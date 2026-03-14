import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const dbName = process.env.MONGODB_DB || 'expenses'
    const db = client.db(dbName)
    const receiptsCol = db.collection('receipts')
    const itemsCol = db.collection('line_items')

    // Get sample dates from receipts
    const receiptDates = await receiptsCol.find(
      { accountId: session.user.accountId },
      { projection: { date: 1, _id: 0 } }
    ).limit(20).toArray()

    // Get sample dates from line items
    const itemDates = await itemsCol.find(
      { accountId: session.user.accountId },
      { projection: { date: 1, _id: 0 } }
    ).limit(20).toArray()

    return NextResponse.json({
      receiptDates: receiptDates.map(r => r.date),
      itemDates: itemDates.map(i => i.date),
      uniqueReceiptDates: [...new Set(receiptDates.map(r => r.date))],
      uniqueItemDates: [...new Set(itemDates.map(i => i.date))]
    })
  } catch (error) {
    console.error('Debug dates error:', error)
    return NextResponse.json({ error: 'Failed to fetch dates' }, { status: 500 })
  }
}
