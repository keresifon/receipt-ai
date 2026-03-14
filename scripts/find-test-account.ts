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

const TEST_EMAIL = 'test@no-wahala.net'

async function findTestAccount() {
  const client = new MongoClient(MONGODB_URI!)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    // List all databases
    const adminDb = client.db().admin()
    const databases = await adminDb.listDatabases()
    
    console.log(`\n📋 Found ${databases.databases.length} databases:`)
    databases.databases.forEach(db => {
      console.log(`- ${db.name}`)
    })
    
    // Search in each database for the test account
    for (const dbInfo of databases.databases) {
      const db = client.db(dbInfo.name)
      const collections = await db.listCollections().toArray()
      
      console.log(`\n🔍 Searching in database: ${dbInfo.name}`)
      console.log(`   Collections: ${collections.map(c => c.name).join(', ')}`)
      
      // Check users collection if it exists
      const usersCollection = db.collection('users')
      const testUser = await usersCollection.findOne({ email: TEST_EMAIL })
      
      if (testUser) {
        console.log(`✅ Found test account in database: ${dbInfo.name}`)
        console.log(`   Email: ${testUser.email}`)
        console.log(`   Verified: ${testUser.emailVerified}`)
        console.log(`   Created: ${testUser.createdAt}`)
        
        // Update to verified if not already
        if (!testUser.emailVerified) {
          await usersCollection.updateOne(
            { email: TEST_EMAIL },
            { 
              $set: { 
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
                updatedAt: new Date()
              }
            }
          )
          console.log('✅ Updated account to verified status')
        }
        
        break
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

findTestAccount()







