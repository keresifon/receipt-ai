import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const includeStats = searchParams.get('stats') === 'true'

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    const accountsCol = db.collection('accounts')
    const usersCol = db.collection('users')
    const accountMembersCol = db.collection('account_members')
    const receiptsCol = db.collection('receipts')
    const lineItemsCol = db.collection('line_items')

    // Get all accounts
    const accounts = await accountsCol.find({}).toArray()
    
    // Get all users
    const users = await usersCol.find({}).toArray()
    
    // Get all account members
    const accountMembers = await accountMembersCol.find({}).toArray()

    // Build accounts with member details
    const accountsWithDetails = await Promise.all(
      accounts.map(async (account) => {
        const accountId = account._id.toString()
        
        // Get members for this account
        const members = accountMembers.filter(
          m => m.accountId?.toString() === accountId
        )
        
        // Get user details for members
        const membersWithDetails = await Promise.all(
          members.map(async (member) => {
            const user = users.find(u => u._id.toString() === member.userId?.toString())
            return {
              id: member._id?.toString(),
              userId: member.userId?.toString(),
              email: user?.email || 'Unknown',
              name: user?.name || 'Unknown',
              role: member.role,
              status: member.status || 'active',
              joinedAt: member.joinedAt,
              invitedBy: member.invitedBy?.toString()
            }
          })
        )

        // Get account creator
        const creator = users.find(u => u._id.toString() === account.createdBy)

        // Get statistics if requested
        let stats = null
        if (includeStats) {
          const accountObjectId = new ObjectId(accountId)
          const receiptCount = await receiptsCol.countDocuments({ accountId: accountObjectId })
          const lineItemCount = await lineItemsCol.countDocuments({ accountId: accountObjectId })
          
          // Get recent activity (last 30 days)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const recentReceipts = await receiptsCol.countDocuments({
            accountId: accountObjectId,
            createdAt: { $gte: thirtyDaysAgo }
          })

          stats = {
            receipts: receiptCount,
            lineItems: lineItemCount,
            recentReceipts,
            memberCount: membersWithDetails.length
          }
        }

        return {
          id: accountId,
          name: account.name,
          description: account.description || '',
          createdAt: account.createdAt,
          createdBy: account.createdBy,
          creator: creator ? {
            id: creator._id.toString(),
            email: creator.email,
            name: creator.name
          } : null,
          settings: account.settings || {},
          members: membersWithDetails,
          memberCount: membersWithDetails.length,
          stats
        }
      })
    )

    // Build users with account details and statistics
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const account = accounts.find(a => a._id.toString() === user.accountId?.toString())
        const member = accountMembers.find(
          m => m.userId?.toString() === user._id.toString()
        )

        // Get user statistics if requested
        let userStats = null
        if (includeStats) {
          const userObjectId = new ObjectId(user._id)
          const accountObjectId = user.accountId ? new ObjectId(user.accountId) : null
          
          const receiptCount = accountObjectId 
            ? await receiptsCol.countDocuments({ accountId: accountObjectId })
            : 0
          const lineItemCount = accountObjectId
            ? await lineItemsCol.countDocuments({ accountId: accountObjectId })
            : 0

          userStats = {
            receipts: receiptCount,
            lineItems: lineItemCount
          }
        }

        // Check if email verification is required (for new users after rollout date)
        const verificationRolloutDate = new Date('2025-01-01T00:00:00Z')
        const isNewUser = user.createdAt > verificationRolloutDate
        const requiresVerification = isNewUser && !user.emailVerified

        // Detect bot/suspicious accounts
        // Patterns: random character strings, suspicious emails
        const namePattern = /^[A-Za-z0-9]{15,}$/ // Long random character strings (15+ alphanumeric)
        const suspiciousEmailPattern = /^[a-z]+\d+@/ // Pattern like "varotolufi435@gmail.com"
        const hasSuspiciousName = user.name && namePattern.test(user.name.trim())
        const hasSuspiciousEmail = user.email && suspiciousEmailPattern.test(user.email)
        const isSuspicious = hasSuspiciousName || hasSuspiciousEmail

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          accountId: user.accountId?.toString(),
          accountName: account?.name || 'Unknown',
          role: user.role || member?.role || 'member',
          emailVerified: user.emailVerified || false,
          requiresVerification: requiresVerification,
          emailVerificationToken: user.emailVerificationToken ? 'Set' : null,
          emailVerificationExpires: user.emailVerificationExpires,
          emailVerificationSentAt: user.emailVerificationSentAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          status: member?.status || 'active',
          joinedAt: member?.joinedAt || user.createdAt,
          invitedBy: member?.invitedBy?.toString(),
          stats: userStats,
          isSuspicious: isSuspicious,
          suspiciousReasons: [
            hasSuspiciousName && 'Random character name',
            hasSuspiciousEmail && 'Suspicious email pattern'
          ].filter(Boolean)
        }
      })
    )

    // Calculate summary statistics (will be updated after usersWithDetails is built)
    const summary: {
      totalAccounts: number
      totalUsers: number
      totalMembers: number
      verifiedUsers: number
      unverifiedUsers: number
      suspiciousUsers: number
      accountsByRole: { admin: number; member: number; viewer: number }
      totalReceipts?: number
      totalLineItems?: number
      recentReceipts?: number
    } = {
      totalAccounts: accounts.length,
      totalUsers: users.length,
      totalMembers: accountMembers.length,
      verifiedUsers: 0, // Will be updated below
      unverifiedUsers: 0, // Will be updated below
      suspiciousUsers: 0, // Will be updated below
      accountsByRole: {
        admin: users.filter(u => u.role === 'admin').length,
        member: users.filter(u => u.role === 'member').length,
        viewer: users.filter(u => u.role === 'viewer').length
      }
    }

    // Add activity stats if requested
    if (includeStats) {
      const totalReceipts = await receiptsCol.countDocuments()
      const totalLineItems = await lineItemsCol.countDocuments()
      
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentReceipts = await receiptsCol.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      })

      summary.totalReceipts = totalReceipts
      summary.totalLineItems = totalLineItems
      summary.recentReceipts = recentReceipts
    }

    // Update summary with actual counts from usersWithDetails
    summary.verifiedUsers = usersWithDetails.filter(u => u.emailVerified).length
    summary.unverifiedUsers = usersWithDetails.filter(u => !u.emailVerified).length
    summary.suspiciousUsers = usersWithDetails.filter(u => u.isSuspicious).length

    return NextResponse.json({
      summary,
      accounts: accountsWithDetails,
      users: usersWithDetails,
      generatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Reporting API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}
