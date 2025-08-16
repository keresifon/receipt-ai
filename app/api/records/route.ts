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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const month = searchParams.get('month') || ''
    const date = searchParams.get('date') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Filter by account
    const accountId = new ObjectId(session.user.accountId)
    const accountFilter = { accountId: accountId }

    // Build match criteria
    const matchCriteria: any = { ...accountFilter }
    
    if (search) {
      matchCriteria.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { store: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (month) {
      if (date) {
        // If both month and date are specified, match exact date
        matchCriteria.date = date
      } else {
        // If only month is specified, match month prefix
        matchCriteria.date = { $regex: `^${month}-` }
      }
    }

    // Get records with pagination
    const records = await items.find(matchCriteria)
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCount = await items.countDocuments(matchCriteria)
    const totalPages = Math.ceil(totalCount / limit)

    // Transform records to include string IDs
    const transformedRecords = records.map(record => ({
      ...record,
      _id: record._id.toString(),
      receipt_id: record.receipt_id.toString()
    }))

    return NextResponse.json({
      records: transformedRecords,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
