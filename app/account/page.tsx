'use client'

import { useAuth } from '@/app/providers/AuthProvider'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function AccountPage() {
  const { user, account, isLoading } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [accountDescription, setAccountDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteEmailDisplay, setInviteEmailDisplay] = useState('')

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

  const openSettingsModal = () => {
    if (!account) return
    setAccountName(account.name || '')
    setAccountDescription(account.description || '')
    setShowSettingsModal(true)
  }

  const openInviteModal = () => {
    setShowInviteModal(true)
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteRole('member')
  }

  const closeSettingsModal = () => {
    setShowSettingsModal(false)
    setAccountName('')
    setAccountDescription('')
  }

  const handleSaveSettings = async () => {
    if (!account) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/accounts/${account._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: accountName,
          description: accountDescription
        })
      })

      if (response.ok) {
        alert('Account settings updated successfully!')
        setShowSettingsModal(false)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to update settings: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async (text: string, button: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(text)
      // Show success message
      const originalText = button.textContent
      const originalClass = button.className
      button.textContent = 'Copied!'
      button.className = 'btn btn-success'
      setTimeout(() => {
        button.textContent = originalText
        button.className = originalClass
      }, 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        // Show success message
        const originalText = button.textContent
        const originalClass = button.className
        button.textContent = 'Copied!'
        button.className = 'btn btn-success'
        setTimeout(() => {
          button.textContent = originalText
          button.className = originalClass
        }, 2000)
      } catch (fallbackErr) {
        alert('Failed to copy link. Please select and copy manually.')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return
    
    setInviting(true)
    try {
      const response = await fetch(`/api/accounts/${account?._id}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Always show the invite link for manual sharing
        const inviteUrl = result.inviteUrl || `${window.location.origin}/auth/signup?invite=${result.invite.token}&email=${encodeURIComponent(inviteEmail)}&account=${account?._id}`
        
        // Show the invite link modal
        setInviteLink(inviteUrl)
        setInviteEmailDisplay(inviteEmail)
        setShowInviteLinkModal(true)
        
        setInviteEmail('')
        setInviteRole('member')
        setShowInviteModal(false)
        loadAccountData() // Refresh the data
      } else {
        const error = await response.json()
        alert(`Failed to send invite: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to send invite:', error)
      alert('Failed to send invite. Please try again.')
    } finally {
      setInviting(false)
    }
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
    <div className="container py-3 py-md-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-2 text-dark">Account Management</h1>
              <p className="text-muted mb-0">
                Manage your family account, invite members, and update settings.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={openInviteModal}
              >
                <i className="bi bi-person-plus me-2"></i>
                Invite Family Member
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={openSettingsModal}
              >
                <i className="bi bi-gear me-2"></i>
                Account Settings
              </button>
            </div>
          </div>
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
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowInviteModal(true)}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Invite Family Member
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={openSettingsModal}
                >
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
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="h4 text-primary mb-0">{members.length}</div>
                      <p className="text-muted mb-0">Family Members</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="h4 text-info mb-0">{invites.length}</div>
                      <p className="text-muted mb-0">Pending Invites</p>
                    </div>
                  </div>
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
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowInviteModal(true)}
            >
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
                        <td>{member.user?.name || 'N/A'}</td>
                        <td>{member.user?.email || 'N/A'}</td>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Invite Family Member
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeInviteModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeInviteModal}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-primary" 
                  onClick={handleInviteMember}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showSettingsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-gear me-2"></i>
                  Account Settings
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeSettingsModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Account Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter account name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter account description"
                    value={accountDescription}
                    onChange={(e) => setAccountDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeSettingsModal}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {showInviteLinkModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Invitation Link</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowInviteLinkModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email Address:</label>
                  <input
                    type="email"
                    className="form-control"
                    value={inviteEmailDisplay}
                    readOnly
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Invitation Link:</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={inviteLink}
                      readOnly
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={(event) => copyToClipboard(inviteLink, event.target as HTMLButtonElement)}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="alert alert-info">
                  <strong>Instructions:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Copy the invitation link above</li>
                    <li>Send it to <strong>{inviteEmailDisplay}</strong></li>
                    <li>They can click the link to join your account</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowInviteLinkModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
