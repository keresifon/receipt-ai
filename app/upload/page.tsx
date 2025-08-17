'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const STORES = ['Walmart', 'Costco', 'No Frills', 'Loblaws', 'Sobeys', 'Metro', 'Dollarama', 'Shoppers Drug Mart', 'Starbucks', 'Tim Hortons', 'Amazon', 'Other (custom)']

type LineItem = {
  description: string
  category: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number
}

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // All useState hooks must be at the top level
  const [file, setFile] = useState<File | null>(null)
  const [date, setDate] = useState('')
  const [store, setStore] = useState('')
  const [customStore, setCustomStore] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showItemsEditor, setShowItemsEditor] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  
  // Redirect unauthenticated users to signin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])
  
  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    loadCategories()
  }, [])
  
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
  
  const effectiveStore = store === 'Other (custom)' ? customStore : store
  const isReady = file && date && effectiveStore

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setShowItemsEditor(false)
    
    if (!file) return setError('Please choose an image file.')
    if (!date) return setError('Please pick a date.')
    if (!effectiveStore) return setError('Please select or enter a store.')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('date', date)
    fd.append('merchant', effectiveStore)
    if (notes) fd.append('notes', notes)

    setLoading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || 'Upload failed')
      
      setLineItems(json.line_items || [])
      setResult(json)
      setShowItemsEditor(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const saveItems = async () => {
    if (!result?.receipt_id) return
    
    setSaveLoading(true)
    try {
      const itemsWithMetadata = lineItems.map(item => ({
        ...item,
        date,
        store: effectiveStore
      }))

      const res = await fetch(`/api/receipts/${result.receipt_id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items: itemsWithMetadata })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Failed to save items')
      }

      // Reset form after successful save
      setShowItemsEditor(false)
      setLineItems([])
      setResult(null)
      setFile(null)
      setDate('')
      setStore('')
      setCustomStore('')
      setNotes('')
      
      alert('Receipt saved successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="container py-3 py-md-4">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-dark text-white">
          <h1 className="h3 mb-2">Upload Receipt</h1>
          <p className="mb-0 text-white-50">
            Upload a receipt image and our AI will extract the details for you to review and edit.
          </p>
        </div>
        <div className="card-body p-4">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Receipt Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                  className="form-control"
                />
                {file && (
                  <div className="mt-2 text-success small">
                    <i className="bi bi-check-circle me-1"></i>
                    Receipt processed successfully! Review the details below.
                  </div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="form-control"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Store</label>
                <select 
                  value={store} 
                  onChange={e => setStore(e.target.value)} 
                  className="form-select"
                >
                  <option value="">— Select store —</option>
                  {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {store === 'Other (custom)' && (
                <div className="col-12">
                  <label className="form-label fw-semibold">Custom Store Name</label>
                  <input 
                    type="text" 
                    value={customStore} 
                    onChange={e => setCustomStore(e.target.value)} 
                    placeholder="Enter store name" 
                    className="form-control"
                  />
                </div>
              )}

              <div className="col-12">
                <label className="form-label fw-semibold">Notes (optional)</label>
                <input 
                  type="text" 
                  placeholder="Add any notes about this receipt" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="form-control"
                />
              </div>
            </div>

            <div className="mt-4">
              <button 
                type="submit"
                disabled={loading || !isReady} 
                className="btn btn-primary btn-lg w-100"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Upload Receipt
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {showItemsEditor && lineItems.length > 0 && (
        <div className="card mt-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">
              <i className="bi bi-pencil-square me-2"></i>
              Review & Edit Line Items
            </h5>
            <small className="text-white-50">Please review the extracted items and assign categories</small>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="border-bottom">
                      <td className="ps-3 pe-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateLineItem(index, 'description', e.target.value)}
                          className="form-control form-control-sm"
                          placeholder="Item description"
                        />
                      </td>
                      <td className="px-2">
                        <select
                          value={item.category || ''}
                          onChange={e => updateLineItem(index, 'category', e.target.value || null)}
                          className="form-select form-select-sm"
                        >
                          <option value="">— Select Category —</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__custom__">+ Add New Category</option>
                        </select>
                        {item.category === '__custom__' && (
                          <input
                            type="text"
                            placeholder="Enter new category"
                            className="form-control form-control-sm mt-1"
                            onChange={e => updateLineItem(index, 'category', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={e => updateLineItem(index, 'quantity', e.target.value ? Number(e.target.value) : null)}
                          className="form-control form-control-sm text-center"
                          placeholder="1"
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price || ''}
                          onChange={e => updateLineItem(index, 'unit_price', e.target.value ? Number(e.target.value) : null)}
                          className="form-control form-control-sm text-end"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 pe-3">
                        <input
                          type="number"
                          step="0.01"
                          value={item.total_price}
                          onChange={e => updateLineItem(index, 'total_price', Number(e.target.value) || 0)}
                          className="form-control form-control-sm text-end"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="d-flex gap-2 mt-3 p-3">
              <button
                type="button"
                onClick={saveItems}
                disabled={saveLoading}
                className="btn btn-success"
              >
                {saveLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Save Items
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowItemsEditor(false)}
                className="btn btn-outline-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {result && !showItemsEditor && (
        <div className="alert alert-success mt-4" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          <strong>Success!</strong> Receipt Saved Successfully!
          <div className="mt-3">
            <a href="/dashboard" className="btn btn-primary">
              View Dashboard
            </a>
          </div>
        </div>
      )}
      

    </div>
  )
}
