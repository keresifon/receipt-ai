import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// GET: Fetch all invites for an account
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
    const invites = db.collection('account_invites')

    const accountId = new ObjectId(params.id)
    const accountInvites = await invites.find({ accountId }).toArray()

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

    const { email, role = 'member' } = await req.json()

    if (!email) {
      return NextResponse.json({ detail: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const invites = db.collection('account_invites')
    const users = db.collection('users')

    // Check if user already exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ detail: 'User already exists' }, { status: 400 })
    }

    // Check if invite already exists
    const existingInvite = await invites.findOne({ 
      accountId: new ObjectId(params.id), 
      email 
    })
    if (existingInvite) {
      return NextResponse.json({ detail: 'Invite already sent' }, { status: 400 })
    }

    const accountId = new ObjectId(params.id)
    const invite = {
      accountId,
      email,
      role,
      invitedBy: new ObjectId(session.user.id),
      invitedAt: new Date(),
      status: 'pending',
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    await invites.insertOne(invite)

    // Send email invitation
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signup?invite=${invite.token}&email=${encodeURIComponent(email)}&account=${params.id}`
    
    let emailSent = false
    let emailError = null
    
    try {
      if (process.env.RESEND_API_KEY) {
        // Use Resend if API key is configured
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: [email],
          subject: `You're invited to join ${session.user.accountName || 'Receipt AI'}!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d6efd;">You're Invited!</h2>
              <p>Hello!</p>
              <p>You've been invited to join <strong>${session.user.accountName || 'Receipt AI'}</strong> as a <strong>${role}</strong>.</p>
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
                <a href="${inviteUrl}" style="background-color: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #6c757d; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #0d6efd;">${inviteUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
              <p style="color: #6c757d; font-size: 12px;">
                This invitation was sent by ${session.user.email}.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          `
        })
        
        emailSent = true
        console.log('✅ Invite email sent successfully to:', email)
        console.log('📧 Email details:', {
          from: 'onboarding@resend.dev',
          to: email,
          subject: `You're invited to join ${session.user.accountName || 'Receipt AI'}!`,
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
      invite: { ...invite, _id: invite._id?.toString() }
    })
  } catch (e: any) {
    console.error('Error creating invite:', e)
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
