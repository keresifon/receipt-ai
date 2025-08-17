import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ detail: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    const accounts = db.collection('accounts')
    const accountMembers = db.collection('account_members')
    const invites = db.collection('account_invites')

    // Check if user exists
    const existingUser = await users.findOne({ email: email.toLowerCase() })
    
    // Check if user is already a member of this account
    let existingMembership = null
    if (existingUser) {
      existingMembership = await accountMembers.findOne({ 
        accountId: new ObjectId(session.user.accountId), 
        userId: existingUser._id 
      })
    }

    // Check if invite already exists
    const existingInvite = await invites.findOne({ 
      accountId: new ObjectId(session.user.accountId), 
      email: email.toLowerCase()
    })

    // Get account info
    const account = await accounts.findOne({ _id: new ObjectId(session.user.accountId) })

    return NextResponse.json({
      email: email.toLowerCase(),
      existingUser: existingUser ? {
        id: existingUser._id.toString(),
        name: existingUser.name,
        email: existingUser.email
      } : null,
      existingMembership: existingMembership ? {
        role: existingMembership.role,
        joinedAt: existingMembership.joinedAt
      } : null,
      existingInvite: existingInvite ? {
        status: existingInvite.status,
        role: existingInvite.role,
        invitedAt: existingInvite.invitedAt
      } : null,
      account: account ? {
        id: account._id.toString(),
        name: account.name,
        description: account.description
      } : null,
      sessionUser: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        accountId: session.user.accountId
      }
    })
  } catch (error: any) {
    console.error('Test invite error:', error)
    return NextResponse.json({ 
      detail: 'Server error',
      error: error.message 
    }, { status: 500 })
  }
}
