import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, Search, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StockIn() {
  const [params] = useSearchParams()
  const qc = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ quantity: '', notes: '', supplier: '' })
  const [loading, setLoading] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/api/products').then(r => r.data).catch(() => []),
  })

  // Pre-select if ?id= param exists
  useEffect(() => {
    const pid = params.get('id')
    if (pid && products.length > 0) {
      const found = products.find(p => p.id === pid)
      if (found) setSelectedProduct(found)
    }
  }, [params, products])

  const filtered = products.filter(p =>
    !search ||
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku  || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return toast.error('Select a product first')
    const qty = parseInt(form.quantity)
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity')

    setLoading(true)
    try {
      const res = await axios.post(`/api/products/${selectedProduct.id}/stock-in`, {
        quantity: qty,
        notes: form.notes,
        supplier: form.supplier,
      })
      toast.success(`✅ Added ${qty} ${selectedProduct.unit} of ${selectedProduct.name}. New stock: ${res.data.new_quantity}`)
      setForm({ quantity: '', notes: '', supplier: '' })
      qc.invalidateQueries(['products'])
      // Refresh selected product
      const updated = await axios.get(`/api/products/${selectedProduct.id}`).then(r => r.data)
      setSelectedProduct(updated)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Stock-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>



      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Product Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="search-bar">
            <Search size={15} className="search-bar__icon" />
            <input
              className="input"
              placeholder="Search product by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="card" style={{ maxHeight: 480, overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="empty-state"><p>No products found</p></div>
            ) : (
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(p => {
                  const isSelected = selectedProduct?.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 'var(--r-md)',
                        background: isSelected ? 'var(--success-bg)' : 'transparent',
                        border: isSelected ? '1.5px solid var(--success)' : '1.5px solid transparent',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all var(--t-fast)',
                      }}
                    >
                      <div className={`icon-box icon-box-sm ${isSelected ? 'icon-box-green' : 'icon-box-brand'}`}>
                        <Package size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.sku} · {p.category}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: p.quantity === 0 ? 'var(--danger-text)' : p.status === 'LOW_STOCK' ? 'var(--warning-text)' : 'var(--success-text)' }}>{p.quantity}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{p.unit}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Form Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Selected Product Info */}
          {selectedProduct ? (
            <div className="card card-p" style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1px solid #bbf7d0'
            }}>
              <div className="flex items-center gap-3">
                <div className="icon-box icon-box-md icon-box-green"><Package size={20} /></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selectedProduct.sku} · Current: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-p" style={{ textAlign: 'center', padding: '20px', background: 'var(--gray-50)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>← Select a product to stock in</div>
            </div>
          )}

          {/* Stock-In Form */}
          <div className="card card-p">
            <h3 className="font-semibold text-heading mb-4">Stock In Details</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Quantity to Add *</label>
                <input
                  className="input"
                  type="number" min="1"
                  placeholder="Enter quantity..."
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  required
                />
                {selectedProduct && form.quantity && (
                  <div className="form-hint" style={{ color: 'var(--success-text)' }}>
                    New total: {(selectedProduct.quantity || 0) + (parseInt(form.quantity) || 0)} {selectedProduct?.unit}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Supplier (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. ABC Distributors"
                  value={form.supplier}
                  onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="input"
                  placeholder="e.g. Received from warehouse, Invoice #123..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading || !selectedProduct}
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                <ArrowDownToLine size={16} />
                {loading ? 'Processing...' : 'Confirm Stock In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
