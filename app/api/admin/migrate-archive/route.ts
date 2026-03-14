import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const CURRENT_YEAR = new Date().getFullYear()

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

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dryRun = false, force = false } = await req.json().catch(() => ({}))

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')
    const receiptsArchiveCol = db.collection('receipts_archive')
    const lineItemsArchiveCol = db.collection('line_items_archive')

    // Identify receipts to archive
    const allReceipts = await receiptsCol.find({}).toArray()
    const receiptsToArchive: any[] = []
    const receiptIdsToArchive = new Set<string>()

    for (const receipt of allReceipts) {
      const year = extractYear(receipt.date)
      if (year !== null && year < CURRENT_YEAR) {
        receiptsToArchive.push(receipt)
        receiptIdsToArchive.add(receipt._id.toString())
      }
    }

    // Identify line items to archive
    const allLineItems = await lineItemsCol.find({}).toArray()
    const lineItemsToArchive: any[] = []

    for (const item of allLineItems) {
      const year = extractYear(item.date)
      const receiptIdStr = item.receipt_id?.toString()
      const shouldArchive = (year !== null && year < CURRENT_YEAR) || 
                           (receiptIdStr && receiptIdsToArchive.has(receiptIdStr))
      if (shouldArchive) {
        lineItemsToArchive.push(item)
      }
    }

    // Ensure archive collections exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)

    if (!collectionNames.includes('receipts_archive')) {
      await db.createCollection('receipts_archive')
      await receiptsArchiveCol.createIndexes([
        { key: { date: 1, merchant: 1 } },
        { key: { createdAt: -1 } },
        { key: { accountId: 1 } },
      ])
    }

    if (!collectionNames.includes('line_items_archive')) {
      await db.createCollection('line_items_archive')
      await lineItemsArchiveCol.createIndexes([
        { key: { receipt_id: 1 } },
        { key: { date: 1, store: 1 } },
        { key: { category: 1, date: -1 } },
        { key: { accountId: 1 } },
      ])
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        summary: {
          receiptsToArchive: receiptsToArchive.length,
          lineItemsToArchive: lineItemsToArchive.length,
          receiptsToKeep: allReceipts.length - receiptsToArchive.length,
          lineItemsToKeep: allLineItems.length - lineItemsToArchive.length,
        },
        sampleReceipts: receiptsToArchive.slice(0, 5).map(r => ({
          _id: r._id.toString(),
          date: r.date,
          merchant: r.merchant,
          accountId: r.accountId?.toString()
        })),
        sampleLineItems: lineItemsToArchive.slice(0, 5).map(item => ({
          _id: item._id.toString(),
          date: item.date,
          store: item.store,
          description: item.description
        }))
      })
    }

    // Perform migration
    const dbSession = client.startSession()
    let receiptsMoved = 0
    let lineItemsMoved = 0

    try {
      await dbSession.withTransaction(async () => {
        if (receiptsToArchive.length > 0) {
          const receiptIds = receiptsToArchive.map(r => r._id)
          await receiptsArchiveCol.insertMany(receiptsToArchive, { session: dbSession })
          const deleteResult = await receiptsCol.deleteMany(
            { _id: { $in: receiptIds } },
            { session: dbSession }
          )
          receiptsMoved = deleteResult.deletedCount
        }

        if (lineItemsToArchive.length > 0) {
          const lineItemIds = lineItemsToArchive.map(item => item._id)
          await lineItemsArchiveCol.insertMany(lineItemsToArchive, { session: dbSession })
          const deleteResult = await lineItemsCol.deleteMany(
            { _id: { $in: lineItemIds } },
            { session: dbSession }
          )
          lineItemsMoved = deleteResult.deletedCount
        }
      })

      // Verify
      const remainingReceipts = await receiptsCol.countDocuments()
      const remainingLineItems = await lineItemsCol.countDocuments()
      const archivedReceipts = await receiptsArchiveCol.countDocuments()
      const archivedLineItems = await lineItemsArchiveCol.countDocuments()

      return NextResponse.json({
        success: true,
        migrated: {
          receipts: receiptsMoved,
          lineItems: lineItemsMoved,
        },
        current: {
          receipts: remainingReceipts,
          lineItems: remainingLineItems,
        },
        archived: {
          receipts: archivedReceipts,
          lineItems: archivedLineItems,
        }
      })
    } catch (error: any) {
      await dbSession.endSession()
      throw error
    } finally {
      await dbSession.endSession()
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
