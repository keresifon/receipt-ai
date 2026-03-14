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

// Use the same connection approach as Next.js lib/mongodb.ts
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

/**
 * Detect if a user account is suspicious/bot-created
 */
function isSuspiciousAccount(user: any): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = []
  
  // Pattern 1: Random character names (15+ alphanumeric characters)
  const namePattern = /^[A-Za-z0-9]{15,}$/
  const hasSuspiciousName = user.name && namePattern.test(user.name.trim())
  if (hasSuspiciousName) {
    reasons.push('Random character name')
  }
  
  // Pattern 2: Suspicious email patterns (like "varotolufi435@gmail.com")
  const suspiciousEmailPattern = /^[a-z]+\d+@/
  const hasSuspiciousEmail = user.email && suspiciousEmailPattern.test(user.email)
  if (hasSuspiciousEmail) {
    reasons.push('Suspicious email pattern')
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  }
}

async function deleteSuspiciousAccounts() {
  const args = process.argv.slice(2)
  const DRY_RUN = args.includes('--dry-run') || args.includes('-d')
  const FORCE = args.includes('--force') || args.includes('-f')

  try {
    console.log('🔄 Connecting to MongoDB...')
    const mongoClient = await clientPromise
    await mongoClient.db('admin').command({ ping: 1 })
    console.log('✅ Connected to MongoDB\n')
    
    const db = mongoClient.db(DB_NAME)
    const usersCol = db.collection('users')
    const accountsCol = db.collection('accounts')
    const accountMembersCol = db.collection('account_members')
    const accountInvitesCol = db.collection('account_invites')
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')
    
    console.log('='.repeat(70))
    console.log('🤖 SUSPICIOUS ACCOUNT DELETION SCRIPT')
    console.log('='.repeat(70))
    console.log(`Database: ${DB_NAME}`)
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY-RUN (no changes will be made)' : '⚡ LIVE (accounts will be deleted)'}`)
    console.log('='.repeat(70) + '\n'
    
    // Get all users and identify suspicious ones
    console.log('📋 Scanning users for suspicious accounts...')
    const allUsers = await usersCol.find({}).toArray()
    const suspiciousUsers: any[] = []
    
    for (const user of allUsers) {
      const { isSuspicious, reasons } = isSuspiciousAccount(user)
      if (isSuspicious) {
        suspiciousUsers.push({
          ...user,
          suspiciousReasons: reasons
        })
      }
    }
    
    console.log(`\n🔍 Found ${suspiciousUsers.length} suspicious accounts out of ${allUsers.length} total users\n`)
    
    if (suspiciousUsers.length === 0) {
      console.log('✅ No suspicious accounts found. Nothing to delete.\n')
      return
    }
    
    // Show details of suspicious accounts
    console.log('📋 Suspicious Accounts:')
    console.log('-'.repeat(70))
    for (const user of suspiciousUsers) {
      console.log(`\n  ID: ${user._id}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Account ID: ${user.accountId || 'None'}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log(`  Reasons: ${user.suspiciousReasons.join(', ')}`)
    }
    console.log('\n' + '-'.repeat(70) + '\n')
    
    if (DRY_RUN) {
      console.log('🔍 DRY-RUN MODE: No accounts will be deleted.')
      console.log('   To perform the actual deletion, run without --dry-run flag\n')
      return
    }
    
    // Confirm before proceeding
    if (!FORCE) {
      console.log('⚠️  WARNING: This will permanently delete suspicious accounts and their data!')
      console.log('   This operation cannot be undone.')
      console.log('   Run with --force flag to skip this confirmation.\n')
      console.log('   Press Ctrl+C to cancel, or wait 10 seconds to continue...\n')
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
    
    // Perform deletion using transactions
    console.log('🗑️  Starting deletion process...\n')
    
    const session = mongoClient.startSession()
    let deletedCount = 0
    let deletedAccounts = 0
    
    try {
      await session.withTransaction(async () => {
        for (const user of suspiciousUsers) {
          const userId = user._id
          const accountId = user.accountId ? new ObjectId(user.accountId) : null
          
          console.log(`\n🗑️  Deleting user: ${user.name} (${user.email})`)
          console.log(`   Reasons: ${user.suspiciousReasons.join(', ')}`)
          
          // 1. Delete account memberships
          const membersResult = await accountMembersCol.deleteMany(
            { userId: userId },
            { session }
          )
          if (membersResult.deletedCount > 0) {
            console.log(`   ✅ Deleted ${membersResult.deletedCount} account memberships`)
          }
          
          // 2. Delete account invites sent by this user
          const invitesResult = await accountInvitesCol.deleteMany(
            { invitedBy: userId },
            { session }
          )
          if (invitesResult.deletedCount > 0) {
            console.log(`   ✅ Deleted ${invitesResult.deletedCount} account invites`)
          }
          
          // 3. If user has an account, check if they're the only member
          if (accountId) {
            const accountMembers = await accountMembersCol.countDocuments(
              { accountId: accountId },
              { session }
            )
            
            // If no other members, delete the account and its data
            if (accountMembers === 0) {
              console.log(`   ⚠️  Account has no other members, deleting account and its data...`)
              
              // Delete receipts
              const receiptsResult = await receiptsCol.deleteMany(
                { accountId: accountId },
                { session }
              )
              console.log(`   ✅ Deleted ${receiptsResult.deletedCount} receipts`)
              
              // Delete line items
              const lineItemsResult = await lineItemsCol.deleteMany(
                { accountId: accountId },
                { session }
              )
              console.log(`   ✅ Deleted ${lineItemsResult.deletedCount} line items`)
              
              // Delete account invites for this account
              await accountInvitesCol.deleteMany(
                { accountId: accountId },
                { session }
              )
              
              // Delete the account
              const accountResult = await accountsCol.deleteOne(
                { _id: accountId },
                { session }
              )
              if (accountResult.deletedCount > 0) {
                deletedAccounts++
                console.log(`   ✅ Deleted account`)
              }
            } else {
              console.log(`   ℹ️  Account has ${accountMembers} other members, keeping account`)
            }
          }
          
          // 4. Delete the user
          const userResult = await usersCol.deleteOne(
            { _id: userId },
            { session }
          )
          if (userResult.deletedCount > 0) {
            deletedCount++
            console.log(`   ✅ Deleted user account`)
          }
        }
      })
      
      console.log('\n' + '='.repeat(70))
      console.log('✅ DELETION COMPLETE')
      console.log('='.repeat(70))
      console.log(`✅ Deleted ${deletedCount} suspicious user accounts`)
      console.log(`✅ Deleted ${deletedAccounts} orphaned accounts`)
      console.log('='.repeat(70) + '\n')
      
    } catch (error: any) {
      console.error('\n❌ Error during deletion:', error.message)
      console.error('   Transaction rolled back - no data was deleted.\n')
      throw error
    } finally {
      await session.endSession()
    }
    
  } catch (error: any) {
    console.error('\n❌ Deletion failed:', error.message || error)
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    try {
      if (client) {
        await client.close()
        console.log('✅ Disconnected from MongoDB')
      }
    } catch (e) {
      // Ignore close errors
    }
  }
}

// Run the script
deleteSuspiciousAccounts().catch(console.error)
