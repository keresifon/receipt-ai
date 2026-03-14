import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'
import { z } from 'zod'
import { sanitizeEmail } from '@/lib/sanitize'
import { apiRateLimit } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// Helper function to authenticate JWT token
async function authenticateJWT(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      accountId: decoded.accountId,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

// Zod schema for invite creation
const CreateInviteSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required').max(254, 'Email too long'),
  role: z.enum(['admin', 'member', 'viewer'], { 
    errorMap: () => ({ message: 'Role must be admin, member, or viewer' })
  }).default('member')
})

// GET: Fetch all invites for an account
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try JWT authentication first (for mobile apps)
    let user = await authenticateJWT(req)
    
    // If JWT fails, try NextAuth session (for web apps)
    if (!user) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        user = {
          userId: session.user.id,
          email: session.user.email,
          accountId: session.user.accountId,
          role: session.user.role
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    if (user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const invites = db.collection('account_invites')

    const accountId = new ObjectId(params.id)
    // Only return pending invites
    const accountInvites = await invites.find({ 
      accountId, 
      status: 'pending' 
    }).toArray()

    return NextResponse.json({ invites: accountInvites })
  } catch (e: any) {
    console.error('Error fetching invites:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}

// POST: Create a new invite
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit invite creation
    const rl = apiRateLimit(req)
    if (rl) return rl

    // Try JWT authentication first (for mobile apps)
    let user = await authenticateJWT(req)
    
    // If JWT fails, try NextAuth session (for web apps)
    if (!user) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        user = {
          userId: session.user.id,
          email: session.user.email,
          accountId: session.user.accountId,
          role: session.user.role
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    if (user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 })
    }

    // Validate and sanitize input
    let validatedData
    try {
      const rawData = await req.json()
      validatedData = CreateInviteSchema.parse(rawData)
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return NextResponse.json({ detail: `Validation error: ${errors}` }, { status: 400 })
      }
      return NextResponse.json({ detail: 'Invalid JSON payload' }, { status: 400 })
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(validatedData.email)
    if (!sanitizedEmail) {
      return NextResponse.json({ detail: 'Invalid email format' }, { status: 400 })
    }

    const { role } = validatedData
    const email = sanitizedEmail

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const invites = db.collection('account_invites')
    const users = db.collection('users')
    const accounts = db.collection('accounts')

    // Get account information for the email
    const account = await accounts.findOne({ _id: new ObjectId(params.id) })
    if (!account) {
      return NextResponse.json({ detail: 'Account not found' }, { status: 404 })
    }

    // Check if user already exists and if they're already part of this account
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      // Check if user is already a member of this account
      const accountMembers = db.collection('account_members')
      const existingMembership = await accountMembers.findOne({ 
        accountId: new ObjectId(params.id), 
        userId: existingUser._id 
      })
      
      if (existingMembership) {
        return NextResponse.json({ 
          detail: 'User is already a member of this account' 
        }, { status: 400 })
      }
      
      // User exists but not in this account - allow invite
      console.log('✅ Inviting existing user to join account:', email)
    } else {
      console.log('✅ Inviting new user to join account:', email)
    }

    // Check if a pending invite already exists
    const existingInvite = await invites.findOne({ 
      accountId: new ObjectId(params.id), 
      email,
      status: 'pending'
    })
    if (existingInvite) {
      return NextResponse.json({ detail: 'Invite already sent' }, { status: 400 })
    }

    const invite = {
      accountId: new ObjectId(params.id),
      email,
      role,
      invitedBy: new ObjectId(user.userId),
      invitedAt: new Date(),
      status: 'pending',
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    const result = await invites.insertOne(invite)
    const insertedInvite = { ...invite, _id: result.insertedId }
    
    console.log('✅ Invite created in database:', {
      inviteId: result.insertedId.toString(),
      email: email,
      accountId: params.id,
      role: role
    })

    // Send email invitation
    const inviteUrl = `${process.env.SITE_URL || 'https://no-wahala.net'}/auth/signup?invite=${invite.token}&email=${encodeURIComponent(email)}&account=${params.id}`
    
    console.log('🔗 Generated invite URL:', inviteUrl)
    
    let emailSent = false
    let emailError = null
    
    try {
      if (process.env.RESEND_API_KEY) {
        // Use Resend if API key is configured
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        console.log('📧 Attempting to send email via Resend...')
        console.log('🔑 Resend API Key:', process.env.RESEND_API_KEY ? 'Configured' : 'Missing')
        
        await resend.emails.send({
          from: 'hello@no-wahala.net',
          to: [email],
          subject: `You're invited to join ${account.name || 'No-wahala.net'}!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">You're Invited!</h2>
              <p>Hello!</p>
              <p>You've been invited to join <strong>${account.name || 'No-wahala.net'}</strong> as a <strong>${role}</strong>.</p>
              <p>This family account helps manage and track expenses together.</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">What you can do:</h3>
                <ul>
                  <li>View shared expense records</li>
                  <li>${role === 'admin' ? 'Manage account settings and members' : 'View spending analytics'}</li>
                  <li>Track family spending patterns</li>
                  <li>Collaborate on budget management</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #6c757d; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #dc2626;">${inviteUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
              <p style="color: #6c757d; font-size: 12px;">
                This invitation was sent by ${user.email}.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          `
        })
        
        emailSent = true
        console.log('✅ Invite email sent successfully to:', email)
        console.log('📧 Email details:', {
          from: 'hello@no-wahala.net',
          to: email,
          subject: `You're invited to join ${account.name || 'No-wahala.net'}!`,
          inviteUrl: inviteUrl
        })
      } else {
        // Fallback: Log the invite link for manual sharing
        console.log('📧 INVITATION LINK (Email service not configured):')
        console.log('🔗 Invite URL:', inviteUrl)
        console.log('📝 To send this invitation:')
        console.log('   1. Copy the URL above')
        console.log('   2. Send it to:', email)
        console.log('   3. They can click the link to join your account')
      }
    } catch (error: any) {
      emailError = error
      console.error('❌ Failed to send invite email:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      })
      console.log('📧 INVITATION LINK (Email failed, use manual sharing):')
      console.log('🔗 Invite URL:', inviteUrl)
      console.log('📝 Send this link to:', email)
    }

    return NextResponse.json({ 
      message: emailSent ? 'Invite sent successfully via email' : 'Invite created successfully (email failed, use invite link)',
      emailSent: emailSent,
      inviteUrl: inviteUrl,
      invite: { ...insertedInvite, _id: insertedInvite._id?.toString() }
    })
  } catch (e: any) {
    console.error('Error creating invite:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}

// DELETE: Delete an invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try JWT authentication first (for mobile apps)
    let user = await authenticateJWT(req)
    
    // If JWT fails, try NextAuth session (for web apps)
    if (!user) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        user = {
          userId: session.user.id,
          email: session.user.email,
          accountId: session.user.accountId,
          role: session.user.role
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    if (user.accountId !== params.id) {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ detail: 'Admin access required' }, { status: 403 })
    }

    // Get invitation ID from query parameters
    const { searchParams } = new URL(req.url)
    const inviteId = searchParams.get('inviteId')
    
    if (!inviteId) {
      return NextResponse.json({ detail: 'Invitation ID is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const invites = db.collection('account_invites')

    // Delete the invitation
    const result = await invites.deleteOne({ 
      _id: new ObjectId(inviteId),
      accountId: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ detail: 'Invitation not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Invitation deleted successfully',
      deletedCount: result.deletedCount
    })
  } catch (e: any) {
    console.error('Error deleting invite:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
