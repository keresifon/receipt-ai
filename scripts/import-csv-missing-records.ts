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

async function importCSVMissingRecords() {
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
    const receipts = db.collection('receipts')
    
    // Read all CSV files
    const csvDir = path.join(__dirname, 'csv')
    const csvFiles = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'))
    
    console.log(`Found ${csvFiles.length} CSV files:`, csvFiles)
    
    let totalImported = 0
    let totalSkipped = 0
    
    for (const csvFile of csvFiles) {
      const month = csvFile.replace('Expense Sheet - ', '').replace('.csv', '')
      console.log(`\n=== Processing ${month} ===`)
      
      // Parse CSV file
      const csvPath = path.join(csvDir, csvFile)
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
      let monthSkipped = 0
      
      for (const csvRecord of csvRecords) {
        const totalPrice = parseFloat(csvRecord.totalPrice)
        
        if (isNaN(totalPrice)) {
          console.log(`Skipping invalid price: ${csvRecord.totalPrice}`)
          monthSkipped++
          continue
        }
        
        // Check if this record already exists in database
        const existingRecord = await lineItems.findOne({
          accountId: accountId,
          date: csvRecord.date,
          store: csvRecord.store,
          description: csvRecord.itemDescription,
          total_price: totalPrice
        })
        
        if (existingRecord) {
          // Record already exists, skip
          monthSkipped++
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
          receipt_id: null, // Will be set if we create a receipt
          createdAt: new Date()
        }
        
        // Insert the line item
        const result = await lineItems.insertOne(newLineItem)
        console.log(`  ✅ Imported: ${csvRecord.date} - ${csvRecord.store} - ${csvRecord.itemDescription} - $${totalPrice}`)
        
        monthImported++
        totalImported++
      }
      
      console.log(`${month}: Imported ${monthImported}, Skipped ${monthSkipped}`)
    }
    
    // Summary
    console.log('\n=== IMPORT SUMMARY ===')
    console.log(`Total records imported: ${totalImported}`)
    console.log(`Total records skipped (already exist): ${totalSkipped}`)
    
    // Verify final counts
    const finalLineItemsCount = await lineItems.countDocuments({ accountId: accountId })
    console.log(`Final line_items count for ${user.email}: ${finalLineItemsCount}`)
    
    // Test API to see if new records are visible
    console.log('\n=== TESTING API ===')
    const testRecords = await lineItems.find({ accountId: accountId }).sort({ createdAt: -1 }).limit(5).toArray()
    console.log('Most recent records:')
    testRecords.forEach(record => {
      console.log(`  ${record.date} - ${record.store} - ${record.description} - $${record.total_price}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the import
importCSVMissingRecords().catch(console.error)
