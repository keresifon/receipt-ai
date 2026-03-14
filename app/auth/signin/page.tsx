'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const router = useRouter()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setForgotPasswordMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordMessage(data.message)
        setForgotPasswordEmail('')
        // Hide forgot password form after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotPasswordMessage('')
        }, 3000)
      } else {
        setForgotPasswordMessage(data.detail || 'Failed to send reset email')
      }
    } catch (error) {
      setForgotPasswordMessage('Failed to send reset email. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // If 2FA input is already shown and we have a token, verify it
      if (showTwoFactorInput && twoFactorToken) {
        // Complete 2FA verification and login
        try {
          // First verify 2FA token
          const verifyResponse = await fetch('/api/auth/2fa/verify-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              token: twoFactorToken,
              email: email
            }),
          })
          
          if (verifyResponse.ok) {
            // 2FA verified, now complete login with special flag
            const result = await signIn('credentials', {
              email: email,
              password: password,
              twoFactorToken: twoFactorToken, // Pass the verified token
              redirect: false,
            })

            if (result?.error) {
              setError('Login failed after 2FA verification')
            } else {
              // Complete login successful
              router.push('/dashboard')
            }
          } else {
            const errorData = await verifyResponse.json()
            setError(errorData.error || '2FA verification failed')
          }
        } catch (error) {
          setError('2FA verification failed')
        }
        setLoading(false)
        return
      }

      // If 2FA input is not shown yet, check if user has 2FA enabled
      try {
        const check2FA = await fetch('/api/auth/check-2fa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })
        
        if (check2FA.ok) {
          const responseData = await check2FA.json()
          const { requires2FA } = responseData
          
          if (requires2FA) {
            // User has 2FA enabled, show 2FA input
            setShowTwoFactorInput(true)
            setLoading(false)
            return
          } else {
            // No 2FA required, proceed with normal signin
            const result = await signIn('credentials', {
              email,
              password,
              redirect: false,
            })

            if (result?.error) {
              setError('Invalid email or password')
            } else {
              // Normal signin successful
              router.push('/dashboard')
            }
          }
        } else {
          setError('Failed to check 2FA status. Please try again.')
        }
      } catch (fetchError) {
        setError('Failed to check 2FA status. Please try again.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold mb-3">Welcome Back</h1>
            <p className="text-muted">Sign in to your Receipt AI account</p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </div>

                <div className="mb-4 text-end">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </button>
                </div>

                {showTwoFactorInput && (
                  <div className="mb-4">
                    <label htmlFor="twoFactorToken" className="form-label">
                      Two-Factor Authentication Code
                    </label>
                    <input
                      type="text"
                      id="twoFactorToken"
                      className="form-control"
                      value={twoFactorToken}
                      onChange={(e) => setTwoFactorToken(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                    <div className="form-text">
                      Enter the 6-digit code from your authenticator app
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {showTwoFactorInput ? 'Verifying...' : 'Signing In...'}
                    </>
                  ) : (
                    showTwoFactorInput ? 'Verify & Sign In' : 'Sign In'
                  )}
                </button>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-decoration-none">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Forgot Password Form */}
          {showForgotPassword && (
            <div className="card mt-3">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Reset Password</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotPasswordMessage('')
                      setForgotPasswordEmail('')
                    }}
                  ></button>
                </div>
                
                <form onSubmit={handleForgotPassword}>
                  {forgotPasswordMessage && (
                    <div className={`alert ${forgotPasswordMessage.includes('sent') ? 'alert-success' : 'alert-danger'}`} role="alert">
                      <i className={`bi ${forgotPasswordMessage.includes('sent') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                      {forgotPasswordMessage}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="forgotPasswordEmail" className="form-label">Email Address</label>
                    <input
                      type="email"
                      id="forgotPasswordEmail"
                      className="form-control"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      placeholder="Enter your email address"
                    />
                    <div className="form-text">
                      We'll send you a link to reset your password
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={forgotPasswordLoading}
                    >
                      {forgotPasswordLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordMessage('')
                        setForgotPasswordEmail('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      

    </div>
  )
}
