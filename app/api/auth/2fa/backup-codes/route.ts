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

    try {
      // Regenerate backup codes
      const backupCodes = await twoFactorService.regenerateBackupCodes(session.user.id)
      
      // Log backup codes regeneration
      await auditLogger.logSecurityEvent(
        session.user.id,
        undefined, // accountId
        '2FA_BACKUP_CODES_REGENERATED',
        { codeCount: backupCodes.length },
        req,
        true
      )

      return NextResponse.json({
        success: true,
        backupCodes,
        message: 'Backup codes regenerated successfully. Store them securely!'
      })

    } catch (error: any) {
      console.error('Generate backup codes error:', error)
      return NextResponse.json(
        { error: 'Failed to generate backup codes' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Backup codes route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
      // Get user's 2FA status to check if backup codes are available
      const status = await twoFactorService.getTwoFactorStatus(session.user.id)
      
      if (!status.enabled) {
        return NextResponse.json({
          error: '2FA must be enabled to use backup codes'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        hasBackupCodes: status.backupCodes && status.backupCodes.length > 0,
        backupCodeCount: status.backupCodes || 0,
        message: 'Backup codes are available for this account'
      })

    } catch (error: any) {
      console.error('Check backup codes error:', error)
      return NextResponse.json(
        { error: 'Failed to check backup codes status' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Backup codes route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
