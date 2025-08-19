'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignUpForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountName: '',
    accountDescription: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isInvitation, setIsInvitation] = useState(false)
  const [invitationData, setInvitationData] = useState<{
    invite: string
    email: string
    account: string
  } | null>(null)
  const [accountInfo, setAccountInfo] = useState<{
    name: string
    description: string
  } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const invite = searchParams.get('invite')
    const email = searchParams.get('email')
    const account = searchParams.get('account')
    
    if (invite && email && account) {
      setIsInvitation(true)
      setInvitationData({ invite, email, account })
      setFormData(prev => ({ ...prev, email }))
      
      // Fetch account information
      fetchAccountInfo(account)
    }
  }, [searchParams])

  const fetchAccountInfo = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`)
      if (response.ok) {
        const data = await response.json()
        setAccountInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch account info:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        ...(isInvitation ? {} : {
          accountName: formData.accountName,
          accountDescription: formData.accountDescription
        }),
        ...(isInvitation ? {
          invite: invitationData?.invite,
          accountId: invitationData?.account
        } : {})
      }
      
      console.log('Signup request body:', requestBody)
      console.log('Is invitation:', isInvitation)
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Sign up failed')
      }

      // Redirect to sign in page with appropriate message
      if (isInvitation) {
        router.push('/auth/signin?message=Account joined successfully! Please sign in.')
      } else {
        router.push('/auth/signin?message=Account created successfully! Please sign in.')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold mb-3">
              {isInvitation ? 'Join Family Account' : 'Create Your Account'}
            </h1>
            <p className="text-muted">
              {isInvitation 
                ? `You've been invited to join ${accountInfo?.name || 'a family account'}`
                : 'Join Receipt AI and start managing your family\'s expenses'
              }
            </p>
            
            {isInvitation && accountInfo && (
              <div className="alert alert-info d-inline-block">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Account:</strong> {accountInfo.name}
                {accountInfo.description && (
                  <span className="ms-2">- {accountInfo.description}</span>
                )}
              </div>
            )}
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

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      placeholder="Create a password (min 8 characters)"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                    />
                  </div>

                  {!isInvitation && (
                    <>
                      <div className="col-12">
                        <hr className="my-3" />
                        <h6 className="text-muted mb-3">Family Account Details</h6>
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="accountName" className="form-label">Account Name</label>
                        <input
                          type="text"
                          id="accountName"
                          name="accountName"
                          className="form-control"
                          value={formData.accountName}
                          onChange={handleChange}
                          required
                          placeholder="e.g., XYZ Family"
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="accountDescription" className="form-label">Description (Optional)</label>
                        <input
                          type="text"
                          id="accountDescription"
                          name="accountDescription"
                          className="form-control"
                          value={formData.accountDescription}
                          onChange={handleChange}
                          placeholder="Brief description of your account"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isInvitation ? 'Joining Account...' : 'Creating Account...'}
                      </>
                    ) : (
                      isInvitation ? 'Join Account' : 'Create Account'
                    )}
                  </button>

                  <div className="text-center">
                    <small className="text-muted">
                      Already have an account?{' '}
                      <Link href="/auth/signin" className="text-decoration-none">
                        Sign in here
                      </Link>
                    </small>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading signup form...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
