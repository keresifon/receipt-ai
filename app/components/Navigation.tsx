'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    try {
      // Get the current origin or use a fallback
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      const callbackUrl = currentOrigin || '/'
      
      console.log('Signing out with callback URL:', callbackUrl)
      
      await signOut({ callbackUrl })
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: redirect to home page
      window.location.href = '/'
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <a className="navbar-brand fw-bold text-white" href="/">
          No-wahala.net
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto">
            {status === 'loading' ? (
              <div className="nav-link">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : session ? (
              <>
                <Link href="/dashboard" className="nav-link text-light fw-semibold">
                  <i className="bi bi-graph-up me-1"></i>
                  Dashboard
                </Link>
                <Link href="/upload" className="nav-link text-light fw-semibold">
                  <i className="bi bi-upload me-1"></i>
                  Upload
                </Link>
                <Link href="/records" className="nav-link text-light fw-semibold">
                  <i className="bi bi-list-ul me-1"></i>
                  Records
                </Link>
                <Link href="/account" className="nav-link text-light fw-semibold">
                  <i className="bi bi-person-circle me-1"></i>
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn btn-outline-light btn-sm ms-2"
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="btn btn-outline-light btn-sm me-2">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn btn-primary btn-sm">
                  <i className="bi bi-person-plus me-1"></i>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
