import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'expenses'

async function checkAllInvites() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    const invites = db.collection('account_invites')
    const users = db.collection('users')
    const members = db.collection('account_members')
    
    // Get ALL invites (not just pending)
    const allInvites = await invites.find({}).toArray()
    
    if (allInvites.length === 0) {
      console.log('No invites found at all')
      return
    }
    
    console.log(`Found ${allInvites.length} total invite(s):\n`)
    
    for (const invite of allInvites) {
      console.log(`📧 Invite ID: ${invite._id}`)
      console.log(`   Email: ${invite.email}`)
      console.log(`   Account ID: ${invite.accountId}`)
      console.log(`   Role: ${invite.role}`)
      console.log(`   Status: ${invite.status}`)
      console.log(`   Invited At: ${invite.invitedAt}`)
      if (invite.acceptedAt) {
        console.log(`   Accepted At: ${invite.acceptedAt}`)
      }
      if (invite.acceptedBy) {
        console.log(`   Accepted By: ${invite.acceptedBy}`)
      }
      
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
checkAllInvites().catch(console.error)

