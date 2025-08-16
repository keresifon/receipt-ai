'use client'
import { useMemo, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const STORES = ['Walmart','Costco','No Frills','Loblaws','Sobeys','Metro','Dollarama','Shoppers Drug Mart','Starbucks','Tim Hortons','Amazon','Other (custom)']

type LineItem = {
  description: string
  category: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number
}

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
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Don't render upload form for authenticated users (they'll be redirected)
  if (status === 'authenticated') {
    return null
  }
  
  // Show upload form for unauthenticated users
  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="h2 fw-bold">Receipt AI</h1>
        <p className="text-muted">Upload your receipts to get started</p>
        <div className="alert alert-info d-inline-block">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Note:</strong> This page is for demo purposes. Please <a href="/auth/signin" className="alert-link">sign in</a> to access your dashboard.
        </div>
      </div>
      
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-body p-4">
              <div className="text-center">
                <i className="bi bi-upload display-1 text-muted"></i>
                <h4 className="mt-3">Demo Upload Form</h4>
                <p className="text-muted">
                  This is a demonstration of the receipt upload functionality. 
                  To access the full application with your data, please sign in.
                </p>
                <a href="/auth/signin" className="btn btn-primary btn-lg">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In to Continue
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
