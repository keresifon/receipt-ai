'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface TwoFactorStatus {
  configured: boolean
  enabled: boolean
  enrolled: boolean
  method: 'totp' | null
  secret?: string
  backupCodes?: number
  createdAt?: string
}

interface TwoFactorSetupProps {
  onClose: () => void
}

export default function TwoFactorSetup({ onClose }: TwoFactorSetupProps) {
  const { data: session, update } = useSession()
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'setup' | 'enroll' | 'complete'>('setup')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  // Load 2FA status on component mount
  useEffect(() => {
    loadTwoFactorStatus()
  }, [])

  const loadTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        if (data.enabled) {
          setStep('complete')
        }
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    }
  }

  const handleEnroll = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setBackupCodes(data.backupCodes)
        setStep('enroll')
        setSuccess('2FA enrollment initiated. Scan the QR code with your authenticator app.')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to enroll in 2FA')
      }
    } catch (error) {
      setError('Failed to enroll in 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode) {
      setError('Verification code is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.verified) {
          setStep('complete')
          setSuccess('2FA has been successfully enabled!')
          await loadTwoFactorStatus()
        } else {
          setError('Invalid verification code')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to verify 2FA code')
      }
    } catch (error) {
      setError('Failed to verify 2FA code')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/status', {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('2FA has been disabled')
        await loadTwoFactorStatus()
        setStep('setup')
        setBackupCodes([])
        setQrCode('')
        setSecret('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      setError('Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const regenerateBackupCodes = async () => {
    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.backupCodes)
        setSuccess('Backup codes regenerated successfully!')
      }
    } catch (error) {
      setError('Failed to regenerate backup codes')
    }
  }

  const renderSetupStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="bi bi-shield-lock text-2xl text-blue-600"></i>
        </div>
        <h3 className="text-lg font-semibold">Enable Two-Factor Authentication</h3>
        <p className="text-gray-600">
          Add an extra layer of security to your account using an authenticator app.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Download an authenticator app (Google Authenticator, Authy, etc.)</li>
          <li>• Scan the QR code that will be generated</li>
          <li>• Enter the 6-digit code from your app to verify</li>
          <li>• Get backup codes for emergency access</li>
        </ul>
      </div>

      <button
        onClick={handleEnroll}
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Setting up...' : 'Enable 2FA'}
      </button>
    </div>
  )

  const renderEnrollStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Complete 2FA Setup</h3>
      
      {success && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}

      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-3">
          Scan this QR code with your authenticator app:
        </p>
        {qrCode && (
          <img 
            src={qrCode} 
            alt="2FA QR Code" 
            className="mx-auto border rounded-lg"
            style={{ maxWidth: '200px' }}
          />
        )}
        <p className="text-xs text-gray-500 mt-2">
          Can't scan? Enter this code manually: <code className="bg-gray-200 px-2 py-1 rounded">{secret}</code>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          className="form-input w-full text-center text-lg tracking-widest"
          maxLength={6}
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || verificationCode.length !== 6}
        className="btn btn-primary w-full"
      >
        {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
      </button>

      <button
        onClick={() => setStep('setup')}
        className="btn btn-outline-secondary w-full"
      >
        Back
      </button>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="bi bi-shield-check text-2xl text-green-600"></i>
        </div>
        <h3 className="text-lg font-semibold text-green-800">2FA Successfully Enabled!</h3>
        <p className="text-gray-600">Your account is now protected with two-factor authentication.</p>
      </div>

      {status && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Current 2FA Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="font-medium capitalize">{status.method}</span>
            </div>
            <div className="flex justify-between">
              <span>Enabled:</span>
              <span className="font-medium">{status.enabled ? 'Yes' : 'No'}</span>
            </div>
            {status.createdAt && (
              <div className="flex justify-between">
                <span>Setup Date:</span>
                <span className="font-medium">{new Date(status.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {backupCodes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-yellow-800">Backup Codes</h4>
            <button
              onClick={regenerateBackupCodes}
              className="btn btn-sm btn-outline-warning"
              title="Generate new backup codes"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            Store these backup codes securely. You can use them to access your account if you lose your 2FA device.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            {backupCodes.map((code, index) => (
              <div key={index} className="bg-white p-2 rounded border text-center">
                {code}
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-600 mt-2 text-center">
            ⚠️ Keep these codes safe and don't share them with anyone
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleDisable}
          disabled={loading}
          className="btn btn-outline-danger flex-1"
        >
          {loading ? 'Disabling...' : 'Disable 2FA'}
        </button>
        <button
          onClick={onClose}
          className="btn btn-primary flex-1"
        >
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-md mx-auto">
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {step === 'setup' && renderSetupStep()}
      {step === 'enroll' && renderEnrollStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  )
}
