#!/usr/bin/env tsx

import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

// Load environment variables
config()

const MONGODB_URI = process.env.MONGODB_URI
const TEST_EMAIL = 'test@no-wahala.net'

async function debugTestAccount() {
  const client = new MongoClient(MONGODB_URI!)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db('expenses')
    const usersCollection = db.collection('users')
    
    // Find the test account with all details
    const testUser = await usersCollection.findOne({ email: TEST_EMAIL })
    
    if (!testUser) {
      console.log('❌ Test account not found')
      return
    }
    
    console.log('✅ Test account found:')
    console.log('📧 Email:', testUser.email)
    console.log('🔐 Password:', testUser.password)
    console.log('✅ Email Verified:', testUser.emailVerified)
    console.log('👤 Role:', testUser.role)
    console.log('🏢 Account ID:', testUser.accountId)
    console.log('📅 Created:', testUser.createdAt)
    console.log('🔄 Updated:', testUser.updatedAt)
    console.log('🔑 Verification Token:', testUser.emailVerificationToken)
    console.log('⏰ Token Expires:', testUser.emailVerificationExpires)
    
    // Check if password is hashed
    if (testUser.password && testUser.password.length > 20) {
      console.log('🔒 Password appears to be hashed (length:', testUser.password.length, ')')
    } else {
      console.log('⚠️ Password appears to be plain text (length:', testUser.password?.length, ')')
    }
    
    // Check if account has an accountId (needed for full access)
    if (!testUser.accountId) {
      console.log('\n⚠️ WARNING: Account has no accountId - this might prevent full access')
      
      // Check if there are any accounts this user could be linked to
      const accountsCollection = db.collection('accounts')
      const accounts = await accountsCollection.find({}).limit(5).toArray()
      console.log('\n📋 Available accounts:')
      accounts.forEach(account => {
        console.log(`- ID: ${account._id}, Name: ${account.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

debugTestAccount()







