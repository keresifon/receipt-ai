import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { sanitizeSearchQuery, sanitizeDate } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = sanitizeSearchQuery(searchParams.get('search') || '')
    const month = sanitizeSearchQuery(searchParams.get('month') || '')
    const date = sanitizeDate(searchParams.get('date') || '')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
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
        // If only month is specified, match multiple date formats
        const year = month.split('-')[0]
        const monthNum = month.split('-')[1]
        
        // Support multiple date formats:
        // 1. YYYY-MM-DD format (e.g., 2024-01-15)
        // 2. MM/DD/YYYY format (e.g., 01/15/2024)
        // 3. M/D/YYYY format (e.g., 1/15/2024)
        matchCriteria.$or = [
          { date: { $regex: `^${month}-` } }, // YYYY-MM-DD
          { date: { $regex: `^${monthNum}/` } }, // MM/DD/YYYY
          { date: { $regex: `^${parseInt(monthNum)}/` } } // M/D/YYYY (single digit month)
        ]
        
        // If we already have $or for search, combine them
        if (matchCriteria.$or && search) {
          const searchOr = matchCriteria.$or
          matchCriteria.$and = [
            { $or: searchOr }, // Search criteria
            { $or: [
              { date: { $regex: `^${month}-` } },
              { date: { $regex: `^${monthNum}/` } },
              { date: { $regex: `^${parseInt(monthNum)}/` } }
            ]} // Month criteria
          ]
          delete matchCriteria.$or
        }
      }
    }

    // Debug logging
    console.log('Records API - Match criteria:', JSON.stringify(matchCriteria, null, 2))
    console.log('Records API - Month filter:', month)
    console.log('Records API - Search filter:', search)
    
    // Get records with pagination
    const records = await items.find(matchCriteria)
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    console.log(`Records API - Found ${records.length} records for month: ${month}`)

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
