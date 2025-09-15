import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { auditLogger } from '@/lib/audit-log'
import { apiRateLimit } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LineItemSchema = z.object({
  description: z.string(),
  category: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  total_price: z.number(),
  hst: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
})

const ReceiptSchema = z.object({
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(), // YYYY-MM-DD
  totals: z.object({
    subtotal: z.number().nullable().optional(),
    tax: z.number().nullable().optional(),
    total: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
  }).partial().optional(),
  notes: z.string().nullable().optional(),
  line_items: z.array(LineItemSchema).default([]),
})

type Receipt = z.infer<typeof ReceiptSchema>

function coerceJson(text: string): any {
  const stripped = text.replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()
  try { return JSON.parse(stripped) } catch {}
  try { return JSON.parse(text) } catch {}
  const first = stripped.indexOf('{'); const last = stripped.lastIndexOf('}')
  if (first >= 0 && last > first) return JSON.parse(stripped.slice(first, last+1))
  throw new Error('Model response was not valid JSON')
}

// Magic-byte detection for common image formats (deny SVG/others)
function detectImageType(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  if (pngSig.every((v, i) => buf[i] === v)) return 'png'
  // WEBP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    return 'webp'
  }
  return null
}

function sanitizeFilename(name: string): string {
  // remove path separators and control chars; keep basic word chars, dot, dash, underscore, space
  const cleaned = name.replace(/[\x00-\x1F\x7F]/g, '').replace(/[\\/]/g, '')
  const safe = cleaned.replace(/[^A-Za-z0-9._\-\s]/g, '')
  return safe || 'upload'
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit upload endpoint
    const rl = apiRateLimit(req)
    if (rl) return rl

    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email, id: decoded.userId }
      } catch (error) {
        // JWT verification failed, try NextAuth session
        const session = await getServerSession(authOptions)
        user = session?.user
      }
    } else {
      // No JWT token, try NextAuth session
      const session = await getServerSession(authOptions)
      user = session?.user
    }
    
    if (!user || !('accountId' in user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const userDate = (form.get('date') as string | null) || null
    const userMerchant = (form.get('merchant') as string | null) || null
    const userNotes = (form.get('notes') as string | null) || null

    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ detail: 'Please upload an image.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ detail: 'File size too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    // Sanitize user inputs
    const sanitizedMerchant = userMerchant ? sanitizeSearchQuery(userMerchant) : null
    const sanitizedNotes = userNotes ? sanitizeSearchQuery(userNotes) : null

    // Read into buffer and validate magic bytes
    const ab = await file.arrayBuffer()
    const buf = Buffer.from(ab)
    const detected = detectImageType(buf)
    const allowed: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp'
    }

    if (!detected) {
      return NextResponse.json({ detail: 'Unsupported image format. Allowed: JPEG, PNG, WEBP.' }, { status: 400 })
    }

    // MIME/type consistency check; if browser type is more permissive, rely on magic bytes
    const expectedMime = allowed[detected]
    const providedMime = file.type
    const mimeOk = providedMime === expectedMime || (detected === 'jpeg' && providedMime === 'image/pjpeg')
    if (!mimeOk) {
      return NextResponse.json({ detail: `MIME type does not match file content. Expected ${expectedMime}.` }, { status: 400 })
    }

    // Block SVG explicitly (text-based) — caught by magic, but double-ensure
    if (providedMime === 'image/svg+xml') {
      return NextResponse.json({ detail: 'SVG images are not allowed.' }, { status: 400 })
    }

    const base64Image = buf.toString('base64')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const system = `Extract receipt summary and line items. Return ONLY JSON with keys:
merchant (string|null), date (YYYY-MM-DD|null), notes (string|null), totals (object with subtotal, tax, total, currency all nullable), line_items (array of {description (string), category (string|null), quantity (number|null), unit_price (number|null), total_price (number), hst (number|null), discount (number|null)}).
Use null for unknowns. Normalize numbers to decimals (no currency symbols). Extract HST (Harmonized Sales Tax) and discount amounts for each line item when present. No commentary.`

    const result = await model.generateContent([
      { text: system },
      { inlineData: { data: base64Image, mimeType: file.type } },
    ])

    const text = result.response?.candidates?.[0]?.content?.parts?.map(p => ('text' in p ? p.text : '')).join('') || '{}'
    console.log('AI Response:', text)
    const json = coerceJson(text)
    console.log('Parsed JSON:', json)
    const parsed: Receipt = ReceiptSchema.parse(json)
    console.log('Validated Receipt:', parsed)

    // Overrides from user (use sanitized values)
    const date = userDate || parsed.date || ''
    const merchant = sanitizedMerchant || parsed.merchant || ''
    const notes = sanitizedNotes || parsed.notes || ''

    const client = await clientPromise
    const dbSession = client.startSession()

    const dbName = process.env.MONGODB_DB || 'expenses'
    const db = client.db(dbName)
    const receiptsCol = db.collection('receipts')
    const itemsCol = db.collection('line_items')

    let receiptId: any
    await dbSession.withTransaction(async () => {
      const receiptDoc = {
        date,
        merchant,
        notes,
        source: sanitizeFilename(file.name || 'upload'),
        createdAt: new Date(),
        totals: parsed.totals || {},
        accountId: new ObjectId(user.accountId),
      }
      console.log('Saving receipt:', receiptDoc)
      const { insertedId } = await receiptsCol.insertOne(receiptDoc, { session: dbSession })
      receiptId = insertedId
      console.log('Receipt saved with ID:', receiptId)

      const rows = (parsed.line_items || []).map(li => ({
        receipt_id: insertedId,
        date,
        store: merchant,
        description: li.description,
        category: li.category ?? '',
        quantity: li.quantity ?? '',
        unit_price: li.unit_price ?? '',
        total_price: li.total_price ?? '',
        hst: li.hst ?? null,
        discount: li.discount ?? null,
        accountId: new ObjectId(user.accountId),
      }))
      if (rows.length) {
        console.log('Saving line items:', rows)
        await itemsCol.insertMany(rows, { session: dbSession })
        console.log('Line items saved successfully')
      }
    })

    dbSession.endSession()

    // Log successful upload
    try {
      await auditLogger.logFileUpload(
        user.id || '',
        user.accountId || '',
        String(receiptId),
        true,
        req
      )
    } catch {}

    return NextResponse.json({ 
      appended: true, 
      receipt_id: str(receiptId),
      line_items: parsed.line_items || []
    })
  } catch (e: any) {
    console.error('Upload error:', e)
    // Audit failure (best-effort)
    try {
      const session = await getServerSession(authOptions)
      if (session?.user && 'accountId' in session.user) {
        await auditLogger.logSecurityEvent(
          (session.user as any).id || undefined,
          (session.user as any).accountId || undefined,
          'FILE_UPLOAD_FAILED',
          { message: e?.message || 'Unknown error' },
          req,
          false,
          e?.message
        )
      }
    } catch {}
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}

function str(x: any) {
  try { return String(x) } catch { return '' }
}
