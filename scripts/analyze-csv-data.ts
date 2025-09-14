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

interface DatabaseRecord {
  _id: string
  date: string
  store: string
  description: string
  category: string
  total_price: number
  accountId: string
}

interface MonthlyComparison {
  month: string
  csvRecords: number
  csvTotal: number
  dbRecords: number
  dbTotal: number
  difference: number
  missingInDB: CSVRecord[]
  extraInDB: DatabaseRecord[]
}

async function analyzeCSVData() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const lineItems = db.collection('line_items')
    
    // Get account ID for the user
    const accountId = new ObjectId('68a0bc4b3c71a47a7a3f89bd')
    
    // Read all CSV files
    const csvDir = path.join(__dirname, 'csv')
    const csvFiles = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'))
    
    console.log(`Found ${csvFiles.length} CSV files:`, csvFiles)
    
    const monthlyComparisons: MonthlyComparison[] = []
    
    for (const csvFile of csvFiles) {
      const month = csvFile.replace('Expense Sheet - ', '').replace('.csv', '')
      console.log(`\n=== Analyzing ${month} ===`)
      
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
      }).filter(record => record.date && record.itemDescription)
      
      // Calculate CSV totals
      const csvTotal = csvRecords.reduce((sum, record) => {
        const price = parseFloat(record.totalPrice) || 0
        return sum + price
      }, 0)
      
      console.log(`CSV Records: ${csvRecords.length}, Total: $${csvTotal.toFixed(2)}`)
      
      // Get database records for this month
      const year = 2025
      const monthNumber = getMonthNumber(month)
      const startDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`
      const endDate = `${year}-${monthNumber.toString().padStart(2, '0')}-31`
      
      console.log(`Querying DB for dates: ${startDate} to ${endDate}`)
      
      const dbRecords = await lineItems.find({
        accountId: accountId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).toArray()
      
      const dbTotal = dbRecords.reduce((sum, record) => {
        const price = typeof record.total_price === 'number' ? record.total_price : parseFloat(record.total_price || '0')
        return sum + price
      }, 0)
      
      console.log(`DB Records: ${dbRecords.length}, Total: $${typeof dbTotal === 'number' ? dbTotal.toFixed(2) : '0.00'}`)
      
      // Debug: Show first few DB records
      if (dbRecords.length > 0) {
        console.log('Sample DB records:')
        dbRecords.slice(0, 3).forEach(record => {
          console.log(`  ${record.date} - ${record.store} - ${record.description} - $${record.total_price} (type: ${typeof record.total_price})`)
        })
      }
      
      // Find missing records (in CSV but not in DB)
      const missingInDB: CSVRecord[] = []
      const extraInDB: DatabaseRecord[] = []
      
      // Simple comparison based on date, store, and description
      for (const csvRecord of csvRecords) {
        const found = dbRecords.find(dbRecord => 
          dbRecord.date === csvRecord.date &&
          dbRecord.store.toLowerCase().includes(csvRecord.store.toLowerCase()) &&
          Math.abs(dbRecord.total_price - parseFloat(csvRecord.totalPrice || '0')) < 0.01
        )
        
        if (!found) {
          missingInDB.push(csvRecord)
        }
      }
      
      // Find extra records (in DB but not in CSV)
      for (const dbRecord of dbRecords) {
        const found = csvRecords.find(csvRecord => 
          csvRecord.date === dbRecord.date &&
          csvRecord.store.toLowerCase().includes(dbRecord.store.toLowerCase()) &&
          Math.abs(parseFloat(csvRecord.totalPrice || '0') - dbRecord.total_price) < 0.01
        )
        
        if (!found) {
          extraInDB.push(dbRecord as unknown as DatabaseRecord)
        }
      }
      
      const comparison: MonthlyComparison = {
        month,
        csvRecords: csvRecords.length,
        csvTotal,
        dbRecords: dbRecords.length,
        dbTotal,
        difference: csvTotal - dbTotal,
        missingInDB,
        extraInDB
      }
      
      monthlyComparisons.push(comparison)
      
      console.log(`Difference: $${typeof comparison.difference === 'number' ? comparison.difference.toFixed(2) : '0.00'}`)
      console.log(`Missing in DB: ${missingInDB.length} records`)
      console.log(`Extra in DB: ${extraInDB.length} records`)
      
      if (missingInDB.length > 0) {
        console.log('Sample missing records:')
        missingInDB.slice(0, 5).forEach(record => {
          console.log(`  ${record.date} - ${record.store} - ${record.itemDescription} - $${record.totalPrice}`)
        })
      }
      
      if (extraInDB.length > 0) {
        console.log('Sample extra records:')
        extraInDB.slice(0, 5).forEach(record => {
          console.log(`  ${record.date} - ${record.store} - ${record.description} - $${record.total_price}`)
        })
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===')
    const totalCsvRecords = monthlyComparisons.reduce((sum, comp) => sum + comp.csvRecords, 0)
    const totalCsvTotal = monthlyComparisons.reduce((sum, comp) => sum + comp.csvTotal, 0)
    const totalDbRecords = monthlyComparisons.reduce((sum, comp) => sum + comp.dbRecords, 0)
    const totalDbTotal = monthlyComparisons.reduce((sum, comp) => sum + comp.dbTotal, 0)
    const totalDifference = totalCsvTotal - totalDbTotal
    
    console.log(`Total CSV Records: ${totalCsvRecords}`)
    console.log(`Total CSV Amount: $${typeof totalCsvTotal === 'number' ? totalCsvTotal.toFixed(2) : '0.00'}`)
    console.log(`Total DB Records: ${totalDbRecords}`)
    console.log(`Total DB Amount: $${typeof totalDbTotal === 'number' ? totalDbTotal.toFixed(2) : '0.00'}`)
    console.log(`Total Difference: $${typeof totalDifference === 'number' ? totalDifference.toFixed(2) : '0.00'}`)
    
    // Monthly breakdown
    console.log('\n=== MONTHLY BREAKDOWN ===')
    monthlyComparisons.forEach(comp => {
      console.log(`${comp.month}: CSV ${comp.csvRecords} records ($${typeof comp.csvTotal === 'number' ? comp.csvTotal.toFixed(2) : '0.00'}) vs DB ${comp.dbRecords} records ($${typeof comp.dbTotal === 'number' ? comp.dbTotal.toFixed(2) : '0.00'}) - Diff: $${typeof comp.difference === 'number' ? comp.difference.toFixed(2) : '0.00'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

function getMonthNumber(monthName: string): number {
  const months: { [key: string]: number } = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  }
  return months[monthName] || 1
}

// Run the analysis
analyzeCSVData().catch(console.error)
