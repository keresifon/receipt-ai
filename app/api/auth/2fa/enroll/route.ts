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
      // Generate new TOTP secret
      const secret = twoFactorService.generateSecret(session.user.email || 'user')
      
      // Generate QR code
      const qrCode = await twoFactorService.generateQRCode(secret, session.user.email || 'user')
      
      // Generate backup codes
      const backupCodes = twoFactorService.generateBackupCodes()
      
      // Store 2FA data in database
      const stored = await twoFactorService.storeTwoFactorData(session.user.id, secret, backupCodes)
      
      if (!stored) {
        throw new Error('Failed to store 2FA data')
      }
      
      // Log the enrollment
      await auditLogger.logSecurityEvent(
        session.user.id,
        undefined, // accountId
        '2FA_ENROLLMENT',
        { method: 'totp' },
        req,
        true
      )

      return NextResponse.json({
        success: true,
        secret,
        qrCode,
        backupCodes,
        message: '2FA enrollment successful. Scan the QR code with your authenticator app.'
      })

    } catch (error: any) {
      console.error('2FA enrollment error:', error)
      return NextResponse.json(
        { error: 'Failed to enroll in 2FA' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('2FA enrollment route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
