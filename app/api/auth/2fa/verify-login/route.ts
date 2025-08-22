import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { twoFactorService } from '@/lib/two-factor'
import { apiRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { token, email } = await request.json()

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email since we don't have a session yet
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'expenses')
    
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify the 2FA token
    const verificationResult = await twoFactorService.verifyTwoFactor(user._id.toString(), token)

    if (verificationResult.valid) {
      // Log successful 2FA verification
      await auditLogger.logSecurityEvent(
        user._id.toString(),
        user.accountId?.toString(),
        '2FA_LOGIN_SUCCESS',
        { method: 'TOTP' },
        request,
        true
      )

      // Return success with redirect URL
      return NextResponse.json({
        success: true,
        message: '2FA verification successful',
        redirectUrl: '/dashboard'
      })
    } else {
      // Log failed 2FA verification
      await auditLogger.logSecurityEvent(
        user._id.toString(),
        user.accountId?.toString(),
        '2FA_LOGIN_FAILED',
        { method: 'TOTP', reason: verificationResult.reason },
        request,
        false
      )

      return NextResponse.json(
        { error: verificationResult.reason || 'Invalid token' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('2FA verification error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
