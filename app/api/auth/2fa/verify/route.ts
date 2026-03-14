import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { twoFactorService } from '@/lib/two-factor'
import { apiRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    await apiRateLimit(req)
    
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    try {
      // Verify the 2FA token
      const result = await twoFactorService.verifyTwoFactor(session.user.id, token)
      
      if (result.valid) {
        // Log successful verification
        await auditLogger.logSecurityEvent(
          session.user.id,
          undefined, // accountId
          '2FA_VERIFICATION_SUCCESS',
          {},
          req,
          true
        )

        return NextResponse.json({
          success: true,
          verified: true
        })
      } else {
        // Log failed verification
        await auditLogger.logSecurityEvent(
          session.user.id,
          undefined, // accountId
          '2FA_VERIFICATION_FAILED',
          { reason: result.reason || 'Invalid token' },
          req,
          false
        )

        return NextResponse.json({
          success: false,
          verified: false,
          error: result.reason || 'Invalid verification token'
        }, { status: 400 })
      }

    } catch (error: any) {
      console.error('2FA verification error:', error)
      
      // Log verification error
      await auditLogger.logSecurityEvent(
        session.user.id,
        undefined, // accountId
        '2FA_VERIFICATION_ERROR',
        { error: error.message },
        req,
        false
      )

      return NextResponse.json(
        { error: 'Failed to verify 2FA token' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('2FA verification route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
