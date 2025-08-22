'use client'

import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'

export function useTimezone() {
  const { account } = useAuth()
  
  const timezone = account?.settings?.timezone || 'America/Toronto'
  
  const formatDateInTimezone = useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      timeZone: timezone,
      ...options
    })
  }, [timezone])
  
  const getTodayInTimezone = useCallback(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { timeZone: timezone })
  }, [timezone])
  
  const getYesterdayInTimezone = useCallback(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toLocaleDateString('en-US', { timeZone: timezone })
  }, [timezone])
  
  return {
    timezone,
    formatDateInTimezone,
    getTodayInTimezone,
    getYesterdayInTimezone
  }
}

