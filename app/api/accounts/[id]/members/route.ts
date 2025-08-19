import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { sanitizeObjectId } from '@/lib/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Zod schema for member addition
const AddMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required').max(24, 'User ID too long'),
  role: z.enum(['admin', 'member', 'viewer'], { 
    errorMap: () => ({ message: 'Role must be admin, member, or viewer' })
  }).default('member')
})

// GET: Fetch all members for an account
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const members = db.collection('account_members')
    const users = db.collection('users')

    const accountId = new ObjectId(params.id)
    const accountMembers = await members.find({ accountId }).toArray()

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      accountMembers.map(async (member) => {
        const user = await users.findOne({ _id: new ObjectId(member.userId) })
        return {
          ...member,
          _id: member._id?.toString(),
          userId: member.userId?.toString(),
          user: user ? {
            id: user._id?.toString(),
            email: user.email,
            name: user.name
          } : null
        }
      })
    )

    return NextResponse.json({ members: membersWithDetails })
  } catch (e: any) {
    console.error('Error fetching members:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}

// POST: Add a new member to the account
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit member addition
    const rl = apiRateLimit(req)
    if (rl) return rl

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

    // Validate and sanitize input
    let validatedData
    try {
      const rawData = await req.json()
      validatedData = AddMemberSchema.parse(rawData)
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return NextResponse.json({ detail: `Validation error: ${errors}` }, { status: 400 })
      }
      return NextResponse.json({ detail: 'Invalid JSON payload' }, { status: 400 })
    }

    // Sanitize and validate ObjectId
    const sanitizedUserId = sanitizeObjectId(validatedData.userId)
    if (!sanitizedUserId) {
      return NextResponse.json({ detail: 'Invalid user ID format' }, { status: 400 })
    }

    const { role } = validatedData
    const userId = sanitizedUserId

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const members = db.collection('account_members')
    const users = db.collection('users')

    // Check if user exists
    const user = await users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ detail: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await members.findOne({
      accountId: new ObjectId(params.id),
      userId: new ObjectId(userId)
    })
    if (existingMember) {
      return NextResponse.json({ detail: 'User is already a member' }, { status: 400 })
    }

    const accountId = new ObjectId(params.id)
    const member = {
      accountId,
      userId: new ObjectId(userId),
      role,
      invitedBy: new ObjectId(session.user.id),
      invitedAt: new Date(),
      joinedAt: new Date(),
      status: 'active'
    }

    await members.insertOne(member)

    return NextResponse.json({ 
      message: 'Member added successfully',
      member: { 
        ...member, 
        _id: member.accountId?.toString(), 
        userId: member.userId?.toString() 
      }
    })
  } catch (e: any) {
    console.error('Error adding member:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
