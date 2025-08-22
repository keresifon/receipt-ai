import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { apiRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Rate limit export access
    const rl = apiRateLimit(req)
    if (rl) return rl

    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json' // json, csv, pdf
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const store = searchParams.get('store')
    const includeReceipts = searchParams.get('includeReceipts') === 'true'

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')
    const receipts = db.collection('receipts')

    const accountId = new ObjectId(session.user.accountId)
    
    // Build match filter
    const matchFilter: any = { accountId }
    
    if (startDate) {
      matchFilter.date = { ...matchFilter.date, $gte: startDate }
    }
    
    if (endDate) {
      matchFilter.date = { ...matchFilter.date, $lte: endDate }
    }
    
    if (category) {
      matchFilter.category = category
    }
    
    if (store) {
      matchFilter.store = store
    }

    // Get line items data
    const lineItems = await items.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'receipts',
          localField: 'receipt_id',
          foreignField: '_id',
          as: 'receipt'
        }
      },
      {
        $addFields: {
          receipt: { $arrayElemAt: ['$receipt', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          date: 1,
          store: 1,
          description: 1,
          category: 1,
          quantity: 1,
          unit_price: 1,
          total_price: 1,
          hst: 1,
          discount: 1,
          receipt_id: 1,
          receipt_merchant: '$receipt.merchant',
          receipt_notes: '$receipt.notes',
          receipt_source: '$receipt.source',
          receipt_created: '$receipt.createdAt'
        }
      },
      { $sort: { date: -1, store: 1, category: 1 } }
    ]).toArray()

    // Get summary statistics
    const summary = await items.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalSpending: { $sum: '$total_price' },
          totalItems: { $sum: 1 },
          avgItemPrice: { $avg: '$total_price' },
          categories: { $addToSet: '$category' },
          stores: { $addToSet: '$store' },
          minDate: { $min: '$date' },
          maxDate: { $max: '$date' }
        }
      }
    ]).toArray()

    const summaryData = summary[0] || {
      totalSpending: 0,
      totalItems: 0,
      avgItemPrice: 0,
      categories: [],
      stores: [],
      minDate: null,
      maxDate: null
    }

    // Get category breakdown
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

    // Get store breakdown
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

    // Get monthly breakdown
    const monthlyBreakdown = await items.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          yearMonth: {
            $concat: [
              { $toString: { $year: { $dateFromString: { dateString: '$date' } } } },
              '-',
              { $toString: { $month: { $dateFromString: { dateString: '$date' } } } }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$yearMonth',
          total: { $sum: '$total_price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray()

    // Prepare export data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        user: session.user.email,
        filters: {
          startDate,
          endDate,
          category,
          store,
          includeReceipts
        },
        summary: {
          totalSpending: summaryData.totalSpending,
          totalItems: summaryData.totalItems,
          avgItemPrice: Math.round(summaryData.avgItemPrice * 100) / 100,
          uniqueCategories: summaryData.categories.length,
          uniqueStores: summaryData.stores.length,
          dateRange: {
            min: summaryData.minDate,
            max: summaryData.maxDate
          }
        }
      },
      data: {
        lineItems: lineItems.map(item => ({
          ...item,
          _id: item._id.toString(),
          receipt_id: item.receipt_id?.toString()
        })),
        categoryBreakdown: categoryBreakdown.map(cat => ({
          category: cat._id,
          total: cat.total,
          count: cat.count,
          percentage: Math.round((cat.total / summaryData.totalSpending) * 10000) / 100
        })),
        storeBreakdown: storeBreakdown.map(store => ({
          store: store._id,
          total: store.total,
          count: store.count,
          percentage: Math.round((store.total / summaryData.totalSpending) * 10000) / 100
        })),
        monthlyBreakdown: monthlyBreakdown.map(month => ({
          period: month._id,
          total: month.total,
          count: month.count
        }))
      }
    }

    // Return based on format
    if (format === 'csv') {
      // Generate CSV data
      const csvHeaders = [
        'Date',
        'Store',
        'Description',
        'Category',
        'Quantity',
        'Unit Price',
        'Total Price',
        'HST',
        'Discount',
        'Receipt ID',
        'Receipt Merchant',
        'Receipt Notes'
      ]

      const csvRows = lineItems.map(item => [
        item.date,
        item.store,
        item.description,
        item.category,
        item.quantity,
        item.unit_price,
        item.total_price,
        item.hst || '',
        item.discount || '',
        item.receipt_id?.toString() || '',
        item.receipt_merchant || '',
        item.receipt_notes || ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="receipts-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Default JSON response
    return NextResponse.json(exportData)
  } catch (e: any) {
    console.error('Export error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
