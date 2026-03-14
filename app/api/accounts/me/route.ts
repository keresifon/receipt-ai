import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { userId: decoded.userId, accountId: decoded.accountId, email: decoded.email, role: decoded.role }
      } catch (error) {
        // JWT verification failed, try NextAuth session
        const session = await getServerSession(authOptions)
        user = session?.user
      }
    } else {
      // No JWT token, try NextAuth session
      const session = await getServerSession(authOptions)
      user = session?.user
    }
    
    if (!user || !('accountId' in user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accounts = db.collection('accounts')
    const users = db.collection('users')
    const accountMembers = db.collection('account_members')

    // Get account information
    const account = await accounts.findOne({ _id: new ObjectId(user.accountId as string) })
    
    if (!account) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    // Get user information
    const userInfo = await users.findOne({ _id: new ObjectId(user.userId as string) })
    
    // Get account members
    const members = await accountMembers.find({ accountId: new ObjectId(user.accountId as string) }).toArray()
    
    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const memberUser = await users.findOne({ _id: new ObjectId(member.userId) })
        return {
          id: member._id?.toString(),
          name: memberUser?.name || 'Unknown',
          email: memberUser?.email || 'Unknown',
          role: member.role,
          status: member.status || 'active'
        }
      })
    )

    // Check if email verification is required for new users
    const verificationRolloutDate = new Date('2025-01-01T00:00:00Z') // Set rollout date
    const isNewUser = userInfo?.createdAt > verificationRolloutDate
    const requiresVerification = isNewUser && !userInfo?.emailVerified

    // Return structured response matching the iOS app's expectations
    const response = {
      user: {
        id: user.accountId,
        email: user.email || userInfo?.email || 'Unknown',
        name: userInfo?.name || 'Unknown',
        accountId: user.accountId,
        role: user.role || 'member',
        emailVerified: userInfo?.emailVerified || false,
        requiresVerification: requiresVerification
      },
      account: {
        id: account._id?.toString(),
        name: account.name,
        members: membersWithDetails
      },
      settings: {
        currency: account.settings?.currency || 'CAD',
        timezone: account.settings?.timezone || 'America/Toronto',
        notifications: account.settings?.notifications || {}
      }
    }

    return NextResponse.json(response)

  } catch (e: any) {
    console.error('Account fetch error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

