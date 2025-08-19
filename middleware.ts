import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'

export default withAuth(
  function middleware(req) {
    // Enforce idle timeout (30 minutes)
    const token: any = (req as any).nextauth?.token
    const thirtyMinutes = 30 * 60 * 1000
    if (token?.lastActivity && Date.now() - token.lastActivity > thirtyMinutes) {
      const url = new URL('/auth/signin', req.url)
      const res = NextResponse.redirect(url)
      res.cookies.delete('next-auth.session-token')
      res.cookies.delete('__Secure-next-auth.session-token')
      return res
    }

    // Apply security headers to all responses
    const response = NextResponse.next()
    return applySecurityHeaders(response)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard',
    '/upload',
    '/records',
    '/account',
    '/api/upload',
    '/api/analytics',
    '/api/records',
    '/api/items/:path*',
    '/api/categories',
    '/api/months'
  ]
}
