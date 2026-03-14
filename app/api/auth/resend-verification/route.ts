import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import clientPromise from '@/lib/mongodb'
import { authRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').optional()
})

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    let body = {}
    try {
      body = await req.json()
    } catch (error) {
      // Handle empty body case
      console.log('Empty request body, using default values')
    }
    const parsed = ResendVerificationSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    
    let user
    
    if (parsed.email) {
      // Find user by email (for unauthenticated requests)
      user = await users.findOne({ email: parsed.email.toLowerCase() })
    } else {
      // Find user by session (for authenticated requests)
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ 
          detail: 'Authentication required' 
        }, { status: 401 })
      }
      
      user = await users.findOne({ _id: new ObjectId(session.user.id) })
    }
    
    if (!user) {
      return NextResponse.json({ 
        detail: 'User not found' 
      }, { status: 404 })
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        detail: 'Email is already verified' 
      }, { status: 400 })
    }

    // Check if verification was sent recently (rate limiting)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentVerification = await users.findOne({
      _id: user._id,
      emailVerificationSentAt: { $gt: fiveMinutesAgo }
    })

    if (recentVerification) {
      return NextResponse.json({ 
        detail: 'Verification email already sent. Please wait 5 minutes before requesting another.' 
      }, { status: 429 })
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

    // Update user with new verification token and sent timestamp
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          emailVerificationSentAt: new Date()
        }
      }
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
          to: [user.email],
          subject: 'Verify your email address - No-wahala.net',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Welcome to No-wahala.net!</h1>
                <p style="color: #666; font-size: 16px;">Please verify your email address to complete your account setup.</p>
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
        console.log('✅ Verification email sent successfully to:', user.email)
        console.log('📧 Email details:', {
          from: 'hello@no-wahala.net',
          to: user.email,
          subject: 'Verify your email address - No-wahala.net',
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
      console.log('📝 Open this link to verify:', user.email)
    }

    // Log verification email sent
    await auditLogger.logSecurityEvent(
      user._id.toString(),
      user.accountId.toString(),
      'VERIFICATION_EMAIL_SENT',
      { 
        userEmail: user.email,
        userRole: user.role
      },
      req,
      true
    )

    return NextResponse.json({ 
      message: emailSent ? 'Verification email sent successfully' : 'Verification email failed, but you can use the verification link',
      emailSent: emailSent,
      verificationUrl: verificationUrl,
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { 
        verificationToken,
        verificationLink: verificationUrl
      })
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        detail: error.errors[0].message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      detail: 'Internal server error' 
    }, { status: 500 })
  }
}
