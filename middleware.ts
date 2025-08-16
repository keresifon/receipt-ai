import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/records',
    '/account',
    '/migrate',
    '/api/upload',
    '/api/analytics',
    '/api/records',
    '/api/items/:path*',
    '/api/categories',
    '/api/months',
    '/api/migrate',
    '/api/debug',
    '/api/debug-db'
  ]
}
