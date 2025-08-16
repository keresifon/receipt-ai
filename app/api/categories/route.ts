import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Get distinct categories, excluding empty/null values and HST/Discount items
    const categories = await items.aggregate([
      { $match: { 
        category: { $exists: true, $ne: '', $ne: null },
        description: { $not: { $regex: /^(hst|discount)$/i } }
      }},
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } },
      { $project: { category: '$_id', _id: 0 } }
    ]).toArray()

    const categoryList = categories.map(c => c.category).filter(Boolean)
    
    return NextResponse.json({ categories: categoryList })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
