import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function checkMembership() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const users = db.collection('users')
    const members = db.collection('account_members')
    const invites = db.collection('account_invites')
    
    const accountId = '68a0bc4b3c71a47a7a3f89bd'
    const userEmail = 'keresifon@gmail.com'
    
    // Find the user
    const user = await users.findOne({ email: userEmail })
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log('User:', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      accountId: user.accountId?.toString()
    })
    
    // Check membership
    const membership = await members.findOne({
      accountId: new ObjectId(accountId),
      userId: user._id
    })
    
    if (membership) {
      console.log('✅ Membership found:', {
        id: membership._id.toString(),
        role: membership.role,
        joinedAt: membership.joinedAt
      })
    } else {
      console.log('❌ No membership found')
    }
    
    // Check all invites for this account
    const allInvites = await invites.find({ accountId: new ObjectId(accountId) }).toArray()
    console.log(`\nAll invites for account ${accountId}:`)
    allInvites.forEach(invite => {
      console.log(`- ${invite.email}: ${invite.status} (${invite.role})`)
    })
    
    // Check all members for this account
    const allMembers = await members.find({ accountId: new ObjectId(accountId) }).toArray()
    console.log(`\nAll members for account ${accountId}:`)
    allMembers.forEach(member => {
      console.log(`- User ID: ${member.userId}, Role: ${member.role}, Joined: ${member.joinedAt}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('\nDisconnected from MongoDB')
  }
}

// Run the check
checkMembership().catch(console.error)

