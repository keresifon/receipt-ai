'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Legend
} from 'recharts'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [filteredData, setFilteredData] = useState<any>(null)

  useEffect(() => {
    (async () => {
      try {
        const [analyticsRes, monthsRes] = await Promise.all([
          fetch('/api/analytics', { cache: 'no-store' }),
          fetch('/api/months', { cache: 'no-store' })
        ])
        
        const analyticsJson = await analyticsRes.json()
        if (!analyticsRes.ok) throw new Error(analyticsJson?.detail || 'Failed to load analytics')
        setData(analyticsJson)
        
        const monthsJson = await monthsRes.json()
        if (monthsRes.ok) {
          setAvailableMonths(monthsJson.months || [])
        }
      } catch (e: any) { setError(e.message) }
    })()
  }, [])

  // Load filtered data when month changes
  useEffect(() => {
    if (!selectedMonth) {
      setFilteredData(data)
      return
    }

    const loadFilteredData = async () => {
      try {
        const res = await fetch(`/api/analytics-filtered?month=${selectedMonth}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.detail || 'Failed to load filtered analytics')
        setFilteredData(json)
      } catch (e: any) {
        setError(e.message)
      }
    }

    loadFilteredData()
  }, [selectedMonth, data])

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    const now = new Date()
    // Use local date to avoid timezone issues
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    const currentData = filteredData || data
    console.log('useEffect triggered - today:', today)
    
    if (!currentData?.recent) {
      setRecent([])
      return
    }
    
    // Filter to show only today's items
    const todaysItems = currentData.recent.filter((item: any) => item.date === today)
    console.log('Today\'s items found:', todaysItems.length)
    setRecent(todaysItems.slice(0, 20))
  }, [filteredData, data])

  if (error) return <main className="p-6">Error: {error}</main>
  if (!data) return <main className="p-6">Loading…</main>

  const currentData = filteredData || data
  const { monthly, byCategory, byStore, totals } = currentData
  
  // Debug logging
  console.log('Dashboard data loaded:', !!currentData)
  console.log('Recent items available:', currentData?.recent?.length || 0)
  console.log('Today variable:', today)

  return (
    <div className="container-fluid py-3 py-md-4">
      <div className="text-center mb-4">
        <h1 className="h2 h1-md fw-bold">Spending Dashboard</h1>
        <p className="lead text-muted">
          Track your expenses and analyze spending patterns
          <span className="d-block small text-muted mt-1">
            <i className="bi bi-calendar-check me-1"></i>
            Today: {new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </p>
      </div>



      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}



      <div className="row g-3 g-md-4 mb-4">
        {/* Month Filter Card */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold mb-3">
                <i className="bi bi-calendar3 me-2"></i>
                Filter by Month
              </div>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="form-select mb-2"
              >
                <option value="">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </option>
                ))}
              </select>
              {selectedMonth && (
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Filtering: {new Date(selectedMonth + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </small>
                  <button
                    onClick={() => setSelectedMonth('')}
                    className="btn btn-outline-secondary btn-sm"
                    title="Clear filter"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Spend Card */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-muted small text-uppercase fw-semibold">
                  {selectedMonth ? 'Month' : 'Total'} Spend
                </div>
                <div className="h3 fw-bold text-success mb-0">${totals.total?.toFixed(2) || '0.00'}</div>
                {selectedMonth && (
                  <small className="text-muted">
                    for {new Date(selectedMonth + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </small>
                )}
              </div>
              <div className="ms-3 d-none d-md-block">
                <div className="bg-success bg-opacity-10 rounded p-3">
                  <i className="bi bi-currency-dollar text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Items Card */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-muted small text-uppercase fw-semibold">
                  {selectedMonth ? 'Month' : 'Total'} Items
                </div>
                <div className="h3 fw-bold text-primary mb-0">{totals.count || 0}</div>
                {selectedMonth && (
                  <small className="text-muted">
                    for {new Date(selectedMonth + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </small>
                )}
              </div>
              <div className="ms-3 d-none d-md-block">
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <i className="bi bi-receipt text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Distinct Stores Card */}
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-muted small text-uppercase fw-semibold">
                  {selectedMonth ? 'Month' : 'Total'} Stores
                </div>
                <div className="h3 fw-bold text-info mb-0">{new Set((byStore || []).map((s: any) => s.store)).size}</div>
                {selectedMonth && (
                  <small className="text-muted">
                    for {new Date(selectedMonth + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </small>
                )}
              </div>
              <div className="ms-3 d-none d-md-block">
                <div className="bg-info bg-opacity-10 rounded p-3">
                  <i className="bi bi-shop text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                {selectedMonth ? 'Month Breakdown' : 'Monthly Spend'}
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#0d6efd" strokeWidth={3} dot={{ fill: '#0d6efd', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                {selectedMonth ? 'Stores This Month' : 'By Store'}
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={byStore} 
                      dataKey="total" 
                      nameKey="store" 
                      outerRadius={80} 
                      fill="#8884d8"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                {selectedMonth ? 'Categories This Month' : 'By Category'}
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#198754" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0">
                  Today's Purchases
                </h5>
                <div className="d-flex gap-2">
                  <a href="/records" className="btn btn-primary btn-sm">
                    <i className="bi bi-pencil-square me-2"></i>
                    Manage All Records
                  </a>
                </div>
              </div>
              {recent.length > 0 && (
                <div className="d-flex align-items-center gap-3">
                  <div className="text-success fw-bold fs-6">
                    <i className="bi bi-currency-dollar me-1"></i>
                    Today's Total: ${recent.reduce((sum: number, item: any) => {
                      const amount = Number(item.total_price || 0)
                      return sum + amount
                    }, 0).toFixed(2)}
                  </div>
                  <div className="text-muted small">
                    <i className="bi bi-receipt me-1"></i>
                    {recent.length} item{recent.length !== 1 ? 's' : ''} purchased today
                  </div>
                </div>
              )}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Store</th>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length > 0 ? (
                      recent.map((r: any) => {
                        const isSpecialItem = ['hst', 'discount'].includes(String(r.description).toLowerCase())
                        return (
                          <tr key={r._id} className={isSpecialItem ? 'table-info' : ''}>
                            <td>{r.date}</td>
                            <td>{r.store}</td>
                            <td>
                              {r.description}
                              {isSpecialItem && <span className="badge bg-primary ms-2">{r.description}</span>}
                            </td>
                            <td>{r.category || '—'}</td>
                            <td>
                              <span className="fw-bold">
                                {String(r.description).toLowerCase() === 'discount' ? '-' : ''}
                                ${Math.abs(Number(r.total_price || 0)).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          <i className="bi bi-calendar-x fs-4 d-block mb-2"></i>
                          No purchases recorded for today ({today})
                          {selectedMonth && (
                            <div className="small">
                              in {new Date(selectedMonth + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
