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

async function verifyTestAccount() {
  const client = new MongoClient(MONGODB_URI!)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')
    
    // Find the test account
    let testUser = await usersCollection.findOne({ email: TEST_EMAIL })
    
    if (!testUser) {
      console.log('❌ Test account not found, searching for similar emails...')
      
      // Search for any user with "test" in email
      const testUsers = await usersCollection.find({ 
        email: { $regex: /test/i } 
      }).toArray()
      
      console.log(`Found ${testUsers.length} users with "test" in email:`)
      testUsers.forEach(user => {
        console.log(`- ${user.email} (verified: ${user.emailVerified})`)
      })
      
      if (testUsers.length > 0) {
        testUser = testUsers[0]
        console.log(`Using first test user: ${testUser.email}`)
      } else {
        console.log('❌ No test accounts found, creating test account...')
        
        // Create the test account
        const newTestUser = {
          email: TEST_EMAIL,
          password: 'test1234', // Note: In production, this should be hashed
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'user',
          accountId: null
        }
        
        const insertResult = await usersCollection.insertOne(newTestUser)
        console.log('✅ Test account created with ID:', insertResult.insertedId)
        testUser = newTestUser
      }
    }
    
    console.log('✅ Test account found:', testUser.email)
    console.log('Current emailVerified status:', testUser.emailVerified)
    
    // Update to verified status
    const result = await usersCollection.updateOne(
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
    
    if (result.modifiedCount > 0) {
      console.log('✅ Test account successfully verified!')
      console.log('📧 Email:', TEST_EMAIL)
      console.log('🔐 Password: test1234')
      console.log('✅ Status: Email Verified')
    } else {
      console.log('ℹ️ Account was already verified')
    }
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ email: TEST_EMAIL })
    console.log('\n📋 Updated Account Status:')
    console.log('Email Verified:', updatedUser?.emailVerified)
    console.log('Verification Token:', updatedUser?.emailVerificationToken)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

verifyTestAccount()
