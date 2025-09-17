import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email }
      } catch (error) {
        // JWT verification failed, try NextAuth session
        const session = await getServerSession(authOptions)
        user = session?.user
      }
    } else {
      // No JWT token, try NextAuth session
      const session = await getServerSession(authOptions)
      user = session?.user
    }
    
    if (!user || !('accountId' in user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    
    const accountId = new ObjectId(user.accountId as string)
    
    // Get month filter from query parameters
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    
    // Build date filter if month is specified
    // Simplified approach: use MongoDB's date aggregation to extract year-month
    const dateFilter = month ? {
      $expr: {
        $eq: [
          { $substr: ["$date", 0, 7] }, // Extract YYYY-MM from date string
          month // Match the requested month (e.g., "2025-05")
        ]
      }
    } : {}
    
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')
    
    // Get total items count for this account
    const totalItems = await items.countDocuments({ accountId: accountId })

    // Group by receipt and calculate net totals per receipt
    const receiptTotals = await items.aggregate([
      { $match: { accountId: accountId, ...dateFilter } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        },
        descLower: { $toLower: { $ifNull: ['$description', ''] } }
      } },
      { $addFields: {
        itemAmount: { $cond: [ { $in: ['$descLower', ['hst', 'discount']] }, 0, '$amount' ] },
        hstAmount: { $cond: [ { $eq: ['$descLower', 'hst'] }, '$amount', 0 ] },
        discountAmount: { $cond: [ { $eq: ['$descLower', 'discount'] }, { $abs: '$amount' }, 0 ] }
      } },
      { $group: {
        _id: { receipt_id: '$receipt_id', date: { $substr: ['$date', 0, 7] }, store: '$store', category: '$category' },
        itemTotal: { $sum: '$itemAmount' },
        hstTotal: { $sum: '$hstAmount' },
        discountTotal: { $sum: '$discountAmount' },
        date: { $first: '$date' },
        store: { $first: '$store' },
        category: { $first: '$category' }
      } },
      { $addFields: { netTotal: { $subtract: [ { $add: ['$itemTotal', '$hstTotal'] }, '$discountTotal' ] } } }
    ]).toArray()

    // Debug logging
    if (month) {
      console.log(`Analytics API: Found ${receiptTotals.length} receipt records for month ${month}`)
      if (receiptTotals.length > 0) {
        console.log(`Sample receipt data:`, receiptTotals.slice(0, 2))
      }
    }

    const monthly = await items.aggregate([
      { $match: { accountId: accountId, ...dateFilter } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        },
        descLower: { $toLower: { $ifNull: ['$description', ''] } }
      } },
      { $addFields: {
        itemAmount: { $cond: [ { $in: ['$descLower', ['hst', 'discount']] }, 0, '$amount' ] },
        hstAmount: { $cond: [ { $eq: ['$descLower', 'hst'] }, '$amount', 0 ] },
        discountAmount: { $cond: [ { $eq: ['$descLower', 'discount'] }, { $abs: '$amount' }, 0 ] }
      } },
      { $group: {
        _id: { receipt_id: '$receipt_id', month: { $substr: ['$date', 0, 7] } },
        itemTotal: { $sum: '$itemAmount' },
        hstTotal: { $sum: '$hstAmount' },
        discountTotal: { $sum: '$discountAmount' }
      } },
      { $addFields: { netTotal: { $subtract: [ { $add: ['$itemTotal', '$hstTotal'] }, '$discountTotal' ] } } },
      { $group: { _id: '$_id.month', total: { $sum: '$netTotal' } } },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', total: 1, _id: 0 } },
    ]).toArray()

    const byCategory = await items.aggregate([
      { $match: { accountId: accountId, description: { $not: { $regex: /^(hst|discount)$/i } }, ...dateFilter } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        }
      } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: { $ifNull: ['$_id', 'Uncategorized'] }, total: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]).toArray()

    // Get store totals first
    const storeTotals = await items.aggregate([
      { $match: { accountId: accountId, ...dateFilter } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        },
        descLower: { $toLower: { $ifNull: ['$description', ''] } }
      } },
      { $addFields: {
        itemAmount: { $cond: [ { $in: ['$descLower', ['hst', 'discount']] }, 0, '$amount' ] },
        hstAmount: { $cond: [ { $eq: ['$descLower', 'hst'] }, '$amount', 0 ] },
        discountAmount: { $cond: [ { $eq: ['$descLower', 'discount'] }, { $abs: '$amount' }, 0 ] }
      } },
      { $group: {
        _id: { receipt_id: '$receipt_id', store: '$store' },
        itemTotal: { $sum: '$itemAmount' },
        hstTotal: { $sum: '$hstAmount' },
        discountTotal: { $sum: '$discountAmount' }
      } },
      { $addFields: { netTotal: { $subtract: [ { $add: ['$itemTotal', '$hstTotal'] }, '$discountTotal' ] } } },
      { $group: { _id: '$_id.store', total: { $sum: '$netTotal' } } },
      { $project: { store: { $ifNull: ['$_id', 'Unknown'] }, total: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]).toArray()

    // Calculate total spending for percentage calculation
    const totalSpending = storeTotals.reduce((sum, store) => sum + store.total, 0)
    
                // Bundle stores under 5% into "Other Stores"
            const byStore = storeTotals.reduce((acc: any[], store) => {
              const percentage = (store.total / totalSpending) * 100
              
              if (percentage >= 5) {
                // Keep individual stores that are 5% or more
                acc.push(store)
              } else {
                // Bundle stores under 5% into "Other Stores"
                const otherStore = acc.find((s: any) => s.store === 'Other Stores')
                if (otherStore) {
                  otherStore.total += store.total
                } else {
                  acc.push({ store: 'Other Stores', total: store.total })
                }
              }
              
              return acc
            }, [] as any[])
    
    // Sort by total (descending)
    byStore.sort((a, b) => b.total - a.total)

    const recent = await items.aggregate([
      { $match: { accountId: accountId, ...dateFilter } },
      { $sort: { date: -1, _id: -1 } },
      { $limit: 25 },
      { $project: {
        _id: { $toString: '$_id' },
        receipt_id: { $toString: '$receipt_id' },
        date: 1,
        store: 1,
        description: 1,
        category: 1,
        total_price: 1
      } },
    ]).toArray()

    const totalsAgg = await items.aggregate([
      { $match: { accountId: accountId, ...dateFilter } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        },
        descLower: { $toLower: { $ifNull: ['$description', ''] } }
      } },
      { $addFields: {
        itemAmount: { $cond: [ { $in: ['$descLower', ['hst', 'discount']] }, 0, '$amount' ] },
        hstAmount: { $cond: [ { $eq: ['$descLower', 'hst'] }, '$amount', 0 ] },
        discountAmount: { $cond: [ { $eq: ['$descLower', 'discount'] }, { $abs: '$amount' }, 0 ] }
      } },
      { $group: {
        _id: '$receipt_id',
        itemTotal: { $sum: '$itemAmount' },
        hstTotal: { $sum: '$hstAmount' },
        discountTotal: { $sum: '$discountAmount' },
        count: { $sum: { $cond: [ { $in: ['$descLower', ['hst', 'discount']] }, 0, 1 ] } }
      } },
      { $addFields: { netTotal: { $subtract: [ { $add: ['$itemTotal', '$hstTotal'] }, '$discountTotal' ] } } },
      { $group: { _id: null, total: { $sum: '$netTotal' }, count: { $sum: '$count' } } },
    ]).toArray()

    const totals = totalsAgg[0] || { total: 0, count: 0 }

    return NextResponse.json({ monthly, byCategory, byStore, recent, totals })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
