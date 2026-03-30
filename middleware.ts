import { NextResponse } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req: any) {
  // For API routes, allow through and let the API routes handle authentication
  if (req.nextUrl.pathname.startsWith('/api/')) {
    console.log('🔓 Allowing API request through:', req.nextUrl.pathname)
    const response = NextResponse.next()
    return applySecurityHeaders(response)
  }

  // Check for email verification requirement for new users
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  
  if (token) {
    const verificationRolloutDate = new Date('2025-01-01T00:00:00Z')
    const createdAtRaw = (token as any).createdAt
    const createdAtDate = createdAtRaw ? new Date(String(createdAtRaw)) : new Date(0)
    const isNewUser = !Number.isNaN(createdAtDate.getTime()) && createdAtDate > verificationRolloutDate
    const requiresVerification = isNewUser && !(token as any).emailVerified

    // Skip verification check for certain pages
    const skipVerificationPages = [
      '/auth/verify-email',
      '/auth/verification-required',
      '/auth/signin',
      '/auth/signup',
      '/auth/2fa',
      '/auth/reset-password',
      '/auth/forgot-password'
    ]

    if (requiresVerification && !skipVerificationPages.includes(req.nextUrl.pathname)) {
      console.log('🔒 Redirecting to verification required page')
      return NextResponse.redirect(new URL('/auth/verification-required', req.url))
    }
  }

  // For non-API routes, allow through (handled by NextAuth)
  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/dashboard',
    '/upload',
    '/records',
    '/account',
    '/api/upload',
    '/api/upload/guest',
    '/api/analytics',
    '/api/records',
    '/api/items/:path*',
    '/api/categories',
    '/api/months'
  ]
}
