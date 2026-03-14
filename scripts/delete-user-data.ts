#!/usr/bin/env tsx

import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

// Load environment variables
config()

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB_NAME || 'receipt-ai'

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  process.exit(1)
}

const USER_EMAIL = 'e4_all@hotmail.com'

async function deleteUserData() {
  const client = new MongoClient(MONGODB_URI!)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // 1. Find the user
    console.log(`\n🔍 Looking for user: ${USER_EMAIL}`)
    const users = db.collection('users')
    const user = await users.findOne({ email: USER_EMAIL.toLowerCase() })
    
    if (!user) {
      console.log('❌ User not found in database')
      return
    }
    
    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      accountId: user.accountId,
      role: user.role
    })
    
    const userId = user._id
    const accountId = user.accountId
    
    // 2. Check what data exists for this user
    console.log('\n📊 Checking existing data...')
    
    // Check line items
    const lineItems = db.collection('line_items')
    const lineItemsCount = await lineItems.countDocuments({ accountId: accountId })
    console.log(`📝 Line items: ${lineItemsCount}`)
    
    // Check receipts
    const receipts = db.collection('receipts')
    const receiptsCount = await receipts.countDocuments({ accountId: accountId })
    console.log(`🧾 Receipts: ${receiptsCount}`)
    
    // Check account members
    const accountMembers = db.collection('account_members')
    const membersCount = await accountMembers.countDocuments({ accountId: accountId })
    console.log(`👥 Account members: ${membersCount}`)
    
    // Check account invites
    const accountInvites = db.collection('account_invites')
    const invitesCount = await accountInvites.countDocuments({ accountId: accountId })
    console.log(`📧 Account invites: ${invitesCount}`)
    
    // Check notifications
    const notifications = db.collection('notifications')
    const notificationsCount = await notifications.countDocuments({ accountId: accountId })
    console.log(`🔔 Notifications: ${notificationsCount}`)
    
    // Check two-factor auth
    const twoFactorAuth = db.collection('two_factor_auth')
    const twoFactorCount = await twoFactorAuth.countDocuments({ userId: userId })
    console.log(`🔐 Two-factor auth records: ${twoFactorCount}`)
    
    // Check account
    const accounts = db.collection('accounts')
    const account = await accounts.findOne({ _id: accountId })
    console.log(`🏢 Account: ${account ? 'Found' : 'Not found'}`)
    
    // 3. Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL data for this user!')
    console.log('This includes:')
    console.log('- User account')
    console.log('- All receipts and line items')
    console.log('- Account membership')
    console.log('- Account invites')
    console.log('- Notifications')
    console.log('- Two-factor auth records')
    console.log('- The entire account (if this user is the admin)')
    
    // For safety, we'll just show what would be deleted
    console.log('\n🔍 Data that would be deleted:')
    console.log(`- User: ${user.email} (${user.name})`)
    console.log(`- Line items: ${lineItemsCount}`)
    console.log(`- Receipts: ${receiptsCount}`)
    console.log(`- Account members: ${membersCount}`)
    console.log(`- Account invites: ${invitesCount}`)
    console.log(`- Notifications: ${notificationsCount}`)
    console.log(`- Two-factor auth records: ${twoFactorCount}`)
    if (account) {
      console.log(`- Account: ${account.name}`)
    }
    
    console.log('\n💡 To actually delete this data, uncomment the deletion code below and run again.')
    
    // Uncomment the following code to actually delete the data:
    /*
    console.log('\n🗑️  Starting deletion process...')
    
    // Start a transaction
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // 1. Delete all line items for this account
        const lineItemsResult = await lineItems.deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`✅ Deleted ${lineItemsResult.deletedCount} line items`)
        
        // 2. Delete all receipts for this account
        const receiptsResult = await receipts.deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`✅ Deleted ${receiptsResult.deletedCount} receipts`)
        
        // 3. Delete all account members
        const membersResult = await accountMembers.deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`✅ Deleted ${membersResult.deletedCount} account members`)
        
        // 4. Delete all account invites
        const invitesResult = await accountInvites.deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`✅ Deleted ${invitesResult.deletedCount} account invites`)
        
        // 5. Delete all notifications for this account
        const notificationsResult = await notifications.deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`✅ Deleted ${notificationsResult.deletedCount} notifications`)
        
        // 6. Delete all two-factor auth records for this user
        const twoFactorResult = await twoFactorAuth.deleteMany(
          { userId: userId },
          { session }
        )
        console.log(`✅ Deleted ${twoFactorResult.deletedCount} two-factor auth records`)
        
        // 7. Delete the user
        const userResult = await users.deleteOne(
          { _id: userId },
          { session }
        )
        console.log(`✅ Deleted ${userResult.deletedCount} user`)
        
        // 8. Finally, delete the account itself
        const accountResult = await accounts.deleteOne(
          { _id: accountId },
          { session }
        )
        console.log(`✅ Deleted ${accountResult.deletedCount} account`)
      })
      
      console.log('\n🎉 All data deleted successfully!')
      
    } catch (error) {
      console.error('❌ Error during deletion:', error)
      throw error
    } finally {
      await session.endSession()
    }
    */
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('✅ Disconnected from MongoDB')
  }
}

// Run the script
deleteUserData().catch(console.error)


