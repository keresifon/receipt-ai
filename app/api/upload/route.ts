import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { auditLogger } from '@/lib/audit-log'

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

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
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

    const ab = await file.arrayBuffer()
    const base64Image = Buffer.from(ab).toString('base64')

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
        source: file.name || 'upload',
        createdAt: new Date(),
        totals: parsed.totals || {},
        accountId: new ObjectId(session.user.accountId),
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
        accountId: new ObjectId(session.user.accountId),
      }))
      if (rows.length) {
        console.log('Saving line items:', rows)
        await itemsCol.insertMany(rows, { session: dbSession })
        console.log('Line items saved successfully')
      }
    })

    dbSession.endSession()

    return NextResponse.json({ 
      appended: true, 
      receipt_id: str(receiptId),
      line_items: parsed.line_items || []
    })
  } catch (e: any) {
    console.error('Upload error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}

function str(x: any) {
  try { return String(x) } catch { return '' }
}
