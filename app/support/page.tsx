import React from 'react'
import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Hero Section */}
      <section className="bg-dark text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3">
                Support Center
              </h1>
              <p className="lead mb-4">
                Get help with No Wahala Receipt. Find answers to common questions, 
                troubleshoot issues, and contact our support team.
              </p>
              <div className="d-flex">
                <Link href="#contact" className="btn btn-light btn-lg px-4 me-3">
                  Contact Support
                </Link>
                <Link href="#guides" className="btn btn-outline-light btn-lg px-4">
                  View Guides
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Customer support and help"
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

      {/* Email Support Section */}
      <section id="contact" className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">Email Support</h2>
            <p className="lead text-secondary">
              We're here to help you with any questions or issues
            </p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="feature-image-container mb-4">
                <img
                  src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                  alt="Email support"
                  className="img-fluid rounded-3 shadow-sm"
                  style={{
                    height: '300px',
                    width: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                    border: '2px solid rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <h4 className="text-dark mb-3">Get Help via Email</h4>
              <p className="text-secondary mb-4">
                Send us an email and we'll respond within 24 hours. We're here to help with any questions about your receipts, account settings, or technical issues.
              </p>
              <a href="mailto:support@no-wahala.net" className="btn btn-primary btn-lg">
                <i className="bi bi-envelope me-2"></i>
                support@no-wahala.net
              </a>
              <div className="mt-3">
                <span className="badge bg-primary fs-6">24 Hour Response Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">Frequently Asked Questions</h2>
            <p className="lead text-secondary">
              Quick answers to common questions about No Wahala Receipt
            </p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq1">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1" aria-expanded="false" aria-controls="collapse1">
                      How do I scan a receipt?
                    </button>
                  </h2>
                  <div id="collapse1" className="accordion-collapse collapse" aria-labelledby="faq1" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Open the app, tap the camera icon, and take a clear photo of your receipt. The AI will automatically extract the information.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq2">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2" aria-expanded="false" aria-controls="collapse2">
                      Is my data secure?
                    </button>
                  </h2>
                  <div id="collapse2" className="accordion-collapse collapse" aria-labelledby="faq2" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes! All your data is encrypted and stored securely. We never share your personal information with third parties.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq3">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3" aria-expanded="false" aria-controls="collapse3">
                      Can I export my data?
                    </button>
                  </h2>
                  <div id="collapse3" className="accordion-collapse collapse" aria-labelledby="faq3" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Absolutely! You can export your expense data as CSV or text files from the Export tab in the app.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq4">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse4" aria-expanded="false" aria-controls="collapse4">
                      What if the AI doesn't extract the data correctly?
                    </button>
                  </h2>
                  <div id="collapse4" className="accordion-collapse collapse" aria-labelledby="faq4" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      You can manually edit any extracted information. The AI learns and improves over time, but manual correction is always available.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq5">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse5" aria-expanded="false" aria-controls="collapse5">
                      Can I use this for business expenses?
                    </button>
                  </h2>
                  <div id="collapse5" className="accordion-collapse collapse" aria-labelledby="faq5" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes! No Wahala Receipt is perfect for business professionals, small business owners, and anyone tracking business expenses.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Guides Section */}
      <section id="guides" className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">User Guides</h2>
            <p className="lead text-secondary">
              Comprehensive guides to help you get the most out of No Wahala Receipt
            </p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="text-center">
                <div className="feature-image-container mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    alt="Getting started guide"
                    className="img-fluid rounded-3 shadow-sm"
                    style={{
                      height: '200px',
                      width: '100%',
                      objectFit: 'cover',
                      filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                      border: '2px solid rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <h4 className="text-dark">Getting Started</h4>
                <p className="text-secondary">
                  Learn how to set up your account and start tracking expenses.
                </p>
                <Link href="/support/getting-started" className="btn btn-primary">
                  Read Guide
                </Link>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="text-center">
                <div className="feature-image-container mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    alt="Receipt scanning tips"
                    className="img-fluid rounded-3 shadow-sm"
                    style={{
                      height: '200px',
                      width: '100%',
                      objectFit: 'cover',
                      filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                      border: '2px solid rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <h4 className="text-secondary">Receipt Scanning Tips</h4>
                <p className="text-secondary">
                  Best practices for getting accurate results from receipt photos.
                </p>
                <Link href="/support/receipt-scanning" className="btn btn-success">
                  Read Guide
                </Link>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="text-center">
                <div className="feature-image-container mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    alt="Exporting data guide"
                    className="img-fluid rounded-3 shadow-sm"
                    style={{
                      height: '200px',
                      width: '100%',
                      objectFit: 'cover',
                      filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                      border: '2px solid rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <h4 className="text-primary">Exporting Data</h4>
                <p className="text-secondary">
                  How to export your expense data for accounting and tax purposes.
                </p>
                <Link href="/support/exporting-data" className="btn btn-info">
                  Read Guide
                </Link>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="text-center">
                <div className="feature-image-container mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    alt="Account settings guide"
                    className="img-fluid rounded-3 shadow-sm"
                    style={{
                      height: '200px',
                      width: '100%',
                      objectFit: 'cover',
                      filter: 'grayscale(0.3) brightness(0.9) contrast(1.1)',
                      border: '2px solid rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <h4 className="text-warning">Account Settings</h4>
                <p className="text-secondary">
                  Manage your account, privacy settings, and app preferences.
                </p>
                <Link href="/support/account-settings" className="btn btn-warning">
                  Read Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">Troubleshooting</h2>
            <p className="lead text-secondary">
              Quick solutions to common issues
            </p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-camera fs-2"></i>
                </div>
                <h4 className="text-dark">App won't scan receipts</h4>
                <ul className="list-unstyled text-secondary">
                  <li>• Ensure camera permissions enabled</li>
                  <li>• Make sure receipt is well-lit</li>
                  <li>• Try different angles</li>
                  <li>• Check internet connection</li>
                </ul>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-person-lock fs-2"></i>
                </div>
                <h4 className="text-dark">Can't log in</h4>
                <ul className="list-unstyled text-secondary">
                  <li>• Verify email and password</li>
                  <li>• Check internet connection</li>
                  <li>• Try password reset</li>
                  <li>• Contact support if needed</li>
                </ul>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-cloud-sync fs-2"></i>
                </div>
                <h4 className="text-dark">Data not syncing</h4>
                <ul className="list-unstyled text-secondary">
                  <li>• Check internet connection</li>
                  <li>• Log out and back in</li>
                  <li>• Restart the app</li>
                  <li>• Update to latest version</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-4">Still Need Help?</h2>
          <p className="lead mb-4">
            Our support team is ready to assist you with any questions or issues you may have.
          </p>
          <div className="d-flex justify-content-center">
            <a href="mailto:support@no-wahala.net" className="btn btn-light btn-lg px-5 me-3">
              <i className="bi bi-envelope me-2"></i>
              Email Support
            </a>
            <Link href="/" className="btn btn-outline-light btn-lg px-5">
              <i className="bi bi-house me-2"></i>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
