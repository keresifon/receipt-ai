import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Build match criteria for month filtering
    const matchCriteria: any = {}
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

    // For monthly data, if filtering by month, just return that month
    const monthly = month ? [{ 
      month, 
      total: totalsAgg[0]?.total || 0 
    }] : []

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
