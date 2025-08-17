'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [status, session, router])
  
  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }
  
  // Don't render for authenticated users (they'll be redirected)
  if (status === 'authenticated') {
    return null
  }
  
  // Show friendly home page for unauthenticated users
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Hero Section */}
      <section className="bg-dark text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Smart Family Receipt Management
              </h1>
              <p className="lead mb-4">
                Organize your family's expenses with AI-powered receipt scanning, 
                collaborative tracking, and insightful analytics.
              </p>
              <div className="d-flex gap-3">
                <Link href="/auth/signup" className="btn btn-light btn-lg px-4">
                  Get Started Free
                </Link>
                <Link href="/auth/signin" className="btn btn-outline-light btn-lg px-4">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="hero-image-container">
                <img
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Smart receipt management with AI"
                  className="img-fluid rounded-3 shadow-lg"
                  style={{
                    maxHeight: '400px',
                    width: 'auto',
                    filter: 'brightness(0.9) contrast(1.1) saturate(0.8)',
                    border: '2px solid rgba(255,255,255,0.1)'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">How It Works</h2>
            <p className="lead text-secondary">
              Simple steps to transform your receipt management
            </p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4 text-center">
              <div className="feature-image-container mb-3">
                <img
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  alt="Upload receipts with camera"
                  className="img-fluid rounded-3 shadow-sm"
                  style={{
                    height: '200px',
                    width: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                    border: '2px solid rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  }}
                />
              </div>
              <h4 className="text-dark">1. Upload Receipts</h4>
              <p className="text-secondary">
                Take photos or upload receipt images. Our AI extracts all the details automatically.
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="feature-image-container mb-3">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  alt="Review and edit data"
                  className="img-fluid rounded-3 shadow-sm"
                  style={{
                    height: '200px',
                    width: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                    border: '2px solid rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  }}
                />
              </div>
              <h4 className="text-secondary">2. Review & Edit</h4>
              <p className="text-secondary">
                Review AI-extracted information and make any necessary corrections or additions.
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="feature-image-container mb-3">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  alt="Analytics and insights"
                  className="img-fluid rounded-3 shadow-sm"
                  style={{
                    height: '200px',
                    width: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                    border: '2px solid rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  }}
                />
              </div>
              <h4 className="text-primary">3. Track & Analyze</h4>
              <p className="text-secondary">
                Get insights into your spending patterns with detailed analytics and reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Get Started?</h2>
          <p className="lead mb-4">
            Join thousands of families who are already using No-wahala.net to manage their finances smarter.
          </p>
          <Link href="/auth/signup" className="btn btn-light btn-lg px-5">
            Start Managing Receipts Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container text-center">
          <p className="mb-0">
            © 2025 No-wahala.net. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
