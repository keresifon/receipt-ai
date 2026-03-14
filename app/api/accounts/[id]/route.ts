import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email, role: decoded.role }
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

    // Check if user has access to this account
    if (user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accounts = db.collection('accounts')

    const account = await accounts.findOne({ _id: new ObjectId(params.id) })
    
    if (!account) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(account)

  } catch (e: any) {
    console.error('Account fetch error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email, role: decoded.role }
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

    // Check if user has access to this account
    if (user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 })
    }

    const { name, description, timezone, currency } = await req.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ detail: 'Account name is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accounts = db.collection('accounts')

    const result = await accounts.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          name: name.trim(),
          description: description?.trim() || '',
          'settings.timezone': timezone || 'America/Toronto',
          'settings.currency': currency || 'CAD',
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Account updated successfully',
      updated: true
    })

  } catch (e: any) {
    console.error('Account update error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email, role: decoded.role }
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

    // Check if user has access to this account
    if (user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accountId = new ObjectId(params.id)

    // Start a transaction to ensure all deletions succeed or fail together
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // 1. Delete all line items for this account
        const lineItemsResult = await db.collection('line_items').deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`Deleted ${lineItemsResult.deletedCount} line items`)

        // 2. Delete all receipts for this account
        const receiptsResult = await db.collection('receipts').deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`Deleted ${receiptsResult.deletedCount} receipts`)

        // 3. Delete all account members
        const membersResult = await db.collection('account_members').deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`Deleted ${membersResult.deletedCount} account members`)

        // 4. Delete all account invites
        const invitesResult = await db.collection('account_invites').deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`Deleted ${invitesResult.deletedCount} account invites`)

        // 5. Delete all notifications for this account
        const notificationsResult = await db.collection('notifications').deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`Deleted ${notificationsResult.deletedCount} notifications`)

        // 6. Delete all two-factor auth records for users in this account
        const usersInAccount = await db.collection('users').find(
          { accountId: accountId },
          { session }
        ).toArray()
        
        const userIds = usersInAccount.map(user => user._id)
        if (userIds.length > 0) {
          const twoFactorResult = await db.collection('two_factor_auth').deleteMany(
            { userId: { $in: userIds } },
            { session }
          )
          console.log(`Deleted ${twoFactorResult.deletedCount} two-factor auth records`)
        }

        // 7. Delete all users in this account
        const usersResult = await db.collection('users').deleteMany(
          { accountId: accountId },
          { session }
        )
        console.log(`Deleted ${usersResult.deletedCount} users`)

        // 8. Finally, delete the account itself
        const accountResult = await db.collection('accounts').deleteOne(
          { _id: accountId },
          { session }
        )
        console.log(`Deleted ${accountResult.deletedCount} account`)

        if (accountResult.deletedCount === 0) {
          throw new Error('Account not found')
        }
      })

      await session.endSession()

      return NextResponse.json({ 
        message: 'Account and all associated data deleted successfully',
        deleted: true
      })

    } catch (transactionError) {
      await session.endSession()
      throw transactionError
    }

  } catch (e: any) {
    console.error('Account deletion error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
