import jwt from 'jsonwebtoken'

export type MobileTokenPayload = {
  userId: string
  email: string
  accountId: string
  role?: string
  emailVerified?: boolean
}

type VerifiedMobileToken = MobileTokenPayload & jwt.JwtPayload

function getSigningSecrets(): string[] {
  const secrets = [process.env.NEXTAUTH_SECRET, process.env.JWT_SECRET]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map(value => value.trim())

  return Array.from(new Set(secrets))
}

export function signMobileToken(payload: MobileTokenPayload): string {
  const secrets = getSigningSecrets()
  if (secrets.length === 0) {
    throw new Error('Missing NEXTAUTH_SECRET/JWT_SECRET for mobile token signing')
  }

  const issuer = process.env.SITE_URL || process.env.NEXTAUTH_URL || 'https://no-wahala.net'
  const audience = 'receiptai-mobile'

  return jwt.sign(
    payload,
    secrets[0],
    {
      algorithm: 'HS256',
      expiresIn: '24h',
      issuer,
      audience,
      subject: payload.userId
    }
  )
}

export function verifyMobileToken(token: string): VerifiedMobileToken {
  const secrets = getSigningSecrets()
  if (secrets.length === 0) {
    throw new Error('Missing NEXTAUTH_SECRET/JWT_SECRET for mobile token verification')
  }

  let lastError: unknown
  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as VerifiedMobileToken
      return decoded
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Invalid mobile JWT')
}
