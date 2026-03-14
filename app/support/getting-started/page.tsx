import React from 'react'
import Link from 'next/link'

export default function GettingStartedGuide() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="text-center mb-5">
                <h1 className="display-4 fw-bold text-dark mb-3">Getting Started Guide</h1>
                <p className="lead text-muted">
                  <i className="bi bi-play-circle me-2"></i>
                  Learn how to set up your account and start tracking expenses with No Wahala Receipt
                </p>
              </div>

              <div className="row">
                <div className="col-12">
                  
                  {/* Step 1: Account Creation */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-person-plus text-primary me-2"></i>
                          Step 1: Create Your Account
                        </h2>
                        <p className="text-muted mb-3">
                          Start by creating your account to access all features of No Wahala Receipt.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">1</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Download the App</h5>
                                <p className="text-muted small mb-0">Download No Wahala Receipt from the App Store</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">2</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Tap "Create Account"</h5>
                                <p className="text-muted small mb-0">Open the app and tap the "Create Account" button</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">3</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Enter Your Details</h5>
                                <p className="text-muted small mb-0">Fill in your name, email, password, and account name</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">4</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Complete Setup</h5>
                                <p className="text-muted small mb-0">Tap "Create Account" to finish the registration</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Step 2: First Receipt */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-camera text-success me-2"></i>
                          Step 2: Scan Your First Receipt
                        </h2>
                        <p className="text-muted mb-3">
                          Once logged in, you'll see the main dashboard. Let's scan your first receipt!
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="card h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-camera text-primary fs-1 mb-3"></i>
                                <h5 className="card-title">Tap Camera Icon</h5>
                                <p className="card-text text-muted">In the bottom navigation, tap the camera icon</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-image text-success fs-1 mb-3"></i>
                                <h5 className="card-title">Take Photo</h5>
                                <p className="card-text text-muted">Point your camera at the receipt and tap the capture button</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-check-circle text-info fs-1 mb-3"></i>
                                <h5 className="card-title">Review & Save</h5>
                                <p className="card-text text-muted">Review the extracted data and tap "Save Receipt"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Step 3: Dashboard Overview */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-graph-up text-info me-2"></i>
                          Step 3: Understanding Your Dashboard
                        </h2>
                        <p className="text-muted mb-3">
                          Your dashboard shows a welcome message and provides access to all main features.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-person-check text-primary me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Welcome Message</h5>
                                <p className="text-muted small mb-0">See "Welcome, [Your Name]" in the top right corner</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-calendar text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Month Filter</h5>
                                <p className="text-muted small mb-0">Filter your analytics by month or view "All Months"</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-bar-chart text-info me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Analytics Cards</h5>
                                <p className="text-muted small mb-0">View total expenses, average spending, and transaction counts</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-pie-chart text-warning me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Spending Charts</h5>
                                <p className="text-muted small mb-0">Visual breakdown of your spending by category</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Step 4: Navigation */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-compass text-primary me-2"></i>
                          Step 4: App Navigation
                        </h2>
                        <p className="text-muted mb-3">
                          The app has four main sections accessible via the bottom navigation bar.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-house text-primary fs-2 mb-2"></i>
                                <h6 className="card-title">Dashboard</h6>
                                <p className="card-text text-muted small">Analytics and overview</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-list-ul text-success fs-2 mb-2"></i>
                                <h6 className="card-title">Records</h6>
                                <p className="card-text text-muted small">View all receipts</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-camera text-info fs-2 mb-2"></i>
                                <h6 className="card-title">Camera</h6>
                                <p className="card-text text-muted small">Scan receipts</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-gear text-warning fs-2 mb-2"></i>
                                <h6 className="card-title">Settings</h6>
                                <p className="card-text text-muted small">Account & preferences</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Step 5: Viewing Records */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-list-ul text-success me-2"></i>
                          Step 5: Viewing Your Records
                        </h2>
                        <p className="text-muted mb-3">
                          Access the Records tab to see all your scanned receipts and manage them.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-eye text-primary me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">View All Receipts</h5>
                                <p className="text-muted small mb-0">See all your scanned receipts in a list format</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-search text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Search & Filter</h5>
                                <p className="text-muted small mb-0">Search for specific receipts or filter by date</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-pencil text-info me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Edit Receipts</h5>
                                <p className="text-muted small mb-0">Tap any receipt to view and edit its details</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-trash text-danger me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Delete Receipts</h5>
                                <p className="text-muted small mb-0">Remove receipts you no longer need</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Next Steps */}
                  <section className="mb-5">
                    <div className="card bg-primary text-white">
                      <div className="card-body">
                        <h2 className="h3 fw-bold mb-3">
                          <i className="bi bi-lightbulb me-2"></i>
                          Next Steps
                        </h2>
                        <p className="mb-3">
                          Now that you're set up, explore these additional features:
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-download me-2"></i>
                              <span>Export your data</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-gear me-2"></i>
                              <span>Customize settings</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-shield-check me-2"></i>
                              <span>Manage account</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Help Section */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h3 className="h5 fw-bold text-dark mb-3">Need More Help?</h3>
                        <p className="text-muted mb-3">
                          If you run into any issues or have questions, we're here to help!
                        </p>
                        <div className="d-flex justify-content-center gap-3">
                          <Link href="/support" className="btn btn-primary">
                            <i className="bi bi-headset me-2"></i>
                            Support Center
                          </Link>
                          <Link href="/support/receipt-scanning" className="btn btn-outline-primary">
                            <i className="bi bi-camera me-2"></i>
                            Receipt Scanning Tips
                          </Link>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

















