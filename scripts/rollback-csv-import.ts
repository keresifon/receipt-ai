import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function rollbackCSVImport() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // Find the user and their accountId
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
    
    const lineItems = db.collection('line_items')
    
    // Get current count before rollback
    const currentCount = await lineItems.countDocuments({ accountId: accountId })
    console.log(`\nCurrent line_items count: ${currentCount}`)
    
    // Find records that were likely imported (have createdAt field and are recent)
    const recentDate = new Date()
    recentDate.setMinutes(recentDate.getMinutes() - 30) // Within last 30 minutes
    
    const importedRecords = await lineItems.find({
      accountId: accountId,
      createdAt: { $gte: recentDate }
    }).toArray()
    
    console.log(`Found ${importedRecords.length} records created in the last 30 minutes`)
    
    if (importedRecords.length === 0) {
      console.log('No recent records found to rollback')
      return
    }
    
    // Show sample of records to be deleted
    console.log('\nSample records to be deleted:')
    importedRecords.slice(0, 5).forEach(record => {
      console.log(`  ${record._id} - ${record.date} - ${record.store} - ${record.description} - $${record.total_price}`)
    })
    
    // Confirm deletion
    console.log(`\n⚠️  WARNING: About to delete ${importedRecords.length} records`)
    console.log('This will remove all records imported from CSV files')
    
    // Delete the imported records
    const deleteResult = await lineItems.deleteMany({
      accountId: accountId,
      createdAt: { $gte: recentDate }
    })
    
    console.log(`\n✅ Deleted ${deleteResult.deletedCount} records`)
    
    // Verify rollback
    const newCount = await lineItems.countDocuments({ accountId: accountId })
    console.log(`New line_items count: ${newCount}`)
    console.log(`Records removed: ${currentCount - newCount}`)
    
    // Check if there are any remaining records with createdAt field
    const remainingWithCreatedAt = await lineItems.countDocuments({
      accountId: accountId,
      createdAt: { $exists: true }
    })
    
    console.log(`Remaining records with createdAt field: ${remainingWithCreatedAt}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the rollback
rollbackCSVImport().catch(console.error)



















