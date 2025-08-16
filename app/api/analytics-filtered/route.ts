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
    const month = searchParams.get('month')

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Build match criteria for month filtering and account
    const accountId = new ObjectId(session.user.accountId)
    const matchCriteria: any = { accountId: accountId }
    if (month) {
      matchCriteria.date = { $regex: `^${month}-` }
    }

    // Get totals with proper discount/HST handling
    const totalsAgg = await items.aggregate([
      { $match: matchCriteria },
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

    // Get by category (excluding HST/Discount)
    const byCategory = await items.aggregate([
      { $match: { ...matchCriteria, description: { $not: { $regex: /^(hst|discount)$/i } } } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        }
      } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: { $ifNull: ['$_id', 'Uncategorized'] }, total: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]).toArray()

    // Group small categories into "Other" for better chart readability
    if (byCategory.length > 0) {
      const totalSpending = byCategory.reduce((sum, item) => sum + item.total, 0)
      const threshold = totalSpending * 0.05 // 5% threshold
      
      const mainCategories = []
      let otherTotal = 0
      let otherCount = 0
      
      byCategory.forEach(item => {
        if (item.total >= threshold) {
          mainCategories.push(item)
        } else {
          otherTotal += item.total
          otherCount++
        }
      })
      
      // Add "Other" category if there are small categories
      if (otherCount > 0) {
        mainCategories.push({
          category: `Other (${otherCount} categories)`,
          total: otherTotal
        })
      }
      
      byCategory.length = 0
      byCategory.push(...mainCategories)
    }

    // Get by store with proper calculations
    const byStore = await items.aggregate([
      { $match: matchCriteria },
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
        discountTotal: { $sum: '$discountAmount' },
        store: { $first: '$store' }
      } },
      { $addFields: { netTotal: { $subtract: [ { $add: ['$itemTotal', '$hstTotal'] }, '$discountTotal' ] } } },
      { $group: { _id: '$store', total: { $sum: '$netTotal' } } },
      { $project: { store: '$_id', total: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]).toArray()

    // Get recent items
    const recent = await items.find(matchCriteria)
      .sort({ date: -1, _id: -1 })
      .limit(50)
      .toArray()

    // Transform recent items
    const transformedRecent = recent.map(item => ({
      ...item,
      _id: item._id.toString(),
      receipt_id: item.receipt_id.toString()
    }))

    // For monthly data, if filtering by month, return that month, otherwise return all months
    let monthly
    if (month) {
      monthly = [{ 
        month, 
        total: totalsAgg[0]?.total || 0 
      }]
    } else {
      // Get all months when no specific month is selected
      monthly = await items.aggregate([
        { $addFields: {
          month: { $substr: ['$date', 0, 7] },
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
          _id: { month: '$month', receipt_id: '$receipt_id' },
          itemTotal: { $sum: '$itemAmount' },
          hstTotal: { $sum: '$hstAmount' },
          discountTotal: { $sum: '$discountAmount' }
        } },
        { $addFields: { netTotal: { $subtract: [ { $add: ['$itemTotal', '$hstTotal'] }, '$discountTotal' ] } } },
        { $group: { _id: '$_id.month', total: { $sum: '$netTotal' } } },
        { $project: { month: '$_id', total: 1, _id: 0 } },
        { $sort: { month: -1 } }
      ]).toArray()
    }

    return NextResponse.json({
      totals: {
        total: totalsAgg[0]?.total || 0,
        count: totalsAgg[0]?.count || 0
      },
      byCategory: byCategory.filter(cat => cat.total > 0),
      byStore: byStore.filter(store => store.total > 0),
      recent: transformedRecent,
      monthly
    })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
