'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmail = async () => {
    if (!email) return
    
    setTesting(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        alert('Test email sent! Check your inbox and spam folder.')
      } else {
        alert(`Failed: ${data.detail}`)
      }
    } catch (error) {
      console.error('Test failed:', error)
      alert('Test failed. Check console for details.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4>🧪 Test Email Delivery</h4>
            </div>
            <div className="card-body">
              <p>This page tests if Resend email delivery is working.</p>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                />
              </div>
              
              <button 
                className="btn btn-primary"
                onClick={testEmail}
                disabled={!email || testing}
              >
                {testing ? 'Sending...' : 'Send Test Email'}
              </button>
              
              {result && (
                <div className="mt-3">
                  <h6>Result:</h6>
                  <pre className="bg-light p-2 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
