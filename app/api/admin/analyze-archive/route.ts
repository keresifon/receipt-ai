import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Parse date string in various formats and extract year
 */
function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  
  const isoMatch = dateStr.match(/^(\d{4})-\d{2}-\d{2}$/)
  if (isoMatch) return parseInt(isoMatch[1], 10)
  
  const usMatch = dateStr.match(/^\d{1,2}\/\d{1,2}\/(\d{4})$/)
  if (usMatch) return parseInt(usMatch[1], 10)
  
  const yearMatch = dateStr.match(/^(\d{4})/)
  if (yearMatch) return parseInt(yearMatch[1], 10)
  
  return null
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication - require admin or authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')

    // Get total counts
    const totalReceipts = await receiptsCol.countDocuments()
    const totalLineItems = await lineItemsCol.countDocuments()

    // Analyze receipts by year
    const receipts = await receiptsCol.find({}).toArray()
    const receiptsByYear: Record<number, number> = {}
    const receiptsToArchive: any[] = []
    const receiptsWithInvalidDates: any[] = []

    for (const receipt of receipts) {
      const year = extractYear(receipt.date)
      if (year === null) {
        receiptsWithInvalidDates.push({
          _id: receipt._id.toString(),
          date: receipt.date,
          merchant: receipt.merchant
        })
        continue
      }
      receiptsByYear[year] = (receiptsByYear[year] || 0) + 1
      if (year < CURRENT_YEAR) {
        receiptsToArchive.push({
          _id: receipt._id.toString(),
          date: receipt.date,
          merchant: receipt.merchant,
          accountId: receipt.accountId?.toString()
        })
      }
    }

    // Analyze line items by year
    const lineItems = await lineItemsCol.find({}).toArray()
    const lineItemsByYear: Record<number, number> = {}
    const lineItemsToArchive: any[] = []
    const lineItemsWithInvalidDates: any[] = []
    const receiptIdMap = new Map<string, boolean>()

    for (const receipt of receiptsToArchive) {
      receiptIdMap.set(receipt._id, true)
    }

    for (const item of lineItems) {
      const year = extractYear(item.date)
      if (year === null) {
        lineItemsWithInvalidDates.push({
          _id: item._id.toString(),
          date: item.date,
          store: item.store
        })
        continue
      }
      lineItemsByYear[year] = (lineItemsByYear[year] || 0) + 1
      const receiptIdStr = item.receipt_id?.toString()
      const shouldArchive = year < CURRENT_YEAR || (receiptIdStr && receiptIdMap.has(receiptIdStr))
      if (shouldArchive) {
        lineItemsToArchive.push({
          _id: item._id.toString(),
          date: item.date,
          store: item.store,
          receipt_id: item.receipt_id?.toString()
        })
      }
    }

    // Analyze by account
    const accountStats = new Map<string, { receipts: number, lineItems: number }>()
    for (const receipt of receiptsToArchive) {
      const accountId = receipt.accountId || 'unknown'
      const stats = accountStats.get(accountId) || { receipts: 0, lineItems: 0 }
      stats.receipts++
      accountStats.set(accountId, stats)
    }
    for (const item of lineItemsToArchive) {
      const accountId = item.accountId || 'unknown'
      const stats = accountStats.get(accountId) || { receipts: 0, lineItems: 0 }
      stats.lineItems++
      accountStats.set(accountId, stats)
    }

    return NextResponse.json({
      currentYear: CURRENT_YEAR,
      summary: {
        totalReceipts,
        totalLineItems,
        receiptsToArchive: receiptsToArchive.length,
        receiptsToKeep: totalReceipts - receiptsToArchive.length,
        lineItemsToArchive: lineItemsToArchive.length,
        lineItemsToKeep: totalLineItems - lineItemsToArchive.length,
      },
      receiptsByYear: Object.fromEntries(
        Object.entries(receiptsByYear).sort(([a], [b]) => parseInt(b) - parseInt(a))
      ),
      lineItemsByYear: Object.fromEntries(
        Object.entries(lineItemsByYear).sort(([a], [b]) => parseInt(b) - parseInt(a))
      ),
      invalidDates: {
        receipts: receiptsWithInvalidDates.length,
        lineItems: lineItemsWithInvalidDates.length,
        sampleReceipts: receiptsWithInvalidDates.slice(0, 5),
        sampleLineItems: lineItemsWithInvalidDates.slice(0, 5),
      },
      accountStats: Array.from(accountStats.entries())
        .map(([accountId, stats]) => ({ accountId, ...stats }))
        .sort((a, b) => (b.receipts + b.lineItems) - (a.receipts + a.lineItems))
        .slice(0, 10),
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}
