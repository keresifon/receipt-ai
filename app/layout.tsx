import '../styles/globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { NextAuthProvider } from './providers/NextAuthProvider'
import { AuthProvider } from './providers/AuthProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body>
        <NextAuthProvider>
          <AuthProvider>
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
                    {session ? (
                      <>
                        <Link href="/" className="nav-link">
                          <i className="bi bi-upload me-1 d-none d-sm-inline"></i>
                          Upload
                        </Link>
                        <Link href="/dashboard" className="nav-link">
                          <i className="bi bi-graph-up me-1 d-none d-sm-inline"></i>
                          Dashboard
                        </Link>
                        <Link href="/records" className="nav-link">
                          <i className="bi bi-list-ul me-1 d-none d-sm-inline"></i>
                          Records
                        </Link>
                        <Link href="/migrate" className="nav-link">
                          <i className="bi bi-arrow-clockwise me-1 d-none d-sm-inline"></i>
                          Migrate Data
                        </Link>
                        <Link href="/account" className="nav-link">
                          <i className="bi bi-person-circle me-1 d-none d-sm-inline"></i>
                          Account
                        </Link>
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
            {children}
          </AuthProvider>
        </NextAuthProvider>
        
        {/* Bootstrap JavaScript for mobile navigation */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" 
          integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" 
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
