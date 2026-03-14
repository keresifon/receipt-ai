#!/usr/bin/env tsx

import { MongoClient, ObjectId } from 'mongodb'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || 'receipt-ai'

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  process.exit(1)
}

const CURRENT_YEAR = new Date().getFullYear()

// Parse command line arguments
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run') || args.includes('-d')
const FORCE = args.includes('--force') || args.includes('-f')

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

/**
 * Use the same connection approach as Next.js lib/mongodb.ts
 */
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient>

const globalWithMongo = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> }

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

async function migrateToArchive() {
  try {
    console.log('🔄 Connecting to MongoDB...')
    const mongoClient = await clientPromise
    await mongoClient.db('admin').command({ ping: 1 })
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoClient.db(DB_NAME)
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')
    const receiptsArchiveCol = db.collection('receipts_archive')
    const lineItemsArchiveCol = db.collection('line_items_archive')
    
    console.log('='.repeat(70))
    console.log('📦 ARCHIVE MIGRATION SCRIPT')
    console.log('='.repeat(70))
    console.log(`Current Year: ${CURRENT_YEAR}`)
    console.log(`Database: ${DB_NAME}`)
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY-RUN (no changes will be made)' : '⚡ LIVE (data will be moved)'}`)
    console.log('='.repeat(70) + '\n')
    
    // Step 1: Identify receipts to archive
    console.log('📋 Step 1: Identifying receipts to archive...')
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
    
    console.log(`   Found ${receiptsToArchive.length} receipts to archive (years < ${CURRENT_YEAR})`)
    console.log(`   ${allReceipts.length - receiptsToArchive.length} receipts will remain in main collection\n`)
    
    // Step 2: Identify line items to archive
    console.log('📋 Step 2: Identifying line items to archive...')
    const allLineItems = await lineItemsCol.find({}).toArray()
    const lineItemsToArchive: any[] = []
    
    for (const item of allLineItems) {
      const year = extractYear(item.date)
      const receiptIdStr = item.receipt_id?.toString()
      // Archive if date is previous year OR if parent receipt is being archived
      const shouldArchive = (year !== null && year < CURRENT_YEAR) || 
                           (receiptIdStr && receiptIdToArchive.has(receiptIdStr))
      
      if (shouldArchive) {
        lineItemsToArchive.push(item)
      }
    }
    
    console.log(`   Found ${lineItemsToArchive.length} line items to archive`)
    console.log(`   ${allLineItems.length - lineItemsToArchive.length} line items will remain in main collection\n`)
    
    // Step 3: Verify archive collections exist (or create them)
    console.log('📋 Step 3: Verifying archive collections...')
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    if (!collectionNames.includes('receipts_archive')) {
      console.log('   Creating receipts_archive collection...')
      if (!DRY_RUN) {
        await db.createCollection('receipts_archive')
        // Create indexes on archive collection
        await receiptsArchiveCol.createIndexes([
          { key: { date: 1, merchant: 1 } },
          { key: { createdAt: -1 } },
          { key: { accountId: 1 } },
        ])
      }
      console.log('   ✅ receipts_archive collection ready')
    } else {
      const archiveCount = await receiptsArchiveCol.countDocuments()
      console.log(`   ✅ receipts_archive collection exists (${archiveCount} documents)`)
    }
    
    if (!collectionNames.includes('line_items_archive')) {
      console.log('   Creating line_items_archive collection...')
      if (!DRY_RUN) {
        await db.createCollection('line_items_archive')
        // Create indexes on archive collection
        await lineItemsArchiveCol.createIndexes([
          { key: { receipt_id: 1 } },
          { key: { date: 1, store: 1 } },
          { key: { category: 1, date: -1 } },
          { key: { accountId: 1 } },
        ])
      }
      console.log('   ✅ line_items_archive collection ready')
    } else {
      const archiveCount = await lineItemsArchiveCol.countDocuments()
      console.log(`   ✅ line_items_archive collection exists (${archiveCount} documents)`)
    }
    console.log()
    
    // Step 4: Show summary
    console.log('='.repeat(70))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`Receipts to archive: ${receiptsToArchive.length}`)
    console.log(`Line items to archive: ${lineItemsToArchive.length}`)
    console.log(`Receipts to keep: ${allReceipts.length - receiptsToArchive.length}`)
    console.log(`Line items to keep: ${allLineItems.length - lineItemsToArchive.length}`)
    console.log('='.repeat(70) + '\n')
    
    if (DRY_RUN) {
      console.log('🔍 DRY-RUN MODE: No data will be moved.')
      console.log('   To perform the actual migration, run without --dry-run flag\n')
      
      // Show sample data
      if (receiptsToArchive.length > 0) {
        console.log('Sample receipts to archive:')
        receiptsToArchive.slice(0, 3).forEach(r => {
          console.log(`   - ${r._id}: ${r.date} | ${r.merchant} | Account: ${r.accountId || 'unknown'}`)
        })
        console.log()
      }
      
      if (lineItemsToArchive.length > 0) {
        console.log('Sample line items to archive:')
        lineItemsToArchive.slice(0, 3).forEach(item => {
          console.log(`   - ${item._id}: ${item.date} | ${item.store} | ${item.description}`)
        })
        console.log()
      }
      
      return
    }
    
    // Step 5: Confirm before proceeding (unless --force)
    if (!FORCE) {
      console.log('⚠️  WARNING: This will move data to archive collections!')
      console.log('   This operation cannot be easily undone.')
      console.log('   Run with --force flag to skip this confirmation.\n')
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    // Step 6: Perform migration using transactions
    console.log('🚀 Starting migration...\n')
    
    const session = mongoClient.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Move receipts to archive
        if (receiptsToArchive.length > 0) {
          console.log(`📦 Moving ${receiptsToArchive.length} receipts to archive...`)
          const receiptIds = receiptsToArchive.map(r => r._id)
          
          // Insert into archive
          await receiptsArchiveCol.insertMany(receiptsToArchive, { session })
          console.log(`   ✅ Inserted ${receiptsToArchive.length} receipts into receipts_archive`)
          
          // Delete from main collection
          const deleteReceiptsResult = await receiptsCol.deleteMany(
            { _id: { $in: receiptIds } },
            { session }
          )
          console.log(`   ✅ Deleted ${deleteReceiptsResult.deletedCount} receipts from receipts collection`)
        }
        
        // Move line items to archive
        if (lineItemsToArchive.length > 0) {
          console.log(`📦 Moving ${lineItemsToArchive.length} line items to archive...`)
          const lineItemIds = lineItemsToArchive.map(item => item._id)
          
          // Insert into archive
          await lineItemsArchiveCol.insertMany(lineItemsToArchive, { session })
          console.log(`   ✅ Inserted ${lineItemsToArchive.length} line items into line_items_archive`)
          
          // Delete from main collection
          const deleteLineItemsResult = await lineItemsCol.deleteMany(
            { _id: { $in: lineItemIds } },
            { session }
          )
          console.log(`   ✅ Deleted ${deleteLineItemsResult.deletedCount} line items from line_items collection`)
        }
      })
      
      console.log('\n✅ Migration completed successfully!\n')
      
      // Step 7: Verify migration
      console.log('🔍 Verifying migration...')
      const remainingReceipts = await receiptsCol.countDocuments()
      const remainingLineItems = await lineItemsCol.countDocuments()
      const archivedReceipts = await receiptsArchiveCol.countDocuments()
      const archivedLineItems = await lineItemsArchiveCol.countDocuments()
      
      console.log(`   Main collection - Receipts: ${remainingReceipts}, Line Items: ${remainingLineItems}`)
      console.log(`   Archive collection - Receipts: ${archivedReceipts}, Line Items: ${archivedLineItems}`)
      
      if (remainingReceipts === allReceipts.length - receiptsToArchive.length &&
          remainingLineItems === allLineItems.length - lineItemsToArchive.length) {
        console.log('\n✅ Verification passed! Migration successful.\n')
      } else {
        console.log('\n⚠️  Verification warning: Counts do not match expected values.')
        console.log('   Please review the data manually.\n')
      }
      
    } catch (error: any) {
      console.error('\n❌ Error during migration:', error.message)
      console.error('   Transaction rolled back - no data was moved.\n')
      throw error
    } finally {
      await session.endSession()
    }
    
    console.log('='.repeat(70))
    console.log('🎉 MIGRATION COMPLETE')
    console.log('='.repeat(70))
    console.log(`✅ ${receiptsToArchive.length} receipts moved to receipts_archive`)
    console.log(`✅ ${lineItemsToArchive.length} line items moved to line_items_archive`)
    console.log(`✅ ${allReceipts.length - receiptsToArchive.length} receipts remain in main collection`)
    console.log(`✅ ${allLineItems.length - lineItemsToArchive.length} line items remain in main collection`)
    console.log('='.repeat(70))
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message || error)
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    try {
      if (client) {
        await client.close()
        console.log('\n✅ Disconnected from MongoDB')
      }
    } catch (e) {
      // Ignore close errors
    }
  }
}

// Run the migration
migrateToArchive().catch(console.error)
