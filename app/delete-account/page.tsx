import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delete Your Account - No Wahala Receipt',
  description:
    'How to delete your No Wahala Receipt account and associated data. In-app deletion and email request instructions.',
}

export default function DeleteAccountPage() {
  return (
    <div>
      <section className="py-5 bg-dark text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">Delete Your No Wahala Receipt Account</h1>
              <p className="lead mb-4">
                This page explains how to request deletion of your <strong>No Wahala Receipt</strong> account and
                the data associated with it. No Wahala Receipt is developed by No-wahala.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-primary fs-6">
                  <i className="bi bi-shield-check me-1"></i>
                  Last updated: June 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <section className="mb-5">
                <h2 className="h3 fw-bold text-dark mb-3">
                  <i className="bi bi-phone text-primary me-2"></i>
                  Option 1: Delete from within the app
                </h2>
                <ol className="text-muted">
                  <li>Open the No Wahala Receipt app and sign in.</li>
                  <li>
                    Go to the <strong>Settings</strong> tab.
                  </li>
                  <li>
                    Tap <strong>Account Settings</strong>.
                  </li>
                  <li>
                    Tap <strong>Delete Account</strong> and confirm.
                  </li>
                </ol>
                <p className="text-muted">
                  Your account and associated data are permanently deleted once you confirm.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h3 fw-bold text-dark mb-3">
                  <i className="bi bi-envelope text-primary me-2"></i>
                  Option 2: Request deletion by email
                </h2>
                <p className="text-muted mb-3">
                  If you cannot access the app, email{' '}
                  <a href="mailto:support@no-wahala.net">support@no-wahala.net</a> from the email address
                  linked to your account with the subject <strong>Delete my account</strong>. We will verify your
                  identity and process the request within 30 days.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h3 fw-bold text-dark mb-3">
                  <i className="bi bi-trash text-danger me-2"></i>
                  What data is deleted
                </h2>
                <p className="text-muted mb-3">When your account is deleted, we permanently remove:</p>
                <ul className="text-muted">
                  <li>Your profile information (name, email address)</li>
                  <li>All receipts, line items, and uploaded receipt images</li>
                  <li>Your spending history and analytics data</li>
                </ul>
              </section>

              <section className="mb-5">
                <h2 className="h3 fw-bold text-dark mb-3">
                  <i className="bi bi-archive text-warning me-2"></i>
                  What data is kept
                </h2>
                <p className="text-muted mb-3">
                  We may retain a limited set of records where required by law (for example,
                  transaction or tax-related logs) for up to 90 days, after which they are
                  permanently deleted. Backups containing your data are purged within 30 days.
                </p>
              </section>

              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Important:</strong> Once your account is deleted, this action cannot be undone.
                Export any data you wish to keep before requesting account deletion.
              </div>

              <p className="text-muted small mt-4 mb-0">
                Related: <Link href="/privacy">Privacy Policy</Link> ·{' '}
                <Link href="/terms">Terms of Service</Link> ·{' '}
                <Link href="/support/account-settings">Account Settings Guide</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}