import React from 'react'
import Link from 'next/link'

export default function ReceiptScanningGuide() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="text-center mb-5">
                <h1 className="display-4 fw-bold text-dark mb-3">Receipt Scanning Tips</h1>
                <p className="lead text-muted">
                  <i className="bi bi-camera me-2"></i>
                  Best practices for getting accurate results from receipt photos
                </p>
              </div>

              <div className="row">
                <div className="col-12">
                  
                  {/* Camera Setup */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-camera text-primary me-2"></i>
                          Camera Setup & Permissions
                        </h2>
                        <p className="text-muted mb-3">
                          Before scanning receipts, ensure your camera is properly set up.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Enable Camera Access</h5>
                                <p className="text-muted small mb-0">Allow camera permissions when prompted by the app</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Clean Camera Lens</h5>
                                <p className="text-muted small mb-0">Wipe your camera lens clean for clear photos</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Stable Position</h5>
                                <p className="text-muted small mb-0">Hold your phone steady or use a flat surface</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Good Lighting</h5>
                                <p className="text-muted small mb-0">Ensure adequate lighting for clear text visibility</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Receipt Preparation */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-file-text text-success me-2"></i>
                          Receipt Preparation
                        </h2>
                        <p className="text-muted mb-3">
                          Prepare your receipt for the best scanning results.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="card h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-file-earmark-text text-primary fs-1 mb-3"></i>
                                <h5 className="card-title">Flatten Receipt</h5>
                                <p className="card-text text-muted">Smooth out any wrinkles or folds in the receipt</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-lightbulb text-warning fs-1 mb-3"></i>
                                <h5 className="card-title">Good Lighting</h5>
                                <p className="card-text text-muted">Use natural light or bright indoor lighting</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-square text-info fs-1 mb-3"></i>
                                <h5 className="card-title">Clean Background</h5>
                                <p className="card-text text-muted">Place receipt on a clean, contrasting surface</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Scanning Techniques */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-camera2 text-info me-2"></i>
                          Scanning Techniques
                        </h2>
                        <p className="text-muted mb-3">
                          Follow these techniques for optimal scanning results.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">1</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Position Receipt</h5>
                                <p className="text-muted small mb-0">Place receipt flat with all text visible</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">2</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Align Camera</h5>
                                <p className="text-muted small mb-0">Hold phone directly above the receipt</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">3</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Check Focus</h5>
                                <p className="text-muted small mb-0">Ensure text is sharp and readable</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">4</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Capture Photo</h5>
                                <p className="text-muted small mb-0">Tap the capture button when ready</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Common Issues */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                          Common Issues & Solutions
                        </h2>
                        <p className="text-muted mb-3">
                          Troubleshoot common scanning problems.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border-warning">
                              <div className="card-body">
                                <h5 className="card-title text-warning">
                                  <i className="bi bi-eye-slash me-2"></i>
                                  Blurry Text
                                </h5>
                                <p className="card-text text-muted small mb-2">Text appears blurry or unreadable</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Hold phone steady</li>
                                  <li>• Ensure good lighting</li>
                                  <li>• Clean camera lens</li>
                                  <li>• Try different angles</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-info">
                              <div className="card-body">
                                <h5 className="card-title text-info">
                                  <i className="bi bi-brightness-low me-2"></i>
                                  Poor Lighting
                                </h5>
                                <p className="card-text text-muted small mb-2">Receipt is too dark or too bright</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Move to better lighting</li>
                                  <li>• Avoid direct sunlight</li>
                                  <li>• Use indoor lighting</li>
                                  <li>• Adjust phone brightness</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-danger">
                              <div className="card-body">
                                <h5 className="card-title text-danger">
                                  <i className="bi bi-file-earmark-x me-2"></i>
                                  Incomplete Receipt
                                </h5>
                                <p className="card-text text-muted small mb-2">Parts of receipt are cut off</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Move phone further back</li>
                                  <li>• Ensure entire receipt is visible</li>
                                  <li>• Use landscape orientation</li>
                                  <li>• Take multiple photos if needed</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-success">
                              <div className="card-body">
                                <h5 className="card-title text-success">
                                  <i className="bi bi-check-circle me-2"></i>
                                  Wrong Data Extracted
                                </h5>
                                <p className="card-text text-muted small mb-2">AI extracts incorrect information</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Manually edit the data</li>
                                  <li>• Rescan with better lighting</li>
                                  <li>• Check receipt quality</li>
                                  <li>• Contact support if persistent</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Best Practices */}
                  <section className="mb-5">
                    <div className="card bg-primary text-white">
                      <div className="card-body">
                        <h2 className="h3 fw-bold mb-3">
                          <i className="bi bi-star me-2"></i>
                          Best Practices
                        </h2>
                        <p className="mb-3">
                          Follow these best practices for consistent, accurate results:
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Scan receipts immediately after purchase</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Keep receipts flat and unfolded</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Use consistent lighting conditions</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle me-2"></i>
                              <span>Review extracted data before saving</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Receipt Types */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-receipt text-success me-2"></i>
                          Supported Receipt Types
                        </h2>
                        <p className="text-muted mb-3">
                          Our AI works best with these types of receipts:
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-shop text-primary fs-2 mb-2"></i>
                                <h6 className="card-title">Retail Stores</h6>
                                <p className="card-text text-muted small">Grocery, clothing, electronics</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-cup text-success fs-2 mb-2"></i>
                                <h6 className="card-title">Restaurants</h6>
                                <p className="card-text text-muted small">Dining, cafes, fast food</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-fuel-pump text-info fs-2 mb-2"></i>
                                <h6 className="card-title">Gas Stations</h6>
                                <p className="card-text text-muted small">Fuel, convenience stores</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-3">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-truck text-warning fs-2 mb-2"></i>
                                <h6 className="card-title">Services</h6>
                                <p className="card-text text-muted small">Repairs, maintenance, utilities</p>
                              </div>
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
                        <h3 className="h5 fw-bold text-dark mb-3">Still Having Issues?</h3>
                        <p className="text-muted mb-3">
                          If you're still experiencing problems with receipt scanning, we're here to help!
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

















