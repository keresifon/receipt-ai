import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { z } from 'zod'
import { authRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'
import { signMobileToken } from '@/lib/mobile-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SigninSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const body = await req.json()
    const parsed = SigninSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    
    // Find user by email
    const user = await users.findOne({ email: parsed.email.toLowerCase() })
    
    if (!user) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(parsed.password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
    }

    // Check if user has 2FA enabled
    const twoFactorAuth = db.collection('two_factor_auth')
    const twoFactorData = await twoFactorAuth.findOne({ 
      userId: user._id,
      enabled: true 
    })

    // If 2FA is enabled, return a flag indicating 2FA is required
    if (twoFactorData) {
      return NextResponse.json({ 
        requires2FA: true,
        message: '2FA verification required'
      }, { status: 200 })
    }

    // Check if email verification is required for new users
    // For now, disable email verification requirement to match NextAuth behavior
    // TODO: Implement consistent email verification logic across all auth methods
    const verificationRolloutDate = new Date('2025-01-01T00:00:00Z') // Set rollout date
    const isNewUser = user.createdAt > verificationRolloutDate
    const requiresVerification = false // Disabled to match NextAuth behavior

    if (requiresVerification) {
      return NextResponse.json({ 
        detail: 'Email verification required',
        requiresVerification: true,
        emailVerified: false,
        verificationUrl: `${process.env.SITE_URL || 'https://no-wahala.net'}/auth/verify-email`
      }, { status: 403 })
    }

    // Create JWT token
    const token = signMobileToken({
      userId: user._id.toString(),
      email: user.email,
      accountId: user.accountId.toString(),
      role: user.role,
      emailVerified: user.emailVerified || false
    })

    // Log successful login
    await auditLogger.logSecurityEvent(
      user._id.toString(),
      user.accountId.toString(),
      'MOBILE_LOGIN',
      { 
        userEmail: user.email,
        userRole: user.role
      },
      req,
      true
    )

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        accountId: user.accountId.toString(),
        role: user.role,
        emailVerified: user.emailVerified || false
      }
    })

  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ detail: e.errors[0].message }, { status: 400 })
    }
    
    console.error('Mobile signin error:', e)
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
