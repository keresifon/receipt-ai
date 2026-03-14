import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { auditLogger } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// DELETE: Remove a member from the account
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    if (session.user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 })
    }

    const { id: accountId, memberId } = params
    
    if (!memberId) {
      return NextResponse.json({ detail: 'Member ID is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const members = db.collection('account_members')

    // Check if member exists
    const existingMember = await members.findOne({
      _id: new ObjectId(memberId),
      accountId: new ObjectId(accountId)
    })
    
    if (!existingMember) {
      return NextResponse.json({ detail: 'Member not found' }, { status: 404 })
    }

    // Log the member removal attempt
    await auditLogger.logSecurityEvent(
      session.user.id,
      accountId,
      'MEMBER_REMOVAL_ATTEMPT',
      {
        targetMemberId: memberId,
        targetMemberRole: existingMember.role,
        targetMemberUserId: existingMember.userId?.toString()
      },
      req,
      true
    )

    // Prevent removing the last admin
    if (existingMember.role === 'admin') {
      const adminCount = await members.countDocuments({
        accountId: new ObjectId(accountId),
        role: 'admin'
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({ 
          detail: 'Cannot remove the last admin from the account' 
        }, { status: 400 })
      }
    }

    // Soft delete: Move to removed_members collection instead of hard delete
    const removedMembers = db.collection('removed_members')
    
    const removedMemberRecord = {
      originalMemberId: new ObjectId(memberId),
      accountId: new ObjectId(accountId),
      userId: existingMember.userId,
      role: existingMember.role,
      joinedAt: existingMember.joinedAt,
      removedAt: new Date(),
      removedBy: new ObjectId(session.user.id),
      removalReason: 'Admin action'
    }
    
    await removedMembers.insertOne(removedMemberRecord)
    
    // Now remove from active members
    await members.deleteOne({
      _id: new ObjectId(memberId),
      accountId: new ObjectId(accountId)
    })

    // Log successful member removal
    await auditLogger.logSecurityEvent(
      session.user.id,
      accountId,
      'MEMBER_REMOVED',
      {
        targetMemberId: memberId,
        targetMemberRole: existingMember.role,
        targetMemberUserId: existingMember.userId?.toString(),
        removalReason: 'Admin action'
      },
      req,
      true
    )

    // Create notification for the removed member
    try {
      const notifications = db.collection('notifications')
      await notifications.insertOne({
        type: 'member_removal',
        title: 'Account Access Removed',
        message: `Your access to the account "${accountId}" has been removed by an administrator.`,
        recipientId: existingMember.userId,
        accountId: new ObjectId(accountId),
        metadata: {
          removedBy: session.user.id,
          removedByEmail: session.user.email,
          removalReason: 'Admin action',
          accountName: 'Family Account' // You could fetch this from accounts collection
        },
        createdAt: new Date(),
        read: false,
        priority: 'high'
      })
    } catch (notificationError) {
      // Don't fail the main operation if notification fails
      console.error('Failed to create notification:', notificationError)
    }

    return NextResponse.json({ 
      message: 'Member removed successfully' 
    })
  } catch (e: any) {
    console.error('Error removing member:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
