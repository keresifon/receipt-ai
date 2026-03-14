import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { apiRateLimit } from '@/lib/rate-limit'
import { verifyMobileToken } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Rate limit categories API access
    const rl = apiRateLimit(req)
    if (rl) return rl

    // Check authentication - support both NextAuth and JWT
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = verifyMobileToken(token)
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
    
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Get distinct categories, excluding empty/null values and HST/Discount items
    const accountId = new ObjectId(user.accountId)
    const categories = await items.aggregate([
      { $match: { 
        $and: [
          { accountId: accountId },
          { category: { $exists: true, $ne: null } },
          { category: { $ne: '' } },
          { description: { $not: { $regex: /^(hst|discount)$/i } } }
        ]
      }},
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]).toArray()

    const categoryList = categories.map(c => c._id).filter(Boolean)
    
    return NextResponse.json({ categories: categoryList })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
