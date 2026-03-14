#!/usr/bin/env tsx

import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

// Load environment variables from .env.local (same as Next.js)
config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || 'receipt-ai'

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  console.error('   Make sure .env.local exists and contains MONGODB_URI')
  process.exit(1)
}

// Use the same connection approach as Next.js lib/mongodb.ts
// This includes connection pooling and proper error handling
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

const CURRENT_YEAR = new Date().getFullYear() // 2026
const ARCHIVE_YEAR = CURRENT_YEAR - 1 // 2025 and earlier

/**
 * Parse date string in various formats and extract year
 * Supports: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
 */
function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  
  // YYYY-MM-DD format
  const isoMatch = dateStr.match(/^(\d{4})-\d{2}-\d{2}$/)
  if (isoMatch) {
    return parseInt(isoMatch[1], 10)
  }
  
  // MM/DD/YYYY or M/D/YYYY format
  const usMatch = dateStr.match(/^\d{1,2}\/\d{1,2}\/(\d{4})$/)
  if (usMatch) {
    return parseInt(usMatch[1], 10)
  }
  
  // Try to extract first 4 digits as year
  const yearMatch = dateStr.match(/^(\d{4})/)
  if (yearMatch) {
    return parseInt(yearMatch[1], 10)
  }
  
  return null
}

/**
 * Check if a date string represents a date from a previous year
 */
function isPreviousYear(dateStr: string | null | undefined): boolean {
  const year = extractYear(dateStr)
  return year !== null && year < CURRENT_YEAR
}

async function analyzeDatabase() {
  try {
    console.log('🔄 Attempting to connect to MongoDB using Next.js connection method...')
    console.log(`   Database: ${DB_NAME}\n`)
    
    // Use the same connection method as Next.js app
    const client = await clientPromise
    await client.db('admin').command({ ping: 1 })
    console.log('✅ Connected to MongoDB successfully')
    console.log(`📊 Database: ${DB_NAME}`)
    console.log(`📅 Current Year: ${CURRENT_YEAR}`)
    console.log(`📦 Archive Year Threshold: ${ARCHIVE_YEAR} and earlier\n`)
    
    const db = client.db(DB_NAME)
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')
    
    // Get total counts
    const totalReceipts = await receiptsCol.countDocuments()
    const totalLineItems = await lineItemsCol.countDocuments()
    
    console.log('📋 Collection Statistics:')
    console.log(`   Receipts: ${totalReceipts.toLocaleString()} total`)
    console.log(`   Line Items: ${totalLineItems.toLocaleString()} total\n`)
    
    // Analyze receipts by year
    console.log('🔍 Analyzing Receipts by Year...')
    const receipts = await receiptsCol.find({}).toArray()
    
    const receiptsByYear: Record<number, number> = {}
    const receiptsToArchive: any[] = []
    const receiptsWithInvalidDates: any[] = []
    
    for (const receipt of receipts) {
      const year = extractYear(receipt.date)
      
      if (year === null) {
        receiptsWithInvalidDates.push({
          _id: receipt._id,
          date: receipt.date,
          merchant: receipt.merchant,
          createdAt: receipt.createdAt
        })
        continue
      }
      
      receiptsByYear[year] = (receiptsByYear[year] || 0) + 1
      
      if (year < CURRENT_YEAR) {
        receiptsToArchive.push({
          _id: receipt._id,
          date: receipt.date,
          merchant: receipt.merchant,
          accountId: receipt.accountId,
          createdAt: receipt.createdAt
        })
      }
    }
    
    console.log('\n📊 Receipts by Year:')
    const sortedYears = Object.keys(receiptsByYear)
      .map(y => parseInt(y, 10))
      .sort((a, b) => b - a)
    
    for (const year of sortedYears) {
      const count = receiptsByYear[year]
      const isArchive = year < CURRENT_YEAR
      const marker = isArchive ? '📦' : '✅'
      console.log(`   ${marker} ${year}: ${count.toLocaleString()} receipts`)
    }
    
    if (receiptsWithInvalidDates.length > 0) {
      console.log(`\n⚠️  Receipts with invalid/unparseable dates: ${receiptsWithInvalidDates.length}`)
      console.log('   Sample invalid dates:')
      receiptsWithInvalidDates.slice(0, 5).forEach(r => {
        console.log(`      - ID: ${r._id}, Date: "${r.date}", Merchant: ${r.merchant}`)
      })
    }
    
    console.log(`\n📦 Receipts to Archive: ${receiptsToArchive.length.toLocaleString()}`)
    console.log(`✅ Receipts to Keep: ${(totalReceipts - receiptsToArchive.length).toLocaleString()}\n`)
    
    // Analyze line items by year
    console.log('🔍 Analyzing Line Items by Year...')
    const lineItems = await lineItemsCol.find({}).toArray()
    
    const lineItemsByYear: Record<number, number> = {}
    const lineItemsToArchive: any[] = []
    const lineItemsWithInvalidDates: any[] = []
    const receiptIdMap = new Map<string, boolean>() // Track which receipt_ids are being archived
    
    // First, build a map of receipt IDs that will be archived
    for (const receipt of receiptsToArchive) {
      receiptIdMap.set(receipt._id.toString(), true)
    }
    
    for (const item of lineItems) {
      const year = extractYear(item.date)
      
      if (year === null) {
        lineItemsWithInvalidDates.push({
          _id: item._id,
          date: item.date,
          store: item.store,
          receipt_id: item.receipt_id
        })
        continue
      }
      
      lineItemsByYear[year] = (lineItemsByYear[year] || 0) + 1
      
      // Archive if date is previous year OR if parent receipt is being archived
      const receiptIdStr = item.receipt_id?.toString()
      const shouldArchive = year < CURRENT_YEAR || (receiptIdStr && receiptIdMap.has(receiptIdStr))
      
      if (shouldArchive) {
        lineItemsToArchive.push({
          _id: item._id,
          date: item.date,
          store: item.store,
          receipt_id: item.receipt_id,
          accountId: item.accountId
        })
      }
    }
    
    console.log('\n📊 Line Items by Year:')
    const sortedItemYears = Object.keys(lineItemsByYear)
      .map(y => parseInt(y, 10))
      .sort((a, b) => b - a)
    
    for (const year of sortedItemYears) {
      const count = lineItemsByYear[year]
      const isArchive = year < CURRENT_YEAR
      const marker = isArchive ? '📦' : '✅'
      console.log(`   ${marker} ${year}: ${count.toLocaleString()} line items`)
    }
    
    if (lineItemsWithInvalidDates.length > 0) {
      console.log(`\n⚠️  Line Items with invalid/unparseable dates: ${lineItemsWithInvalidDates.length}`)
      console.log('   Sample invalid dates:')
      lineItemsWithInvalidDates.slice(0, 5).forEach(item => {
        console.log(`      - ID: ${item._id}, Date: "${item.date}", Store: ${item.store}`)
      })
    }
    
    console.log(`\n📦 Line Items to Archive: ${lineItemsToArchive.length.toLocaleString()}`)
    console.log(`✅ Line Items to Keep: ${(totalLineItems - lineItemsToArchive.length).toLocaleString()}\n`)
    
    // Analyze by account
    console.log('🔍 Analyzing by Account...')
    const accountStats = new Map<string, { receipts: number, lineItems: number }>()
    
    for (const receipt of receiptsToArchive) {
      const accountId = receipt.accountId?.toString() || 'unknown'
      const stats = accountStats.get(accountId) || { receipts: 0, lineItems: 0 }
      stats.receipts++
      accountStats.set(accountId, stats)
    }
    
    for (const item of lineItemsToArchive) {
      const accountId = item.accountId?.toString() || 'unknown'
      const stats = accountStats.get(accountId) || { receipts: 0, lineItems: 0 }
      stats.lineItems++
      accountStats.set(accountId, stats)
    }
    
    console.log(`\n📊 Accounts with data to archive: ${accountStats.size}`)
    const sortedAccounts = Array.from(accountStats.entries())
      .sort((a, b) => (b[1].receipts + b[1].lineItems) - (a[1].receipts + a[1].lineItems))
      .slice(0, 10)
    
    console.log('   Top accounts by archive volume:')
    for (const [accountId, stats] of sortedAccounts) {
      console.log(`      ${accountId}: ${stats.receipts} receipts, ${stats.lineItems} line items`)
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 ARCHIVE SUMMARY')
    console.log('='.repeat(60))
    console.log(`📦 Receipts to Archive: ${receiptsToArchive.length.toLocaleString()}`)
    console.log(`📦 Line Items to Archive: ${lineItemsToArchive.length.toLocaleString()}`)
    console.log(`✅ Receipts to Keep: ${(totalReceipts - receiptsToArchive.length).toLocaleString()}`)
    console.log(`✅ Line Items to Keep: ${(totalLineItems - lineItemsToArchive.length).toLocaleString()}`)
    console.log(`\n💾 Estimated Storage Impact:`)
    console.log(`   Archive Collections: receipts_archive, line_items_archive`)
    console.log(`   Current Collections: receipts, line_items`)
    console.log(`\n⚠️  Next Steps:`)
    console.log(`   1. Review the data above`)
    console.log(`   2. Create migration script to move data to archive collections`)
    console.log(`   3. Run migration in dry-run mode first`)
    console.log(`   4. Execute migration and verify data integrity`)
    console.log('='.repeat(60))
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error)
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('\n💡 Troubleshooting tips:')
      console.error('   1. Check if your MongoDB Atlas cluster is running (free tier clusters pause after inactivity)')
      console.error('   2. Verify your network connection')
      console.error('   3. Check if your IP address is whitelisted in MongoDB Atlas')
      console.error('   4. Try accessing MongoDB Atlas dashboard to wake up the cluster')
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed - check your MongoDB credentials')
    } else {
      console.error('\n💡 Check your MongoDB connection string and network connectivity')
    }
    
    process.exit(1)
  } finally {
    // Close the client connection
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

// Run the script
analyzeDatabase().catch(console.error)
