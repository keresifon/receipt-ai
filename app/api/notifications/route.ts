import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { sanitizeObjectId, sanitizeSearchQuery } from '@/lib/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Zod schema for notification creation (admin/system only)
const CreateNotificationSchema = z.object({
  type: z.enum(['member_removal', 'system_alert', 'account_update', 'security_alert'], {
    errorMap: () => ({ message: 'Invalid notification type' })
  }),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  recipientId: z.string().min(1, 'Recipient ID is required').max(24, 'Recipient ID too long'),
  accountId: z.string().min(1, 'Account ID is required').max(24, 'Account ID too long'),
  metadata: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
})

// POST: Create a new notification
export async function POST(req: NextRequest) {
  try {
    // Rate limit notification creation
    const rl = apiRateLimit(req)
    if (rl) return rl

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or system action
    if (session.user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required for notification creation' }, { status: 403 })
    }

    // Validate and sanitize input
    let validatedData
    try {
      const rawData = await req.json()
      validatedData = CreateNotificationSchema.parse(rawData)
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return NextResponse.json({ detail: `Validation error: ${errors}` }, { status: 400 })
      }
      return NextResponse.json({ detail: 'Invalid JSON payload' }, { status: 400 })
    }

    // Sanitize ObjectIds
    const sanitizedRecipientId = sanitizeObjectId(validatedData.recipientId)
    const sanitizedAccountId = sanitizeObjectId(validatedData.accountId)
    
    if (!sanitizedRecipientId || !sanitizedAccountId) {
      return NextResponse.json({ detail: 'Invalid ID format' }, { status: 400 })
    }

    // Sanitize title and message
    const sanitizedTitle = sanitizeSearchQuery(validatedData.title)
    const sanitizedMessage = sanitizeSearchQuery(validatedData.message)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const notifications = db.collection('notifications')

    const notification = {
      type: validatedData.type,
      title: sanitizedTitle,
      message: sanitizedMessage,
      recipientId: new ObjectId(sanitizedRecipientId),
      accountId: new ObjectId(sanitizedAccountId),
      metadata: validatedData.metadata || {},
      createdAt: new Date(),
      read: false,
      priority: validatedData.priority
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
