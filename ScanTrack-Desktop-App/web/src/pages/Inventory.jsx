import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Package, Search, Plus, Filter, RefreshCw, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Electronics', 'Food & Beverage', 'Clothing', 'Office Supplies', 'Tools', 'Medical', 'General']

function StatusBadge({ status }) {
  const map = {
    IN_STOCK: ['badge-in-stock', 'In Stock'],
    LOW_STOCK: ['badge-low-stock', 'Low Stock'],
    OUT_OF_STOCK: ['badge-out-stock', 'Out of Stock'],
  }
  const [cls, label] = map[status] || ['badge-info', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const qc = useQueryClient()

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/api/products').then(r => r.data).catch(() => []),
    refetchInterval: 60_000,
  })

  // Client-side filter
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku  || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || p.category === category
    return matchSearch && matchCat
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1>Inventory</h1>
          <p>{products.length} products registered · {products.filter(p => p.status === 'LOW_STOCK').length} low stock</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-p" style={{ padding: '14px 18px' }}>
        <div className="flex gap-3 flex-wrap">
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} className="search-bar__icon" />
            <input
              className="input"
              placeholder="Search by name, SKU, supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ width: 200 }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Location</th>
                <th>Status</th>
                <th>QR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="skeleton skeleton-text" style={{ width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state__icon"><Package size={24} /></div>
                      <h3>No products found</h3>
                      <p>{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-box icon-box-sm icon-box-brand"><Package size={13} /></div>
                        <div>
                          <div className="font-semibold text-body" style={{ fontSize: 13 }}>{item.name}</div>
                          <div className="text-xs text-muted">{item.supplier || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4, color: 'var(--gray-700)' }}>{item.sku}</code></td>
                    <td><span className="text-sm text-body">{item.category}</span></td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: 14,
                        color: item.quantity === 0 ? 'var(--danger-text)'
                          : item.status === 'LOW_STOCK' ? 'var(--warning-text)'
                          : 'var(--success-text)'
                      }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td><span className="text-sm text-muted">{item.unit}</span></td>
                    <td><span className="text-sm text-body">{item.location}</span></td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <a
                        href={`/api/qr/${item.id}`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost btn-sm btn-icon" title="View QR Code"
                      >
                        <QrCode size={14} />
                      </a>
                    </td>
                    <td>
                      <Link to={`/inventory/${item.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onAdded={() => { qc.invalidateQueries(['products']); setShowAdd(false) }} />}
    </div>
  )
}

function AddProductModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '', sku: '', category: 'General', quantity: '',
    unit: 'pcs', location: 'Warehouse', supplier: '',
    low_stock_threshold: '5', description: '', cost_price: '', sell_price: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Product name is required')
    setLoading(true)
    try {
      await axios.post('/api/products', { ...form, quantity: parseInt(form.quantity) || 0 })
      toast.success('Product added successfully!')
      onAdded()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Add New Product</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="input" placeholder="e.g. USB-C Cable 2m" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">SKU (auto if blank)</label>
                <input className="input" placeholder="e.g. USB-C-2M-001" value={form.sku} onChange={e => set('sku', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Quantity</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'roll', 'set', 'pair'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Threshold</label>
                <input className="input" type="number" min="0" placeholder="5" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Location / Aisle</label>
                <input className="input" placeholder="Warehouse A / Shelf 2" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input className="input" placeholder="Supplier name" value={form.supplier} onChange={e => set('supplier', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Cost Price (₹)</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Sell Price (₹)</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" placeholder="Optional product description..." value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : '+ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
