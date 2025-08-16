import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invite = searchParams.get('invite')
    const email = searchParams.get('email')
    const account = searchParams.get('account')
    
    if (!invite || !email || !account) {
      return NextResponse.json({ 
        detail: 'Missing parameters: invite, email, account required' 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Check invite status
    const invites = db.collection('account_invites')
    const inviteDoc = await invites.findOne({ 
      token: invite,
      email: email.toLowerCase(),
      accountId: new ObjectId(account)
    })
    
    // Check account status
    const accounts = db.collection('accounts')
    const accountDoc = await accounts.findOne({ _id: new ObjectId(account) })
    
    // Check if user already exists
    const users = db.collection('users')
    const userDoc = await users.findOne({ email: email.toLowerCase() })
    
    // Check if user is already a member
    const accountMembers = db.collection('account_members')
    const membership = userDoc ? await accountMembers.findOne({ 
      accountId: new ObjectId(account), 
      userId: userDoc._id 
    }) : null

    return NextResponse.json({
      message: 'Invite debug information',
      parameters: { invite, email, account },
      invite: inviteDoc ? {
        ...inviteDoc,
        _id: inviteDoc._id?.toString(),
        accountId: inviteDoc.accountId?.toString(),
        invitedBy: inviteDoc.invitedBy?.toString()
      } : null,
      account: accountDoc ? {
        ...accountDoc,
        _id: accountDoc._id?.toString(),
        createdBy: accountDoc.createdBy?.toString()
      } : null,
      user: userDoc ? {
        ...userDoc,
        _id: userDoc._id?.toString(),
        accountId: userDoc.accountId?.toString()
      } : null,
      membership: membership ? {
        ...membership,
        _id: membership._id?.toString(),
        accountId: membership.accountId?.toString(),
        userId: membership.userId?.toString()
      } : null,
      validation: {
        inviteExists: !!inviteDoc,
        inviteStatus: inviteDoc?.status,
        accountExists: !!accountDoc,
        userExists: !!userDoc,
        alreadyMember: !!membership,
        tokenValid: inviteDoc?.token === invite,
        emailMatch: inviteDoc?.email === email.toLowerCase(),
        accountIdValid: inviteDoc?.accountId?.toString() === account
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      message: 'Debug failed',
      error: error.message
    }, { status: 500 })
  }
}
