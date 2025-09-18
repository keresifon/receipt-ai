import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { apiRateLimit } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Rate limit stores API access
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

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')
    
    // Get distinct stores for this account
    const stores = await items.aggregate([
      { $match: { accountId: new ObjectId(user.accountId) } },
      { $group: { _id: '$store' } },
      { $sort: { _id: 1 } }
    ]).toArray()

    const userStores = stores.map(s => s._id).filter(Boolean)
    
    // Always provide default stores along with user's existing stores
    const defaultStores = [
      'Walmart',
      'Target', 
      'Amazon',
      'Costco',
      'Loblaws',
      'Safeway',
      'CVS Pharmacy',
      'Walgreens',
      'McDonald\'s',
      'Starbucks',
      'Subway',
      'Gas Station',
      'Grocery Store',
      'Restaurant',
      'Other'
    ]
    
    // Combine user stores with default stores, removing duplicates
    const allStores = [...new Set([...userStores, ...defaultStores])].sort()
    
    return NextResponse.json({ stores: allStores })
  } catch (e: any) {
    console.error('Stores API error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
