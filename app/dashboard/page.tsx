'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Legend, Cell
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
        {/* Total Spend Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-currency-dollar text-primary fs-3"></i>
              </div>
              <div>
                <h6 className="card-title text-muted mb-1">Total Spend</h6>
                <h4 className="mb-0 text-primary">${totals.total?.toFixed(2) || '0.00'}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Total Items Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center">
              <div className="bg-accent bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-receipt text-accent fs-3"></i>
              </div>
              <div>
                <h6 className="card-title text-muted mb-1">Total Items</h6>
                <h4 className="mb-0 text-accent">{totals.count || 0}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Distinct Stores Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center">
              <div className="bg-secondary bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-shop text-secondary fs-3"></i>
              </div>
              <div>
                <h6 className="card-title text-muted mb-1">Distinct Stores</h6>
                <h4 className="mb-0 text-secondary">{new Set((byStore || []).map((s: any) => s.store)).size}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Month Filter Card */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center">
              <div className="bg-secondary bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-calendar-event text-secondary fs-3"></i>
              </div>
              <div>
                <h6 className="card-title text-muted mb-1">Month Filter</h6>
                <select 
                  className="form-select form-select-sm" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="all">All Months</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {new Date(month + '-15').toLocaleDateString('en-US', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        {/* Monthly Spend Chart */}
        <div className="col-12 col-lg-8 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Monthly Spend
              </h5>
            </div>
            <div className="card-body">
              {monthly && monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Line type="monotone" dataKey="total" stroke="#1f2937" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-graph-up fs-1"></i>
                  <p className="mt-3">No spending data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="col-12 col-lg-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <i className="bi bi-tags me-2"></i>
                By Category
              </h5>
            </div>
            <div className="card-body">
              {byCategory && byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ category, total }: any) => {
                        // Handle long category names and "Other" category
                        if (category.includes('Other')) {
                          return `Other: $${total.toFixed(0)}`
                        }
                        // Truncate long category names
                        const shortName = category.length > 15 ? category.substring(0, 12) + '...' : category
                        return `${shortName}: $${total.toFixed(0)}`
                      }}
                    >
                      {byCategory.map((entry: any, index: number) => {
                        // Use special color for "Other" category
                        const isOther = entry.category.includes('Other')
                        const colors = ['#1f2937', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
                        const color = isOther ? '#374151' : colors[index % colors.length]
                        
                        return (
                          <Cell key={`cell-${index}`} fill={color} />
                        )
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Amount']}
                      labelFormatter={(label) => {
                        // Show full category name in tooltip
                        return label
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-tags fs-1"></i>
                  <p className="mt-3">No category data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spending by Store */}
        <div className="col-12 col-lg-6 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <i className="bi bi-shop me-2"></i>
                By Store
              </h5>
            </div>
            <div className="card-body">
              {byStore && byStore.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byStore}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="store" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="total" fill="#1f2937" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-shop fs-1"></i>
                  <p className="mt-3">No store data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="col-12 col-lg-6 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <i className="bi bi-calendar-day me-2"></i>
                Today's Purchases
              </h5>
              {recent.length > 0 && (
                <div className="mt-2">
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-white fw-bold fs-6">
                      <i className="bi bi-currency-dollar me-1"></i>
                      Today's Total: ${recent.reduce((sum: number, item: any) => {
                        const amount = Number(item.total_price || 0)
                        return sum + amount
                      }, 0).toFixed(2)}
                    </div>
                    <div className="text-white-50 small">
                      <i className="bi bi-receipt me-1"></i>
                      {recent.length} item{recent.length !== 1 ? 's' : ''} purchased today
                    </div>
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
                            <td className="text-muted small">
                              {r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </td>
                            <td className="text-muted small">
                              {r.store || '—'}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="fw-semibold">{r.description}</span>
                                {isSpecialItem && <span className="badge bg-primary ms-2">{r.description}</span>}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-secondary">{r.category || '—'}</span>
                            </td>
                            <td className="text-end">
                              <span className={`fw-semibold ${r.category === 'Discount' ? 'text-success' : ''}`}>
                                ${r.total_price?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          <i className="bi bi-calendar-x fs-4 d-block mb-2"></i>
                          No purchases recorded for today
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
