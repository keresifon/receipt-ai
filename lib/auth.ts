import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable must be set')
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorToken: { label: '2FA Token', type: 'text', optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const client = await clientPromise
          const db = client.db(process.env.MONGODB_DB || 'expenses')
          const users = db.collection('users')
          
          const user = await users.findOne({ email: credentials.email.toLowerCase() })
          
          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            return null
          }

          // Check if user has 2FA enabled
          const twoFactorAuth = db.collection('two_factor_auth')
          const twoFactorData = await twoFactorAuth.findOne({ 
            userId: user._id,
            enabled: true 
          })

          // If 2FA is enabled but no token provided, return user with 2FA flag
          if (twoFactorData && !credentials.twoFactorToken) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              accountId: user.accountId.toString(),
              role: user.role,
              requires2FA: true,
              twoFactorSecret: twoFactorData.secret,
              emailVerified: user.emailVerified || false,
              createdAt: user.createdAt
            }
          }

          // If 2FA token is provided, it means 2FA was already verified
          // Return user with 2FA verified flag
          if (credentials.twoFactorToken) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              accountId: user.accountId.toString(),
              role: user.role,
              requires2FA: false,
              twoFactorVerified: true,
              emailVerified: user.emailVerified || false,
              createdAt: user.createdAt
            }
          }

          // If no 2FA, return user normally
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            accountId: user.accountId.toString(),
            role: user.role,
            requires2FA: false,
            emailVerified: user.emailVerified || false,
            createdAt: user.createdAt
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 2 * 60 * 60, // 2 hours
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    verifyRequest: '/auth/2fa',
    error: '/auth/signin', // Redirect errors back to signin
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: any) {
      // If user requires 2FA and no token provided, redirect to 2FA page
      if (user?.requires2FA && !user?.twoFactorVerified) {
        return '/auth/2fa'
      }
      return true
    },
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.accountId = user.accountId
        token.role = user.role
        token.lastActivity = Date.now()
        token.requires2FA = user.requires2FA
        token.twoFactorSecret = user.twoFactorSecret
        token.twoFactorVerified = false // Start as unverified
        token.emailVerified = user.emailVerified
        token.createdAt = user.createdAt
      }
      // Refresh/rotate every 15 minutes
      const fifteenMinutes = 15 * 60 * 1000
      if (!token.iat || (Date.now() - (token.lastRotatedAt || 0)) > fifteenMinutes) {
        token.lastRotatedAt = Date.now()
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub
        session.user.accountId = token.accountId
        session.user.role = token.role
        session.user.lastActivity = token.lastActivity
        session.user.requires2FA = token.requires2FA
        session.user.twoFactorVerified = token.twoFactorVerified
        session.user.emailVerified = token.emailVerified
      }
      return session
    },
    async redirect({ url, baseUrl }: any) {
      // Get the proper base URL from environment or fallback to request origin
      const siteUrl = process.env.NEXTAUTH_URL || process.env.SITE_URL || baseUrl
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${siteUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === siteUrl) return url
      return siteUrl
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
