import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// POST: Create a new notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { type, title, message, recipientId, accountId, metadata } = await req.json()

    if (!type || !title || !message || !recipientId || !accountId) {
      return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const notifications = db.collection('notifications')

    const notification = {
      type,
      title,
      message,
      recipientId: new ObjectId(recipientId),
      accountId: new ObjectId(accountId),
      metadata: metadata || {},
      createdAt: new Date(),
      read: false,
      priority: type === 'member_removal' ? 'high' : 'normal'
    }

    const result = await notifications.insertOne(notification)

    return NextResponse.json({ 
      message: 'Notification created successfully',
      notificationId: result.insertedId
    })
  } catch (e: any) {
    console.error('Error creating notification:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}

// GET: Fetch notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const notifications = db.collection('notifications')

    const query: any = {
      recipientId: new ObjectId(session.user.id),
      accountId: new ObjectId(session.user.accountId)
    }

    if (unreadOnly) {
      query.read = false
    }

    const userNotifications = await notifications
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ 
      notifications: userNotifications.map(n => ({
        ...n,
        _id: n._id.toString(),
        recipientId: n.recipientId.toString(),
        accountId: n.accountId.toString()
      }))
    })
  } catch (e: any) {
    console.error('Error fetching notifications:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
