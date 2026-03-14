import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { authRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'
import crypto from 'crypto'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Bot detection patterns
const RANDOM_NAME_PATTERN = /^[A-Za-z0-9]{15,}$/ // Random character strings
const SUSPICIOUS_EMAIL_PATTERN = /^[a-z]+\d+@/ // Pattern like "varotolufi435@gmail.com"
const VALID_NAME_PATTERN = /^[a-zA-Z\s'-]{2,}$/ // Valid names with spaces, hyphens, apostrophes

const SignupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .refine((name) => {
      // Reject random character strings
      if (RANDOM_NAME_PATTERN.test(name.trim())) {
        return false
      }
      // Require at least some letters (not just numbers/symbols)
      return /[a-zA-Z]/.test(name)
    }, {
      message: 'Please enter a valid name'
    }),
  email: z.string()
    .email('Invalid email address')
    .refine((email) => {
      // Warn about suspicious email patterns but don't block (may be valid)
      // We'll flag these for review instead
      return true
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  accountName: z.string()
    .min(2, 'Account name must be at least 2 characters')
    .max(100, 'Account name is too long')
    .optional(),
  accountDescription: z.string().optional(),
  invite: z.string().optional(),
  accountId: z.string().optional(),
  // Honeypot field - bots will fill this, humans won't see it
  website: z.string().optional().refine((val) => !val || val === '', {
    message: 'Bot detected'
  })
}).refine((data) => {
  // If it's an invitation, accountName is not required
  if (data.invite && data.accountId) {
    return true
  }
  // If it's not an invitation, accountName is required
  return data.accountName && data.accountName.length >= 2
}, {
  message: "Account name is required for new accounts",
  path: ["accountName"]
})

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const body = await req.json()
    
    // Check honeypot field
    if (body.website && body.website !== '') {
      // Honeypot field was filled - likely a bot
      console.warn('Bot detected: honeypot field filled', {
        ip: req.ip || req.headers.get('x-forwarded-for'),
        email: body.email
      })
      // Return success to bot but don't create account
      return NextResponse.json({ 
        message: 'Account creation request received' 
      }, { status: 200 })
    }
    
    const parsed = SignupSchema.parse(body)
    
    // Get database collections
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    const accounts = db.collection('accounts')
    const suspiciousSignups = db.collection('suspicious_signups')
    
    // Get IP address for tracking
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check for recent suspicious signups from this IP
    const recentSuspicious = await suspiciousSignups.countDocuments({
      ip: ip,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    
    if (recentSuspicious >= 3) {
      console.warn('IP blocked: too many suspicious signup attempts', { ip, email: parsed.email })
      return NextResponse.json({ 
        detail: 'Too many signup attempts. Please try again later.' 
      }, { status: 429 })
    }
    
    // Additional bot detection checks
    const hasSuspiciousName = parsed.name && RANDOM_NAME_PATTERN.test(parsed.name.trim())
    const hasSuspiciousEmail = parsed.email && SUSPICIOUS_EMAIL_PATTERN.test(parsed.email)
    
    if (hasSuspiciousName) {
      // Log suspicious attempt
      await suspiciousSignups.insertOne({
        ip: ip,
        email: parsed.email,
        name: parsed.name,
        reason: 'Random character name',
        timestamp: new Date()
      })
      
      console.warn('Suspicious signup attempt: random character name', {
        ip,
        email: parsed.email,
        name: parsed.name
      })
      return NextResponse.json({ 
        detail: 'Invalid name format. Please use a real name.' 
      }, { status: 400 })
    }
    
    if (hasSuspiciousEmail) {
      // Log suspicious attempt but allow (may be valid)
      await suspiciousSignups.insertOne({
        ip: ip,
        email: parsed.email,
        name: parsed.name,
        reason: 'Suspicious email pattern',
        timestamp: new Date()
      })
      
      console.warn('Suspicious signup attempt: suspicious email pattern', {
        ip,
        email: parsed.email,
        name: parsed.name
      })
      // Allow but flag for review
    }

    // Check if user already exists
    const existingUser = await users.findOne({ email: parsed.email.toLowerCase() })
    
    if (existingUser) {
      if (parsed.invite && parsed.accountId) {
        // User exists and has invitation - allow them to join the account
        try {
          const accountId = new ObjectId(parsed.accountId)
          
          // Verify the invite exists and is valid
          const invites = db.collection('account_invites')
          const invite = await invites.findOne({ 
            token: parsed.invite,
            email: parsed.email.toLowerCase(),
            accountId: accountId,
            status: 'pending'
          })
          
          if (!invite) {
            return NextResponse.json({ detail: 'Invalid or expired invitation' }, { status: 400 })
          }
          
          // Check if user is already a member of this account
          const accountMembers = db.collection('account_members')
          const existingMembership = await accountMembers.findOne({ 
            accountId: accountId, 
            userId: existingUser._id 
          })
          
          if (existingMembership) {
            return NextResponse.json({ 
              detail: 'You are already a member of this account' 
            }, { status: 400 })
          }
          
          // Add user to account as member
          await accountMembers.insertOne({
            accountId: accountId,
            userId: existingUser._id,
            role: invite.role,
            joinedAt: new Date()
          })
          
          // Mark invite as accepted
          await invites.updateOne(
            { _id: invite._id },
            { $set: { status: 'accepted', acceptedAt: new Date() } }
          )
          
          return NextResponse.json({ 
            message: 'Successfully joined account',
            userId: existingUser._id.toString(),
            accountId: accountId.toString()
          })
          
        } catch (error) {
          return NextResponse.json({ detail: 'Invalid account ID' }, { status: 400 })
        }
      } else {
        // User exists but no invitation - return error
        return NextResponse.json({ detail: 'User with this email already exists' }, { status: 400 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 12)

    let accountId: ObjectId
    let userRole: 'admin' | 'member' | 'viewer' = 'admin'

    if (parsed.invite && parsed.accountId) {
      // Handle invitation - join existing account
      try {
        accountId = new ObjectId(parsed.accountId)
        
        // Verify the invite exists and is valid
        const invites = db.collection('account_invites')
        const invite = await invites.findOne({ 
          token: parsed.invite,
          email: parsed.email.toLowerCase(),
          accountId: accountId,
          status: 'pending'
        })
        
        if (!invite) {
          return NextResponse.json({ detail: 'Invalid or expired invitation' }, { status: 400 })
        }
        
        // Set role based on invitation
        userRole = invite.role
        
        // Mark invite as accepted immediately
        const inviteUpdateResult = await invites.updateOne(
          { _id: invite._id },
          { 
            $set: { 
              status: 'accepted', 
              acceptedAt: new Date(),
              acceptedBy: parsed.email.toLowerCase()
            } 
          }
        )
        
        if (inviteUpdateResult.matchedCount === 0) {
          return NextResponse.json({ detail: 'Failed to update invite status' }, { status: 500 })
        }
        
      } catch (error) {
        return NextResponse.json({ detail: 'Invalid account ID' }, { status: 400 })
      }
    } else {
      // Create new account
      // Note: accountName validation is handled by the schema above
      const accountDoc = {
        name: parsed.accountName!,
        description: parsed.accountDescription || '',
        createdAt: new Date(),
        createdBy: '', // Will be updated after user creation
        settings: {
          currency: 'CAD',
          timezone: 'America/Toronto',
          allowInvites: true,
          maxUsers: 10
        }
      }

      const accountResult = await accounts.insertOne(accountDoc)
      accountId = accountResult.insertedId

      // Update account with creator info after user creation
      // (We'll do this below)
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

    // Create user
    const userDoc = {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      password: hashedPassword,
      accountId: accountId,
      role: userRole,
      createdAt: new Date(),
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      emailVerificationSentAt: new Date()
    }

    const userResult = await users.insertOne(userDoc)

    // If this was a new account, update it with creator info
    if (!parsed.invite) {
      await accounts.updateOne(
        { _id: accountId },
        { $set: { createdBy: userResult.insertedId.toString() } }
      )
    }

    // If this was an invite, add user to account_members
    if (parsed.invite) {
      const accountMembers = db.collection('account_members')
      await accountMembers.insertOne({
        accountId: accountId,
        userId: userResult.insertedId,
        role: userRole,
        joinedAt: new Date()
      })
    }

    // Log successful account creation/joining
    await auditLogger.logSecurityEvent(
      userResult.insertedId.toString(),
      accountId.toString(),
      parsed.invite ? 'ACCOUNT_JOINED' : 'ACCOUNT_CREATION',
      { 
        accountName: parsed.accountName || 'existing_account',
        userEmail: parsed.email,
        userRole: userRole
      },
      req,
      true
    )

    // Send verification email using Resend
    const verificationUrl = `${process.env.SITE_URL || 'https://no-wahala.net'}/auth/verify-email?token=${verificationToken}`
    
    console.log('🔗 Generated verification URL:', verificationUrl)
    
    let emailSent = false
    let emailError = null
    
    try {
      if (process.env.RESEND_API_KEY) {
        // Use Resend if API key is configured
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        console.log('📧 Attempting to send verification email via Resend...')
        console.log('🔑 Resend API Key:', process.env.RESEND_API_KEY ? 'Configured' : 'Missing')
        
        await resend.emails.send({
          from: 'hello@no-wahala.net',
          to: [parsed.email],
          subject: 'Welcome to No-wahala.net - Verify your email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Welcome to No-wahala.net!</h1>
                <p style="color: #666; font-size: 16px;">Thank you for signing up. Please verify your email address to complete your account setup.</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
                  Click the button below to verify your email address and activate your account.
                </p>
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>Note:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
              <p style="color: #6c757d; font-size: 12px;">
                If you didn't create an account with No-wahala.net, you can safely ignore this email.
              </p>
            </div>
          `
        })
        
        emailSent = true
        console.log('✅ Verification email sent successfully to:', parsed.email)
        console.log('📧 Email details:', {
          from: 'hello@no-wahala.net',
          to: parsed.email,
          subject: 'Welcome to No-wahala.net - Verify your email',
          verificationUrl: verificationUrl
        })
      } else {
        // Fallback: Log the verification link for manual sharing
        console.log('📧 VERIFICATION LINK (Email service not configured):')
        console.log('🔗 Verification URL:', verificationUrl)
        console.log('📝 To verify email:')
        console.log('   1. Copy the URL above')
        console.log('   2. Open it in your browser')
        console.log('   3. Your email will be verified')
      }
    } catch (error: any) {
      emailError = error
      console.error('❌ Failed to send verification email:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      })
      console.log('📧 VERIFICATION LINK (Email failed, use manual sharing):')
      console.log('🔗 Verification URL:', verificationUrl)
      console.log('📝 Open this link to verify:', parsed.email)
    }

    return NextResponse.json({ 
      message: parsed.invite ? 'Account joined successfully' : (emailSent ? 'Account created successfully. Please check your email to verify your account.' : 'Account created successfully. Please check your email to verify your account.'),
      emailSent: emailSent,
      userId: userResult.insertedId.toString(),
      accountId: accountId.toString(),
      verificationUrl: verificationUrl,
      // In development, return the verification link
      ...(process.env.NODE_ENV === 'development' && { 
        verificationToken,
        verificationLink: verificationUrl
      })
    })

  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ detail: e.errors[0].message }, { status: 400 })
    }
    
    console.error('Signup error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
