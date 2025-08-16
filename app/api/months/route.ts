import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

    // Get distinct months from all records for this account
    const accountId = new ObjectId(session.user.accountId)
    const months = await items.aggregate([
      { $match: { 
        $and: [
          { accountId: accountId },
          { date: { $exists: true, $ne: null } },
          { date: { $ne: '' } }
        ]
      }},
      { $project: { month: { $substr: ['$date', 0, 7] } } },
      { $group: { _id: '$month' } },
      { $sort: { _id: -1 } }
    ]).toArray()

    console.log('Months API Debug:', {
      accountId: session.user.accountId,
      totalMonths: months.length,
      months: months
    })

    const monthList = months.map(m => m._id).filter(Boolean)
    
    return NextResponse.json({ months: monthList })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
