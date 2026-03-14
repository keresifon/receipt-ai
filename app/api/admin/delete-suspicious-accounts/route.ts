import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * Detect if a user account is suspicious/bot-created
 */
function isSuspiciousAccount(user: any): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = []
  
  // Pattern 1: Random character names (15+ alphanumeric characters)
  const namePattern = /^[A-Za-z0-9]{15,}$/
  const hasSuspiciousName = user.name && namePattern.test(user.name.trim())
  if (hasSuspiciousName) {
    reasons.push('Random character name')
  }
  
  // Pattern 2: Suspicious email patterns (like "varotolufi435@gmail.com")
  const suspiciousEmailPattern = /^[a-z]+\d+@/
  const hasSuspiciousEmail = user.email && suspiciousEmailPattern.test(user.email)
  if (hasSuspiciousEmail) {
    reasons.push('Suspicious email pattern')
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authSession = await getServerSession(authOptions)
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dryRun = false, force = false } = await req.json().catch(() => ({}))

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    const usersCol = db.collection('users')
    const accountsCol = db.collection('accounts')
    const accountMembersCol = db.collection('account_members')
    const accountInvitesCol = db.collection('account_invites')
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')

    // Get all users and identify suspicious ones
    const allUsers = await usersCol.find({}).toArray()
    const suspiciousUsers: any[] = []
    
    for (const user of allUsers) {
      const { isSuspicious, reasons } = isSuspiciousAccount(user)
      if (isSuspicious) {
        suspiciousUsers.push({
          ...user,
          suspiciousReasons: reasons
        })
      }
    }

    if (suspiciousUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No suspicious accounts found',
        deleted: { users: 0, accounts: 0 },
        suspiciousAccounts: []
      })
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        suspiciousCount: suspiciousUsers.length,
        suspiciousAccounts: suspiciousUsers.map(u => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          accountId: u.accountId?.toString(),
          role: u.role,
          emailVerified: u.emailVerified,
          reasons: u.suspiciousReasons
        }))
      })
    }

    // Perform deletion
    const dbSession = client.startSession()
    let deletedUsers = 0
    let deletedAccounts = 0
    const deletedUserIds: string[] = []
    const deletedAccountIds: string[] = []

    try {
      await dbSession.withTransaction(async () => {
        for (const user of suspiciousUsers) {
          const userId = user._id
          const accountId = user.accountId ? new ObjectId(user.accountId) : null
          
          // Delete account memberships
          await accountMembersCol.deleteMany(
            { userId: userId },
            { session: dbSession }
          )
          
          // Delete account invites sent by this user
          await accountInvitesCol.deleteMany(
            { invitedBy: userId },
            { session: dbSession }
          )
          
          // If user has an account, check if they're the only member
          if (accountId) {
            const accountMembers = await accountMembersCol.countDocuments(
              { accountId: accountId },
              { session: dbSession }
            )
            
            // If no other members, delete the account and its data
            if (accountMembers === 0) {
              // Delete receipts
              await receiptsCol.deleteMany(
                { accountId: accountId },
                { session: dbSession }
              )
              
              // Delete line items
              await lineItemsCol.deleteMany(
                { accountId: accountId },
                { session: dbSession }
              )
              
              // Delete account invites for this account
              await accountInvitesCol.deleteMany(
                { accountId: accountId },
                { session: dbSession }
              )
              
              // Delete the account
              const accountResult = await accountsCol.deleteOne(
                { _id: accountId },
                { session: dbSession }
              )
              if (accountResult.deletedCount > 0) {
                deletedAccounts++
                deletedAccountIds.push(accountId.toString())
              }
            }
          }
          
          // Delete the user
          const userResult = await usersCol.deleteOne(
            { _id: userId },
            { session: dbSession }
          )
          if (userResult.deletedCount > 0) {
            deletedUsers++
            deletedUserIds.push(userId.toString())
          }
        }
      })

      return NextResponse.json({
        success: true,
        deleted: {
          users: deletedUsers,
          accounts: deletedAccounts
        },
        deletedUserIds,
        deletedAccountIds
      })
    } catch (error: any) {
      await dbSession.endSession()
      throw error
    } finally {
      await dbSession.endSession()
    }
  } catch (error: any) {
    console.error('Delete suspicious accounts error:', error)
    return NextResponse.json(
      { error: error.message || 'Deletion failed' },
      { status: 500 }
    )
  }
}
