import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import clientPromise from '@/lib/mongodb'
import { authRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
})

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const body = await req.json()
    const parsed = VerifyEmailSchema.parse(body)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    const users = db.collection('users')
    
    // Find user by verification token
    const user = await users.findOne({ 
      emailVerificationToken: parsed.token,
      emailVerificationExpires: { $gt: new Date() }
    })
    
    if (!user) {
      return NextResponse.json({ 
        detail: 'Invalid or expired verification token' 
      }, { status: 400 })
    }

    // Update user to mark email as verified
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          emailVerified: true,
          emailVerifiedAt: new Date()
        },
        $unset: { 
          emailVerificationToken: 1,
          emailVerificationExpires: 1
        }
      }
    )

    // Log successful email verification
    await auditLogger.logSecurityEvent(
      user._id.toString(),
      user.accountId.toString(),
      'EMAIL_VERIFIED',
      { 
        userEmail: user.email,
        userRole: user.role
      },
      req,
      true
    )

    return NextResponse.json({ 
      message: 'Email verified successfully',
      emailVerified: true
    })

  } catch (error) {
    console.error('Email verification error:', error)
    
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
