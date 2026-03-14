import React from 'react'
import Link from 'next/link'

export default function ExportDataGuide() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <div className="text-center mb-5">
                <h1 className="display-4 fw-bold text-dark mb-3">Exporting Data Guide</h1>
                <p className="lead text-muted">
                  <i className="bi bi-download me-2"></i>
                  How to export your expense data for accounting and tax purposes
                </p>
              </div>

              <div className="row">
                <div className="col-12">
                  
                  {/* Accessing Export */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-box-arrow-up text-primary me-2"></i>
                          Accessing the Export Feature
                        </h2>
                        <p className="text-muted mb-3">
                          The Export feature is accessible from the main navigation bar in your app.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">1</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Open Export Tab</h5>
                                <p className="text-muted small mb-0">Tap the "Export" tab in the bottom navigation</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">2</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Choose Export Format</h5>
                                <p className="text-muted small mb-0">Select CSV or Text format for your export</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">3</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Select Date Range</h5>
                                <p className="text-muted small mb-0">Choose the time period for your export</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">4</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Configure Options</h5>
                                <p className="text-muted small mb-0">Choose what data to include in the export</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Export Formats */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-file-earmark-text text-success me-2"></i>
                          Export Formats
                        </h2>
                        <p className="text-muted mb-3">
                          Choose the format that best suits your needs.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border-success h-100">
                              <div className="card-body">
                                <h5 className="card-title text-success">
                                  <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                                  CSV Format
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Comma-separated values format, perfect for Excel and accounting software.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Compatible with Excel, Google Sheets</li>
                                  <li>• Easy to import into accounting software</li>
                                  <li>• Structured data format</li>
                                  <li>• Perfect for tax preparation</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-info h-100">
                              <div className="card-body">
                                <h5 className="card-title text-info">
                                  <i className="bi bi-file-text me-2"></i>
                                  Text Format
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Plain text format, readable and easy to review.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Human-readable format</li>
                                  <li>• Easy to review and edit</li>
                                  <li>• Compatible with any text editor</li>
                                  <li>• Good for quick reference</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Date Range Options */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-calendar-range text-info me-2"></i>
                          Date Range Options
                        </h2>
                        <p className="text-muted mb-3">
                          Select the time period for your data export.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-calendar-check text-primary fs-2 mb-3"></i>
                                <h5 className="card-title">All Time</h5>
                                <p className="card-text text-muted small">Export all your receipt data</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-calendar-month text-success fs-2 mb-3"></i>
                                <h5 className="card-title">This Month</h5>
                                <p className="card-text text-muted small">Current month's expenses only</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-4">
                            <div className="card border h-100">
                              <div className="card-body text-center">
                                <i className="bi bi-calendar3 text-info fs-2 mb-3"></i>
                                <h5 className="card-title">Custom Range</h5>
                                <p className="card-text text-muted small">Select specific start and end dates</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Export Options */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-gear text-warning me-2"></i>
                          Export Options
                        </h2>
                        <p className="text-muted mb-3">
                          Choose what data to include in your export.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Categories</h5>
                                <p className="text-muted small mb-0">Include expense categories for better organization</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Store Names</h5>
                                <p className="text-muted small mb-0">Include merchant/store information</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Prices</h5>
                                <p className="text-muted small mb-0">Include all price and amount information</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                              <div>
                                <h5 className="mb-1">Dates</h5>
                                <p className="text-muted small mb-0">Include purchase dates for each transaction</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Export Process */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                          Export Process
                        </h2>
                        <p className="text-muted mb-3">
                          Follow these steps to complete your export.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">1</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Configure Settings</h5>
                                <p className="text-muted small mb-0">Select format, date range, and data options</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">2</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Tap Export Button</h5>
                                <p className="text-muted small mb-0">Tap "Export Data" to start the process</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">3</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Wait for Processing</h5>
                                <p className="text-muted small mb-0">App will fetch all your data and generate the file</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '30px', height: '30px'}}>
                                <span className="small fw-bold">4</span>
                              </div>
                              <div>
                                <h5 className="mb-1">Share File</h5>
                                <p className="text-muted small mb-0">Use the share sheet to save or send the file</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Using Exported Data */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-file-earmark-spreadsheet text-success me-2"></i>
                          Using Your Exported Data
                        </h2>
                        <p className="text-muted mb-3">
                          Here's how to use your exported data for different purposes.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border-success h-100">
                              <div className="card-body">
                                <h5 className="card-title text-success">
                                  <i className="bi bi-calculator me-2"></i>
                                  Tax Preparation
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Use your exported data for tax filing and deductions.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Import into tax software</li>
                                  <li>• Categorize business expenses</li>
                                  <li>• Calculate deductions</li>
                                  <li>• Keep records for audits</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-info h-100">
                              <div className="card-body">
                                <h5 className="card-title text-info">
                                  <i className="bi bi-graph-up me-2"></i>
                                  Accounting Software
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Import data into your accounting system.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• QuickBooks integration</li>
                                  <li>• Excel spreadsheet import</li>
                                  <li>• Google Sheets analysis</li>
                                  <li>• Custom accounting systems</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-warning h-100">
                              <div className="card-body">
                                <h5 className="card-title text-warning">
                                  <i className="bi bi-building me-2"></i>
                                  Business Reporting
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Create reports for business analysis.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Monthly expense reports</li>
                                  <li>• Budget analysis</li>
                                  <li>• Spending trends</li>
                                  <li>• Cost center tracking</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-primary h-100">
                              <div className="card-body">
                                <h5 className="card-title text-primary">
                                  <i className="bi bi-person-check me-2"></i>
                                  Personal Finance
                                </h5>
                                <p className="card-text text-muted small mb-3">
                                  Track personal spending and budgeting.
                                </p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Personal budget tracking</li>
                                  <li>• Spending analysis</li>
                                  <li>• Financial planning</li>
                                  <li>• Expense categorization</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Troubleshooting */}
                  <section className="mb-5">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h2 className="h3 fw-bold text-dark mb-3">
                          <i className="bi bi-tools text-warning me-2"></i>
                          Troubleshooting Export Issues
                        </h2>
                        <p className="text-muted mb-3">
                          Common issues and solutions when exporting data.
                        </p>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="card border-warning">
                              <div className="card-body">
                                <h5 className="card-title text-warning">
                                  <i className="bi bi-exclamation-triangle me-2"></i>
                                  Export Takes Too Long
                                </h5>
                                <p className="card-text text-muted small mb-2">Export process seems to hang or take forever</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Check internet connection</li>
                                  <li>• Try smaller date range</li>
                                  <li>• Restart the app</li>
                                  <li>• Contact support if persistent</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-info">
                              <div className="card-body">
                                <h5 className="card-title text-info">
                                  <i className="bi bi-file-x me-2"></i>
                                  Empty Export File
                                </h5>
                                <p className="card-text text-muted small mb-2">Exported file contains no data</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Check date range selection</li>
                                  <li>• Ensure you have receipts in that period</li>
                                  <li>• Try "All Time" option</li>
                                  <li>• Verify data options are selected</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-danger">
                              <div className="card-body">
                                <h5 className="card-title text-danger">
                                  <i className="bi bi-share me-2"></i>
                                  Can't Share File
                                </h5>
                                <p className="card-text text-muted small mb-2">Share sheet doesn't appear or work</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Check iOS version compatibility</li>
                                  <li>• Restart the app</li>
                                  <li>• Try different sharing method</li>
                                  <li>• Update to latest app version</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-6">
                            <div className="card border-success">
                              <div className="card-body">
                                <h5 className="card-title text-success">
                                  <i className="bi bi-check-circle me-2"></i>
                                  File Format Issues
                                </h5>
                                <p className="card-text text-muted small mb-2">File doesn't open in expected application</p>
                                <ul className="list-unstyled small text-muted">
                                  <li>• Try different format (CSV vs Text)</li>
                                  <li>• Check file extension</li>
                                  <li>• Use appropriate app to open</li>
                                  <li>• Contact support for help</li>
                                </ul>
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
                        <h3 className="h5 fw-bold text-dark mb-3">Need More Help?</h3>
                        <p className="text-muted mb-3">
                          If you're having trouble with data export, we're here to help!
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

















