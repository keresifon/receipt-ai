import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { sanitizeSearchQuery, sanitizeDate } from '@/lib/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Rate limit receipt search
    const rl = apiRateLimit(req)
    if (rl) return rl

    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        user = { accountId: decoded.accountId, email: decoded.email }
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

    const { searchParams } = new URL(req.url)
    const rawStore = searchParams.get('store')
    const rawDate = searchParams.get('date')

    if (!rawStore || !rawDate) {
      return NextResponse.json({ detail: 'Store and date parameters are required' }, { status: 400 })
    }

    // Sanitize query parameters
    const store = sanitizeSearchQuery(rawStore)
    const date = sanitizeDate(rawDate)

    if (!store || !date) {
      return NextResponse.json({ detail: 'Invalid store or date format' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const receipts = db.collection('receipts')

    // Find the most recent receipt for this store and date
    const receipt = await receipts.findOne(
      { 
        accountId: new ObjectId(user.accountId),
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
