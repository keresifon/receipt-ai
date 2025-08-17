import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    if (session.user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 })
    }

    const { name, description, timezone, currency } = await req.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ detail: 'Account name is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const accounts = db.collection('accounts')

    const result = await accounts.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          name: name.trim(),
          description: description?.trim() || '',
          'settings.timezone': timezone || 'America/Toronto',
          'settings.currency': currency || 'CAD',
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Account updated successfully',
      updated: true
    })

  } catch (e: any) {
    console.error('Account update error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
