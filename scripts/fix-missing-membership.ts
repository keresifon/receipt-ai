import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function fixMissingMembership() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const users = db.collection('users')
    const invites = db.collection('account_invites')
    const members = db.collection('account_members')
    
    // Find the user
    const user = await users.findOne({ email: 'keresifon@gmail.com' })
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
    
    // Find the invite
    const invite = await invites.findOne({
      email: 'keresifon@gmail.com',
      accountId: new ObjectId('68a0bc4b3c71a47a7a3f89bd')
    })
    
    if (!invite) {
      console.log('Invite not found')
      return
    }
    
    console.log('Found invite:', {
      id: invite._id.toString(),
      status: invite.status,
      role: invite.role
    })
    
    // Check if membership exists
    const existingMembership = await members.findOne({
      accountId: new ObjectId('68a0bc4b3c71a47a7a3f89bd'),
      userId: user._id
    })
    
    if (existingMembership) {
      console.log('Membership already exists:', {
        id: existingMembership._id.toString(),
        role: existingMembership.role,
        joinedAt: existingMembership.joinedAt
      })
      return
    }
    
    // Create the missing membership
    const membershipResult = await members.insertOne({
      accountId: new ObjectId('68a0bc4b3c71a47a7a3f89bd'),
      userId: user._id,
      role: invite.role || 'viewer',
      joinedAt: new Date()
    })
    
    console.log('Created missing membership:', {
      id: membershipResult.insertedId.toString(),
      role: invite.role || 'viewer'
    })
    
    // Verify the membership was created
    const newMembership = await members.findOne({
      _id: membershipResult.insertedId
    })
    
    if (newMembership) {
      console.log('✅ Membership verification successful')
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
fixMissingMembership().catch(console.error)
