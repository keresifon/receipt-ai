'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, getCurrencySymbol } from '@/lib/currencies'

type SpendingTrends = {
  period: string
  year: number
  month: number
  total: number
  count: number
  growth: number
  growthPercent: number
  categories: number
  stores: number
}

type CategoryBreakdown = {
  category: string
  total: number
  count: number
  percentage: number
}

type StoreBreakdown = {
  store: string
  total: number
  count: number
  percentage: number
}

type OverallStats = {
  totalSpending: number
  totalItems: number
  avgItemPrice: number
  dateRange: {
    start: string
    end: string
  }
  uniqueCategories?: number
  uniqueStores?: number
}

type TrendsData = {
  period: number
  dateRange: {
    start: string
    end: string
  }
  monthlyTrends: SpendingTrends[]
  categoryBreakdown: CategoryBreakdown[]
  storeBreakdown: StoreBreakdown[]
  overallStats: OverallStats | null
}

type ComparisonData = {
  periods: {
    period1: {
      months: number
      start: string
      end: string
      totalSpending: number
      totalItems: number
      avgItemPrice: number
      uniqueCategories: number
      uniqueStores: number
    }
    period2: {
      months: number
      start: string
      end: string
      totalSpending: number
      totalItems: number
      avgItemPrice: number
      uniqueCategories: number
      uniqueStores: number
    }
  }
  changes: {
    spending: {
      absolute: number
      percent: number
      trend: 'increase' | 'decrease' | 'stable'
    }
    items: {
      absolute: number
      percent: number
      trend: 'increase' | 'decrease' | 'stable'
    }
    avgPrice: {
      absolute: number
      percent: number
      trend: 'increase' | 'decrease' | 'stable'
    }
  }
  categoryComparison: Array<{
    category: string
    period1: { total: number; count: number }
    period2: { total: number; count: number }
    change: number
    changePercent: number
  }>
  storeComparison: Array<{
    store: string
    period1: { total: number; count: number }
    period2: { total: number; count: number }
    change: number
    changePercent: number
  }>
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State for different analytics views
  const [activeTab, setActiveTab] = useState<'trends' | 'compare' | 'export'>('trends')
  
  // Trends state
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)
  const [trendsLoading, setTrendsLoading] = useState(false)
  const [trendsPeriod, setTrendsPeriod] = useState('12')
  const [trendsCategory, setTrendsCategory] = useState('')
  const [trendsStore, setTrendsStore] = useState('')
  
  // Comparison state
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [period1, setPeriod1] = useState('3')
  const [period2, setPeriod2] = useState('6')
  const [compareCategory, setCompareCategory] = useState('')
  const [compareStore, setCompareStore] = useState('')
  
  // Export state
  const [exportLoading, setExportLoading] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exportCategory, setExportCategory] = useState('')
  const [exportStore, setExportStore] = useState('')
  
  // Common state
  const [categories, setCategories] = useState<string[]>([])
  const [stores, setStores] = useState<string[]>([])
  const [accountCurrency, setAccountCurrency] = useState<string>('CAD')
  
  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])
  
  // Load categories and stores
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, storesRes, accountRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/stores'),
          fetch('/api/accounts/me')
        ])
        
        const categoriesData = await categoriesRes.json()
        if (categoriesRes.ok) {
          setCategories(categoriesData.categories || [])
        }
        
        const storesData = await storesRes.json()
        if (storesRes.ok) {
          setStores(storesData.stores || [])
        }
        
        const accountData = await accountRes.json()
        if (accountRes.ok && accountData.settings?.currency) {
          setAccountCurrency(accountData.settings.currency)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])
  
  // Load trends data
  const loadTrendsData = async () => {
    setTrendsLoading(true)
    try {
      const params = new URLSearchParams({
        period: trendsPeriod
      })
      
      if (trendsCategory) params.set('category', trendsCategory)
      if (trendsStore) params.set('store', trendsStore)
      
      const res = await fetch(`/api/analytics/trends?${params}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.detail || 'Failed to load trends')
      
      setTrendsData(data)
    } catch (err: any) {
      console.error('Failed to load trends:', err)
    } finally {
      setTrendsLoading(false)
    }
  }
  
  // Load comparison data
  const loadComparisonData = async () => {
    setComparisonLoading(true)
    try {
      const params = new URLSearchParams({
        period1,
        period2
      })
      
      if (compareCategory) params.set('category', compareCategory)
      if (compareStore) params.set('store', compareStore)
      
      const res = await fetch(`/api/analytics/compare?${params}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.detail || 'Failed to load comparison')
      
      setComparisonData(data)
    } catch (err: any) {
      console.error('Failed to load comparison:', err)
    } finally {
      setComparisonLoading(false)
    }
  }
  
  // Export data
  const exportData = async (format: 'json' | 'csv') => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams({
        format
      })
      
      if (exportStartDate) params.set('startDate', exportStartDate)
      if (exportEndDate) params.set('endDate', exportEndDate)
      if (exportCategory) params.set('category', exportCategory)
      if (exportStore) params.set('store', exportStore)
      
      if (format === 'csv') {
        // For CSV, create a download link
        const url = `/api/export?${params}`
        const link = document.createElement('a')
        link.href = url
        link.download = `receipts-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // For JSON, fetch and download
        const res = await fetch(`/api/export?${params}`)
        const data = await res.json()
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `receipts-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error('Export failed:', err)
    } finally {
      setExportLoading(false)
    }
  }
  
  // Auto-load data when parameters change
  useEffect(() => {
    if (activeTab === 'trends') {
      loadTrendsData()
    }
  }, [trendsPeriod, trendsCategory, trendsStore])
  
  useEffect(() => {
    if (activeTab === 'compare') {
      loadComparisonData()
    }
  }, [period1, period2, compareCategory, compareStore])
  
  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }
  
  // Don't render for unauthenticated users
  if (status === 'unauthenticated') {
    return null
  }

  const currencySymbol = getCurrencySymbol(accountCurrency)

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-2">Analytics & Insights</h1>
          <p className="mb-0 text-muted">
            Analyze your spending patterns, compare periods, and export data
          </p>
        </div>
      </div>

            {/* Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-body p-0">
          {/* Mobile: Stacked tabs, Desktop: Horizontal tabs */}
          <ul className="nav nav-tabs nav-fill flex-column flex-md-row" role="tablist" style={{ 
            borderBottom: 'none',
            margin: 0
          }}>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link border-0 ${activeTab === 'trends' ? 'active bg-primary text-white' : 'text-muted'}`}
                onClick={() => setActiveTab('trends')}
                type="button"
                style={{ 
                  border: 'none',
                  backgroundColor: activeTab === 'trends' ? '#0d6efd' : 'transparent',
                  color: activeTab === 'trends' ? '#ffffff' : '#6c757d',
                  fontWeight: activeTab === 'trends' ? '600' : '400',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s ease-in-out',
                  minWidth: 'auto',
                  width: '100%',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'trends') {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.color = '#495057'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'trends') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#6c757d'
                  }
                }}
              >
                <i className="bi bi-graph-up me-2"></i>
                <span className="fw-semibold d-none d-sm-inline">Spending Trends</span>
                <span className="fw-semibold d-sm-none">Trends</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link border-0 ${activeTab === 'compare' ? 'active bg-primary text-white' : 'text-muted'}`}
                onClick={() => setActiveTab('compare')}
                type="button"
                style={{ 
                  border: 'none',
                  backgroundColor: activeTab === 'compare' ? '#0d6efd' : 'transparent',
                  color: activeTab === 'compare' ? '#ffffff' : '#6c757d',
                  fontWeight: activeTab === 'compare' ? '600' : '400',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s ease-in-out',
                  minWidth: 'auto',
                  width: '100%',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'compare') {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.color = '#495057'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'compare') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#6c757d'
                  }
                }}
              >
                <i className="bi bi-arrow-left-right me-2"></i>
                <span className="fw-semibold d-none d-lg-inline">Comparative Analysis</span>
                <span className="fw-semibold d-lg-none d-none d-sm-inline">Compare</span>
                <span className="fw-semibold d-sm-none">Compare</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link border-0 ${activeTab === 'export' ? 'active bg-primary text-white' : 'text-muted'}`}
                onClick={() => setActiveTab('export')}
                type="button"
                style={{ 
                  border: 'none',
                  backgroundColor: activeTab === 'export' ? '#0d6efd' : 'transparent',
                  color: activeTab === 'export' ? '#ffffff' : '#6c757d',
                  fontWeight: activeTab === 'export' ? '600' : '400',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s ease-in-out',
                  minWidth: 'auto',
                  width: '100%',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'export') {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.color = '#495057'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'export') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#6c757d'
                  }
                }}
              >
                <i className="bi bi-download me-2"></i>
                <span className="fw-semibold d-none d-sm-inline">Export Data</span>
                <span className="fw-semibold d-sm-none">Export</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="tab-content">
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">Time Period</label>
                  <select
                    className="form-select"
                    value={trendsPeriod}
                    onChange={(e) => setTrendsPeriod(e.target.value)}
                  >
                    <option value="3">Last 3 months</option>
                    <option value="6">Last 6 months</option>
                    <option value="12">Last 12 months</option>
                    <option value="24">Last 24 months</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={trendsCategory}
                    onChange={(e) => setTrendsCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">Store</label>
                  <select
                    className="form-select"
                    value={trendsStore}
                    onChange={(e) => setTrendsStore(e.target.value)}
                  >
                    <option value="">All Stores</option>
                    {stores.map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-primary w-100"
                    onClick={loadTrendsData}
                    disabled={trendsLoading}
                  >
                    {trendsLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        <span className="d-none d-sm-inline">Loading...</span>
                        <span className="d-sm-none">Load</span>
                      </>
                    ) : (
                      <>
                        <span className="d-none d-sm-inline">Refresh Data</span>
                        <span className="d-sm-none">Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trends Data */}
          {trendsData && (
            <div className="row">
              {/* Summary Cards */}
              <div className="col-6 col-md-3 mb-3 mb-md-4">
                <div className="card text-center h-100">
                  <div className="card-body d-flex flex-column justify-content-center">
                    <h6 className="card-title text-muted mb-2 d-none d-md-block">Total Spending</h6>
                    <h6 className="card-title text-muted mb-2 d-md-none">Total</h6>
                    <h4 className="text-primary mb-1">
                      {formatCurrency(trendsData.overallStats?.totalSpending || 0, accountCurrency)}
                    </h4>
                    <small className="text-muted">
                      {trendsData.overallStats?.totalItems || 0} items
                    </small>
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-md-3 mb-3 mb-md-4">
                <div className="card text-center h-100">
                  <div className="card-body d-flex flex-column justify-content-center">
                    <h6 className="card-title text-muted mb-2 d-none d-md-block">Avg Item Price</h6>
                    <h6 className="card-title text-muted mb-2 d-md-none">Avg Price</h6>
                    <h4 className="text-success mb-1">
                      {formatCurrency(trendsData.overallStats?.avgItemPrice || 0, accountCurrency)}
                    </h4>
                    <small className="text-muted">per item</small>
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-md-3 mb-3 mb-md-4">
                <div className="card text-center h-100">
                  <div className="card-body d-flex flex-column justify-content-center">
                    <h6 className="card-title text-muted mb-2">Categories</h6>
                    <h4 className="text-info mb-1">
                      {trendsData.overallStats?.uniqueCategories || 0}
                    </h4>
                    <small className="text-muted">unique</small>
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-md-3 mb-3 mb-md-4">
                <div className="card text-center h-100">
                  <div className="card-body d-flex flex-column justify-content-center">
                    <h6 className="card-title text-muted mb-2">Stores</h6>
                    <h4 className="text-warning mb-1">
                      {trendsData.overallStats?.uniqueStores || 0}
                    </h4>
                    <small className="text-muted">unique</small>
                  </div>
                </div>
              </div>

              {/* Monthly Trends Chart */}
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Monthly Spending Trends</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th className="d-none d-md-table-cell">Period</th>
                            <th>Total</th>
                            <th className="d-none d-sm-table-cell">Items</th>
                            <th className="d-none d-lg-table-cell">Growth</th>
                            <th className="d-none d-lg-table-cell">Categories</th>
                            <th className="d-none d-lg-table-cell">Stores</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendsData.monthlyTrends.map((month, index) => (
                            <tr key={month.period}>
                              <td className="d-none d-md-table-cell">
                                {new Date(month.year, month.month - 1).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="fw-bold">
                                {formatCurrency(month.total, accountCurrency)}
                                <small className="d-md-none d-block text-muted">
                                  {new Date(month.year, month.month - 1).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </small>
                              </td>
                              <td className="d-none d-sm-table-cell">{month.count}</td>
                              <td className="d-none d-lg-table-cell">
                                <span className={`badge ${
                                  month.growth > 0 ? 'bg-success' : 
                                  month.growth < 0 ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {month.growth > 0 ? '+' : ''}{formatCurrency(month.growth, accountCurrency)}
                                  {month.growthPercent !== 0 && (
                                    <span className="ms-1">
                                      ({month.growthPercent > 0 ? '+' : ''}{month.growthPercent}%)
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="d-none d-lg-table-cell">{month.categories}</td>
                              <td className="d-none d-lg-table-cell">{month.stores}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="col-12 col-lg-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Category Breakdown</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Total</th>
                            <th>Count</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendsData.categoryBreakdown.slice(0, 10).map(cat => (
                            <tr key={cat.category}>
                              <td>{cat.category}</td>
                              <td className="fw-bold">
                                {formatCurrency(cat.total, accountCurrency)}
                              </td>
                              <td>{cat.count}</td>
                              <td>{cat.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Breakdown */}
              <div className="col-12 col-lg-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Store Breakdown</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Store</th>
                            <th>Total</th>
                            <th>Count</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendsData.storeBreakdown.slice(0, 10).map(store => (
                            <tr key={store.store}>
                              <td>{store.store}</td>
                              <td className="fw-bold">
                                {formatCurrency(store.total, accountCurrency)}
                              </td>
                              <td>{store.count}</td>
                              <td>{store.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'compare' && (
        <div className="tab-content">
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label">Period 1</label>
                  <select
                    className="form-select"
                    value={period1}
                    onChange={(e) => setPeriod1(e.target.value)}
                  >
                    <option value="1">1 month</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label">Period 2</label>
                  <select
                    className="form-select"
                    value={period2}
                    onChange={(e) => setPeriod2(e.target.value)}
                  >
                    <option value="1">1 month</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={compareCategory}
                    onChange={(e) => setCompareCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label">Store</label>
                  <select
                    className="form-select"
                    value={compareStore}
                    onChange={(e) => setCompareStore(e.target.value)}
                  >
                    <option value="">All Stores</option>
                    {stores.map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-2 d-flex align-items-end">
                  <button
                    className="btn btn-primary w-100"
                    onClick={loadComparisonData}
                    disabled={comparisonLoading}
                  >
                    {comparisonLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        <span className="d-none d-sm-inline">Loading...</span>
                        <span className="d-sm-none">Load</span>
                      </>
                    ) : (
                      <>
                        <span className="d-none d-sm-inline">Compare</span>
                        <span className="d-sm-none">Go</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Data */}
          {comparisonData && (
            <div className="row">
              {/* Summary Cards */}
              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Period 1 ({comparisonData.periods.period1.months} months)</h5>
                    <small className="text-muted">
                      {comparisonData.periods.period1.start} to {comparisonData.periods.period1.end}
                    </small>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <h4 className="text-primary">
                          {formatCurrency(comparisonData.periods.period1.totalSpending, accountCurrency)}
                        </h4>
                        <small className="text-muted">Total</small>
                      </div>
                      <div className="col-4">
                        <h4 className="text-success">
                          {comparisonData.periods.period1.totalItems}
                        </h4>
                        <small className="text-muted">Items</small>
                      </div>
                      <div className="col-4">
                        <h4 className="text-info">
                          {formatCurrency(comparisonData.periods.period1.avgItemPrice, accountCurrency)}
                        </h4>
                        <small className="text-muted">Avg Price</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Period 2 ({comparisonData.periods.period2.months} months)</h5>
                    <small className="text-muted">
                      {comparisonData.periods.period2.start} to {comparisonData.periods.period2.end}
                    </small>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <h4 className="text-primary">
                          {formatCurrency(comparisonData.periods.period2.totalSpending, accountCurrency)}
                        </h4>
                        <small className="text-muted">Total</small>
                      </div>
                      <div className="col-4">
                        <h4 className="text-success">
                          {comparisonData.periods.period2.totalItems}
                        </h4>
                        <small className="text-muted">Items</small>
                      </div>
                      <div className="col-4">
                        <h4 className="text-info">
                          {formatCurrency(comparisonData.periods.period2.avgItemPrice, accountCurrency)}
                        </h4>
                        <small className="text-muted">Avg Price</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes Summary */}
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Changes Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-md-4">
                        <div className={`card border-${comparisonData.changes.spending.trend === 'increase' ? 'danger' : 'success'}`}>
                          <div className="card-body">
                            <h5 className="card-title">Spending</h5>
                            <h3 className={`text-${comparisonData.changes.spending.trend === 'increase' ? 'danger' : 'success'}`}>
                              {comparisonData.changes.spending.trend === 'increase' ? '+' : ''}
                              {formatCurrency(comparisonData.changes.spending.absolute, accountCurrency)}
                            </h3>
                            <small className="text-muted">
                              {comparisonData.changes.spending.trend === 'increase' ? '+' : ''}
                              {comparisonData.changes.spending.percent}%
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className={`card border-${comparisonData.changes.items.trend === 'increase' ? 'danger' : 'success'}`}>
                          <div className="card-body">
                            <h5 className="card-title">Items</h5>
                            <h3 className={`text-${comparisonData.changes.items.trend === 'increase' ? 'danger' : 'success'}`}>
                              {comparisonData.changes.items.trend === 'increase' ? '+' : ''}
                              {comparisonData.changes.items.absolute}
                            </h3>
                            <small className="text-muted">
                              {comparisonData.changes.items.trend === 'increase' ? '+' : ''}
                              {comparisonData.changes.items.percent}%
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className={`card border-${comparisonData.changes.avgPrice.trend === 'increase' ? 'danger' : 'success'}`}>
                          <div className="card-body">
                            <h5 className="card-title">Avg Price</h5>
                            <h3 className={`text-${comparisonData.changes.avgPrice.trend === 'increase' ? 'danger' : 'success'}`}>
                              {comparisonData.changes.avgPrice.trend === 'increase' ? '+' : ''}
                              {formatCurrency(comparisonData.changes.avgPrice.absolute, accountCurrency)}
                            </h3>
                            <small className="text-muted">
                              {comparisonData.changes.avgPrice.trend === 'increase' ? '+' : ''}
                              {comparisonData.changes.avgPrice.percent}%
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Comparison */}
              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Category Comparison</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>P1</th>
                            <th>P2</th>
                            <th>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.categoryComparison.slice(0, 10).map(cat => (
                            <tr key={cat.category}>
                              <td>{cat.category}</td>
                              <td>{formatCurrency(cat.period1.total, accountCurrency)}</td>
                              <td>{formatCurrency(cat.period2.total, accountCurrency)}</td>
                              <td>
                                <span className={`badge ${
                                  cat.change > 0 ? 'bg-danger' : 
                                  cat.change < 0 ? 'bg-success' : 'bg-secondary'
                                }`}>
                                  {cat.change > 0 ? '+' : ''}{formatCurrency(cat.change, accountCurrency)}
                                  ({cat.changePercent > 0 ? '+' : ''}{cat.changePercent}%)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Comparison */}
              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Store Comparison</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Store</th>
                            <th>P1</th>
                            <th>P2</th>
                            <th>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.storeComparison.slice(0, 10).map(store => (
                            <tr key={store.store}>
                              <td>{store.store}</td>
                              <td>{formatCurrency(store.period1.total, accountCurrency)}</td>
                              <td>{formatCurrency(store.period2.total, accountCurrency)}</td>
                              <td>
                                <span className={`badge ${
                                  store.change > 0 ? 'bg-danger' : 
                                  store.change < 0 ? 'bg-success' : 'bg-secondary'
                                }`}>
                                  {store.change > 0 ? '+' : ''}{formatCurrency(store.change, accountCurrency)}
                                  ({store.changePercent > 0 ? '+' : ''}{store.changePercent}%)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Export Your Data</h5>
              <small className="text-muted">
                Export your receipt data in various formats for analysis, tax purposes, or backup
              </small>
            </div>
            <div className="card-body">
              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={exportCategory}
                    onChange={(e) => setExportCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label">Store</label>
                  <select
                    className="form-select"
                    value={exportStore}
                    onChange={(e) => setExportStore(e.target.value)}
                  >
                    <option value="">All Stores</option>
                    {stores.map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div className="card border-primary h-100">
                    <div className="card-body text-center d-flex flex-column">
                      <h5 className="card-title text-primary">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        <span className="d-none d-sm-inline">Export as CSV</span>
                        <span className="d-sm-none">CSV Export</span>
                      </h5>
                      <p className="card-text flex-grow-1">
                        <span className="d-none d-md-inline">
                          Download your data as a CSV file for use in Excel, Google Sheets, or other spreadsheet applications.
                        </span>
                        <span className="d-md-none">
                          Download as CSV for spreadsheets
                        </span>
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => exportData('csv')}
                        disabled={exportLoading}
                      >
                        {exportLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            <span className="d-none d-sm-inline">Exporting...</span>
                            <span className="d-sm-none">Exporting</span>
                          </>
                        ) : (
                          <>
                            <span className="d-none d-sm-inline">Download CSV</span>
                            <span className="d-sm-none">CSV</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="card border-success h-100">
                    <div className="card-body text-center d-flex flex-column">
                      <h5 className="card-title text-success">
                        <i className="bi bi-file-earmark-code me-2"></i>
                        <span className="d-none d-sm-inline">Export as JSON</span>
                        <span className="d-sm-none">JSON Export</span>
                      </h5>
                      <p className="card-text flex-grow-1">
                        <span className="d-none d-md-inline">
                          Download your data as a JSON file for use in other applications or for backup purposes.
                        </span>
                        <span className="d-md-none">
                          Download as JSON for applications
                        </span>
                      </p>
                      <button
                        className="btn btn-success"
                        onClick={() => exportData('json')}
                        disabled={exportLoading}
                      >
                        {exportLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            <span className="d-none d-sm-inline">Exporting...</span>
                            <span className="d-sm-none">Exporting</span>
                          </>
                        ) : (
                          <>
                            <span className="d-none d-sm-inline">Download JSON</span>
                            <span className="d-sm-none">JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="alert alert-info">
                  <h6 className="alert-heading">Export Features:</h6>
                  <ul className="mb-0">
                    <li><strong>Filtered Data:</strong> Export only the data you need using date ranges, categories, and stores</li>
                    <li><strong>Complete Information:</strong> Includes all receipt details, line items, and metadata</li>
                    <li><strong>Multiple Formats:</strong> Choose between CSV for spreadsheets or JSON for applications</li>
                    <li><strong>Tax Ready:</strong> Perfect for tax preparation and financial reporting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
