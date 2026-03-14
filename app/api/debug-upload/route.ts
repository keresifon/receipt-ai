import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    // Check recent receipts
    const recentReceipts = await db.collection('receipts')
      .find({ accountId: new ObjectId(session.user.accountId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    
    // Check recent line items
    const recentLineItems = await db.collection('line_items')
      .find({ accountId: new ObjectId(session.user.accountId) })
      .sort({ _id: -1 })
      .limit(5)
      .toArray()
    
    // Check total counts
    const totalReceipts = await db.collection('receipts').countDocuments({ accountId: new ObjectId(session.user.accountId) })
    const totalLineItems = await db.collection('line_items').countDocuments({ accountId: new ObjectId(session.user.accountId) })
    
    // Check environment variables
    const envCheck = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Missing',
      MONGODB_DB: process.env.MONGODB_DB || 'expenses',
      NODE_ENV: process.env.NODE_ENV
    }

    return NextResponse.json({
      message: 'Debug information',
      session: {
        user: session.user.email,
        accountId: session.user.accountId
      },
      database: {
        totalReceipts,
        totalLineItems,
        recentReceipts: recentReceipts.map(r => ({
          _id: r._id,
          date: r.date,
          merchant: r.merchant,
          accountId: r.accountId,
          createdAt: r.createdAt
        })),
        recentLineItems: recentLineItems.map(li => ({
          _id: li._id,
          description: li.description,
          accountId: li.accountId,
          receipt_id: li.receipt_id
        }))
      },
      environment: envCheck
    })
  } catch (e: any) {
    console.error('Debug error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
