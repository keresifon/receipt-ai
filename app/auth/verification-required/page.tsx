'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerificationRequiredPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUserEmail(session.user.email || '')
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session, router])

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
      } else {
        setMessage(data.detail || 'Failed to send verification email')
      }
    } catch (error) {
      setMessage('An error occurred while sending verification email')
    } finally {
      setIsResending(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning mb-3" style={{width: '48px', height: '48px'}}>
                <i className="bi bi-exclamation-triangle-fill text-white"></i>
              </div>
              <h2 className="h3 fw-bold text-dark mb-2">
                Email Verification Required
              </h2>
              <p className="text-muted mb-4">
                Please verify your email address to continue using No-wahala.net
              </p>
            </div>

            <div className="card shadow-sm">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <p className="text-muted mb-3">
                    We've sent a verification email to:
                  </p>
                  <p className="fw-medium text-dark">{userEmail}</p>
                </div>

                <div className="alert alert-info mb-4">
                  <h6 className="alert-heading mb-2">Next Steps:</h6>
                  <ol className="mb-0 small">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return to the app to continue</li>
                  </ol>
                </div>

                {message && (
                  <div className={`alert ${message.includes('sent') ? 'alert-success' : 'alert-danger'} mb-4`}>
                    {message}
                  </div>
                )}

                <div className="d-grid gap-2">
                  <button
                    onClick={resendVerification}
                    disabled={isResending}
                    className="btn btn-primary"
                  >
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>

                  <Link
                    href="/auth/signin"
                    className="btn btn-outline-secondary"
                  >
                    Sign Out
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="small text-muted">
                Having trouble? Check your spam folder or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
