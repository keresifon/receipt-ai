import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
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

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            accountId: user.accountId.toString(),
            role: user.role
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accountId = user.accountId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub
        session.user.accountId = token.accountId
        session.user.role = token.role
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
