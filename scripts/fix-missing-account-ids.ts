import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function fixMissingAccountIds() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // First, find the user and their accountId
    const users = db.collection('users')
    const user = await users.findOne({ email: 'YOUR_EMAIL@example.com' })
    
    if (!user) {
      console.log('❌ User YOUR_EMAIL@example.com not found')
      return
    }
    
    console.log('✅ Found user:', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      accountId: user.accountId?.toString()
    })
    
    if (!user.accountId) {
      console.log('❌ User does not have an accountId')
      return
    }
    
    const accountId = new ObjectId(user.accountId)
    console.log(`Using accountId: ${accountId}`)
    
    // Fix line_items without accountId
    console.log('\n=== FIXING LINE_ITEMS ===')
    const lineItems = db.collection('line_items')
    
    const lineItemsWithoutAccountId = await lineItems.countDocuments({ 
      $or: [
        { accountId: { $exists: false } },
        { accountId: null }
      ]
    })
    
    console.log(`Found ${lineItemsWithoutAccountId} line_items without accountId`)
    
    if (lineItemsWithoutAccountId > 0) {
      const lineItemsResult = await lineItems.updateMany(
        { 
          $or: [
            { accountId: { $exists: false } },
            { accountId: null }
          ]
        },
        { $set: { accountId: accountId } }
      )
      
      console.log(`✅ Updated ${lineItemsResult.modifiedCount} line_items records`)
      
      // Show sample of updated records
      const updatedLineItems = await lineItems.find({ accountId: accountId }).limit(3).toArray()
      console.log('Sample updated line_items:')
      updatedLineItems.forEach(record => {
        console.log(`  ${record._id} - ${record.date} - ${record.store} - ${record.description}`)
      })
    }
    
    // Fix receipts without accountId
    console.log('\n=== FIXING RECEIPTS ===')
    const receipts = db.collection('receipts')
    
    const receiptsWithoutAccountId = await receipts.countDocuments({ 
      $or: [
        { accountId: { $exists: false } },
        { accountId: null }
      ]
    })
    
    console.log(`Found ${receiptsWithoutAccountId} receipts without accountId`)
    
    if (receiptsWithoutAccountId > 0) {
      const receiptsResult = await receipts.updateMany(
        { 
          $or: [
            { accountId: { $exists: false } },
            { accountId: null }
          ]
        },
        { $set: { accountId: accountId } }
      )
      
      console.log(`✅ Updated ${receiptsResult.modifiedCount} receipts records`)
      
      // Show sample of updated records
      const updatedReceipts = await receipts.find({ accountId: accountId }).limit(3).toArray()
      console.log('Sample updated receipts:')
      updatedReceipts.forEach(record => {
        console.log(`  ${record._id} - ${record.date} - ${record.merchant}`)
      })
    }
    
    // Fix string accountIds (convert to ObjectId)
    console.log('\n=== FIXING STRING ACCOUNT_IDS ===')
    
    const lineItemsWithStringAccountId = await lineItems.countDocuments({
      accountId: { $type: 'string' }
    })
    
    console.log(`Found ${lineItemsWithStringAccountId} line_items with string accountId`)
    
    if (lineItemsWithStringAccountId > 0) {
      const stringAccountIdResult = await lineItems.updateMany(
        { accountId: { $type: 'string' } },
        [{ $set: { accountId: { $toObjectId: "$accountId" } } }]
      )
      
      console.log(`✅ Updated ${stringAccountIdResult.modifiedCount} line_items with string accountId`)
    }
    
    // Verify the fixes
    console.log('\n=== VERIFICATION ===')
    
    const finalLineItemsCount = await lineItems.countDocuments({ accountId: accountId })
    const finalReceiptsCount = await receipts.countDocuments({ accountId: accountId })
    
    console.log(`Final count for ${user.email}:`)
    console.log(`  line_items: ${finalLineItemsCount}`)
    console.log(`  receipts: ${finalReceiptsCount}`)
    
    // Check for any remaining records without accountId
    const remainingLineItemsWithoutAccountId = await lineItems.countDocuments({ 
      $or: [
        { accountId: { $exists: false } },
        { accountId: null }
      ]
    })
    
    const remainingReceiptsWithoutAccountId = await receipts.countDocuments({ 
      $or: [
        { accountId: { $exists: false } },
        { accountId: null }
      ]
    })
    
    if (remainingLineItemsWithoutAccountId === 0 && remainingReceiptsWithoutAccountId === 0) {
      console.log('✅ All records now have accountId fields')
    } else {
      console.log(`❌ Still have ${remainingLineItemsWithoutAccountId} line_items and ${remainingReceiptsWithoutAccountId} receipts without accountId`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the fix
fixMissingAccountIds().catch(console.error)

