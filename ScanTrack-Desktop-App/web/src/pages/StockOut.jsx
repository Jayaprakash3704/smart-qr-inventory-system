import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpFromLine, Search, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const REASONS = ['Sale', 'Transfer', 'Damage/Loss', 'Expired', 'Return to Supplier', 'Internal Use', 'Order Fulfillment', 'Other']

export default function StockOut() {
  const [params] = useSearchParams()
  const qc = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ quantity: '', reason: 'Sale', notes: '' })
  const [loading, setLoading] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/api/products').then(r => r.data).catch(() => []),
  })

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

  const qty = parseInt(form.quantity) || 0
  const projectedQty = selectedProduct ? (selectedProduct.quantity || 0) - qty : 0
  const wouldGoNegative = selectedProduct && qty > (selectedProduct.quantity || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return toast.error('Select a product first')
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity')
    if (wouldGoNegative) return toast.error('Quantity exceeds available stock')

    setLoading(true)
    try {
      const res = await axios.post(`/api/products/${selectedProduct.id}/stock-out`, {
        quantity: qty,
        reason: form.reason,
        notes: form.notes,
      })
      toast.success(`✅ Removed ${qty} ${selectedProduct.unit} of ${selectedProduct.name}. New stock: ${res.data.new_quantity}`)
      setForm({ quantity: '', reason: 'Sale', notes: '' })
      qc.invalidateQueries(['products'])
      const updated = await axios.get(`/api/products/${selectedProduct.id}`).then(r => r.data)
      setSelectedProduct(updated)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Stock-out failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div className="page-header">
        <div className="page-header__left">
          <h1>Stock Out</h1>
          <p>Record outgoing inventory to decrease stock levels</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Product List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="search-bar">
            <Search size={15} className="search-bar__icon" />
            <input className="input" placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card" style={{ maxHeight: 480, overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="empty-state"><p>No products found</p></div>
            ) : (
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(p => {
                  const isSelected = selectedProduct?.id === p.id
                  const isOut = p.quantity === 0
                  return (
                    <button
                      key={p.id}
                      onClick={() => !isOut && setSelectedProduct(p)}
                      disabled={isOut}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 'var(--r-md)',
                        background: isSelected ? 'var(--danger-bg)' : 'transparent',
                        border: isSelected ? '1.5px solid var(--danger)' : '1.5px solid transparent',
                        cursor: isOut ? 'not-allowed' : 'pointer', textAlign: 'left',
                        opacity: isOut ? 0.5 : 1, transition: 'all var(--t-fast)',
                      }}
                    >
                      <div className={`icon-box icon-box-sm ${isSelected ? 'icon-box-red' : 'icon-box-brand'}`}>
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

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {selectedProduct ? (
            <div className="card card-p" style={{ background: 'linear-gradient(135deg, #fff1f2, #fee2e2)', border: '1px solid #fecaca' }}>
              <div className="flex items-center gap-3">
                <div className="icon-box icon-box-md icon-box-red"><Package size={20} /></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selectedProduct.sku} · Available: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-p" style={{ textAlign: 'center', background: 'var(--gray-50)' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>← Select a product to stock out</div>
            </div>
          )}

          <div className="card card-p">
            <h3 className="font-semibold text-heading mb-4">Stock Out Details</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Quantity to Remove *</label>
                <input
                  className={`input ${wouldGoNegative ? 'input-error' : ''}`}
                  type="number" min="1"
                  max={selectedProduct?.quantity || undefined}
                  placeholder="Enter quantity..."
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  required
                />
                {selectedProduct && qty > 0 && (
                  <div className="form-hint" style={{ color: wouldGoNegative ? 'var(--danger-text)' : projectedQty <= (selectedProduct.low_stock_threshold || 5) ? 'var(--warning-text)' : 'var(--success-text)' }}>
                    {wouldGoNegative
                      ? `⚠ Exceeds available stock (${selectedProduct.quantity})`
                      : `Remaining stock: ${projectedQty} ${selectedProduct.unit}`
                    }
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="input" placeholder="Additional details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>

              {selectedProduct && selectedProduct.status === 'LOW_STOCK' && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--warning-bg)', color: 'var(--warning-text)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={14} /> This product is already on low stock ({selectedProduct.quantity} {selectedProduct.unit})
                </div>
              )}

              <button
                type="submit"
                className="btn btn-danger"
                disabled={loading || !selectedProduct || wouldGoNegative}
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                <ArrowUpFromLine size={16} />
                {loading ? 'Processing...' : 'Confirm Stock Out'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
