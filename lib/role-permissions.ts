import { UserRole } from '@/types/auth'

/**
 * Role-based access control utilities
 */

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  MEMBER: 'member' as UserRole,
  VIEWER: 'viewer' as UserRole,
} as const

/**
 * Check if a user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
  return role === ROLES.ADMIN
}

/**
 * Check if a user has member privileges or higher
 */
export function isMemberOrHigher(role: UserRole): boolean {
  return role === ROLES.ADMIN || role === ROLES.MEMBER
}

/**
 * Check if a user has viewer privileges or higher (essentially any authenticated user)
 */
export function isViewerOrHigher(role: UserRole): boolean {
  return role === ROLES.ADMIN || role === ROLES.MEMBER || role === ROLES.VIEWER
}

/**
 * Check if a user can invite family members
 * Only admins can invite family members
 */
export function canInviteMembers(role: UserRole): boolean {
  return isAdmin(role)
}

/**
 * Check if a user can manage account settings
 * Only admins can manage account settings
 */
export function canManageAccountSettings(role: UserRole): boolean {
  return isAdmin(role)
}

/**
 * Check if a user can manage members (add/remove/change roles)
 * Only admins can manage members
 */
export function canManageMembers(role: UserRole): boolean {
  return isAdmin(role)
}

/**
 * Check if a user can view account information
 * All authenticated users can view account information
 */
export function canViewAccount(role: UserRole): boolean {
  return isViewerOrHigher(role)
}

/**
 * Check if a user can create/edit receipts
 * Members and admins can create/edit receipts
 */
export function canCreateReceipts(role: UserRole): boolean {
  return isMemberOrHigher(role)
}

/**
 * Check if a user can view receipts
 * All authenticated users can view receipts
 */
export function canViewReceipts(role: UserRole): boolean {
  return isViewerOrHigher(role)
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'Administrator'
    case ROLES.MEMBER:
      return 'Member'
    case ROLES.VIEWER:
      return 'Viewer'
    default:
      return 'Unknown'
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'Full access to account management, member invitations, and settings'
    case ROLES.MEMBER:
      return 'Can create and manage receipts, view account information'
    case ROLES.VIEWER:
      return 'Can view receipts and account information only'
    default:
      return 'Unknown role'
  }
}

/**
 * Get role permissions list
 */
export function getRolePermissions(role: UserRole): string[] {
  switch (role) {
    case ROLES.ADMIN:
      return [
        'Manage account settings',
        'Invite family members',
        'Remove family members',
        'Change member roles',
        'Create and edit receipts',
        'View all receipts',
        'View account information'
      ]
    case ROLES.MEMBER:
      return [
        'Create and edit receipts',
        'View all receipts',
        'View account information'
      ]
    case ROLES.VIEWER:
      return [
        'View receipts',
        'View account information'
      ]
    default:
      return []
  }
}








