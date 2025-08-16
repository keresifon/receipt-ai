'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MigratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const runMigration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Migration failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold">Data Migration</h1>
            <p className="text-muted">
              Update your existing records to work with the new authentication system
            </p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>What this does:</strong> This will update all your existing receipts and line items 
                to be associated with your new account, making them visible in the dashboard and records pages.
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {result && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  <strong>Migration completed successfully!</strong>
                  <br />
                  <small>
                    Updated {result.lineItemsUpdated} line items and {result.receiptsUpdated} receipts.
                    <br />
                    Account ID: {result.accountId}
                  </small>
                </div>
              )}

              <div className="d-grid gap-3">
                <button
                  onClick={runMigration}
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Running Migration...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Run Migration
                    </>
                  )}
                </button>

                {result && (
                  <button
                    onClick={() => router.push('/')}
                    className="btn btn-success"
                  >
                    <i className="bi bi-arrow-right me-2"></i>
                    Go to Dashboard
                  </button>
                )}

                <button
                  onClick={() => router.push('/auth/signin')}
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Sign In
                </button>
              </div>

              <div className="mt-4">
                <h6>Migration Details:</h6>
                <ul className="small text-muted">
                  <li>Updates all existing line items with your account ID</li>
                  <li>Updates all existing receipts with your account ID</li>
                  <li>Creates your account member record</li>
                  <li>Makes existing data visible in the new system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
