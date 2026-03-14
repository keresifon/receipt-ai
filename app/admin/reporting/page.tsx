'use client'

import { useEffect, useState } from 'react'

interface ReportingData {
  summary: {
    totalAccounts: number
    totalUsers: number
    totalMembers: number
    verifiedUsers: number
    unverifiedUsers: number
    accountsByRole: {
      admin: number
      member: number
      viewer: number
    }
    suspiciousUsers?: number
    totalReceipts?: number
    totalLineItems?: number
    recentReceipts?: number
  }
  accounts: Array<{
    id: string
    name: string
    description: string
    createdAt: string
    createdBy: string
    creator: { id: string; email: string; name: string } | null
    settings: any
    members: Array<{
      id: string
      userId: string
      email: string
      name: string
      role: string
      status: string
      joinedAt: string
    }>
    memberCount: number
    stats?: {
      receipts: number
      lineItems: number
      recentReceipts: number
      memberCount: number
    }
  }>
  users: Array<{
    id: string
    email: string
    name: string
    accountId: string
    accountName: string
    role: string
    emailVerified: boolean
    requiresVerification?: boolean
    emailVerificationToken?: string | null
    emailVerificationExpires?: string
    emailVerificationSentAt?: string
    createdAt: string
    updatedAt?: string
    status: string
    joinedAt: string
    invitedBy?: string
    stats?: {
      receipts: number
      lineItems: number
    }
    isSuspicious?: boolean
    suspiciousReasons?: string[]
  }>
  generatedAt: string
}

export default function AdminReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeStats, setIncludeStats] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'accounts' | 'users'>('summary')
  const [deletingSuspicious, setDeletingSuspicious] = useState(false)
  const [deleteResult, setDeleteResult] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [includeStats])

  // Force refresh on mount to avoid cache issues
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = includeStats 
        ? `/api/admin/reporting?stats=true&t=${Date.now()}` 
        : `/api/admin/reporting?t=${Date.now()}`
      
      console.log('Fetching reporting data from:', url)
      const res = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      console.log('Response status:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Error response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${res.status}: ${res.statusText}` }
        }
        throw new Error(errorData.error || 'Failed to load reporting data')
      }
      
      const json = await res.json()
      console.log('Received data:', json)
      console.log('Users count:', json.users?.length)
      console.log('Accounts count:', json.accounts?.length)
      
      if (!json.users || !json.accounts) {
        throw new Error('Invalid data format received from API')
      }
      
      setData(json)
    } catch (e: any) {
      console.error('Error loading data:', e)
      setError(e.message || 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteSuspiciousAccounts = async (dryRun: boolean = true) => {
    try {
      setDeletingSuspicious(true)
      setDeleteResult(null)
      
      const res = await fetch('/api/admin/delete-suspicious-accounts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({dryRun})
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete suspicious accounts')
      }
      
      setDeleteResult(result)
      
      if (!dryRun && result.success) {
        // Reload data after deletion
        await loadData()
        alert(`Successfully deleted ${result.deleted.users} suspicious user accounts and ${result.deleted.accounts} orphaned accounts.`)
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setDeletingSuspicious(false)
    }
  }

  if (loading) {
    return (
      <div className="container my-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading reporting data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Report</h4>
          <p><strong>Error:</strong> {error}</p>
          <p className="mb-0">Please check the browser console for more details.</p>
          <hr />
          <button className="btn btn-primary" onClick={loadData}>
            <i className="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container my-5">
        <div className="alert alert-info" role="alert">
          <h4 className="alert-heading">No Data Available</h4>
          <p>Data is still loading or could not be retrieved.</p>
          <button className="btn btn-primary" onClick={loadData}>
            <i className="bi bi-arrow-clockwise"></i> Load Data
          </button>
        </div>
      </div>
    )
  }

  // Debug: Log current data state
  console.log('Rendering with data:', {
    hasData: !!data,
    usersCount: data?.users?.length || 0,
    accountsCount: data?.accounts?.length || 0,
    activeTab
  })

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Admin Reporting</h1>
          <p className="text-muted mb-0">
            Generated at: {formatDate(data.generatedAt)}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="includeStats"
              checked={includeStats}
              onChange={(e) => setIncludeStats(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="includeStats">
              Include Statistics
            </label>
          </div>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => {
              window.location.reload()
            }}
          >
            <i className="bi bi-arrow-clockwise"></i> Hard Refresh
          </button>
          <button className="btn btn-primary" onClick={loadData}>
            <i className="bi bi-arrow-clockwise"></i> Refresh Data
          </button>
        </div>
      </div>

      {/* Debug Info - Remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="alert alert-info mb-3">
          <small>
            <strong>Debug:</strong> Users: {data.users?.length || 0}, 
            Accounts: {data.accounts?.length || 0}, 
            Active Tab: {activeTab}
          </small>
        </div>
      )}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small">Total Accounts</h6>
              <h2 className="mb-0">{data.summary?.totalAccounts || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small">Total Users</h6>
              <h2 className="mb-0">{data.summary?.totalUsers || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small">Verified Users</h6>
              <h2 className="mb-0 text-success">{data.summary?.verifiedUsers || 0}</h2>
              <small className="text-muted">
                {data.summary?.unverifiedUsers || 0} unverified
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small">Total Members</h6>
              <h2 className="mb-0">{data.summary?.totalMembers || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {data.summary?.suspiciousUsers !== undefined && data.summary.suspiciousUsers > 0 && (
        <div className="alert alert-warning mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="alert-heading">
                <i className="bi bi-exclamation-triangle-fill"></i> Suspicious Accounts Detected
              </h5>
              <p className="mb-2">
                <strong>{data.summary.suspiciousUsers}</strong> user(s) have been flagged as potentially bot-created accounts.
                These are highlighted in yellow in the Users table.
              </p>
              {deleteResult?.dryRun && (
                <div className="mt-2">
                  <strong>Dry-run preview:</strong>
                  <ul className="mb-0 mt-2">
                    {deleteResult.suspiciousAccounts?.slice(0, 5).map((acc: any, i: number) => (
                      <li key={i}>
                        {acc.name} ({acc.email}) - {acc.reasons.join(', ')}
                      </li>
                    ))}
                    {deleteResult.suspiciousCount > 5 && (
                      <li>... and {deleteResult.suspiciousCount - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              {deleteResult?.success && !deleteResult.dryRun && (
                <div className="mt-2 text-success">
                  <strong>✅ Deletion complete:</strong> {deleteResult.deleted.users} users and {deleteResult.deleted.accounts} accounts deleted.
                </div>
              )}
            </div>
            <div className="ms-3">
              <button
                className="btn btn-sm btn-outline-danger me-2"
                onClick={() => handleDeleteSuspiciousAccounts(true)}
                disabled={deletingSuspicious}
              >
                {deletingSuspicious ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Checking...
                  </>
                ) : (
                  <>
                    <i className="bi bi-eye"></i> Preview
                  </>
                )}
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${data.summary?.suspiciousUsers || 0} suspicious accounts? This cannot be undone!`)) {
                    handleDeleteSuspiciousAccounts(false)
                  }
                }}
                disabled={deletingSuspicious || !deleteResult?.dryRun}
              >
                {deletingSuspicious ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash"></i> Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {includeStats && data.summary.totalReceipts !== undefined && (
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small">Total Receipts</h6>
                <h3 className="mb-0">{data.summary.totalReceipts.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small">Total Line Items</h6>
                <h3 className="mb-0">{data.summary.totalLineItems?.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small">Recent Receipts (30d)</h6>
                <h3 className="mb-0">{data.summary.recentReceipts?.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Breakdown */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Users by Role</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <span className="fw-bold">Admin</span>
                <span className="badge bg-danger">{data.summary.accountsByRole.admin}</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <span className="fw-bold">Member</span>
                <span className="badge bg-primary">{data.summary.accountsByRole.member}</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <span className="fw-bold">Viewer</span>
                <span className="badge bg-secondary">{data.summary.accountsByRole.viewer}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Accounts ({data.accounts?.length || 0})
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({data.users?.length || 0})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3">Quick Summary</h5>
              <div className="alert alert-info">
                <strong>Tip:</strong> Click on the "Accounts" or "Users" tabs above to see detailed information with account names and user details.
              </div>
              <div className="row">
                <div className="col-md-6">
                  <ul className="list-group">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Total Accounts</span>
                      <strong>{data.summary?.totalAccounts || 0}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Total Users</span>
                      <strong>{data.summary?.totalUsers || 0}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Total Memberships</span>
                      <strong>{data.summary?.totalMembers || 0}</strong>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <ul className="list-group">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Verified Users</span>
                      <strong className="text-success">{data.summary?.verifiedUsers || 0}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Unverified Users</span>
                      <strong className="text-warning">{data.summary?.unverifiedUsers || 0}</strong>
                    </li>
                    {includeStats && data.summary?.totalReceipts !== undefined && (
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Total Receipts</span>
                        <strong>{data.summary.totalReceipts.toLocaleString()}</strong>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Quick preview of accounts and users */}
              <div className="row mt-4">
                <div className="col-md-6">
                  <h6>Recent Accounts (first 5)</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Members</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.accounts?.slice(0, 5).map((account) => (
                          <tr key={account.id}>
                            <td><strong>{account.name}</strong></td>
                            <td><span className="badge bg-primary">{account.memberCount}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6>Recent Users (first 5)</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Account</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users?.slice(0, 5).map((user) => (
                          <tr key={user.id}>
                            <td><strong>{user.name}</strong></td>
                            <td><small>{user.accountName}</small></td>
                            <td>
                              <span className={`badge ${
                                user.role === 'admin' ? 'bg-danger' :
                                user.role === 'member' ? 'bg-primary' :
                                'bg-secondary'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">All Accounts ({data.accounts?.length || 0})</h5>
            </div>
            <div className="card-body p-0">
              {!data.accounts || data.accounts.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No accounts found
                </div>
              ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Creator</th>
                      <th>Members</th>
                      <th>Created</th>
                      {includeStats && <th>Receipts</th>}
                      {includeStats && <th>Line Items</th>}
                    </tr>
                  </thead>
                  <tbody>
                      {data.accounts.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <strong>{account.name}</strong>
                        </td>
                        <td>
                          <small className="text-muted">
                            {account.description || '—'}
                          </small>
                        </td>
                        <td>
                          {account.creator ? (
                            <div>
                              <div>{account.creator.name}</div>
                              <small className="text-muted">{account.creator.email}</small>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <span className="badge bg-primary">{account.memberCount}</span>
                        </td>
                        <td>
                          <small>{formatDate(account.createdAt)}</small>
                        </td>
                        {includeStats && (
                          <>
                            <td>
                              {account.stats?.receipts.toLocaleString() || '—'}
                            </td>
                            <td>
                              {account.stats?.lineItems.toLocaleString() || '—'}
                            </td>
                          </>
                        )}
                      </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">All Users ({data.users?.length || 0})</h5>
            </div>
            <div className="card-body p-0">
              {!data.users || data.users.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No users found
                </div>
              ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Account</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Verification</th>
                      <th>Created</th>
                      <th>Joined</th>
                      {includeStats && <th>Receipts</th>}
                      {includeStats && <th>Line Items</th>}
                    </tr>
                  </thead>
                  <tbody>
                      {data.users.map((user) => (
                      <tr key={user.id} className={user.isSuspicious ? 'table-warning' : ''}>
                        <td>
                          <strong>{user.name}</strong>
                          {user.isSuspicious && (
                            <div>
                              <small className="text-danger">
                                <i className="bi bi-exclamation-triangle-fill"></i> Bot/Suspicious
                              </small>
                              {user.suspiciousReasons && user.suspiciousReasons.length > 0 && (
                                <div>
                                  <small className="text-muted">
                                    {user.suspiciousReasons.join(', ')}
                                  </small>
                                </div>
                              )}
                            </div>
                          )}
                          {user.invitedBy && (
                            <div>
                              <small className="text-muted">
                                <i className="bi bi-person-plus"></i> Invited
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{user.email}</div>
                          {user.requiresVerification && (
                            <small className="text-warning">
                              <i className="bi bi-exclamation-triangle"></i> Requires verification
                            </small>
                          )}
                        </td>
                        <td>
                          <div><strong>{user.accountName || 'No Account'}</strong></div>
                          <small className="text-muted">ID: {user.accountId || 'N/A'}</small>
                        </td>
                        <td>
                          <span className={`badge ${
                            user.role === 'admin' ? 'bg-danger' :
                            user.role === 'member' ? 'bg-primary' :
                            'bg-secondary'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            user.status === 'active' ? 'bg-success' : 'bg-warning'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td>
                          {user.emailVerified ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle"></i> Verified
                            </span>
                          ) : (
                            <div>
                              <span className="badge bg-warning">
                                <i className="bi bi-x-circle"></i> Not Verified
                              </span>
                              {user.emailVerificationToken && (
                                <div>
                                  <small className="text-muted">
                                    Token: {user.emailVerificationToken}
                                  </small>
                                </div>
                              )}
                              {user.emailVerificationExpires && (
                                <div>
                                  <small className="text-muted">
                                    Expires: {formatDate(user.emailVerificationExpires)}
                                  </small>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <small>{formatDate(user.createdAt)}</small>
                          {user.updatedAt && user.updatedAt !== user.createdAt && (
                            <div>
                              <small className="text-muted">
                                Updated: {formatDate(user.updatedAt)}
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          <small>{formatDate(user.joinedAt)}</small>
                          {user.emailVerificationSentAt && (
                            <div>
                              <small className="text-muted">
                                Sent: {formatDate(user.emailVerificationSentAt)}
                              </small>
                            </div>
                          )}
                        </td>
                        {includeStats && (
                          <>
                            <td>
                              {user.stats?.receipts.toLocaleString() || '—'}
                            </td>
                            <td>
                              {user.stats?.lineItems.toLocaleString() || '—'}
                            </td>
                          </>
                        )}
                      </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
