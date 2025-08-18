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
    const items = db.collection('line_items')
    
    // Debug: Check what fields exist in the collection
    const sampleItem = await items.findOne({ accountId: new ObjectId(session.user.accountId) })
    console.log('Sample item structure:', sampleItem)

    // Get distinct stores for this account
    console.log('Searching for stores with accountId:', session.user.accountId)
    
    const stores = await items.aggregate([
      { $match: { accountId: new ObjectId(session.user.accountId) } },
      { $group: { _id: '$store' } },
      { $sort: { _id: 1 } }
    ]).toArray()

    console.log('Raw stores aggregation result:', stores)
    
    const storeList = stores.map(s => s._id).filter(Boolean)
    console.log('Filtered store list:', storeList)
    
    return NextResponse.json({ stores: storeList })
  } catch (e: any) {
    console.error('Stores API error:', e)
    return NextResponse.json({ 
      detail: e?.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 })
  }
}
