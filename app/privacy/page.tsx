import React from 'react'

export default function PrivacyPolicy() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div>
                <h1 className="display-4 fw-bold mb-3">Privacy Policy</h1>
                <p className="lead mb-4">
                  Your privacy is important to us. Learn how we protect and handle your personal information.
                </p>
                <div className="d-flex">
                  <span className="badge bg-primary fs-6 me-3">
                    <i className="bi bi-shield-check me-1"></i>
                    Last updated: September 16, 2025
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Privacy and security"
                  className="img-fluid rounded-3"
                  style={{
                    maxHeight: '320px',
                    width: 'auto',
                    filter: 'brightness(0.9) contrast(1.1) saturate(0.8)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">

              <div className="row">
                <div className="col-12">
                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-info-circle text-primary me-2"></i>
                      1. Introduction
                    </h2>
                    <p className="text-muted mb-3">
                      No Wahala Receipt ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
                    </p>
                    <p className="text-muted">
                      Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-collection text-primary me-2"></i>
                      2. Information We Collect
                    </h2>
                    
                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">2.1 Personal Information</h4>
                        <p className="text-muted mb-3">
                          We may collect personal information that you voluntarily provide to us when you:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Create an account (name, email address)</li>
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Upload receipt images</li>
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Contact us for support</li>
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Participate in surveys or promotions</li>
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">2.2 Receipt Data</h4>
                        <p className="text-muted mb-3">
                          Our Service processes receipt images and extracts the following information:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-receipt text-primary me-2"></i>Merchant/store name</li>
                          <li className="mb-2"><i className="bi bi-receipt text-primary me-2"></i>Purchase date</li>
                          <li className="mb-2"><i className="bi bi-receipt text-primary me-2"></i>Item descriptions and quantities</li>
                          <li className="mb-2"><i className="bi bi-receipt text-primary me-2"></i>Prices and totals</li>
                          <li className="mb-2"><i className="bi bi-receipt text-primary me-2"></i>Tax information</li>
                          <li className="mb-2"><i className="bi bi-receipt text-primary me-2"></i>Categories for expense tracking</li>
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">2.3 Device Information</h4>
                        <p className="text-muted mb-3">
                          We may collect information about your device, including:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-phone text-info me-2"></i>Device type and operating system</li>
                          <li className="mb-2"><i className="bi bi-phone text-info me-2"></i>Unique device identifiers</li>
                          <li className="mb-2"><i className="bi bi-phone text-info me-2"></i>IP address</li>
                          <li className="mb-2"><i className="bi bi-phone text-info me-2"></i>App usage analytics</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-gear text-primary me-2"></i>
                      3. How We Use Your Information
                    </h2>
                    <p className="text-muted mb-3">
                      We use the information we collect to:
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Provide and maintain our Service</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Process and analyze receipt images using AI technology</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Generate expense reports and analytics</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Send you important updates about the Service</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Respond to your inquiries and provide customer support</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Improve our Service and develop new features</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-check2-circle text-success me-3 mt-1"></i>
                          <span className="text-muted">Ensure the security and integrity of our Service</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-share text-primary me-2"></i>
                      4. Information Sharing and Disclosure
                    </h2>
                    <p className="text-muted mb-3">
                      We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
                    </p>
                    <div className="alert alert-info">
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2"><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating our Service</li>
                        <li className="mb-2"><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                        <li className="mb-2"><strong>Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred as part of the business assets</li>
                        <li className="mb-0"><strong>Consent:</strong> We may share information with your explicit consent</li>
                      </ul>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-lock text-primary me-2"></i>
                      5. Data Security
                    </h2>
                    <p className="text-muted mb-3">
                      We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="card h-100">
                          <div className="card-body text-center">
                            <i className="bi bi-shield-lock text-primary fs-1 mb-3"></i>
                            <h5 className="card-title">Encryption</h5>
                            <p className="card-text text-muted">Data encrypted in transit and at rest</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card h-100">
                          <div className="card-body text-center">
                            <i className="bi bi-graph-up text-success fs-1 mb-3"></i>
                            <h5 className="card-title">Regular Updates</h5>
                            <p className="card-text text-muted">Regular security assessments and updates</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card h-100">
                          <div className="card-body text-center">
                            <i className="bi bi-person-check text-info fs-1 mb-3"></i>
                            <h5 className="card-title">Access Controls</h5>
                            <p className="card-text text-muted">Strict access controls and authentication</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card h-100">
                          <div className="card-body text-center">
                            <i className="bi bi-cloud-check text-warning fs-1 mb-3"></i>
                            <h5 className="card-title">Secure Storage</h5>
                            <p className="card-text text-muted">Secure data storage and backup procedures</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-clock text-primary me-2"></i>
                      6. Data Retention
                    </h2>
                    <p className="text-muted">
                      We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. Receipt data and associated information will be retained until you delete your account or request data deletion.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-person-gear text-primary me-2"></i>
                      7. Your Rights and Choices
                    </h2>
                    <p className="text-muted mb-3">
                      You have the following rights regarding your personal information:
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-eye text-primary me-3"></i>
                          <div>
                            <strong>Access</strong>
                            <div className="small text-muted">Request access to your personal information</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-pencil text-success me-3"></i>
                          <div>
                            <strong>Correction</strong>
                            <div className="small text-muted">Request correction of inaccurate information</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-trash text-danger me-3"></i>
                          <div>
                            <strong>Deletion</strong>
                            <div className="small text-muted">Request deletion of your personal information</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-download text-info me-3"></i>
                          <div>
                            <strong>Portability</strong>
                            <div className="small text-muted">Request a copy of your data in a portable format</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-bell-slash text-warning me-3"></i>
                          <div>
                            <strong>Opt-out</strong>
                            <div className="small text-muted">Unsubscribe from marketing communications</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5" id="account-deletion">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-person-x text-primary me-2"></i>
                      8. Account Deletion
                    </h2>
                    <div className="alert alert-info">
                      <h4 className="h5 fw-semibold mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        How to Delete Your ReceiptAI Account
                      </h4>
                      <p className="mb-3">
                        You can request deletion of your account and associated data at any time. Here are the steps:
                      </p>
                      
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <div className="card h-100">
                            <div className="card-body">
                              <h5 className="card-title">
                                <i className="bi bi-phone text-primary me-2"></i>
                                Through the App
                              </h5>
                              <ol className="mb-0">
                                <li>Log into your ReceiptAI account</li>
                                <li>Go to Settings → Account Settings</li>
                                <li>Scroll to "Delete Account" section</li>
                                <li>Click "Request Account Deletion"</li>
                                <li>Confirm your request</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card h-100">
                            <div className="card-body">
                              <h5 className="card-title">
                                <i className="bi bi-envelope text-success me-2"></i>
                                Via Email
                              </h5>
                              <p className="mb-2">Email us at:</p>
                              <div className="bg-light p-2 rounded mb-2">
                                <strong>support@no-wahala.net</strong>
                              </div>
                              <p className="mb-1">Include:</p>
                              <ul className="mb-0 small">
                                <li>Subject: "Account Deletion Request"</li>
                                <li>Your email address</li>
                                <li>Confirmation of deletion request</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="card border-success">
                            <div className="card-header bg-success text-white">
                              <h5 className="mb-0">
                                <i className="bi bi-check-circle me-2"></i>
                                Data That Will Be Deleted
                              </h5>
                            </div>
                            <div className="card-body">
                              <ul className="list-unstyled mb-0">
                                <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Personal information (name, email)</li>
                                <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Receipt photos and data</li>
                                <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Expense records</li>
                                <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Account settings and preferences</li>
                                <li className="mb-0"><i className="bi bi-check text-success me-2"></i>All financial data</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card border-warning">
                            <div className="card-header bg-warning text-dark">
                              <h5 className="mb-0">
                                <i className="bi bi-info-circle me-2"></i>
                                Data Retention Policy
                              </h5>
                            </div>
                            <div className="card-body">
                              <p className="mb-2"><strong>Processing Time:</strong></p>
                              <p className="mb-3">Account deletion processed within 30 days</p>
                              
                              <p className="mb-2"><strong>Data That May Be Retained:</strong></p>
                              <ul className="list-unstyled mb-0 small">
                                <li className="mb-1"><i className="bi bi-graph-up text-info me-2"></i>Anonymized analytics (no personal identifiers)</li>
                                <li className="mb-1"><i className="bi bi-shield-check text-warning me-2"></i>Legal compliance records (if required)</li>
                                <li className="mb-0"><i className="bi bi-bar-chart text-secondary me-2"></i>Aggregated usage statistics</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-warning mt-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Important:</strong> Once your account is deleted, this action cannot be undone. You will lose access to all your receipt data, expense records, and account settings. Please export any data you wish to keep before requesting account deletion.
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-heart text-primary me-2"></i>
                      9. Children's Privacy
                    </h2>
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-globe text-primary me-2"></i>
                      10. International Data Transfers
                    </h2>
                    <p className="text-muted">
                      Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-arrow-clockwise text-primary me-2"></i>
                      11. Changes to This Privacy Policy
                    </h2>
                    <p className="text-muted">
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-envelope text-primary me-2"></i>
                      12. Contact Us
                    </h2>
                    <p className="text-muted mb-4">
                      If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                    </p>
                    <div className="card bg-dark text-white">
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="text-center">
                              <i className="bi bi-envelope fs-2 mb-2"></i>
                              <div className="fw-semibold">Email</div>
                              <div className="small">privacy@no-wahala.net</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="text-center">
                              <i className="bi bi-globe fs-2 mb-2"></i>
                              <div className="fw-semibold">Website</div>
                              <div className="small">https://no-wahala.net</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}