'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, Account, AuthContextType } from '@/types/auth'
import clientPromise from '@/lib/mongodb'

const AuthContext = createContext<AuthContextType>({
  user: null,
  account: null,
  isLoading: true,
  signOut: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [account, setAccount] = useState<Account | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user && 'accountId' in session.user) {
      loadAccount(session.user.accountId as string)
    } else {
      setAccount(null)
      setIsLoading(false)
    }
  }, [session, status])

  const loadAccount = async (accountId: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}`)
      if (res.ok) {
        const accountData = await res.json()
        setAccount(accountData)
      }
    } catch (error) {
      console.error('Failed to load account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const value: AuthContextType = {
    user: session?.user && 'accountId' in session.user ? session.user as User : null,
    account,
    isLoading: status === 'loading' || isLoading,
    signOut: handleSignOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
