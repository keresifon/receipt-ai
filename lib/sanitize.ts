/**
 * Utility functions for sanitizing user inputs
 */

/**
 * Escapes regex special characters to prevent regex injection
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sanitizes search queries for MongoDB regex operations
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''
  
  // Remove any potential regex patterns
  const sanitized = query
    .replace(/[.*+?^${}()|[\]\\]/g, '') // Remove regex special chars
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
  
  return sanitized
}

/**
 * Sanitizes date strings to ensure they're in YYYY-MM-DD format
 */
export function sanitizeDate(date: string): string | null {
  if (!date || typeof date !== 'string') return null
  
  // Check if date matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return null
  
  // Validate the date
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return null
  
  return date
}

/**
 * Sanitizes numeric inputs
 */
export function sanitizeNumber(input: any): number | null {
  if (input === null || input === undefined) return null
  
  const num = Number(input)
  if (isNaN(num)) return null
  
  return num
}

/**
 * Sanitizes email addresses
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return null
  
  return email.toLowerCase().trim()
}

/**
 * Sanitizes object IDs for MongoDB
 */
export function sanitizeObjectId(id: string): string | null {
  if (!id || typeof id !== 'string') return null
  
  // Check if it's a valid MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  if (!objectIdRegex.test(id)) return null
  
  return id
}

