import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function listPendingInvites() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const invites = db.collection('account_invites')
    const users = db.collection('users')
    const members = db.collection('account_members')
    
    // Get all pending invites
    const pendingInvites = await invites.find({ status: 'pending' }).toArray()
    
    if (pendingInvites.length === 0) {
      console.log('No pending invites found')
      return
    }
    
    console.log(`Found ${pendingInvites.length} pending invite(s):\n`)
    
    for (const invite of pendingInvites) {
      console.log(`📧 Invite ID: ${invite._id}`)
      console.log(`   Email: ${invite.email}`)
      console.log(`   Account ID: ${invite.accountId}`)
      console.log(`   Role: ${invite.role}`)
      console.log(`   Status: ${invite.status}`)
      console.log(`   Invited At: ${invite.invitedAt}`)
      
      // Check if user exists
      const user = await users.findOne({ email: invite.email })
      if (user) {
        console.log(`   ✅ User exists: ${user.name} (ID: ${user._id})`)
        console.log(`   User role: ${user.role}`)
        console.log(`   User accountId: ${user.accountId}`)
        
        // Check if membership exists
        const membership = await members.findOne({
          accountId: invite.accountId,
          userId: user._id
        })
        
        if (membership) {
          console.log(`   ✅ Membership exists: ${membership.role} (Joined: ${membership.joinedAt})`)
        } else {
          console.log(`   ❌ NO MEMBERSHIP - This is the issue!`)
        }
      } else {
        console.log(`   ❌ User not found`)
      }
      
      console.log('') // Empty line for readability
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Disconnected from MongoDB')
  }
}

// Run the check
listPendingInvites().catch(console.error)

