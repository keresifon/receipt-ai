import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    const stringAccountId = session.user.accountId
    const objectIdAccountId = new ObjectId(stringAccountId)
    
    // Update receipts collection
    const receiptsResult = await db.collection('receipts').updateMany(
      { accountId: stringAccountId },
      { $set: { accountId: objectIdAccountId } }
    )
    
    // Update line_items collection
    const lineItemsResult = await db.collection('line_items').updateMany(
      { accountId: stringAccountId },
      { $set: { accountId: objectIdAccountId } }
    )
    
    // Update account_members collection
    const membersResult = await db.collection('account_members').updateMany(
      { accountId: stringAccountId },
      { $set: { accountId: objectIdAccountId } }
    )
    
    // Update account_invites collection
    const invitesResult = await db.collection('account_invites').updateMany(
      { accountId: stringAccountId },
      { $set: { accountId: objectIdAccountId } }
    )

    return NextResponse.json({
      message: 'Migration completed',
      results: {
        receipts: receiptsResult.modifiedCount,
        lineItems: lineItemsResult.modifiedCount,
        members: membersResult.modifiedCount,
        invites: invitesResult.modifiedCount
      }
    })
  } catch (e: any) {
    console.error('Migration error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
