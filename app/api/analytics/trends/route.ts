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
    const period = searchParams.get('period') || '12' // Default to 12 months
    const category = searchParams.get('category') // Optional category filter
    const store = searchParams.get('store') // Optional store filter

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    const accountId = new ObjectId(session.user.accountId)
    
    // Build match filter
    const matchFilter: any = { accountId }
    
    if (category) {
      matchFilter.category = category
    }
    
    if (store) {
      matchFilter.store = store
    }

    // Calculate date range (last N months)
    const monthsAgo = parseInt(period)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsAgo)
    startDate.setDate(1) // Start of first month
    startDate.setHours(0, 0, 0, 0)

    matchFilter.date = { $gte: startDate.toISOString().split('T')[0] }

    // Get monthly spending trends
    const monthlyTrends = await items.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          yearMonth: {
            $concat: [
              { $toString: { $year: { $dateFromString: { dateString: '$date' } } } },
              '-',
              { $toString: { $month: { $dateFromString: { dateString: '$date' } } } }
            ]
          },
          month: { $month: { $dateFromString: { dateString: '$date' } } },
          year: { $year: { $dateFromString: { dateString: '$date' } } }
        }
      },
      {
        $group: {
          _id: '$yearMonth',
          yearMonth: { $first: '$yearMonth' },
          year: { $first: '$year' },
          month: { $first: '$month' },
          total: { $sum: '$total_price' },
          count: { $sum: 1 },
          categories: { $addToSet: '$category' },
          stores: { $addToSet: '$store' }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]).toArray()

    // Get category breakdown for the period
    const categoryBreakdown = await items.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$total_price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray()

    // Get store breakdown for the period
    const storeBreakdown = await items.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$store',
          total: { $sum: '$total_price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray()

    // Calculate overall statistics
    const overallStats = await items.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalSpending: { $sum: '$total_price' },
          totalItems: { $sum: 1 },
          avgItemPrice: { $avg: '$total_price' },
          minDate: { $min: '$date' },
          maxDate: { $max: '$date' }
        }
      }
    ]).toArray()

    // Calculate month-over-month growth
    const trendsWithGrowth = monthlyTrends.map((month, index) => {
      const baseMonth = {
        _id: month._id,
        yearMonth: month.yearMonth,
        year: month.year,
        month: month.month,
        total: month.total,
        count: month.count,
        categories: month.categories,
        stores: month.stores
      }
      
      if (index === 0) {
        return { ...baseMonth, growth: 0, growthPercent: 0 }
      }
      
      const previousMonth = monthlyTrends[index - 1]
      const growth = month.total - previousMonth.total
      const growthPercent = previousMonth.total > 0 
        ? ((growth / previousMonth.total) * 100) 
        : 0
      
      return { ...baseMonth, growth, growthPercent }
    })

    // Format response
    const response = {
      period: monthsAgo,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      monthlyTrends: trendsWithGrowth.map(month => ({
        period: month._id,
        year: month.year,
        month: month.month,
        total: month.total,
        count: month.count,
        growth: month.growth,
        growthPercent: Math.round(month.growthPercent * 100) / 100,
        categories: month.categories.length,
        stores: month.stores.length
      })),
      categoryBreakdown: categoryBreakdown.map(cat => ({
        category: cat._id,
        total: cat.total,
        count: cat.count,
        percentage: 0 // Will be calculated on frontend
      })),
      storeBreakdown: storeBreakdown.map(store => ({
        store: store._id,
        total: store.total,
        count: store.count,
        percentage: 0 // Will be calculated on frontend
      })),
      overallStats: overallStats[0] ? {
        totalSpending: overallStats[0].totalSpending,
        totalItems: overallStats[0].totalItems,
        avgItemPrice: Math.round(overallStats[0].avgItemPrice * 100) / 100,
        dateRange: {
          start: overallStats[0].minDate,
          end: overallStats[0].maxDate
        }
      } : null
    }

    // Calculate percentages for breakdowns
    if (response.overallStats) {
      response.categoryBreakdown.forEach(cat => {
        cat.percentage = Math.round((cat.total / response.overallStats!.totalSpending) * 10000) / 100
      })
      
      response.storeBreakdown.forEach(store => {
        store.percentage = Math.round((store.total / response.overallStats!.totalSpending) * 10000) / 100
      })
    }

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('Analytics trends error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
