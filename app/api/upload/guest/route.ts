import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'

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
  date: z.string().nullable().optional(),
  totals: z
    .object({
      subtotal: z.number().nullable().optional(),
      tax: z.number().nullable().optional(),
      total: z.number().nullable().optional(),
      currency: z.string().nullable().optional(),
    })
    .partial()
    .optional(),
  notes: z.string().nullable().optional(),
  line_items: z.array(LineItemSchema).default([]),
})

type Receipt = z.infer<typeof ReceiptSchema>

function coerceJson(text: string): any {
  const stripped = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(stripped)
  } catch {}
  try {
    return JSON.parse(text)
  } catch {}
  const first = stripped.indexOf('{')
  const last = stripped.lastIndexOf('}')
  if (first >= 0 && last > first) return JSON.parse(stripped.slice(first, last + 1))
  throw new Error('Model response was not valid JSON')
}

function detectImageType(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (pngSig.every((v, i) => buf[i] === v)) return 'png'
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'webp'
  }
  return null
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\x00-\x1f\x7f]/g, '').replace(/[\\/]/g, '')
  const safe = cleaned.replace(/[^A-Za-z0-9._\-\s]/g, '')
  return safe || 'upload'
}

/**
 * Same receipt extraction as /api/upload (Gemini), but does not persist to MongoDB.
 * Intended for the iOS guest mode: scan with the same quality, store results on-device only.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = apiRateLimit(req)
    if (rl) return rl

    const form = await req.formData()
    const file = form.get('file') as File | null
    const userDate = (form.get('date') as string | null) || null
    const userMerchant = (form.get('merchant') as string | null) || null
    const userNotes = (form.get('notes') as string | null) || null

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ detail: 'Please upload an image.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ detail: 'File size too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    const sanitizedMerchant = userMerchant ? sanitizeSearchQuery(userMerchant) : null
    const sanitizedNotes = userNotes ? sanitizeSearchQuery(userNotes) : null

    const ab = await file.arrayBuffer()
    const buf = Buffer.from(ab)
    const detected = detectImageType(buf)
    const allowed: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }

    if (!detected) {
      return NextResponse.json({ detail: 'Unsupported image format. Allowed: JPEG, PNG, WEBP.' }, { status: 400 })
    }

    const expectedMime = allowed[detected]
    const providedMime = file.type
    const mimeOk = providedMime === expectedMime || (detected === 'jpeg' && providedMime === 'image/pjpeg')
    if (!mimeOk) {
      return NextResponse.json({ detail: `MIME type does not match file content. Expected ${expectedMime}.` }, { status: 400 })
    }

    if (providedMime === 'image/svg+xml') {
      return NextResponse.json({ detail: 'SVG images are not allowed.' }, { status: 400 })
    }

    const base64Image = buf.toString('base64')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const system = `Extract receipt summary and line items. Return ONLY JSON with keys:
merchant (string|null), date (YYYY-MM-DD|null), notes (string|null), totals (object with subtotal, tax, total, currency all nullable), line_items (array of {description (string), category (string|null), quantity (number|null), unit_price (number|null), total_price (number), hst (number|null), discount (number|null)}).
Use null for unknowns. Normalize numbers to decimals (no currency symbols). Extract HST (Harmonized Sales Tax) and discount amounts for each line item when present. No commentary.`

    const result = await model.generateContent([
      { text: system },
      { inlineData: { data: base64Image, mimeType: file.type } },
    ])

    const text =
      result.response?.candidates?.[0]?.content?.parts?.map((p) => ('text' in p ? p.text : '')).join('') || '{}'
    const json = coerceJson(text)
    const parsed: Receipt = ReceiptSchema.parse(json)

    const date = userDate || parsed.date || ''
    const merchant = sanitizedMerchant || parsed.merchant || ''
    const notes = sanitizedNotes || parsed.notes || ''

    let lineItems = [...(parsed.line_items || [])]
    if (!lineItems.length) {
      const total = parsed.totals?.total
      if (total != null && typeof total === 'number') {
        lineItems = [
          {
            description: merchant ? `Receipt — ${merchant}` : 'Receipt total',
            category: null,
            quantity: null,
            unit_price: null,
            total_price: total,
            hst: parsed.totals?.tax ?? null,
            discount: null,
          },
        ]
      }
    }

    const receiptId = `local-${randomUUID()}`
    const sourceName = sanitizeFilename(file.name || 'guest-upload')

    return NextResponse.json({
      appended: false,
      receipt_id: receiptId,
      line_items: lineItems,
      guest: true,
      source: sourceName,
      date,
      merchant,
      notes,
    })
  } catch (e: any) {
    console.error('Guest upload error:', e)
    return NextResponse.json(
      {
        detail: e?.message || 'Server error',
        error: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
