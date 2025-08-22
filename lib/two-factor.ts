import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// 2FA enrollment status
export interface TwoFactorStatus {
  enabled: boolean
  enrolled: boolean
  method: 'totp' | null
  secret?: string
  backupCodes?: string[]
  createdAt?: Date
}

// 2FA verification result
export interface VerificationResult {
  valid: boolean
  reason?: string
}

class TwoFactorService {
  // Generate a new TOTP secret
  generateSecret(email: string, appName: string = 'Receipt AI'): string {
    // Generate 20 bytes (160 bits) which gives us 32 base32 characters
    const secretObj = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      issuer: appName,
      length: 20  // 20 bytes = 32 base32 characters
    })
    
    console.log('Generated secret object:', {
      ascii: secretObj.ascii?.substring(0, 10) + '...',
      hex: secretObj.hex?.substring(0, 10) + '...',
      base32: secretObj.base32?.substring(0, 10) + '...',
      base32Length: secretObj.base32?.length || 0
    })
    
    return secretObj.base32
  }

    // Generate QR code for authenticator app
  async generateQRCode(secret: string, email: string, appName: string = 'Receipt AI'): Promise<string> {
    const qrParams = {
      secret,
      label: email,
      issuer: appName,
      algorithm: 'sha1' as const,
      digits: 6,
      period: 30
    }
    
    console.log('Generating QR code with parameters:', qrParams)
    
    // Manually construct the otpauth URL to ensure secret integrity
    const encodedLabel = encodeURIComponent(email)
    const encodedIssuer = encodeURIComponent(appName)
    const otpauthUrl = `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
    
    console.log('Manually generated otpauth URL:', {
      url: otpauthUrl,
      urlLength: otpauthUrl.length,
      containsSecret: otpauthUrl.includes(qrParams.secret),
      secretInUrl: otpauthUrl.split('secret=')[1]?.split('&')[0]
    })
    
    // Test: Generate TOTP token from the same URL parameters to verify consistency
    const testToken = speakeasy.totp({
      secret: qrParams.secret,
      encoding: 'base32',
      algorithm: 'sha1',
      digits: 6
    })
    
    console.log('TOTP Token from QR parameters:', {
      secret: qrParams.secret,
      testToken
    })

    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  // Verify TOTP token
  verifyToken(secret: string, token: string, window: number = 4): boolean {
    // Try multiple algorithms to handle different authenticator app configurations
    const algorithms = ['sha1', 'sha256', 'sha512'] as const
    
    for (const algorithm of algorithms) {
      // Try multiple time windows for each algorithm
      for (let w = 0; w <= 4; w++) {
        const result = speakeasy.totp.verify({
          secret,
          encoding: 'base32',
          token,
          window: w,
          algorithm,
          digits: 6
        })
        
        if (result) {
          console.log(`TOTP Verification successful with algorithm ${algorithm} and window ${w}:`, {
            secretLength: secret.length,
            token,
            algorithm,
            window: w,
            result: true,
            currentTime: new Date().toISOString()
          })
          return true
        }
      }
    }
    
    console.log('TOTP Verification failed across all algorithms and windows:', {
      secretLength: secret.length,
      token,
      algorithms: ['sha1', 'sha256', 'sha512'],
      windows: [0, 1, 2, 3, 4],
      result: false,
      currentTime: new Date().toISOString()
    })
    
    return false
  }

  // Generate backup codes
  generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateRandomCode())
    }
    return codes
  }

  // Verify backup code
  verifyBackupCode(storedCodes: string[], inputCode: string): boolean {
    const hashedInput = this.hashBackupCode(inputCode)
    return storedCodes.includes(hashedInput)
  }

  // Generate random backup code
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Store 2FA data in database
  async storeTwoFactorData(userId: string, secret: string, backupCodes: string[]): Promise<boolean> {
    try {
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'expenses')
      
      const twoFactorData = {
        userId: new ObjectId(userId),
        secret,
        backupCodes: backupCodes.map(code => this.hashBackupCode(code)),
        enabled: true,
        enrolled: true,
        method: 'totp',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('two_factor_auth').updateOne(
        { userId: new ObjectId(userId) },
        { $set: twoFactorData },
        { upsert: true }
      )

      return true
    } catch (error) {
      return false
    }
  }

  // Get 2FA status from database
  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'expenses')
      
      const twoFactorData = await db.collection('two_factor_auth').findOne({
        userId: new ObjectId(userId)
      })

      if (!twoFactorData) {
        return {
          enabled: false,
          enrolled: false,
          method: null
        }
      }

      return {
        enabled: twoFactorData.enabled,
        enrolled: twoFactorData.enrolled,
        method: twoFactorData.method,
        secret: twoFactorData.secret,
        backupCodes: twoFactorData.backupCodes?.length || 0,
        createdAt: twoFactorData.createdAt
      }
    } catch (error) {
      return {
        enabled: false,
        enrolled: false,
        method: null
      }
    }
  }

  // Disable 2FA for user
  async disableTwoFactor(userId: string): Promise<boolean> {
    try {
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'expenses')
      
      await db.collection('two_factor_auth').deleteOne({
        userId: new ObjectId(userId)
      })

      return true
    } catch (error) {
      return false
    }
  }

  // Verify 2FA during login
  async verifyTwoFactor(userId: string, token: string): Promise<VerificationResult> {
    try {
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'expenses')
      
      const twoFactorData = await db.collection('two_factor_auth').findOne({
        userId: new ObjectId(userId)
      })

      if (!twoFactorData || !twoFactorData.enabled) {
        return { valid: false, reason: '2FA not enabled' }
      }

      // First try TOTP verification
      const totpResult = this.verifyToken(twoFactorData.secret, token)
      
      if (totpResult) {
        return { valid: true }
      }

      // If TOTP fails, try backup code
      if (this.verifyBackupCode(twoFactorData.backupCodes, token)) {
        // Remove used backup code
        await this.removeBackupCode(userId, token)
        return { valid: true }
      }

      // Return error reason

      return { valid: false, reason: 'Invalid token or backup code' }
    } catch (error) {
      return { valid: false, reason: 'Verification failed' }
    }
  }

  // Remove used backup code
  private async removeBackupCode(userId: string, usedCode: string): Promise<void> {
    try {
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'expenses')
      
      const hashedUsedCode = this.hashBackupCode(usedCode)
      
      // First get the current backup codes
      const twoFactorData = await db.collection('two_factor_auth').findOne({
        userId: new ObjectId(userId)
      })
      
      if (twoFactorData && twoFactorData.backupCodes) {
        // Remove the used code from the array
        const updatedBackupCodes = twoFactorData.backupCodes.filter(
          (code: string) => code !== hashedUsedCode
        )
        
        // Update with the filtered array
        await db.collection('two_factor_auth').updateOne(
          { userId: new ObjectId(userId) },
          { 
            $set: { 
              backupCodes: updatedBackupCodes,
              updatedAt: new Date() 
            }
          }
        )
      }
    } catch (error) {
      // Silently fail backup code removal
    }
  }

  // Hash backup code for secure storage
  private hashBackupCode(code: string): string {
    // Simple hash for demo - in production, use bcrypt or similar
    return code.replace(/\s/g, '').toUpperCase()
  }

  // Regenerate backup codes
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const newBackupCodes = this.generateBackupCodes()
      const hashedCodes = newBackupCodes.map(code => this.hashBackupCode(code))
      
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'expenses')
      
      await db.collection('two_factor_auth').updateOne(
        { userId: new ObjectId(userId) },
        { 
          $set: { 
            backupCodes: hashedCodes,
            updatedAt: new Date()
          }
        }
      )

      return newBackupCodes
    } catch (error) {
      throw new Error('Failed to regenerate backup codes')
    }
  }
}

// Export singleton instance
export const twoFactorService = new TwoFactorService()


