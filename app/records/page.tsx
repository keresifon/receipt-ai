'use client'
import { useState, useEffect, useMemo } from 'react'
import { formatCurrency, getCurrencySymbol } from '@/lib/currencies'

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
  const [accountCurrency, setAccountCurrency] = useState<string>('CAD')
  
  // New HST/Discount item state
  const [newItemType, setNewItemType] = useState('')
  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().split('T')[0])
  const [newItemStore, setNewItemStore] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [availableStores, setAvailableStores] = useState<string[]>([])
  const [linkedReceipt, setLinkedReceipt] = useState<any>(null)
  
  // New line item state
  const [newLineItemType, setNewLineItemType] = useState('line-item')
  const [newLineItemDescription, setNewLineItemDescription] = useState('')
  const [newLineItemCategory, setNewLineItemCategory] = useState('')
  const [newLineItemQuantity, setNewLineItemQuantity] = useState('')
  const [newLineItemUnitPrice, setNewLineItemUnitPrice] = useState('')
  const [newLineItemTotalPrice, setNewLineItemTotalPrice] = useState('')
  const [newLineItemStore, setNewLineItemStore] = useState('')
  const [newLineItemDate, setNewLineItemDate] = useState(new Date().toISOString().split('T')[0])
  const [addingLineItem, setAddingLineItem] = useState(false)
  const [linkedReceiptForLineItem, setLinkedReceiptForLineItem] = useState<any>(null)

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
        console.log('Fetching data from APIs...')
        const [categoriesRes, monthsRes, accountRes, storesRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/months'),
          fetch('/api/accounts/me'),
          fetch('/api/stores')
        ])
        console.log('All API calls completed')
        
        const categoriesData = await categoriesRes.json()
        if (categoriesRes.ok) {
          setCategories(categoriesData.categories || [])
        }
        
        const monthsData = await monthsRes.json()
        if (monthsRes.ok) {
          setAvailableMonths(monthsData.months || [])
        }

        const accountData = await accountRes.json()
        if (accountRes.ok && accountData.settings?.currency) {
          setAccountCurrency(accountData.settings.currency)
        }

        const storesData = await storesRes.json()
        console.log('Stores API response:', storesData)
        if (storesRes.ok) {
          setAvailableStores(storesData.stores || [])
          console.log('Available stores set:', storesData.stores || [])
        } else {
          console.error('Stores API failed:', storesRes.status, storesData)
        }
        
        // Debug: Check if stores are being set
        console.log('Current availableStores state:', availableStores)
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

  // Check for linked receipt when store or date changes
  useEffect(() => {
    if (newItemStore && newItemDate) {
      checkLinkedReceipt(newItemStore, newItemDate)
    } else {
      setLinkedReceipt(null)
    }
  }, [newItemStore, newItemDate])

  // Check for linked receipt for line items when store or date changes
  useEffect(() => {
    if (newLineItemStore && newLineItemDate) {
      checkLinkedReceiptForLineItem(newLineItemStore, newLineItemDate)
    } else {
      setLinkedReceiptForLineItem(null)
    }
  }, [newLineItemStore, newLineItemDate])

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
    setEditing((prev: {[key: string]: any}) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }))
  }

  const saveChanges = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const entries = Object.entries(editing)
      await Promise.all(entries.map(async ([id, fields]) => {
        const body: any = {}
        const typedFields = fields as {[key: string]: any}
        if (typedFields.total_price !== undefined) body.total_price = typedFields.total_price
        if (typedFields.category !== undefined) body.category = typedFields.category
        if (typedFields.description !== undefined) body.description = typedFields.description
        if (typedFields.quantity !== undefined) body.quantity = typedFields.quantity
        if (typedFields.unit_price !== undefined) body.unit_price = typedFields.unit_price
        if (typedFields.hst !== undefined) body.hst = typedFields.hst
        if (typedFields.discount !== undefined) body.discount = typedFields.discount
        
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

  const checkLinkedReceipt = async (store: string, date: string) => {
    if (!store || !date) {
      setLinkedReceipt(null)
      return
    }
    
    try {
      const receiptRes = await fetch(`/api/receipts/find?store=${encodeURIComponent(store)}&date=${date}`)
      const receiptData = await receiptRes.json()
      
      if (receiptRes.ok && receiptData.receipt) {
        setLinkedReceipt(receiptData.receipt)
      } else {
        setLinkedReceipt(null)
      }
    } catch (err) {
      setLinkedReceipt(null)
    }
  }

  const checkLinkedReceiptForLineItem = async (store: string, date: string) => {
    if (!store || !date) {
      setLinkedReceiptForLineItem(null)
      return
    }
    
    try {
      const receiptRes = await fetch(`/api/receipts/find?store=${encodeURIComponent(store)}&date=${date}`)
      const receiptData = await receiptRes.json()
      
      if (receiptRes.ok && receiptData.receipt) {
        setLinkedReceiptForLineItem(receiptData.receipt)
      } else {
        setLinkedReceiptForLineItem(null)
      }
    } catch (err) {
      setLinkedReceiptForLineItem(null)
    }
  }

  const addNewItem = async () => {
    if (!newItemType || !newItemDate || !newItemStore || !newItemAmount) return
    
    setAddingItem(true)
    setError(null)
    
    try {
      // First, find the most recent receipt for this store and date
      const receiptRes = await fetch(`/api/receipts/find?store=${encodeURIComponent(newItemStore)}&date=${newItemDate}`)
      const receiptData = await receiptRes.json()
      
      if (!receiptRes.ok) {
        throw new Error(receiptData?.detail || 'Failed to find receipt')
      }
      
      if (!receiptData.receipt) {
        throw new Error(`No receipt found for ${newItemStore} on ${newItemDate}. Please ensure the receipt exists first.`)
      }
      
      // Use the found receipt ID
      const body = {
        receipt_id: receiptData.receipt._id,
        date: newItemDate,
        store: newItemStore,
        description: newItemType,
        category: newItemType === 'HST' ? 'HST/Discount' : 'Discount',
        total_price: newItemType === 'Discount' ? -Math.abs(Number(newItemAmount)) : Number(newItemAmount)
      }
      
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.detail || 'Failed to add item')
      }
      
      // Reset form and reload records
      setNewItemType('')
      setNewItemDate('')
      setNewItemStore('')
      setNewItemAmount('')
      await loadRecords(currentPage)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingItem(false)
    }
  }

  const addNewLineItem = async () => {
    if (!newLineItemDescription || !newLineItemStore || !newLineItemDate || !newLineItemTotalPrice) return
    
    setAddingLineItem(true)
    setError(null)
    
    try {
      // First, find the receipt for this store and date
      const receiptRes = await fetch(`/api/receipts/find?store=${encodeURIComponent(newLineItemStore)}&date=${newLineItemDate}`)
      const receiptData = await receiptRes.json()
      
      if (!receiptRes.ok) {
        throw new Error(receiptData?.detail || 'Failed to find receipt')
      }
      
      if (!receiptData.receipt) {
        throw new Error(`No receipt found for ${newLineItemStore} on ${newLineItemDate}. Please ensure the receipt exists first.`)
      }
      
      // Use the found receipt ID
      const body = {
        receipt_id: receiptData.receipt._id,
        date: newLineItemDate,
        store: newLineItemStore,
        description: newLineItemDescription,
        category: newLineItemCategory || '',
        quantity: newLineItemQuantity || '',
        unit_price: newLineItemUnitPrice || '',
        total_price: Number(newLineItemTotalPrice)
      }
      
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.detail || 'Failed to add line item')
      }
      
      // Reset form and reload records
      setNewLineItemDescription('')
      setNewLineItemCategory('')
      setNewLineItemQuantity('')
      setNewLineItemUnitPrice('')
      setNewLineItemTotalPrice('')
      setNewLineItemStore('')
      setNewLineItemDate(new Date().toISOString().split('T')[0])
      await loadRecords(currentPage)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingLineItem(false)
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Records Management</h1>
          {(month || date) && (
            <small className="text-muted">
              {month && `Filtering ${new Date(month + '-15').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}
              {date && month && ' - '}
              {date && `Date: ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </small>
          )}
        </div>
        <div className="text-muted text-end">
          {pagination && (
            <>
              <div className="fw-semibold">
                {pagination.totalCount} total records
              </div>
              {records.length > 0 && date && (
                <div className="text-success small">
                  Total Amount: {formatCurrency(totalAmount, accountCurrency)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Search Records</label>
              <input
                type="text"
                placeholder="Search by description, category, or store..."
                value={searchDebounce}
                onChange={e => setSearchDebounce(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="col-md-3">
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
              <div className="col-md-3">
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
            <div className="col-md-3 d-flex align-items-end">
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



      {/* Add New HST/Discount Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-plus-circle me-2"></i>
            Add New HST/Discount Item
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                value={newItemType}
                onChange={e => setNewItemType(e.target.value)}
                className="form-select"
              >
                <option value="">Select Type</option>
                <option value="HST">HST</option>
                <option value="Discount">Discount</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={newItemDate}
                onChange={e => setNewItemDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Store</label>
              <select
                value={newItemStore}
                onChange={e => setNewItemStore(e.target.value)}
                className="form-select"
              >
                <option value="">Select Store</option>
                {availableStores.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                value={newItemAmount}
                onChange={e => setNewItemAmount(e.target.value)}
                placeholder="0.00"
                className="form-control"
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-primary"
                onClick={addNewItem}
                disabled={!newItemType || !newItemDate || !newItemStore || !newItemAmount || addingItem}
              >
                {addingItem ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Adding...
                  </>
                ) : (
                  <i className="bi bi-plus"></i>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Linked Receipt Info */}
        {linkedReceipt && (
          <div className="alert alert-success m-3">
            <i className="bi bi-link-45deg me-2"></i>
            <strong>Linked to Receipt:</strong> {linkedReceipt.merchant} on {linkedReceipt.date} 
            (Total: {formatCurrency(linkedReceipt.total, accountCurrency)})
          </div>
        )}
        {!linkedReceipt && newItemStore && newItemDate && (
          <div className="alert alert-warning m-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>No Receipt Found:</strong> No receipt found for {newItemStore} on {newItemDate}. 
            Please ensure the receipt exists before adding HST/Discount.
          </div>
        )}
      </div>

      {/* Add New Line Item Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-plus-circle me-2"></i>
            Add New Line Item to Receipt
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Description</label>
              <input
                type="text"
                value={newLineItemDescription}
                onChange={e => setNewLineItemDescription(e.target.value)}
                placeholder="Item description"
                className="form-control"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Category</label>
              <select
                value={newLineItemCategory}
                onChange={e => setNewLineItemCategory(e.target.value)}
                className="form-select"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">+ Add New</option>
              </select>
              {newLineItemCategory === '__custom__' && (
                <input
                  type="text"
                  placeholder="Enter new category"
                  className="form-control mt-1"
                  onChange={e => setNewLineItemCategory(e.target.value)}
                />
              )}
            </div>
            <div className="col-md-1">
              <label className="form-label">Qty</label>
              <input
                type="number"
                step="0.01"
                value={newLineItemQuantity}
                onChange={e => setNewLineItemQuantity(e.target.value)}
                placeholder="1"
                className="form-control"
              />
            </div>
            <div className="col-md-1">
              <label className="form-label">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={newLineItemUnitPrice}
                onChange={e => setNewLineItemUnitPrice(e.target.value)}
                placeholder="0.00"
                className="form-control"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Total Price</label>
              <input
                type="number"
                step="0.01"
                value={newLineItemTotalPrice}
                onChange={e => setNewLineItemTotalPrice(e.target.value)}
                placeholder="0.00"
                className="form-control"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Store</label>
              <select
                value={newLineItemStore}
                onChange={e => setNewLineItemStore(e.target.value)}
                className="form-select"
              >
                <option value="">Select Store</option>
                {availableStores.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={newLineItemDate}
                onChange={e => setNewLineItemDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-success"
                onClick={addNewLineItem}
                disabled={!newLineItemDescription || !newLineItemStore || !newLineItemDate || !newLineItemTotalPrice || addingLineItem}
                title="Add line item to receipt"
              >
                {addingLineItem ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Adding...
                  </>
                ) : (
                  <i className="bi bi-plus"></i>
                )}
              </button>
            </div>
          </div>
          
          {/* Linked Receipt Info for Line Item */}
          {linkedReceiptForLineItem && (
            <div className="alert alert-success mt-3 mb-0">
              <i className="bi bi-link-45deg me-2"></i>
              <strong>Will be added to Receipt:</strong> {linkedReceiptForLineItem.merchant} on {linkedReceiptForLineItem.date} 
              (Total: {formatCurrency(linkedReceiptForLineItem.total, accountCurrency)})
            </div>
          )}
          {!linkedReceiptForLineItem && newLineItemStore && newLineItemDate && (
            <div className="alert alert-warning mt-3 mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>No Receipt Found:</strong> No receipt found for {newLineItemStore} on {newLineItemDate}. 
              Please ensure the receipt exists before adding line items.
            </div>
          )}
        </div>
      </div>



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
                          <span>{record.unit_price ? formatCurrency(Number(record.unit_price), accountCurrency) : '—'}</span>
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
                            {formatCurrency(Math.abs(Number(record.total_price || 0)), accountCurrency)}
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
