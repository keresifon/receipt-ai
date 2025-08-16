import { DefaultSession } from 'next-auth'

export interface User {
  id: string
  email: string
  name: string
  accountId: string
  role: UserRole
}

export interface Account {
  _id: string
  name: string
  description?: string
  createdAt: Date
  createdBy: string
  settings: AccountSettings
}

export interface AccountSettings {
  currency: string
  timezone: string
  allowInvites: boolean
  maxUsers: number
}

export interface AccountMember {
  _id: string
  accountId: string
  userId: string
  role: UserRole
  invitedBy: string
  invitedAt: Date
  joinedAt?: Date
  status: 'pending' | 'active' | 'suspended'
}

export interface AccountInvite {
  _id: string
  accountId: string
  email: string
  role: UserRole
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'expired'
}

export type UserRole = 'admin' | 'member' | 'viewer'

export interface Session extends DefaultSession {
  user: User & DefaultSession['user']
}

export interface AuthContextType {
  user: User | null
  account: Account | null
  isLoading: boolean
  signOut: () => void
}
