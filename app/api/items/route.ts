import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  receipt_id: z.string().optional(), // Optional for standalone items
  date: z.string(),
  store: z.string(),
  description: z.string(), // e.g., "HST" or "Discount"
  category: z.string().optional(),
  total_price: z.union([z.string(), z.number()])
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')
    const receipts = db.collection('receipts')

    let receiptId: ObjectId

    if (parsed.receipt_id) {
      // Use existing receipt
      receiptId = new ObjectId(parsed.receipt_id)
    } else {
      // Find existing receipt by date and store
      const existingReceipt = await receipts.findOne({
        date: parsed.date,
        merchant: parsed.store
      })

      if (!existingReceipt) {
        return NextResponse.json({ 
          detail: `No receipt found for ${parsed.store} on ${parsed.date}. Please create a receipt first or select a different date/store.` 
        }, { status: 404 })
      }

      receiptId = existingReceipt._id
    }

    const doc = {
      receipt_id: receiptId,
      date: parsed.date,
      store: parsed.store,
      description: parsed.description,
      category: parsed.category ?? '',
      total_price: parsed.total_price,
      quantity: 1,
      unit_price: parsed.total_price
    }
    const res = await items.insertOne(doc)
    return NextResponse.json({ 
      insertedId: res.insertedId.toString(),
      receiptId: receiptId.toString()
    })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}


