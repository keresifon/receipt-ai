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

async function searchUserData() {
  const client = new MongoClient(MONGODB_URI!)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // 1. Search for exact email
    console.log(`\n🔍 Searching for exact email: ${SEARCH_EMAIL}`)
    const users = db.collection('users')
    const exactUser = await users.findOne({ email: SEARCH_EMAIL })
    
    if (exactUser) {
      console.log('✅ Found exact match:', exactUser)
    } else {
      console.log('❌ No exact match found')
    }
    
    // 2. Search for case-insensitive email
    console.log(`\n🔍 Searching for case-insensitive email: ${SEARCH_EMAIL}`)
    const caseInsensitiveUser = await users.findOne({ 
      email: { $regex: new RegExp(`^${SEARCH_EMAIL}$`, 'i') }
    })
    
    if (caseInsensitiveUser) {
      console.log('✅ Found case-insensitive match:', caseInsensitiveUser)
    } else {
      console.log('❌ No case-insensitive match found')
    }
    
    // 3. Search for partial email matches
    console.log(`\n🔍 Searching for partial email matches containing: e4_all`)
    const partialUsers = await users.find({ 
      email: { $regex: /e4_all/i }
    }).toArray()
    
    if (partialUsers.length > 0) {
      console.log(`✅ Found ${partialUsers.length} partial matches:`)
      partialUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name}) - ID: ${user._id}`)
      })
    } else {
      console.log('❌ No partial matches found')
    }
    
    // 4. Search for hotmail.com emails
    console.log(`\n🔍 Searching for all hotmail.com emails`)
    const hotmailUsers = await users.find({ 
      email: { $regex: /@hotmail\.com$/i }
    }).toArray()
    
    if (hotmailUsers.length > 0) {
      console.log(`✅ Found ${hotmailUsers.length} hotmail.com users:`)
      hotmailUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name}) - ID: ${user._id}`)
      })
    } else {
      console.log('❌ No hotmail.com users found')
    }
    
    // 5. List all users (for debugging)
    console.log(`\n🔍 All users in database:`)
    const allUsers = await users.find({}).toArray()
    
    if (allUsers.length > 0) {
      console.log(`✅ Found ${allUsers.length} total users:`)
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name}) - ID: ${user._id}`)
      })
    } else {
      console.log('❌ No users found in database')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('✅ Disconnected from MongoDB')
  }
}

// Run the script
searchUserData().catch(console.error)


