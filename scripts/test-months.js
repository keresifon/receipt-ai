const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

async function testMonths() {
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
    const items = db.collection('line_items')
    
    // Test month extraction logic
    console.log('\n🧪 Testing Month Extraction:')
    
    // Get sample dates
    const sampleDates = await items.distinct('date')
    console.log('Sample dates found:', sampleDates.slice(0, 10))
    
    // Test the month extraction logic
    const months = await items.aggregate([
      { $match: { 
        $and: [
          { date: { $exists: true, $ne: null } },
          { date: { $ne: '' } }
        ]
      }},
      { $project: { 
        originalDate: '$date',
        extractedMonth: { $substr: ['$date', 0, 7] },
        firstChar: { $substr: ['$date', 0, 1] },
        length: { $strLenCP: '$date' }
      } },
      { $limit: 5 }
    ]).toArray()
    
    console.log('\nMonth extraction test:')
    months.forEach((item, i) => {
      console.log(`  ${i + 1}. Original: "${item.originalDate}" -> Extracted: "${item.extractedMonth}" (Length: ${item.length})`)
    })
    
    // Test the full months aggregation
    const allMonths = await items.aggregate([
      { $match: { 
        $and: [
          { date: { $exists: true, $ne: null } },
          { date: { $ne: '' } }
        ]
      }},
      { $project: { month: { $substr: ['$date', 0, 7] } } },
      { $group: { _id: '$month' } },
      { $sort: { _id: -1 } }
    ]).toArray()
    
    console.log('\nAll months found:')
    allMonths.forEach(month => {
      console.log(`  - ${month._id}`)
    })
    
    await client.close()
    console.log('\n✅ Month extraction test completed')

  } catch (error) {
    console.error('❌ Error testing months:', error)
  }
}

testMonths()
