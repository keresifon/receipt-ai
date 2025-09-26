'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('No verification token provided')
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        if (response.status === 400 && data.detail?.includes('expired')) {
          setStatus('expired')
          setMessage('This verification link has expired. Please request a new one.')
        } else {
          setStatus('error')
          setMessage(data.detail || 'Verification failed')
        }
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  const resendVerification = async () => {
    setIsResending(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('A new verification email has been sent!')
        setStatus('success')
      } else {
        setMessage(data.detail || 'Failed to resend verification email')
        setStatus('error')
      }
    } catch (error) {
      setMessage('An error occurred while resending verification email')
      setStatus('error')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-2">
                Email Verification
              </h2>
            </div>

            <div className="card shadow-sm">
              <div className="card-body p-4 text-center">
                {status === 'loading' && (
                  <div>
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">Verifying your email...</p>
                  </div>
                )}

                {status === 'success' && (
                  <div>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success mb-3" style={{width: '48px', height: '48px'}}>
                      <i className="bi bi-check-lg text-white"></i>
                    </div>
                    <p className="text-success fw-medium mb-2">{message}</p>
                    <p className="small text-muted">
                      Redirecting to dashboard...
                    </p>
                  </div>
                )}

                {status === 'error' && (
                  <div>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger mb-3" style={{width: '48px', height: '48px'}}>
                      <i className="bi bi-x-lg text-white"></i>
                    </div>
                    <p className="text-danger fw-medium mb-3">{message}</p>
                    <Link
                      href="/auth/signin"
                      className="btn btn-outline-primary"
                    >
                      Return to Sign In
                    </Link>
                  </div>
                )}

                {status === 'expired' && (
                  <div>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning mb-3" style={{width: '48px', height: '48px'}}>
                      <i className="bi bi-exclamation-triangle-fill text-white"></i>
                    </div>
                    <p className="text-warning fw-medium mb-3">{message}</p>
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
                        Return to Sign In
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
