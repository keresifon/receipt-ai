import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !('accountId' in session.user)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accounts = db.collection('accounts')

    const account = await accounts.findOne({ _id: new ObjectId(session.user.accountId as string) })
    
    if (!account) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(account)

  } catch (e: any) {
    console.error('Account fetch error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

