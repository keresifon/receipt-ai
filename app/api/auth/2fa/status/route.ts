import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { twoFactorService } from '@/lib/two-factor'
import { apiRateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-log'

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    await apiRateLimit(req)
    
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get user's 2FA status
      const status = await twoFactorService.getTwoFactorStatus(session.user.id)
      
      return NextResponse.json({
        configured: true,
        ...status
      })

    } catch (error: any) {
      console.error('Get 2FA status error:', error)
      return NextResponse.json(
        { error: 'Failed to get 2FA status' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('2FA status route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    await apiRateLimit(req)
    
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Disable 2FA for user
      const success = await twoFactorService.disableTwoFactor(session.user.id)
      
      if (success) {
        // Log 2FA disable
        await auditLogger.logSecurityEvent(
          session.user.id,
          undefined, // accountId
          '2FA_DISABLED',
          {},
          req,
          true
        )

        return NextResponse.json({
          success: true,
          message: '2FA has been disabled'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to disable 2FA'
        }, { status: 500 })
      }

    } catch (error: any) {
      console.error('Disable 2FA error:', error)
      
      // Log disable error
      await auditLogger.logSecurityEvent(
        session.user.id,
        undefined, // accountId
        '2FA_DISABLE_ERROR',
        { error: error.message },
        req,
        false
      )

      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('2FA disable route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
