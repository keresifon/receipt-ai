import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    if (session.user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accounts = db.collection('accounts')

    const account = await accounts.findOne({ _id: new ObjectId(params.id) })
    
    if (!account) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(account)

  } catch (e: any) {
    console.error('Account fetch error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
