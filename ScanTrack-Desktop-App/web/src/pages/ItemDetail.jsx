import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft, Package, QrCode, ArrowDownToLine, ArrowUpFromLine,
  Edit2, Trash2, MapPin, Tag, User,
} from 'lucide-react'
import toast from 'react-hot-toast'

function StatusBadge({ status }) {
  const map = {
    IN_STOCK: ['badge-in-stock', 'In Stock'],
    LOW_STOCK: ['badge-low-stock', 'Low Stock'],
    OUT_OF_STOCK: ['badge-out-stock', 'Out of Stock'],
  }
  const [cls, label] = map[status] || ['badge-info', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => axios.get(`/api/products/${id}`).then(r => r.data),
  })

  const { data: txns = [] } = useQuery({
    queryKey: ['product-txns', id],
    queryFn: () => axios.get(`/api/transactions?product_id=${id}&limit=20`).then(r => r.data).catch(() => []),
  })

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/products/${id}`)
      toast.success('Product deleted')
      navigate('/inventory')
    } catch {
      toast.error('Failed to delete product')
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skeleton" style={{ height: 40, width: 160 }} />
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  )

  if (!product) return (
    <div className="empty-state">
      <div className="empty-state__icon"><Package size={24} /></div>
      <h3>Product not found</h3>
      <p>This product may have been deleted</p>
      <Link to="/inventory" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>← Back to Inventory</Link>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
            <Edit2 size={13} /> Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

        {/* Left: Product Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-p">
            <div className="flex items-center gap-4 mb-5">
              <div className="icon-box icon-box-lg icon-box-brand"><Package size={24} /></div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)' }}>{product.name}</h2>
                <code style={{ fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 6 }}>{product.sku}</code>
              </div>
              <StatusBadge status={product.status} />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              {[
                { label: 'Category',  value: product.category,  icon: Tag },
                { label: 'Location',  value: product.location,  icon: MapPin },
                { label: 'Supplier',  value: product.supplier || '—', icon: User },
                { label: 'Unit',      value: product.unit,      icon: Package },
                { label: 'Cost Price', value: product.cost_price ? `₹${product.cost_price}` : '—', icon: Tag },
                { label: 'Sell Price', value: product.sell_price ? `₹${product.sell_price}` : '—', icon: Tag },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{
                  background: 'var(--gray-50)', borderRadius: 'var(--r-md)',
                  padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center'
                }}>
                  <Icon size={14} color="var(--gray-400)" />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginTop: 1 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {product.description && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</div>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>{product.description}</p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <h3 className="font-semibold text-heading">Transaction History</h3>
            </div>
            {txns.length === 0 ? (
              <div className="empty-state"><p>No transactions yet</p></div>
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Before</th>
                      <th>After</th>
                      <th>Notes</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map(t => (
                      <tr key={t.id}>
                        <td>
                          <span className={`badge ${t.type === 'STOCK_IN' ? 'badge-stock-in' : 'badge-stock-out'}`}>
                            {t.type === 'STOCK_IN' ? '↓' : '↑'} {t.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: t.type === 'STOCK_IN' ? 'var(--success-text)' : 'var(--danger-text)' }}>
                            {t.type === 'STOCK_IN' ? '+' : '-'}{t.quantity}
                          </span>
                        </td>
                        <td><span className="text-sm text-sub">{t.quantity_before ?? '—'}</span></td>
                        <td><span className="text-sm font-semibold text-body">{t.quantity_after ?? '—'}</span></td>
                        <td><span className="text-sm text-muted truncate" style={{ maxWidth: 120, display: 'block' }}>{t.notes || t.reason || '—'}</span></td>
                        <td><span className="text-xs text-muted">{t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: QR + Stock info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quantity */}
          <div className="card card-p" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current Stock</div>
            <div style={{
              fontSize: 56, fontWeight: 900, lineHeight: 1,
              color: product.quantity === 0 ? 'var(--danger-text)'
                : product.status === 'LOW_STOCK' ? 'var(--warning-text)'
                : 'var(--success-text)'
            }}>
              {product.quantity}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>{product.unit}</div>
            <div style={{ margin: '12px 0' }} className="divider" />
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              Low stock alert at ≤ {product.low_stock_threshold || 5} {product.unit}
            </div>
          </div>

          {/* QR Code */}
          <div className="card card-p" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              QR Code
            </div>
            <div className="qr-viewer">
              <img
                src={`/api/qr/${product.id}`}
                alt={`QR Code for ${product.name}`}
                style={{ maxWidth: 180 }}
              />
            </div>
            <a
              href={`/api/qr/${product.id}`}
              download={`${product.sku}-qr.png`}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
            >
              <QrCode size={13} /> Download QR
            </a>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to={`/stock-in?id=${product.id}`} className="btn btn-success" style={{ justifyContent: 'center' }}>
              <ArrowDownToLine size={15} /> Stock In
            </Link>
            <Link to={`/stock-out?id=${product.id}`} className="btn btn-danger" style={{ justifyContent: 'center' }}>
              <ArrowUpFromLine size={15} /> Stock Out
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSaved={() => { qc.invalidateQueries(['product', id]); setShowEdit(false) }}
        />
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="modal-backdrop" onClick={() => setShowDelete(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <span className="modal__title">Delete Product?</span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowDelete(false)}>✕</button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({ ...product })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put(`/api/products/${product.id}`, form)
      toast.success('Product updated!')
      onSaved()
    } catch {
      toast.error('Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Edit Product</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal__body">
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="input" value={form.category} onChange={e => set('category', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="input" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Threshold</label>
                <input className="input" type="number" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', parseInt(e.target.value))} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Cost Price</label>
                <input className="input" type="number" step="0.01" value={form.cost_price} onChange={e => set('cost_price', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Sell Price</label>
                <input className="input" type="number" step="0.01" value={form.sell_price} onChange={e => set('sell_price', parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
