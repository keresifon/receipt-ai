import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    const accountId = new ObjectId(session.user.accountId)
    
    // Update all existing line_items to include accountId
    const lineItemsResult = await db.collection('line_items').updateMany(
      { accountId: { $exists: false } },
      { $set: { accountId: accountId } }
    )

    // Update all existing receipts to include accountId
    const receiptsResult = await db.collection('receipts').updateMany(
      { accountId: { $exists: false } },
      { $set: { accountId: accountId } }
    )

    // Create account member record for the current user
    const accountMembers = db.collection('account_members')
    const existingMember = await accountMembers.findOne({
      accountId: accountId,
      userId: session.user.id
    })

    if (!existingMember) {
      await accountMembers.insertOne({
        accountId: accountId,
        userId: session.user.id,
        role: session.user.role,
        invitedBy: session.user.id,
        invitedAt: new Date(),
        joinedAt: new Date(),
        status: 'active'
      })
    }

    return NextResponse.json({
      message: 'Migration completed successfully',
      lineItemsUpdated: lineItemsResult.modifiedCount,
      receiptsUpdated: receiptsResult.modifiedCount,
      accountId: session.user.accountId
    })

  } catch (e: any) {
    console.error('Migration error:', e)
    return NextResponse.json({ detail: 'Migration failed: ' + e.message }, { status: 500 })
  }
}
