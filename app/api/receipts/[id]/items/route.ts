import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { line_items } = body

    if (!line_items || !Array.isArray(line_items)) {
      return NextResponse.json({ detail: 'line_items array required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Delete existing items for this receipt
    await items.deleteMany({ receipt_id: new ObjectId(params.id) })

    // Insert updated items
    if (line_items.length > 0) {
      const rows = line_items.map((li: any) => ({
        receipt_id: new ObjectId(params.id),
        date: li.date,
        store: li.store,
        description: li.description,
        category: li.category || '',
        quantity: li.quantity ?? '',
        unit_price: li.unit_price ?? '',
        total_price: li.total_price ?? '',
        hst: li.hst ?? '',
        discount: li.discount ?? '',
      }))
      await items.insertMany(rows)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
