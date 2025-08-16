import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Group by receipt and calculate net totals per receipt
    const receiptTotals = await items.aggregate([
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

    const monthly = await items.aggregate([
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
      { $match: { description: { $not: { $regex: /^(hst|discount)$/i } } } },
      { $addFields: {
        amount: {
          $cond: [ { $or: [ { $eq: ['$total_price', ''] }, { $eq: ['$total_price', null] } ] }, 0, { $toDouble: '$total_price' } ]
        }
      } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: { $ifNull: ['$_id', 'Uncategorized'] }, total: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]).toArray()

    const byStore = await items.aggregate([
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

    const recent = await items.aggregate([
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
