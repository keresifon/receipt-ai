import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { apiRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Rate limit analytics access
    const rl = apiRateLimit(req)
    if (rl) return rl

    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period1 = searchParams.get('period1') || '3' // First period (months)
    const period2 = searchParams.get('period2') || '6' // Second period (months)
    const category = searchParams.get('category') // Optional category filter
    const store = searchParams.get('store') // Optional store filter

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    const accountId = new ObjectId(session.user.accountId)
    
    // Build base match filter
    const baseFilter: any = { accountId }
    
    if (category) {
      baseFilter.category = category
    }
    
    if (store) {
      baseFilter.store = store
    }

    // Calculate date ranges
    const now = new Date()
    
    // Period 1 (more recent)
    const period1Start = new Date(now)
    period1Start.setMonth(period1Start.getMonth() - parseInt(period1))
    period1Start.setDate(1)
    period1Start.setHours(0, 0, 0, 0)
    
    const period1End = new Date(now)
    period1End.setHours(23, 59, 59, 999)
    
    // Period 2 (older)
    const period2Start = new Date(period1Start)
    period2Start.setMonth(period2Start.getMonth() - parseInt(period2))
    
    const period2End = new Date(period1Start)
    period2End.setDate(period2End.getDate() - 1)
    period2End.setHours(23, 59, 59, 999)

    // Get data for both periods
    const [period1Data, period2Data] = await Promise.all([
      // Period 1 data
      items.aggregate([
        { 
          $match: { 
            ...baseFilter,
            date: { 
              $gte: period1Start.toISOString().split('T')[0],
              $lte: period1End.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSpending: { $sum: '$total_price' },
            totalItems: { $sum: 1 },
            avgItemPrice: { $avg: '$total_price' },
            categories: { $addToSet: '$category' },
            stores: { $addToSet: '$store' },
            dailySpending: {
              $push: {
                date: '$date',
                amount: '$total_price'
              }
            }
          }
        }
      ]).toArray(),
      
      // Period 2 data
      items.aggregate([
        { 
          $match: { 
            ...baseFilter,
            date: { 
              $gte: period2Start.toISOString().split('T')[0],
              $lte: period2End.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSpending: { $sum: '$total_price' },
            totalItems: { $sum: 1 },
            avgItemPrice: { $avg: '$total_price' },
            categories: { $addToSet: '$category' },
            stores: { $addToSet: '$store' },
            dailySpending: {
              $push: {
                date: '$date',
                amount: '$total_price'
              }
            }
          }
        }
      ]).toArray()
    ])

    // Get category breakdown for both periods
    const [period1Categories, period2Categories] = await Promise.all([
      items.aggregate([
        { 
          $match: { 
            ...baseFilter,
            date: { 
              $gte: period1Start.toISOString().split('T')[0],
              $lte: period1End.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$total_price' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]).toArray(),
      
      items.aggregate([
        { 
          $match: { 
            ...baseFilter,
            date: { 
              $gte: period2Start.toISOString().split('T')[0],
              $lte: period2End.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$total_price' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]).toArray()
    ])

    // Get store breakdown for both periods
    const [period1Stores, period2Stores] = await Promise.all([
      items.aggregate([
        { 
          $match: { 
            ...baseFilter,
            date: { 
              $gte: period1Start.toISOString().split('T')[0],
              $lte: period1End.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: '$store',
            total: { $sum: '$total_price' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]).toArray(),
      
      items.aggregate([
        { 
          $match: { 
            ...baseFilter,
            date: { 
              $gte: period2Start.toISOString().split('T')[0],
              $lte: period2End.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: '$store',
            total: { $sum: '$total_price' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]).toArray()
    ])

    // Process the data
    const p1 = period1Data[0] || { totalSpending: 0, totalItems: 0, avgItemPrice: 0, categories: [], stores: [], dailySpending: [] }
    const p2 = period2Data[0] || { totalSpending: 0, totalItems: 0, avgItemPrice: 0, categories: [], stores: [], dailySpending: [] }

    // Calculate changes
    const spendingChange = p1.totalSpending - p2.totalSpending
    const spendingChangePercent = p2.totalSpending > 0 
      ? ((spendingChange / p2.totalSpending) * 100) 
      : 0
    
    const itemsChange = p1.totalItems - p2.totalItems
    const itemsChangePercent = p2.totalItems > 0 
      ? ((itemsChange / p2.totalItems) * 100) 
      : 0

    const avgPriceChange = p1.avgItemPrice - p2.avgItemPrice
    const avgPriceChangePercent = p2.avgItemPrice > 0 
      ? ((avgPriceChange / p2.avgItemPrice) * 100) 
      : 0

    // Merge category data for comparison
    const allCategories = new Set([
      ...period1Categories.map(c => c._id),
      ...period2Categories.map(c => c._id)
    ])

    const categoryComparison = Array.from(allCategories).map(catName => {
      const p1Cat = period1Categories.find(c => c._id === catName)
      const p2Cat = period2Categories.find(c => c._id === catName)
      
      const p1Total = p1Cat?.total || 0
      const p2Total = p2Cat?.total || 0
      const change = p1Total - p2Total
      const changePercent = p2Total > 0 ? ((change / p2Total) * 100) : 0
      
      return {
        category: catName,
        period1: { total: p1Total, count: p1Cat?.count || 0 },
        period2: { total: p2Total, count: p2Cat?.count || 0 },
        change,
        changePercent: Math.round(changePercent * 100) / 100
      }
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    // Merge store data for comparison
    const allStores = new Set([
      ...period1Stores.map(s => s._id),
      ...period2Stores.map(s => s._id)
    ])

    const storeComparison = Array.from(allStores).map(storeName => {
      const p1Store = period1Stores.find(s => s._id === storeName)
      const p2Store = period2Stores.find(s => s._id === storeName)
      
      const p1Total = p1Store?.total || 0
      const p2Total = p2Store?.total || 0
      const change = p1Total - p2Total
      const changePercent = p2Total > 0 ? ((change / p2Total) * 100) : 0
      
      return {
        store: storeName,
        period1: { total: p1Total, count: p1Store?.count || 0 },
        period2: { total: p2Total, count: p2Store?.count || 0 },
        change,
        changePercent: Math.round(changePercent * 100) / 100
      }
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    // Calculate daily spending patterns
    const p1Daily = p1.dailySpending.reduce((acc: any, item: any) => {
      const date = item.date
      acc[date] = (acc[date] || 0) + item.amount
      return acc
    }, {})
    
    const p2Daily = p2.dailySpending.reduce((acc: any, item: any) => {
      const date = item.date
      acc[date] = (acc[date] || 0) + item.amount
      return acc
    }, {})

    const response = {
      periods: {
        period1: {
          months: parseInt(period1),
          start: period1Start.toISOString().split('T')[0],
          end: period1End.toISOString().split('T')[0],
          totalSpending: p1.totalSpending,
          totalItems: p1.totalItems,
          avgItemPrice: Math.round(p1.avgItemPrice * 100) / 100,
          uniqueCategories: p1.categories.length,
          uniqueStores: p1.stores.length
        },
        period2: {
          months: parseInt(period2),
          start: period2Start.toISOString().split('T')[0],
          end: period2End.toISOString().split('T')[0],
          totalSpending: p2.totalSpending,
          totalItems: p2.totalItems,
          avgItemPrice: Math.round(p2.avgItemPrice * 100) / 100,
          uniqueCategories: p2.categories.length,
          uniqueStores: p2.stores.length
        }
      },
      changes: {
        spending: {
          absolute: spendingChange,
          percent: Math.round(spendingChangePercent * 100) / 100,
          trend: spendingChange > 0 ? 'increase' : spendingChange < 0 ? 'decrease' : 'stable'
        },
        items: {
          absolute: itemsChange,
          percent: Math.round(itemsChangePercent * 100) / 100,
          trend: itemsChange > 0 ? 'increase' : itemsChange < 0 ? 'decrease' : 'stable'
        },
        avgPrice: {
          absolute: Math.round(avgPriceChange * 100) / 100,
          percent: Math.round(avgPriceChangePercent * 100) / 100,
          trend: avgPriceChange > 0 ? 'increase' : avgPriceChange < 0 ? 'decrease' : 'stable'
        }
      },
      categoryComparison,
      storeComparison,
      dailyPatterns: {
        period1: Object.entries(p1Daily).map(([date, amount]) => ({ date, amount })),
        period2: Object.entries(p2Daily).map(([date, amount]) => ({ date, amount }))
      }
    }

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('Analytics compare error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
