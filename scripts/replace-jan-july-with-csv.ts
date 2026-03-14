import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

interface CSVRecord {
  date: string
  itemDescription: string
  category: string
  quantity: string
  pricePerUnit: string
  totalPrice: string
  store: string
  notes?: string
  discount?: string
}

async function replaceJanJulyWithCSV() {
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
    
    // Step 1: Remove all existing records from January to July 2025
    console.log('\n=== STEP 1: REMOVING EXISTING JAN-JULY 2025 RECORDS ===')
    
    const monthsToReplace = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07']
    
    let totalRemoved = 0
    for (const month of monthsToReplace) {
      const deleteResult = await lineItems.deleteMany({
        accountId: accountId,
        date: { $regex: `^${month}` }
      })
      console.log(`${month}: Removed ${deleteResult.deletedCount} records`)
      totalRemoved += deleteResult.deletedCount
    }
    
    console.log(`Total records removed: ${totalRemoved}`)
    
    // Step 2: Import all CSV records for January to July
    console.log('\n=== STEP 2: IMPORTING CSV RECORDS FOR JAN-JULY 2025 ===')
    
    const csvDir = path.join(__dirname, 'csv')
    const csvFiles = [
      'Expense Sheet - January.csv',
      'Expense Sheet - February.csv', 
      'Expense Sheet - March.csv',
      'Expense Sheet - April.csv',
      'Expense Sheet - May.csv',
      'Expense Sheet - June.csv',
      'Expense Sheet - July.csv'
    ]
    
    let totalImported = 0
    
    for (const csvFile of csvFiles) {
      const month = csvFile.replace('Expense Sheet - ', '').replace('.csv', '')
      console.log(`\n--- Processing ${month} ---`)
      
      // Parse CSV file
      const csvPath = path.join(csvDir, csvFile)
      
      if (!fs.existsSync(csvPath)) {
        console.log(`❌ CSV file not found: ${csvPath}`)
        continue
      }
      
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      const csvLines = csvContent.split('\n').filter(line => line.trim())
      
      // Skip header row
      const csvRecords: CSVRecord[] = csvLines.slice(1).map(line => {
        const [date, itemDescription, category, quantity, pricePerUnit, totalPrice, store, notes, discount] = line.split(',')
        return {
          date: date?.trim() || '',
          itemDescription: itemDescription?.trim() || '',
          category: category?.trim() || '',
          quantity: quantity?.trim() || '',
          pricePerUnit: pricePerUnit?.trim() || '',
          totalPrice: totalPrice?.trim() || '',
          store: store?.trim() || '',
          notes: notes?.trim() || '',
          discount: discount?.trim() || ''
        }
      }).filter(record => record.date && record.itemDescription && record.totalPrice)
      
      console.log(`CSV has ${csvRecords.length} records`)
      
      let monthImported = 0
      
      for (const csvRecord of csvRecords) {
        const totalPrice = parseFloat(csvRecord.totalPrice)
        
        if (isNaN(totalPrice)) {
          continue
        }
        
        // Create new line item record
        const newLineItem = {
          accountId: accountId,
          date: csvRecord.date,
          store: csvRecord.store,
          description: csvRecord.itemDescription,
          category: csvRecord.category || 'Uncategorized',
          quantity: csvRecord.quantity ? parseFloat(csvRecord.quantity) : 1,
          unit_price: csvRecord.pricePerUnit ? parseFloat(csvRecord.pricePerUnit) : totalPrice,
          total_price: totalPrice,
          hst: csvRecord.category === 'Tax' ? totalPrice : null,
          discount: csvRecord.discount ? parseFloat(csvRecord.discount) : null,
          receipt_id: null,
          createdAt: new Date()
        }
        
        // Insert the line item
        await lineItems.insertOne(newLineItem)
        monthImported++
      }
      
      console.log(`${month}: Imported ${monthImported} records`)
      totalImported += monthImported
    }
    
    // Final summary
    console.log(`\n=== REPLACEMENT COMPLETE ===`)
    console.log(`Records removed: ${totalRemoved}`)
    console.log(`Records imported: ${totalImported}`)
    
    // Verify final counts
    const finalLineItemsCount = await lineItems.countDocuments({ accountId: accountId })
    console.log(`Final line_items count for ${user.email}: ${finalLineItemsCount}`)
    
    // Show breakdown by month
    console.log('\n=== FINAL BREAKDOWN BY MONTH ===')
    for (const month of monthsToReplace) {
      const monthCount = await lineItems.countDocuments({
        accountId: accountId,
        date: { $regex: `^${month}` }
      })
      console.log(`${month}: ${monthCount} records`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the replacement
replaceJanJulyWithCSV().catch(console.error)



















