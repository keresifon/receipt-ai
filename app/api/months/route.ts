import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Get distinct months from all records
    const months = await items.aggregate([
              { $match: { date: { $exists: true, $ne: '' } } },
      { $project: { month: { $substr: ['$date', 0, 7] } } },
      { $group: { _id: '$month' } },
      { $sort: { _id: -1 } },
      { $project: { month: '$_id', _id: 0 } }
    ]).toArray()

    const monthList = months.map(m => m.month).filter(Boolean)
    
    return NextResponse.json({ months: monthList })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
