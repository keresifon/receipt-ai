import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface CSRFConfig {
  secret: string
  tokenLength: number
  headerName: string
  cookieName: string
}

const defaultConfig: CSRFConfig = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
  tokenLength: 32,
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token'
}

export class CSRFProtection {
  private config: CSRFConfig

  constructor(config?: Partial<CSRFConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  generateToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString('hex')
  }

  validateToken(token: string, storedToken: string): boolean {
    if (!token || !storedToken) return false
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(storedToken, 'hex')
    )
  }

  createTokenCookie(): { name: string; value: string; options: any } {
    const token = this.generateToken()
    return {
      name: this.config.cookieName,
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      }
    }
  }

  validateRequest(req: NextRequest): boolean {
    const token = req.headers.get(this.config.headerName)
    const cookieToken = req.cookies.get(this.config.cookieName)?.value

    if (!token || !cookieToken) return false
    return this.validateToken(token, cookieToken)
  }

  middleware() {
    return (req: NextRequest) => {
      // Skip CSRF validation for GET requests
      if (req.method === 'GET') {
        return null
      }

      // Validate CSRF token for state-changing requests
      if (!this.validateRequest(req)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }

      return null
    }
  }
}

// Export default instance
export const csrfProtection = new CSRFProtection()
