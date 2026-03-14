'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface VerificationStatus {
  emailVerified: boolean
  hasVerificationToken: boolean
  verificationExpires?: string
  createdAt: string
}

export default function EmailVerificationBanner() {
  const { data: session, status } = useSession()
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    console.log('Auth status changed:', status)
    console.log('Session:', session)
    if (status === 'authenticated' && session?.user) {
      fetchVerificationStatus()
    }
  }, [status, session])

  const fetchVerificationStatus = async () => {
    try {
      console.log('Fetching verification status...')
      const response = await fetch('/api/auth/verification-status')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Verification status data:', data)
        setVerificationStatus(data)
        
        // Show banner only for existing users (not new users who are redirected)
        const verificationRolloutDate = new Date('2025-01-01T00:00:00Z')
        const isNewUser = new Date(data.createdAt) > verificationRolloutDate
        const requiresVerification = isNewUser && !data.emailVerified
        
        // Only show banner for existing users who haven't verified
        if (!data.emailVerified && !requiresVerification) {
          console.log('Email not verified (existing user), showing banner')
          setShowBanner(true)
        } else if (requiresVerification) {
          console.log('New user requires verification, hiding banner (will be redirected)')
        } else {
          console.log('Email is verified, hiding banner')
        }
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error)
    }
  }

  const resendVerification = async () => {
    setIsResending(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Verification email sent! Check your inbox.')
        // Hide banner temporarily
        setShowBanner(false)
        setTimeout(() => setShowBanner(true), 5000) // Show again after 5 seconds
      } else {
        setMessage(data.detail || 'Failed to send verification email')
      }
    } catch (error) {
      setMessage('An error occurred while sending verification email')
    } finally {
      setIsResending(false)
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
    // Don't show again for this session
    sessionStorage.setItem('emailVerificationDismissed', 'true')
  }

  // Don't show if user dismissed it in this session
  useEffect(() => {
    if (sessionStorage.getItem('emailVerificationDismissed') === 'true') {
      setShowBanner(false)
    }
  }, [])

  console.log('Banner render check:', { showBanner, verificationStatus, emailVerified: verificationStatus?.emailVerified })
  
  if (!showBanner || !verificationStatus || verificationStatus.emailVerified) {
    return null
  }

  return (
    <div className="alert alert-warning alert-dismissible fade show" role="alert">
      <div className="d-flex align-items-start">
        <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
        <div className="flex-grow-1">
          <h6 className="alert-heading mb-2">Email Verification Required</h6>
          <p className="mb-2">
            Please verify your email address to ensure you receive important notifications and to secure your account.
          </p>
          {message && (
            <div className="alert alert-info py-2 mb-3">
              <small>{message}</small>
            </div>
          )}
          <div className="d-flex gap-2">
            <button
              onClick={resendVerification}
              disabled={isResending}
              className="btn btn-outline-warning btn-sm"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={dismissBanner}
              className="btn btn-outline-secondary btn-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
