'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function TwoFactorAuthForm() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Get the callback URL and email from search params
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const emailParam = searchParams.get('email') || ''

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

  useEffect(() => {
    console.log('2FA Page - Auth Status:', status)
    console.log('2FA Page - Session:', session)
    console.log('2FA Page - Email Param:', emailParam)
    
    // If user is already authenticated and 2FA verified, redirect
    if (status === 'authenticated' && (session?.user as any)?.twoFactorVerified) {
      console.log('User fully authenticated, redirecting to:', callbackUrl)
      router.push(callbackUrl)
      return
    }

    // If user is not authenticated, check if we have email parameter
    // (which means they came from signin and need to complete 2FA)
    if (status === 'unauthenticated') {
      if (emailParam) {
        // User is in 2FA flow, don't redirect back to signin
        console.log('User in 2FA flow, staying on 2FA page')
        return
      } else {
        // User came here without email, redirect to signin
        console.log('User not authenticated and no email, redirecting to signin')
        router.push('/auth/signin')
        return
      }
    }

    // Countdown timer for TOTP codes
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status, session, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify 2FA token directly
      const response = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          email: emailParam // Pass email for verification
        }),
      })

      if (response.ok) {
        // 2FA verification successful, complete login
        const result = await signIn('credentials', {
          email: emailParam,
          password: '', // We'll handle this differently
          redirect: false,
        })

        if (result?.error) {
          setError('Login failed after 2FA verification')
        } else {
          // Login successful, redirect to dashboard
          router.push(callbackUrl)
        }
      } else {
        const data = await response.json()
        setError(data.error || '2FA verification failed')
      }
    } catch (error) {
      setError('An error occurred during verification')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="h4 mb-3">Two-Factor Authentication</h2>
                  <p className="text-muted">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                         style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-shield-lock fs-5"></i>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {!showPasswordInput ? (
                    <>
                      <div className="mb-3">
                        <label htmlFor="token" className="form-label">
                          Authentication Code
                        </label>
                        <input
                          type="text"
                          className={`form-control form-control-lg text-center ${error ? 'is-invalid' : ''}`}
                          id="token"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          pattern="[0-9]{6}"
                          required
                          autoFocus
                        />
                        {error && <div className="invalid-feedback">{error}</div>}
                      </div>

                      <div className="text-center mb-3">
                        <small className="text-muted">
                          Code expires in: <span className="text-primary fw-bold">{timeLeft}s</span>
                        </small>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={loading || token.length !== 6}
                      >
                        Continue
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>
                        <input
                          type="password"
                          className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          autoFocus
                        />
                        {error && <div className="invalid-feedback">{error}</div>}
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={loading || !password}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Verifying...
                          </>
                        ) : (
                          'Verify & Sign In'
                        )}
                      </button>
                    </>
                  )}
                </form>

                <div className="text-center mt-4">
                  <small className="text-muted">
                    Having trouble? <a href="/auth/signin" className="text-decoration-none">Try signing in again</a>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TwoFactorAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <TwoFactorAuthForm />
    </Suspense>
  )
}
