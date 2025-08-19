import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const accountId = searchParams.get('accountId')

    if (!email || !accountId) {
      return NextResponse.json({ detail: 'Email and accountId are required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    const invites = db.collection('account_invites')
    const members = db.collection('account_members')
    const users = db.collection('users')

    // Find the invite
    const invite = await invites.findOne({
      email: email.toLowerCase(),
      accountId: new ObjectId(accountId)
    })

    // Find the user
    const user = await users.findOne({ email: email.toLowerCase() })

    // Find membership
    let membership = null
    if (user) {
      membership = await members.findOne({
        accountId: new ObjectId(accountId),
        userId: user._id
      })
    }

    return NextResponse.json({
      email: email.toLowerCase(),
      accountId: accountId,
      invite: invite ? {
        _id: invite._id.toString(),
        status: invite.status,
        role: invite.role,
        token: invite.token,
        invitedAt: invite.invitedAt,
        acceptedAt: invite.acceptedAt,
        acceptedBy: invite.acceptedBy
      } : null,
      user: user ? {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        accountId: user.accountId?.toString()
      } : null,
      membership: membership ? {
        _id: membership._id.toString(),
        role: membership.role,
        joinedAt: membership.joinedAt
      } : null
    })

  } catch (e: any) {
    console.error('Debug invite status error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
