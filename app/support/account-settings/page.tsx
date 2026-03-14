import React from 'react'
import Link from 'next/link'

export default function AccountSettingsGuide() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="text-center mb-5">
                <h1 className="display-4 fw-bold text-dark mb-3">Account Settings Guide</h1>
                <p className="lead text-muted">
                  <i className="bi bi-gear me-2"></i>
                  Manage your account, privacy settings, and app preferences
                </p>
              </div>

              <div className="row">
                <div className="col-12">
                  
                  {/* Accessing Settings */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-gear text-primary me-2"></i>
                          Accessing Settings
                        </h2>
                        <p className="text-muted mb-3">
                          The Settings tab is located in the bottom navigation bar of your app.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">1</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Tap Settings Tab</h5>
                                <p className="text-muted small mb-0">Tap the "Settings" tab in the bottom navigation</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">2</span>
                              </div>
                              <div>
                                <h5 className="mb-1">View Settings Options</h5>
                                <p className="text-muted small mb-0">See all available settings and account options</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Account Section */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-person text-success me-2"></i>
                          Account Section
                        </h2>
                        <p className="text-muted mb-3">
                          Manage your account information and preferences.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border h-100">
                              <div className="card-body">
                                <h5 className="card-title text-primary">
                                  <i className="bi bi-person-gear me-2"></i>
                                  Account Settings
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Access comprehensive account management features.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Edit user profile (name, email)</li>
                                  <li>• Change password</li>
                                  <li>• Manage account details</li>
                                  <li>• View account members</li>
                                  <li>• Two-factor authentication</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border h-100">
                              <div className="card-body">
                                <h5 className="card-title text-success">
                                  <i className="bi bi-bell me-2"></i>
                                  Notifications
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Control app notification preferences.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Enable/disable notifications</li>
                                  <li>• App update alerts</li>
                                  <li>• Feature announcements</li>
                                  <li>• Support notifications</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Preferences Section */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-sliders text-info me-2"></i>
                          Preferences Section
                        </h2>
                        <p className="text-muted mb-3">
                          Customize your app experience with these preference settings.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border h-100">
                              <div className="card-body">
                                <h5 className="card-title text-info">
                                  <i className="bi bi-moon me-2"></i>
                                  Dark Mode
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Switch between light and dark themes for comfortable viewing.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Toggle dark mode on/off</li>
                                  <li>• Applies to entire app</li>
                                  <li>• Reduces eye strain</li>
                                  <li>• Saves battery on OLED screens</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* App Information */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-info-circle text-primary me-2"></i>
                          App Information
                        </h2>
                        <p className="text-muted mb-3">
                          View app details and access important links.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-app text-primary fs-2 mb-3"></i>
                                <h5 className="card-title">Version</h5>
                                <p className="card-text text-muted small">View current app version and build number</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-shield-check text-success fs-2 mb-3"></i>
                                <h5 className="card-title">Privacy Policy</h5>
                                <p className="card-text text-muted small">Read our privacy policy and data practices</p>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-file-text text-info fs-2 mb-3"></i>
                                <h5 className="card-title">Terms of Service</h5>
                                <p className="card-text text-muted small">Review terms and conditions</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-star text-warning fs-2 mb-3"></i>
                                <h5 className="card-title">Rate App</h5>
                                <p className="card-text text-muted small">Rate us on the App Store</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Account Settings Details */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-person-gear text-success me-2"></i>
                          Account Settings Details
                        </h2>
                        <p className="text-muted mb-3">
                          Comprehensive account management features available in Account Settings.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border-success h-100">
                              <div className="card-body">
                                <h5 className="card-title text-success">
                                  <i className="bi bi-person me-2"></i>
                                  User Profile
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Manage your personal information.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Edit your display name</li>
                                  <li>• View your email address</li>
                                  <li>• Update profile information</li>
                                  <li>• Change password</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-info h-100">
                              <div className="card-body">
                                <h5 className="card-title text-info">
                                  <i className="bi bi-building me-2"></i>
                                  Account Details
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Manage account-level settings (admin only).
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Account name and description</li>
                                  <li>• Timezone settings</li>
                                  <li>• Currency preferences</li>
                                  <li>• Account management</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-warning h-100">
                              <div className="card-body">
                                <h5 className="card-title text-warning">
                                  <i className="bi bi-shield-lock me-2"></i>
                                  Security
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Enhance your account security.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Two-factor authentication</li>
                                  <li>• Password management</li>
                                  <li>• Security settings</li>
                                  <li>• Account protection</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-danger h-100">
                              <div className="card-body">
                                <h5 className="card-title text-danger">
                                  <i className="bi bi-people me-2"></i>
                                  Members
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Manage account members (admin only).
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• View account members</li>
                                  <li>• Invite new members</li>
                                  <li>• Manage permissions</li>
                                  <li>• Remove members</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="mb-5">
                    <div className="card bg-danger text-white">
                      <div className="card-body">
                        <h2 className="h3 fw-bold mb-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Danger Zone
                        </h2>
                        <p className="mb-3">
                          Irreversible actions that will permanently affect your account.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-trash me-2"></i>
                              <div>
                                <h5 className="mb-1">Delete Account</h5>
                                <p className="mb-0 small opacity-75">
                                  Permanently delete your account and all associated data including receipts, line items, and account information.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Settings Tips */}
                  <section className="mb-5">
                    <div className="card bg-primary text-white">
                      <div className="card-body">
                        <h2 className="h3 fw-bold mb-3">
                          <i className="bi bi-lightbulb me-2"></i>
                          Settings Tips
                        </h2>
                        <p className="mb-3">
                          Best practices for managing your account and app settings:
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Enable notifications for important updates</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Use dark mode for better battery life</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Keep your profile information updated</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Review privacy policy regularly</span>
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
                          If you need assistance with account settings or have questions, we're here to help!
                        </p>
                        <div className="d-flex justify-content-center gap-3">
                          <Link href="/support" className="btn btn-primary">
                            <i className="bi bi-headset me-2"></i>
                            Contact Support
                          </Link>
                          <Link href="/support/getting-started" className="btn btn-outline-primary">
                            <i className="bi bi-play-circle me-2"></i>
                            Getting Started Guide
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

















