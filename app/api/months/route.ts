import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check for mobile app JWT token first
    const authHeader = req.headers.get('authorization')
    let user: any = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        console.log('JWT decoded:', { accountId: decoded.accountId, email: decoded.email })
        user = { accountId: decoded.accountId, email: decoded.email }
      } catch (error) {
        console.log('JWT verification failed:', error)
        // JWT verification failed, try NextAuth session
        const session = await getServerSession(authOptions)
        user = session?.user
      }
    } else {
      // No JWT token, try NextAuth session
      const session = await getServerSession(authOptions)
      user = session?.user
    }
    
    if (!user || !user.accountId) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    
    const accountId = new ObjectId(user.accountId)
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const items = db.collection('line_items')

    // Get distinct months from user's records only
    const months = await items.aggregate([
      { $match: { 
        accountId: accountId,
        date: { $exists: true, $ne: '' } 
      }},
      { $project: { month: { $substr: ['$date', 0, 7] } } },
      { $group: { _id: '$month' } },
      { $sort: { _id: -1 } },
      { $project: { month: '$_id', _id: 0 } }
    ]).toArray()

    const monthList = months.map(m => m.month).filter(Boolean)
    
    console.log('Months found:', monthList)
    console.log('Account ID used:', accountId.toString())
    
    return NextResponse.json({ months: monthList })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Server error' }, { status: 500 })
  }
}
