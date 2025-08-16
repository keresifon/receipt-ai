const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

async function checkDatabase() {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      console.error('MONGODB_URI not found in .env.local')
      return
    }

    const client = new MongoClient(uri)
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Check line_items collection
    const lineItems = db.collection('line_items')
    const totalLineItems = await lineItems.countDocuments()
    console.log(`\n📊 Line Items Collection:`)
    console.log(`   Total records: ${totalLineItems}`)
    
    if (totalLineItems > 0) {
      const sampleItem = await lineItems.findOne()
      console.log(`   Sample record:`, JSON.stringify(sampleItem, null, 2))
    }

    // Check receipts collection
    const receipts = db.collection('receipts')
    const totalReceipts = await receipts.countDocuments()
    console.log(`\n📋 Receipts Collection:`)
    console.log(`   Total records: ${totalReceipts}`)
    
    if (totalReceipts > 0) {
      const sampleReceipt = await receipts.findOne()
      console.log(`   Sample record:`, JSON.stringify(sampleReceipt, null, 2))
    }

    // Check users collection
    const users = db.collection('users')
    const totalUsers = await users.countDocuments()
    console.log(`\n👤 Users Collection:`)
    console.log(`   Total records: ${totalUsers}`)
    
    if (totalUsers > 0) {
      const sampleUser = await users.findOne()
      console.log(`   Sample record:`, JSON.stringify(sampleUser, null, 2))
    }

    // Check accounts collection
    const accounts = db.collection('accounts')
    const totalAccounts = await accounts.countDocuments()
    console.log(`\n🏢 Accounts Collection:`)
    console.log(`   Total records: ${totalAccounts}`)
    
    if (totalAccounts > 0) {
      const sampleAccount = await accounts.findOne()
      console.log(`   Sample record:`, JSON.stringify(sampleAccount, null, 2))
    }

    // Check if there are any records with accountId
    if (totalLineItems > 0) {
      const withAccountId = await lineItems.countDocuments({ accountId: { $exists: true } })
      const withoutAccountId = await lineItems.countDocuments({ accountId: { $exists: false } })
      console.log(`\n🔐 Account ID Status:`)
      console.log(`   Records with accountId: ${withAccountId}`)
      console.log(`   Records without accountId: ${withoutAccountId}`)
    }

    await client.close()
    console.log('\n✅ Database check completed')

  } catch (error) {
    console.error('❌ Error checking database:', error)
  }
}

checkDatabase()
