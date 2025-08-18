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

    const { searchParams } = new URL(req.url)
    const store = searchParams.get('store')
    const date = searchParams.get('date')

    if (!store || !date) {
      return NextResponse.json({ detail: 'Store and date parameters are required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const receipts = db.collection('receipts')

    // Find the most recent receipt for this store and date
    const receipt = await receipts.findOne(
      { 
        accountId: new ObjectId(session.user.accountId),
        merchant: store,
        date: date
      },
      { 
        sort: { createdAt: -1 } // Most recent first
      }
    )

    if (!receipt) {
      return NextResponse.json({ 
        receipt: null,
        message: `No receipt found for ${store} on ${date}`
      })
    }

    return NextResponse.json({ 
      receipt: {
        _id: receipt._id.toString(),
        merchant: receipt.merchant,
        date: receipt.date,
        total: receipt.totals?.total || 0
      }
    })
  } catch (e: any) {
    console.error('Find receipt error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
