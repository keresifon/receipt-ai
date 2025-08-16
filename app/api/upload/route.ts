import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import clientPromise from '@/lib/mongodb'

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
    const form = await req.formData()
    const file = form.get('file') as File | null
    const userDate = (form.get('date') as string | null) || null
    const userMerchant = (form.get('merchant') as string | null) || null
    const userNotes = (form.get('notes') as string | null) || null

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ detail: 'Please upload an image.' }, { status: 400 })
    }

    const ab = await file.arrayBuffer()
    const base64Image = Buffer.from(ab).toString('base64')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const system = `Extract receipt summary and line items. Return ONLY JSON with keys:
merchant (string|null), date (YYYY-MM-DD|null), notes (string|null), totals (object with subtotal, tax, total, currency all nullable), line_items (array of {description (string), category (string|null), quantity (number|null), unit_price (number|null), total_price (number)}).
Use null for unknowns. Normalize numbers to decimals (no currency symbols). No commentary.`

    const result = await model.generateContent([
      { text: system },
      { inlineData: { data: base64Image, mimeType: file.type } },
    ])

    const text = result.response?.candidates?.[0]?.content?.parts?.map(p => ('text' in p ? p.text : '')).join('') || '{}'
    const json = coerceJson(text)
    const parsed: Receipt = ReceiptSchema.parse(json)

    // Overrides from user
    const date = userDate || parsed.date || ''
    const merchant = userMerchant || parsed.merchant || ''
    const notes = userNotes || parsed.notes || ''

    const client = await clientPromise
    const session = client.startSession()

    const dbName = process.env.MONGODB_DB || 'expenses'
    const db = client.db(dbName)
    const receiptsCol = db.collection('receipts')
    const itemsCol = db.collection('line_items')

    let receiptId: any
    await session.withTransaction(async () => {
      const receiptDoc = {
        date,
        merchant,
        notes,
        source: file.name || 'upload',
        createdAt: new Date(),
        totals: parsed.totals || {},
      }
      const { insertedId } = await receiptsCol.insertOne(receiptDoc, { session })
      receiptId = insertedId

      const rows = (parsed.line_items || []).map(li => ({
        receipt_id: insertedId,
        date,
        store: merchant,
        description: li.description,
        category: li.category ?? '',
        quantity: li.quantity ?? '',
        unit_price: li.unit_price ?? '',
        total_price: li.total_price ?? '',
        hst: li.hst ?? '',
        discount: li.discount ?? '',
      }))
      if (rows.length) await itemsCol.insertMany(rows, { session })
    })

    session.endSession()

    return NextResponse.json({ 
      appended: true, 
      receipt_id: str(receiptId),
      line_items: parsed.line_items || []
    })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}

function str(x: any) {
  try { return String(x) } catch { return '' }
}
