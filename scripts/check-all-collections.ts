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

const SEARCH_EMAIL = 'e4_all@hotmail.com'

async function checkAllCollections() {
  const client = new MongoClient(MONGODB_URI!)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // Get all collection names
    const collections = await db.listCollections().toArray()
    console.log(`\n📋 Found ${collections.length} collections:`)
    
    for (const collection of collections) {
      const collectionName = collection.name
      const coll = db.collection(collectionName)
      const count = await coll.countDocuments()
      
      console.log(`\n📁 Collection: ${collectionName} (${count} documents)`)
      
      // Search for the email in this collection
      if (count > 0) {
        // Try to find documents containing the email
        const emailMatches = await coll.find({
          $or: [
            { email: { $regex: new RegExp(SEARCH_EMAIL, 'i') } },
            { userEmail: { $regex: new RegExp(SEARCH_EMAIL, 'i') } },
            { invitedBy: { $regex: new RegExp(SEARCH_EMAIL, 'i') } }
          ]
        }).toArray()
        
        if (emailMatches.length > 0) {
          console.log(`  🔍 Found ${emailMatches.length} documents containing "${SEARCH_EMAIL}":`)
          emailMatches.forEach((doc, index) => {
            console.log(`    ${index + 1}. ${JSON.stringify(doc, null, 2)}`)
          })
        } else {
          // Show a few sample documents to understand the structure
          const sampleDocs = await coll.find({}).limit(3).toArray()
          if (sampleDocs.length > 0) {
            console.log(`  📄 Sample document structure:`)
            console.log(`    ${JSON.stringify(sampleDocs[0], null, 2)}`)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('✅ Disconnected from MongoDB')
  }
}

// Run the script
checkAllCollections().catch(console.error)


