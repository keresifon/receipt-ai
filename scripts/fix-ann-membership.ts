import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function fixAnnMembership() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const users = db.collection('users')
    const members = db.collection('account_members')
    
    const accountId = '68a0bc4b3c71a47a7a3f89bd'
    const userEmail = 'auekpenyong@gmail.com'
    
    // Find the user
    const user = await users.findOne({ email: userEmail })
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log('Found user:', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      accountId: user.accountId?.toString()
    })
    
    // Check if membership already exists
    const existingMembership = await members.findOne({
      accountId: new ObjectId(accountId),
      userId: user._id
    })
    
    if (existingMembership) {
      console.log('✅ Membership already exists:', {
        id: existingMembership._id.toString(),
        role: existingMembership.role,
        joinedAt: existingMembership.joinedAt
      })
      return
    }
    
    // Create the missing membership
    const membershipResult = await members.insertOne({
      accountId: new ObjectId(accountId),
      userId: user._id,
      role: 'viewer', // Based on the invite
      joinedAt: new Date()
    })
    
    console.log('✅ Created missing membership:', {
      id: membershipResult.insertedId.toString(),
      role: 'viewer'
    })
    
    // Verify the membership was created
    const newMembership = await members.findOne({
      _id: membershipResult.insertedId
    })
    
    if (newMembership) {
      console.log('✅ Membership verification successful')
      
      // Also verify by querying with the user and account
      const verifiedMembership = await members.findOne({
        accountId: new ObjectId(accountId),
        userId: user._id
      })
      
      if (verifiedMembership) {
        console.log('✅ Membership query verification successful')
      } else {
        console.log('❌ Membership query verification failed')
      }
    } else {
      console.log('❌ Membership verification failed')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the fix
fixAnnMembership().catch(console.error)
