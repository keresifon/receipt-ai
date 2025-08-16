import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Get distinct categories, excluding empty/null values and HST/Discount items
    const accountId = new ObjectId(session.user.accountId)
    const categories = await items.aggregate([
      { $match: { 
        $and: [
          { accountId: accountId },
          { category: { $exists: true, $ne: null } },
          { category: { $ne: '' } },
          { description: { $not: { $regex: /^(hst|discount)$/i } } }
        ]
      }},
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]).toArray()

    const categoryList = categories.map(c => c._id).filter(Boolean)
    
    return NextResponse.json({ categories: categoryList })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
