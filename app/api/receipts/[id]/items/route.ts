import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

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
        accountId: new ObjectId(session.user.accountId),
      }))
      console.log('Saving line items with accountId:', session.user.accountId)
      await items.insertMany(rows)
      console.log('Line items saved successfully')
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Line items update error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
