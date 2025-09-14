import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function backupJanJulyData() {
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
    
    // Create backup directory
    const backupDir = path.join(__dirname, 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // Generate timestamp for backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `jan-july-backup-${timestamp}.json`)
    
    console.log('\n=== BACKING UP JAN-JULY 2025 DATA ===')
    
    // Get all records from January to July 2025
    const monthsToBackup = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07']
    
    const backupData = {
      timestamp: new Date().toISOString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        accountId: user.accountId?.toString()
      },
      records: [] as any[]
    }
    
    let totalBackedUp = 0
    
    for (const month of monthsToBackup) {
      const monthRecords = await lineItems.find({
        accountId: accountId,
        date: { $regex: `^${month}` }
      }).toArray()
      
      console.log(`${month}: Found ${monthRecords.length} records`)
      backupData.records.push(...monthRecords)
      totalBackedUp += monthRecords.length
    }
    
    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    
    console.log(`\n✅ Backup completed successfully!`)
    console.log(`📁 Backup file: ${backupFile}`)
    console.log(`📊 Total records backed up: ${totalBackedUp}`)
    
    // Show breakdown
    console.log('\n=== BACKUP BREAKDOWN ===')
    for (const month of monthsToBackup) {
      const monthCount = backupData.records.filter(record => 
        record.date && record.date.startsWith(month)
      ).length
      console.log(`${month}: ${monthCount} records`)
    }
    
    // Also create a rollback script
    const rollbackScript = `import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function rollbackJanJulyData() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const lineItems = db.collection('line_items')
    
    // Load backup data
    const backupFile = '${backupFile}'
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))
    
    console.log('📁 Loaded backup from:', backupData.timestamp)
    console.log('👤 User:', backupData.user.email)
    console.log('📊 Records to restore:', backupData.records.length)
    
    const accountId = new ObjectId(backupData.user.accountId)
    
    // Remove current Jan-July data
    const monthsToReplace = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07']
    let totalRemoved = 0
    
    for (const month of monthsToReplace) {
      const deleteResult = await lineItems.deleteMany({
        accountId: accountId,
        date: { $regex: \`^\${month}\` }
      })
      console.log(\`\${month}: Removed \${deleteResult.deletedCount} records\`)
      totalRemoved += deleteResult.deletedCount
    }
    
    // Restore backup data
    let totalRestored = 0
    for (const record of backupData.records) {
      // Remove _id to let MongoDB generate new one
      const { _id, ...recordData } = record
      recordData.accountId = accountId
      
      await lineItems.insertOne(recordData)
      totalRestored++
    }
    
    console.log(\`\\n✅ Rollback completed!\`)
    console.log(\`📊 Records removed: \${totalRemoved}\`)
    console.log(\`📊 Records restored: \${totalRestored}\`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

rollbackJanJulyData().catch(console.error)`
    
    const rollbackFile = path.join(backupDir, `rollback-jan-july-${timestamp}.ts`)
    fs.writeFileSync(rollbackFile, rollbackScript)
    
    console.log(`\n🔄 Rollback script created: ${rollbackFile}`)
    console.log(`\nTo restore this backup later, run:`)
    console.log(`npx tsx ${rollbackFile}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the backup
backupJanJulyData().catch(console.error)

