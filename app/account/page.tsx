'use client'

import { useAuth } from '@/app/providers/AuthProvider'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function AccountPage() {
  const { user, account, isLoading } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (account) {
      loadAccountData()
    }
  }, [account])

  const loadAccountData = async () => {
    if (!account) return
    
    setLoading(true)
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/accounts/${account._id}/members`),
        fetch(`/api/accounts/${account._id}/invites`)
      ])

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.members || [])
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json()
        setInvites(invitesData.invites || [])
      }
    } catch (error) {
      console.error('Failed to load account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading account...</p>
        </div>
      </div>
    )
  }

  if (!user || !account) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          You must be logged in to view this page.
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12 col-lg-8">
          {/* Account Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-building me-2"></i>
                Account Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Account Name</label>
                  <p className="mb-0">{account.name}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Description</label>
                  <p className="mb-0">{account.description || 'No description'}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Created</label>
                  <p className="mb-0">{new Date(account.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Currency</label>
                  <p className="mb-0">{account.settings.currency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Your Profile
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Name</label>
                  <p className="mb-0">{user.name}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Email</label>
                  <p className="mb-0">{user.email}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Role</label>
                  <span className={`badge bg-${user.role === 'admin' ? 'primary' : 'secondary'}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Account ID</label>
                  <p className="mb-0 text-muted small">{user.accountId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          {/* Quick Actions */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">
                  <i className="bi bi-person-plus me-2"></i>
                  Invite Family Member
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-gear me-2"></i>
                  Account Settings
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={handleSignOut}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Account Stats
              </h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <div className="h4 text-primary mb-0">{members.length}</div>
                  <small className="text-muted">Members</small>
                </div>
                <div className="col-6">
                  <div className="h4 text-info mb-0">{invites.length}</div>
                  <small className="text-muted">Pending Invites</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      {user.role === 'admin' && (
        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>
              Account Members
            </h5>
            <button className="btn btn-primary btn-sm">
              <i className="bi bi-person-plus me-2"></i>
              Invite Member
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : members.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member._id}>
                        <td>{member.name}</td>
                        <td>{member.email}</td>
                        <td>
                          <span className={`badge bg-${member.role === 'admin' ? 'primary' : 'secondary'}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td>{new Date(member.joinedAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-outline-danger btn-sm">
                            <i className="bi bi-person-x"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center mb-0">No members found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
