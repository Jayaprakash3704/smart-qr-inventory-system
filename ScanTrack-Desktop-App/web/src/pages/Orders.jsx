import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plus, ShoppingCart, CheckCircle, XCircle, Clock, Package, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function OrderStatusBadge({ status }) {
  const map = {
    PENDING: ['badge-pending', 'Pending'],
    APPROVED: ['badge-approved', 'Approved'],
    CANCELLED: ['badge-cancelled', 'Cancelled'],
  }
  const [cls, label] = map[status] || ['badge-info', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function Orders() {
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => axios.get('/api/orders').then(r => r.data).catch(() => []),
    refetchInterval: 30_000,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/api/products').then(r => r.data).catch(() => []),
  })

  const handleApprove = async (orderId) => {
    try {
      await axios.post(`/api/orders/${orderId}/approve`)
      toast.success('Order approved and stock deducted!')
      qc.invalidateQueries(['orders'])
      qc.invalidateQueries(['products'])
    } catch (err) {
      const msg = err.response?.data?.error || 'Approval failed'
      toast.error(msg)
    }
  }

  const handleCancel = async (orderId) => {
    try {
      await axios.post(`/api/orders/${orderId}/cancel`)
      toast.success('Order cancelled')
      qc.invalidateQueries(['orders'])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed')
    }
  }

  const pendingCount = orders.filter(o => o.status === 'PENDING').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ gap: 14 }}>
        {[
          { label: 'Pending',   count: orders.filter(o => o.status === 'PENDING').length,   color: 'var(--warning)',  bg: 'var(--warning-bg)',  icon: Clock },
          { label: 'Approved',  count: orders.filter(o => o.status === 'APPROVED').length,  color: 'var(--success)',  bg: 'var(--success-bg)',  icon: CheckCircle },
          { label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length, color: 'var(--gray-400)', bg: 'var(--gray-100)',    icon: XCircle },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)' }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state__icon"><ShoppingCart size={24} /></div>
                      <h3>No orders yet</h3>
                      <p>Create your first customer order</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{order.id}</code></td>
                    <td><span className="font-semibold text-body">{order.customer_name}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(order.items || []).map((item, i) => (
                          <span key={i} style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                            {item.quantity}× {item.product_name || item.product_id}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td><span className="text-xs text-muted">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        {order.status === 'PENDING' && isAdmin && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(order.id)}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCancel(order.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'PENDING' && !isAdmin && (
                          <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>Awaiting admin approval</span>
                        )}
                        {order.status !== 'PENDING' && (
                          <span className="text-xs text-muted">{order.approved_at ? `Processed ${new Date(order.approved_at).toLocaleDateString()}` : '—'}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateOrderModal
          products={products}
          onClose={() => setShowCreate(false)}
          onCreated={() => { qc.invalidateQueries(['orders']); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

function CreateOrderModal({ products, onClose, onCreated }) {
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', product_name: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)

  const addItem = () => setItems(prev => [...prev, { product_id: '', product_name: '', quantity: 1 }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const handleProductChange = (i, productId) => {
    const product = products.find(p => p.id === productId)
    updateItem(i, 'product_id', productId)
    updateItem(i, 'product_name', product?.name || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerName.trim()) return toast.error('Customer name required')
    if (items.some(item => !item.product_id)) return toast.error('Select a product for each item')
    setLoading(true)
    try {
      await axios.post('/api/orders', { customer_name: customerName, items, notes })
      toast.success('Order created!')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Create New Order</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input className="input" placeholder="Customer / Company name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label">Order Items *</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      className="input"
                      value={item.product_id}
                      onChange={e => handleProductChange(i, e.target.value)}
                      required
                    >
                      <option value="">Select product...</option>
                      {products.filter(p => p.status !== 'OUT_OF_STOCK').map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit} available)</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      type="number" min="1"
                      placeholder="Qty"
                      style={{ width: 80 }}
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    {items.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => removeItem(i)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="input" placeholder="Delivery address, special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
