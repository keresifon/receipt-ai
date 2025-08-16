'use client'
import { useState, useEffect, useMemo } from 'react'

type Record = {
  _id: string
  receipt_id: string
  date: string
  store: string
  description: string
  category: string
  quantity: string | number
  unit_price: string | number
  total_price: string | number
  hst?: string | number
  discount?: string | number
}

type PaginationInfo = {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [date, setDate] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [editing, setEditing] = useState<{[key: string]: any}>({})
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableStores, setAvailableStores] = useState<string[]>([])

  // Add HST/Discount state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    description: '',
    total_price: '',
    date: '',
    store: '',
    category: '',
    customStore: ''
  })
  const [addingItem, setAddingItem] = useState(false)
  const [availableReceipts, setAvailableReceipts] = useState<any[]>([])
  const [checkingReceipts, setCheckingReceipts] = useState(false)

  // Calculate total for current filtered records
  const totalAmount = useMemo(() => {
    return records.reduce((sum, record) => {
      const amount = Number(record.total_price || 0)
      return sum + amount
    }, 0)
  }, [records])

  // Load categories, months, and stores
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, monthsRes, analyticsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/months'),
          fetch('/api/analytics')
        ])
        
        const categoriesData = await categoriesRes.json()
        if (categoriesRes.ok) {
          setCategories(categoriesData.categories || [])
        }
        
        const monthsData = await monthsRes.json()
        if (monthsRes.ok) {
          setAvailableMonths(monthsData.months || [])
        }

        const analyticsData = await analyticsRes.json()
        if (analyticsRes.ok) {
          const stores = (analyticsData.byStore || []).map((item: any) => item.store)
          setAvailableStores(stores)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])

  // Reset date when month changes
  useEffect(() => {
    setDate('')
  }, [month])

  // Check for available receipts when date or store changes
  useEffect(() => {
    if (showAddForm && newItem.date && newItem.store && newItem.store !== 'custom') {
      checkAvailableReceipts(newItem.date, newItem.store)
    }
  }, [newItem.date, newItem.store, showAddForm])

  // Load records
  const loadRecords = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (search) params.set('search', search)
      if (month) params.set('month', month)
      if (date) params.set('date', date)
      
      const res = await fetch(`/api/records?${params}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.detail || 'Failed to load records')
      
      setRecords(data.records || [])
      setPagination(data.pagination)
      setCurrentPage(page)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load and reload on search/filter changes
  useEffect(() => {
    loadRecords(1)
  }, [search, month, date])

  // Handle search with debouncing
  const [searchDebounce, setSearchDebounce] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDebounce), 500)
    return () => clearTimeout(timer)
  }, [searchDebounce])

  const updateRecord = (id: string, field: string, value: any) => {
    setEditing(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }))
  }

  const saveChanges = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const entries = Object.entries(editing)
      await Promise.all(entries.map(async ([id, fields]: [string, any]) => {
        const body: any = {}
        if (fields.total_price !== undefined) body.total_price = fields.total_price
        if (fields.category !== undefined) body.category = fields.category
        if (fields.description !== undefined) body.description = fields.description
        if (fields.quantity !== undefined) body.quantity = fields.quantity
        if (fields.unit_price !== undefined) body.unit_price = fields.unit_price
        if (fields.hst !== undefined) body.hst = fields.hst
        if (fields.discount !== undefined) body.discount = fields.discount
        
        const res = await fetch(`/api/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error?.detail || 'Update failed')
        }
      }))
      
      // Reload records to show updated data
      await loadRecords(currentPage)
      setEditing({})
      setEditMode(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.detail || 'Delete failed')
      }
      
      await loadRecords(currentPage)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const addHSTDiscountItem = async () => {
    if (!newItem.description || !newItem.total_price || !newItem.date || !newItem.store) {
      setError('Please fill in all required fields')
      return
    }

    // Auto-fill current date if not set
    if (!newItem.date) {
      const today = new Date().toISOString().split('T')[0]
      setNewItem(prev => ({ ...prev, date: today }))
      return
    }

    setAddingItem(true)
    setError(null)

    try {
      // Determine the store name (use custom store if selected)
      const storeName = newItem.store === 'custom' ? newItem.customStore : newItem.store
      
      if (newItem.store === 'custom' && !newItem.customStore) {
        setError('Please enter a custom store name')
        return
      }

      // Check if we have receipts for this date/store combination
      if (newItem.store !== 'custom' && availableReceipts.length === 0) {
        setError(`No receipts found for ${newItem.store} on ${newItem.date}. Please create a receipt first or select a different date/store.`)
        return
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newItem.description,
          total_price: Number(newItem.total_price),
          date: newItem.date,
          store: storeName,
          category: newItem.category || 'HST/Discount'
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.detail || 'Failed to add item')
      }

      // Reset form and reload records
      setNewItem({
        description: '',
        total_price: '',
        date: '',
        store: '',
        category: '',
        customStore: ''
      })
      setShowAddForm(false)
      await loadRecords(currentPage)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingItem(false)
    }
  }

    const openAddForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setNewItem(prev => ({ ...prev, date: today, customStore: '' }))
    setShowAddForm(true)
  }

  const checkAvailableReceipts = async (date: string, store: string) => {
    if (!date || !store || store === 'custom') return
    
    setCheckingReceipts(true)
    try {
      const res = await fetch(`/api/analytics?month=${date.substring(0, 7)}`)
      const data = await res.json()
      
      if (res.ok && data.byStore) {
        const storeReceipts = data.byStore
          .filter((item: any) => item.store === store)
          .map((item: any) => ({
            date: item.date,
            store: item.store,
            total: item.total,
            count: item.count
          }))
        setAvailableReceipts(storeReceipts)
      }
    } catch (err) {
      console.error('Failed to check receipts:', err)
    } finally {
      setCheckingReceipts(false)
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-3 py-md-4">
      <div className="row mb-4">
        <div className="col-12 col-md-8">
          <h1 className="h3 mb-0">Records Management</h1>
          {(month || date) && (
            <small className="text-muted d-block mt-1">
              {month && `Filtering ${new Date(month + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}
              {date && month && ' - '}
              {date && `Date: ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </small>
          )}
          <div className="mt-2">
            <button
              className="btn btn-sm btn-outline-success"
              onClick={openAddForm}
              title="Quick add HST or Discount items"
            >
              <i className="bi bi-plus-circle me-1"></i>
              Quick Add HST/Discount
            </button>
          </div>
        </div>
        <div className="col-12 col-md-4 text-start text-md-end mt-3 mt-md-0">
          {pagination && (
            <>
              <div className="fw-semibold">
                {pagination.totalCount} total records
              </div>
              {records.length > 0 && date && (
                <div className="text-success small">
                  Total Amount: ${totalAmount.toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add HST/Discount Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add HST or Discount Item
            </h6>
            <small className="text-muted">
              Note: HST/Discount items are added to existing receipts. Select a date and store where you have a receipt.
            </small>
          </div>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => showAddForm ? setShowAddForm(false) : openAddForm()}
          >
            {showAddForm ? (
              <>
                <i className="bi bi-chevron-up me-1"></i>
                Hide Form
              </>
            ) : (
              <>
                <i className="bi bi-chevron-down me-1"></i>
                Show Form
              </>
            )}
          </button>
        </div>
        {showAddForm && (
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label">Type</label>
                <select
                  value={newItem.description}
                  onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select type...</option>
                  <option value="HST">HST</option>
                  <option value="Discount">Discount</option>
                </select>
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.total_price}
                  onChange={e => setNewItem(prev => ({ ...prev, total_price: e.target.value }))}
                  placeholder="0.00"
                  className="form-control"
                />
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={newItem.date}
                  onChange={e => setNewItem(prev => ({ ...prev, date: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label">Store</label>
                <select
                  value={newItem.store}
                  onChange={e => setNewItem(prev => ({ ...prev, store: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select store...</option>
                  {availableStores.map(store => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                  <option value="custom">+ Add Custom Store</option>
                </select>
                {newItem.store === 'custom' && (
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter custom store name"
                    onChange={e => setNewItem(prev => ({ ...prev, customStore: e.target.value }))}
                  />
                )}
              </div>
            </div>
            
            {/* Receipt Availability Check */}
            {newItem.date && newItem.store && newItem.store !== 'custom' && (
              <div className="row mt-3">
                <div className="col-12">
                  <div className="alert alert-info">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-info-circle me-2"></i>
                      <div>
                        <strong>Receipt Check:</strong>
                        {checkingReceipts ? (
                          <span className="ms-2">
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Checking for existing receipts...
                          </span>
                        ) : availableReceipts.length > 0 ? (
                          <span className="ms-2 text-success">
                            ✓ Found {availableReceipts.length} receipt(s) for {newItem.store} on {new Date(newItem.date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="ms-2 text-warning">
                            ⚠ No receipts found for {newItem.store} on {new Date(newItem.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {availableReceipts.length > 0 && (
                      <div className="mt-2 small">
                        <strong>Available receipts:</strong>
                        <ul className="mb-0 mt-1">
                          {availableReceipts.map((receipt, index) => (
                            <li key={index}>
                              {receipt.store} - {receipt.date} - ${receipt.total.toFixed(2)} ({receipt.count} items)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="row mt-3">
              <div className="col-12">
                <button
                  className="btn btn-success"
                  onClick={addHSTDiscountItem}
                  disabled={addingItem || !newItem.description || !newItem.total_price || !newItem.date || !newItem.store}
                >
                  {addingItem ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-lg me-2"></i>
                      Add {newItem.description || 'Item'}
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => {
                    setNewItem({
                      description: '',
                      total_price: '',
                      date: '',
                      store: '',
                      category: '',
                      customStore: ''
                    })
                    setShowAddForm(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Search Records</label>
              <input
                type="text"
                placeholder="Search by description, category, or store..."
                value={searchDebounce}
                onChange={e => setSearchDebounce(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label">Filter by Month</label>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="form-select"
              >
                <option value="">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {new Date(m + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            {month && (
              <div className="col-12 col-sm-6 col-md-3">
                <label className="form-label">Filter by Date</label>
                <div className="input-group">
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="form-control"
                    min={`${month}-01`}
                    max={`${month}-31`}
                  />
                  {date && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setDate('')}
                      title="Clear date filter"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="col-12 col-sm-6 col-md-3 d-flex align-items-end">
              {!editMode ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setEditMode(true)}
                  disabled={records.length === 0}
                >
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Records
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success"
                    onClick={saveChanges}
                    disabled={saving || Object.keys(editing).length === 0}
                    title={Object.keys(editing).length === 0 ? "Make changes to enable saving" : `Save ${Object.keys(editing).length} changed record(s)`}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Save Changes
                        {Object.keys(editing).length > 0 && (
                          <span className="badge bg-light text-dark ms-2">
                            {Object.keys(editing).length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditing({})
                      setEditMode(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(month || date || search) && (
        <div className="alert alert-info mb-4">
          <i className="bi bi-funnel me-2"></i>
          <strong>Active Filters:</strong>
          {month && (
            <span className="badge bg-primary ms-2">
              Month: {new Date(month + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
          )}
          {date && (
            <span className="badge bg-success ms-2">
              Date: {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          {search && (
            <span className="badge bg-info ms-2">
              Search: "{search}"
            </span>
          )}
          <button
            className="btn btn-sm btn-outline-secondary ms-3"
            onClick={() => {
              setMonth('')
              setDate('')
              setSearch('')
              setSearchDebounce('')
            }}
          >
            <i className="bi bi-x-lg me-1"></i>
            Clear All Filters
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {editMode && Object.keys(editing).length === 0 && (
        <div className="alert alert-info" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Edit Mode Active:</strong> Click on any field in the table below to start editing. 
          The "Save Changes" button will become available once you make changes.
        </div>
      )}



      {/* Records Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Store</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  {editMode && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const id = record._id
                  const isSpecialItem = ['hst', 'discount'].includes(record.description.toLowerCase())
                  
                  return (
                    <tr key={id} className={isSpecialItem ? 'table-info' : ''}>
                      <td>{record.date}</td>
                      <td>{record.store}</td>
                      <td>
                        {editMode ? (
                          <input
                            type="text"
                            value={editing[id]?.description ?? record.description}
                            onChange={e => updateRecord(id, 'description', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        ) : (
                          <span>
                            {record.description}
                            {isSpecialItem && <span className="badge bg-primary ms-2">{record.description}</span>}
                          </span>
                        )}
                      </td>
                      <td>
                        {editMode ? (
                          <div>
                            <select
                              value={editing[id]?.category ?? (record.category || '')}
                              onChange={e => updateRecord(id, 'category', e.target.value)}
                              className="form-select form-select-sm"
                              style={{ width: '150px' }}
                            >
                              <option value="">— Select Category —</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                              <option value="__custom__">+ Add New Category</option>
                            </select>
                            {(editing[id]?.category === '__custom__') && (
                              <input
                                type="text"
                                placeholder="Enter new category"
                                className="form-control form-control-sm mt-1"
                                style={{ width: '150px' }}
                                onChange={e => updateRecord(id, 'category', e.target.value)}
                              />
                            )}
                          </div>
                        ) : (
                          <span>{record.category || '—'}</span>
                        )}
                      </td>
                      <td>
                        {editMode ? (
                          <input
                            type="number"
                            value={editing[id]?.quantity ?? (record.quantity || '')}
                            onChange={e => updateRecord(id, 'quantity', e.target.value)}
                            className="form-control form-control-sm"
                            style={{ width: '80px' }}
                          />
                        ) : (
                          <span>{record.quantity || '—'}</span>
                        )}
                      </td>
                      <td>
                        {editMode ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing[id]?.unit_price ?? (record.unit_price || '')}
                            onChange={e => updateRecord(id, 'unit_price', e.target.value)}
                            className="form-control form-control-sm"
                            style={{ width: '90px' }}
                          />
                        ) : (
                          <span>{record.unit_price ? `$${Number(record.unit_price).toFixed(2)}` : '—'}</span>
                        )}
                      </td>
                      <td>
                        {editMode ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing[id]?.total_price ?? (record.total_price || '')}
                            onChange={e => updateRecord(id, 'total_price', e.target.value)}
                            className="form-control form-control-sm"
                            style={{ width: '90px' }}
                          />
                        ) : (
                          <span className="fw-bold">
                            {record.description.toLowerCase() === 'discount' ? '-' : ''}
                            ${Math.abs(Number(record.total_price || 0)).toFixed(2)}
                          </span>
                        )}
                      </td>
                      {editMode && (
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRecord(id)}
                            title="Delete record"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${!pagination.hasPrev ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => loadRecords(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </button>
              </li>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 2) + i
                if (page > pagination.totalPages) return null
                
                return (
                  <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => loadRecords(page)}
                    >
                      {page}
                    </button>
                  </li>
                )
              })}
              
              <li className={`page-item ${!pagination.hasNext ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => loadRecords(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {records.length === 0 && !loading && (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-4 text-muted"></i>
          <h5 className="mt-3 text-muted">No records found</h5>
          <p className="text-muted">
            {search || month ? 'Try adjusting your search or filter criteria.' : 'No records available.'}
          </p>
        </div>
      )}
    </div>
  )
}
