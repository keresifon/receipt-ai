import { NextResponse } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'

export default async function middleware(req: any) {
  // For API routes, allow through and let the API routes handle authentication
  if (req.nextUrl.pathname.startsWith('/api/')) {
    console.log('🔓 Allowing API request through:', req.nextUrl.pathname)
    const response = NextResponse.next()
    return applySecurityHeaders(response)
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
    '/api/analytics',
    '/api/records',
    '/api/items/:path*',
    '/api/categories',
    '/api/months'
  ]
}
