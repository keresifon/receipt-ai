import React from 'react'

export default function TermsOfService() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div>
                <h1 className="display-4 fw-bold mb-3">Terms of Service</h1>
                <p className="lead mb-4">
                  Please read these terms carefully before using our service. These terms govern your use of No Wahala Receipt.
                </p>
                <div className="d-flex">
                  <span className="badge bg-primary fs-6 me-3">
                    <i className="bi bi-file-text me-1"></i>
                    Last updated: December 19, 2024
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Terms and conditions"
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
                      <i className="bi bi-check-circle text-primary me-2"></i>
                      1. Acceptance of Terms
                    </h2>
                    <p className="text-muted mb-3">
                      By accessing and using No Wahala Receipt ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-gear text-primary me-2"></i>
                      2. Description of Service
                    </h2>
                    <p className="text-muted mb-3">
                      No Wahala Receipt is a mobile application and web service that helps users:
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-camera text-primary me-3"></i>
                          <span className="text-muted">Capture and digitize receipt images</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-robot text-success me-3"></i>
                          <span className="text-muted">Extract expense data using AI technology</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-folder text-info me-3"></i>
                          <span className="text-muted">Organize and categorize expenses</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-graph-up text-warning me-3"></i>
                          <span className="text-muted">Generate expense reports and analytics</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-download text-danger me-3"></i>
                          <span className="text-muted">Export data for accounting purposes</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-person text-primary me-2"></i>
                      3. User Accounts
                    </h2>
                    
                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">3.1 Account Creation</h4>
                        <p className="text-muted mb-3">
                          To use certain features of the Service, you must create an account. You agree to:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Provide accurate, current, and complete information</li>
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Maintain and update your account information</li>
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Keep your password secure and confidential</li>
                          <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Accept responsibility for all activities under your account</li>
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">3.2 Account Termination</h4>
                        <p className="text-muted">
                          We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-shield-check text-primary me-2"></i>
                      4. Acceptable Use
                    </h2>
                    
                    <div className="card bg-success bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">4.1 Permitted Uses</h4>
                        <p className="text-muted">
                          You may use the Service only for lawful purposes and in accordance with these Terms. You agree to use the Service only for personal or business expense tracking purposes.
                        </p>
                      </div>
                    </div>

                    <div className="card bg-danger bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">4.2 Prohibited Uses</h4>
                        <p className="text-muted mb-3">
                          You agree not to use the Service:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To submit false or misleading information</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To upload or transmit viruses or any other type of malicious code</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>For any obscene or immoral purpose</li>
                          <li className="mb-2"><i className="bi bi-x-circle text-danger me-2"></i>To interfere with or circumvent the security features of the Service</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-copyright text-primary me-2"></i>
                      5. Intellectual Property Rights
                    </h2>
                    <p className="text-muted mb-3">
                      The Service and its original content, features, and functionality are and will remain the exclusive property of No Wahala Receipt and its licensors. The Service is protected by copyright, trademark, and other laws.
                    </p>
                    <p className="text-muted">
                      You retain ownership of your receipt images and data. By using the Service, you grant us a limited license to process, analyze, and store your data solely for the purpose of providing the Service to you.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-shield text-primary me-2"></i>
                      6. Privacy Policy
                    </h2>
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-clock text-primary me-2"></i>
                      7. Service Availability
                    </h2>
                    <p className="text-muted mb-3">
                      We strive to provide continuous service availability, but we do not guarantee that the Service will be available at all times. The Service may be temporarily unavailable due to:
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-tools text-warning me-3"></i>
                          <span className="text-muted">Scheduled maintenance</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-exclamation-triangle text-danger me-3"></i>
                          <span className="text-muted">Technical difficulties</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-cloud-rain text-info me-3"></i>
                          <span className="text-muted">Force majeure events</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded">
                          <i className="bi bi-question-circle text-secondary me-3"></i>
                          <span className="text-muted">Other circumstances beyond our control</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-exclamation-triangle text-primary me-2"></i>
                      8. Disclaimers and Limitations of Liability
                    </h2>
                    
                    <div className="card bg-warning bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">8.1 Service Disclaimer</h4>
                        <p className="text-muted">
                          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the Service or the information, content, materials, or products included on the Service.
                        </p>
                      </div>
                    </div>

                    <div className="card bg-info bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">8.2 AI Processing Disclaimer</h4>
                        <p className="text-muted">
                          While we use advanced AI technology to extract data from receipts, we cannot guarantee 100% accuracy. You are responsible for reviewing and verifying the accuracy of extracted data before using it for accounting or tax purposes.
                        </p>
                      </div>
                    </div>

                    <div className="card bg-danger bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">8.3 Limitation of Liability</h4>
                        <p className="text-muted">
                          In no event shall No Wahala Receipt, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-shield-exclamation text-primary me-2"></i>
                      9. Indemnification
                    </h2>
                    <p className="text-muted">
                      You agree to defend, indemnify, and hold harmless No Wahala Receipt and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees).
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-download text-primary me-2"></i>
                      10. Data Export and Portability
                    </h2>
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      You have the right to export your data from the Service at any time. We provide tools to export your receipt data in various formats (CSV, PDF, etc.). Upon account termination, you may request a complete copy of your data.
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-calendar-x text-primary me-2"></i>
                      11. Data Retention Policy
                    </h2>
                    
                    <div className="card bg-warning bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">11.1 Free Account Data Retention</h4>
                        <div className="alert alert-info mb-3">
                          <i className="bi bi-calendar-event me-2"></i>
                          <strong>Policy Effective Date:</strong> This data retention policy will begin on January 1, 2027. All existing data will be preserved until then.
                        </div>
                        <p className="text-muted mb-3">
                          For free accounts, we implement an automated data retention policy to manage storage costs and ensure optimal service performance:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-calendar-check text-warning me-2"></i><strong>Retention Period:</strong> Receipt data older than 1 year is automatically deleted</li>
                          <li className="mb-2"><i className="bi bi-clock text-info me-2"></i><strong>Grace Period:</strong> You have 30 days after the retention date to download your data before permanent deletion</li>
                          <li className="mb-2"><i className="bi bi-bell text-primary me-2"></i><strong>Notifications:</strong> We will notify you via email 45, 15, and 3 days before data deletion</li>
                          <li className="mb-2"><i className="bi bi-download text-success me-2"></i><strong>Data Export:</strong> During the grace period, you can download all your data free of charge</li>
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-success bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">11.2 Premium Account Data Retention</h4>
                        <p className="text-muted mb-3">
                          Premium subscribers enjoy extended data retention:
                        </p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="bi bi-calendar-check text-success me-2"></i><strong>Retention Period:</strong> Receipt data is retained for 5 years</li>
                          <li className="mb-2"><i className="bi bi-download text-primary me-2"></i><strong>Unlimited Exports:</strong> Download your data at any time without restrictions</li>
                          <li className="mb-2"><i className="bi bi-shield-check text-info me-2"></i><strong>No Automatic Deletion:</strong> Your data is never automatically deleted while your subscription is active</li>
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-info bg-opacity-10 mb-4">
                      <div className="card-body">
                        <h4 className="h5 fw-semibold text-dark mb-3">11.3 Data Retention Schedule</h4>
                        <p className="text-muted mb-3">
                          Data cleanup occurs automatically on the following schedule starting January 2027:
                        </p>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center p-3 bg-light rounded">
                              <i className="bi bi-calendar-event text-primary me-3"></i>
                              <div>
                                <div className="fw-semibold">First Cleanup</div>
                                <div className="small text-muted">January 31, 2027</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center p-3 bg-light rounded">
                              <i className="bi bi-hourglass-split text-warning me-3"></i>
                              <div>
                                <div className="fw-semibold">Grace Period</div>
                                <div className="small text-muted">30 days after cleanup date</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="alert alert-success mt-3">
                          <i className="bi bi-shield-check me-2"></i>
                          <strong>Grandfathering:</strong> All data uploaded before January 1, 2027 will be preserved and not subject to the 1-year retention limit.
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Important:</strong> Once data is deleted after the grace period, it cannot be recovered. We strongly recommend upgrading to Premium or downloading your data during the grace period if you need longer retention.
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-arrow-clockwise text-primary me-2"></i>
                      12. Modifications to Terms
                    </h2>
                    <p className="text-muted">
                      We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-scale text-primary me-2"></i>
                      13. Governing Law
                    </h2>
                    <p className="text-muted">
                      These Terms shall be interpreted and governed by the laws of Canada, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-scissors text-primary me-2"></i>
                      14. Severability
                    </h2>
                    <p className="text-muted">
                      If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
                    </p>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 fw-bold text-dark mb-3">
                      <i className="bi bi-envelope text-primary me-2"></i>
                      15. Contact Information
                    </h2>
                    <p className="text-muted mb-4">
                      If you have any questions about these Terms of Service, please contact us at:
                    </p>
                    <div className="card bg-dark text-white">
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="text-center">
                              <i className="bi bi-envelope fs-2 mb-2"></i>
                              <div className="fw-semibold">Email</div>
                              <div className="small">legal@no-wahala.net</div>
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