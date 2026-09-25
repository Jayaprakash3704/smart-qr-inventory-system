import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { QrCode, Download, Search, Package } from 'lucide-react'

export default function QRGenerator() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/api/products').then(r => r.data).catch(() => []),
  })

  const filtered = products.filter(p =>
    !search ||
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku  || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (product) => setSelected(product)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1>QR Generator</h1>
          <p>Select a product to view and download its QR code</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* Product List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="search-bar">
            <Search size={15} className="search-bar__icon" />
            <input
              className="input"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="card">
            {isLoading ? (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--r-md)' }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon"><QrCode size={24} /></div>
                <h3>No products found</h3>
                <p>Add products first from the Inventory page</p>
              </div>
            ) : (
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 'var(--r-md)',
                      background: selected?.id === p.id ? 'var(--brand-muted)' : 'transparent',
                      border: selected?.id === p.id ? '1.5px solid #f97316' : '1.5px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--t-fast)',
                    }}
                    onMouseEnter={e => { if (selected?.id !== p.id) e.currentTarget.style.background = 'var(--gray-50)' }}
                    onMouseLeave={e => { if (selected?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="icon-box icon-box-sm icon-box-brand"><Package size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.sku} · {p.category}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)',
                      background: p.quantity === 0 ? 'var(--danger-bg)' : p.status === 'LOW_STOCK' ? 'var(--warning-bg)' : 'var(--success-bg)',
                      color: p.quantity === 0 ? 'var(--danger-text)' : p.status === 'LOW_STOCK' ? 'var(--warning-text)' : 'var(--success-text)',
                    }}>
                      {p.quantity} {p.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QR Viewer */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected ? (
            <>
              <div className="card card-p" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                  QR Code for Product
                </div>

                <div style={{
                  background: 'var(--white)', border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--r-lg)', padding: 20, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <img
                    src={`/api/qr/${selected.id}`}
                    alt={`QR for ${selected.name}`}
                    style={{ width: 220, height: 220, objectFit: 'contain' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)' }}>{selected.name}</div>
                  <code style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selected.sku}</code>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a
                    href={`/api/qr/${selected.id}`}
                    download={`${selected.sku}-qr.png`}
                    className="btn btn-primary"
                    style={{ justifyContent: 'center' }}
                  >
                    <Download size={15} /> Download PNG
                  </a>
                  <Link
                    to={`/inventory/${selected.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center' }}
                  >
                    View Product Detail
                  </Link>
                </div>
              </div>

              <div className="card card-p" style={{ fontSize: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>QR Payload</div>
                <pre style={{
                  background: 'var(--gray-900)', color: '#a3e635',
                  padding: 12, borderRadius: 'var(--r-md)',
                  fontSize: 11, overflow: 'auto', fontFamily: 'monospace',
                  lineHeight: 1.6,
                }}>
                  {JSON.stringify({ id: selected.id, name: selected.name, sku: selected.sku, category: selected.category }, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="card card-p" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--r-xl)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <QrCode size={28} color="var(--gray-400)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6 }}>Select a product</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Choose a product from the list to view its QR code</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
