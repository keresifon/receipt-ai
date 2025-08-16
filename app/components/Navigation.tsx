'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const { data: session, status } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand">
          Receipt AI
        </Link>
        
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
                <Link href="/dashboard" className="nav-link">
                  <i className="bi bi-graph-up me-1 d-none d-sm-inline"></i>
                  Dashboard
                </Link>
                <Link href="/upload" className="nav-link">
                  <i className="bi bi-upload me-1 d-none d-sm-inline"></i>
                  Upload
                </Link>
                <Link href="/records" className="nav-link">
                  <i className="bi bi-list-ul me-1 d-none d-sm-inline"></i>
                  Records
                </Link>
                <Link href="/account" className="nav-link">
                  <i className="bi bi-person-circle me-1 d-none d-sm-inline"></i>
                  Account
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="nav-link btn btn-link p-0 border-0"
                  style={{ background: 'none', textDecoration: 'none' }}
                >
                  <i className="bi bi-box-arrow-right me-1 d-none d-sm-inline"></i>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="nav-link">
                  <i className="bi bi-box-arrow-in-right me-1 d-none d-sm-inline"></i>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="nav-link">
                  <i className="bi bi-person-plus me-1 d-none d-sm-inline"></i>
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
