import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function checkMissingAccountIds() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // Check line_items collection
    console.log('\n=== LINE_ITEMS COLLECTION ===')
    const lineItems = db.collection('line_items')
    
    const totalLineItems = await lineItems.countDocuments()
    console.log(`Total line_items records: ${totalLineItems}`)
    
    const lineItemsWithAccountId = await lineItems.countDocuments({ accountId: { $exists: true, $ne: null } })
    const lineItemsWithoutAccountId = totalLineItems - lineItemsWithAccountId
    
    console.log(`Records with accountId: ${lineItemsWithAccountId}`)
    console.log(`Records without accountId: ${lineItemsWithoutAccountId}`)
    
    if (lineItemsWithoutAccountId > 0) {
      console.log('\nSample records without accountId:')
      const samplesWithoutAccountId = await lineItems.find({ 
        $or: [
          { accountId: { $exists: false } },
          { accountId: null }
        ]
      }).limit(5).toArray()
      
      samplesWithoutAccountId.forEach(record => {
        console.log(`  ${record._id} - ${record.date} - ${record.store} - ${record.description} - accountId: ${record.accountId}`)
      })
    }
    
    // Check receipts collection
    console.log('\n=== RECEIPTS COLLECTION ===')
    const receipts = db.collection('receipts')
    
    const totalReceipts = await receipts.countDocuments()
    console.log(`Total receipts records: ${totalReceipts}`)
    
    const receiptsWithAccountId = await receipts.countDocuments({ accountId: { $exists: true, $ne: null } })
    const receiptsWithoutAccountId = totalReceipts - receiptsWithAccountId
    
    console.log(`Records with accountId: ${receiptsWithAccountId}`)
    console.log(`Records without accountId: ${receiptsWithoutAccountId}`)
    
    if (receiptsWithoutAccountId > 0) {
      console.log('\nSample receipts without accountId:')
      const samplesWithoutAccountId = await receipts.find({ 
        $or: [
          { accountId: { $exists: false } },
          { accountId: null }
        ]
      }).limit(5).toArray()
      
      samplesWithoutAccountId.forEach(record => {
        console.log(`  ${record._id} - ${record.date} - ${record.merchant} - accountId: ${record.accountId}`)
      })
    }
    
    // Check account_members collection
    console.log('\n=== ACCOUNT_MEMBERS COLLECTION ===')
    const accountMembers = db.collection('account_members')
    
    const totalMembers = await accountMembers.countDocuments()
    console.log(`Total account_members records: ${totalMembers}`)
    
    const membersWithAccountId = await accountMembers.countDocuments({ accountId: { $exists: true, $ne: null } })
    const membersWithoutAccountId = totalMembers - membersWithAccountId
    
    console.log(`Records with accountId: ${membersWithAccountId}`)
    console.log(`Records without accountId: ${membersWithoutAccountId}`)
    
    // Check account_invites collection
    console.log('\n=== ACCOUNT_INVITES COLLECTION ===')
    const accountInvites = db.collection('account_invites')
    
    const totalInvites = await accountInvites.countDocuments()
    console.log(`Total account_invites records: ${totalInvites}`)
    
    const invitesWithAccountId = await accountInvites.countDocuments({ accountId: { $exists: true, $ne: null } })
    const invitesWithoutAccountId = totalInvites - invitesWithAccountId
    
    console.log(`Records with accountId: ${invitesWithAccountId}`)
    console.log(`Records without accountId: ${invitesWithoutAccountId}`)
    
    // Check users collection
    console.log('\n=== USERS COLLECTION ===')
    const users = db.collection('users')
    
    const totalUsers = await users.countDocuments()
    console.log(`Total users records: ${totalUsers}`)
    
    const usersWithAccountId = await users.countDocuments({ accountId: { $exists: true, $ne: null } })
    const usersWithoutAccountId = totalUsers - usersWithAccountId
    
    console.log(`Records with accountId: ${usersWithAccountId}`)
    console.log(`Records without accountId: ${usersWithoutAccountId}`)
    
    if (usersWithoutAccountId > 0) {
      console.log('\nSample users without accountId:')
      const samplesWithoutAccountId = await users.find({ 
        $or: [
          { accountId: { $exists: false } },
          { accountId: null }
        ]
      }).limit(5).toArray()
      
      samplesWithoutAccountId.forEach(record => {
        console.log(`  ${record._id} - ${record.email} - ${record.name} - accountId: ${record.accountId}`)
      })
    }
    
    // Summary
    console.log('\n=== SUMMARY ===')
    const totalRecordsWithoutAccountId = lineItemsWithoutAccountId + receiptsWithoutAccountId + membersWithoutAccountId + invitesWithoutAccountId + usersWithoutAccountId
    
    if (totalRecordsWithoutAccountId === 0) {
      console.log('✅ All records have accountId fields')
    } else {
      console.log(`❌ ${totalRecordsWithoutAccountId} records are missing accountId fields`)
      console.log(`   - line_items: ${lineItemsWithoutAccountId}`)
      console.log(`   - receipts: ${receiptsWithoutAccountId}`)
      console.log(`   - account_members: ${membersWithoutAccountId}`)
      console.log(`   - account_invites: ${invitesWithoutAccountId}`)
      console.log(`   - users: ${usersWithoutAccountId}`)
    }
    
    // Check for records with invalid accountId format (string vs ObjectId)
    console.log('\n=== ACCOUNT_ID FORMAT CHECK ===')
    
    // Check line_items for string accountIds
    const lineItemsWithStringAccountId = await lineItems.countDocuments({
      accountId: { $type: 'string' }
    })
    const lineItemsWithObjectIdAccountId = await lineItems.countDocuments({
      accountId: { $type: 'objectId' }
    })
    
    console.log(`line_items with string accountId: ${lineItemsWithStringAccountId}`)
    console.log(`line_items with ObjectId accountId: ${lineItemsWithObjectIdAccountId}`)
    
    if (lineItemsWithStringAccountId > 0) {
      console.log('\nSample line_items with string accountId:')
      const samples = await lineItems.find({ accountId: { $type: 'string' } }).limit(3).toArray()
      samples.forEach(record => {
        console.log(`  ${record._id} - accountId: "${record.accountId}" (type: ${typeof record.accountId})`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the check
checkMissingAccountIds().catch(console.error)

