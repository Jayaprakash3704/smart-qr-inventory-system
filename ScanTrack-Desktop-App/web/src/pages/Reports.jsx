import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts'
import {
  BarChart3, TrendingUp, TrendingDown, Package, AlertTriangle,
  Download, ShoppingCart, CheckCircle, Clock, IndianRupee,
} from 'lucide-react'

const PIE_COLORS      = ['#22c55e', '#eab308', '#ef4444']
const CATEGORY_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ef4444','#eab308','#06b6d4','#ec4899']

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'

// ─── CSV Export Helper ────────────────────────────────────────────────
function exportCSV(data, filename) {
  if (!data || data.length === 0) {
    toast.error('No data available to export.')
    return
  }
  const cols = Object.keys(data[0])
  const rows = data.map(r => cols.map(c => {
    let val = r[c] ?? ''
    if (typeof val === 'object') val = JSON.stringify(val)
    val = String(val).replace(/"/g, '""') // Escape quotes
    return `"${val}"` // Wrap in quotes for commas
  }).join(','))
  
  const csv = [cols.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV Exported Successfully!')
}

// ─── PDF Export Helper ────────────────────────────────────────────────
function exportPDF(s, txns, lowStock, days) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(30, 41, 59)
  doc.text('ScanTrack - Reports & Analytics', 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
  doc.text(`Report Period: Last ${days} days`, 14, 35)
  
  // KPI Summary Table
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text('Inventory Overview', 14, 48)
  
  const kpiData = [
    ['Total Products', s?.totalProducts?.toString() || '0'],
    ['In Stock', s?.inStock?.toString() || '0'],
    ['Low Stock', s?.lowStock?.toString() || '0'],
    ['Out of Stock', s?.outOfStock?.toString() || '0'],
    ['Inventory Value (Cost)', `Rs. ${(s?.totalInventoryValue || 0).toLocaleString('en-IN')}`],
    ['Potential Revenue', `Rs. ${(s?.potentialRevenue || 0).toLocaleString('en-IN')}`]
  ]
  
  doc.autoTable({
    startY: 52,
    head: [['Metric', 'Value']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22] }, // Brand orange
    styles: { fontSize: 10 }
  })
  
  // Low Stock Table
  if (lowStock && lowStock.length > 0) {
    let currentY = doc.lastAutoTable.finalY + 15
    if (currentY > 250) { doc.addPage(); currentY = 20 }
    
    doc.setFontSize(14)
    doc.text('Low & Out of Stock Alerts', 14, currentY)
    
    const lowStockData = lowStock.map(p => [
      p.name, p.sku || 'N/A', p.category || 'N/A', 
      p.quantity.toString(), p.low_stock_threshold.toString(), p.status.replace(/_/g, ' ')
    ])
    
    doc.autoTable({
      startY: currentY + 4,
      head: [['Product', 'SKU', 'Category', 'Qty', 'Threshold', 'Status']],
      body: lowStockData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }, // Red
      styles: { fontSize: 9 }
    })
  }
  
  // Recent Transactions
  if (txns && txns.length > 0) {
    let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60
    if (currentY > 250) { doc.addPage(); currentY = 20 }
    
    doc.setFontSize(14)
    doc.text(`Recent Transactions (Last ${days} days)`, 14, currentY)
    
    const txnsData = txns.slice(0, 100).map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      t.product_name,
      t.type.replace(/_/g, ' '),
      t.quantity.toString(),
      t.reason || 'N/A'
    ])
    
    doc.autoTable({
      startY: currentY + 4,
      head: [['Date', 'Product', 'Type', 'Qty', 'Reason']],
      body: txnsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // Blue
      styles: { fontSize: 9 }
    })
  }
  
  doc.save(`scantrack-report-${days}d.pdf`)
  toast.success('PDF Exported Successfully!')
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, cls, sub }) {
  return (
    <div className="stat-card anim-fade-up">
      <div className={`icon-box icon-box-md ${cls}`}><Icon size={20} /></div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
}

export default function Reports() {
  const [days, setDays] = useState(30)

  const { data: s, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => axios.get('/api/reports/summary').then(r => r.data).catch(() => null),
    refetchInterval: 120_000,
  })

  const { data: lowStock = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => axios.get('/api/reports/low-stock').then(r => r.data).catch(() => []),
    refetchInterval: 120_000,
  })

  const { data: txnsData } = useQuery({
    queryKey: ['reports-transactions', days],
    queryFn: () => {
      const from = new Date(Date.now() - days * 86400_000).toISOString().split('T')[0]
      return axios.get(`/api/reports/transactions?from=${from}&limit=200`).then(r => r.data).catch(() => ({ transactions: [] }))
    },
    refetchInterval: 120_000,
  })

  const txns = txnsData?.transactions || []

  // Filter daily data to selected range
  const filteredDaily = (s?.dailyTransactions || []).slice(-(days))

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        {[7, 30, 90].map(d => (
          <button
            key={d}
            className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => exportCSV(txns, `scantrack-transactions-${days}d.csv`)}
          title="Export transactions to CSV"
        >
          <Download size={14} /> Export CSV
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => exportPDF(s, txns, lowStock, days)}
          title="Export Professional PDF Report"
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* ── Inventory KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
        <StatCard label="Total Products"   value={s?.totalProducts ?? 0}     icon={Package}       cls="icon-box-brand"   />
        <StatCard label="In Stock"         value={s?.inStock ?? 0}           icon={TrendingUp}    cls="icon-box-green"   />
        <StatCard label="Low Stock"        value={s?.lowStock ?? 0}          icon={AlertTriangle} cls="icon-box-yellow"  />
        <StatCard label="Out of Stock"     value={s?.outOfStock ?? 0}        icon={TrendingDown}  cls="icon-box-red"     />
        <StatCard label="Stock In (total)" value={s?.stockInQty ?? 0}        icon={TrendingUp}    cls="icon-box-blue"  sub="units" />
        <StatCard label="Stock Out (total)"value={s?.stockOutQty ?? 0}       icon={TrendingDown}  cls="icon-box-purple" sub="units" />
        <StatCard
          label="Inventory Value"
          value={`₹${(s?.totalInventoryValue ?? 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          cls="icon-box-green"
          sub="cost × qty"
        />
        <StatCard
          label="Potential Revenue"
          value={`₹${(s?.potentialRevenue ?? 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          cls="icon-box-brand"
          sub="sell × qty"
        />
      </div>

      {/* ── Orders Summary ── */}
      {(s?.totalOrders ?? 0) > 0 && (
        <div className="card card-p">
          <h3 className="font-semibold text-heading mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} /> Orders Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Orders',     value: s?.totalOrders ?? 0,     color: 'var(--gray-700)',   bg: 'var(--gray-100)',    icon: ShoppingCart },
              { label: 'Pending',          value: s?.pendingOrders ?? 0,   color: 'var(--warning-text)', bg: 'var(--warning-bg)', icon: Clock },
              { label: 'Approved',         value: s?.approvedOrders ?? 0,  color: 'var(--success-text)', bg: 'var(--success-bg)', icon: CheckCircle },
              { label: 'Cancelled',        value: s?.cancelledOrders ?? 0, color: 'var(--gray-400)',   bg: 'var(--gray-100)',    icon: TrendingDown },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: bg, borderRadius: 'var(--r-md)' }}>
                <Icon size={18} color={color} />
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card card-p">
          <h3 className="font-semibold text-heading mb-4">Stock Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={s?.statusBreakdown || []}
                cx="50%" cy="50%"
                outerRadius={90} innerRadius={50}
                dataKey="count" paddingAngle={4}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {(s?.statusBreakdown || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Outfit' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-p">
          <h3 className="font-semibold text-heading mb-4">Products by Category</h3>
          {(s?.categoryBreakdown || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={s.categoryBreakdown} barSize={28} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontSize: 13 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(s?.categoryBreakdown || []).map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 240 }}><p>No category data</p></div>
          )}
        </div>
      </div>

      {/* ── Daily Transactions Chart ── */}
      {filteredDaily.length > 0 && (
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="font-semibold text-heading">{days}-Day Transaction Volume</h3>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              In: <strong style={{ color: '#22c55e' }}>{filteredDaily.reduce((a, d) => a + d.stockIn, 0)}</strong>
              &nbsp;· Out: <strong style={{ color: '#ef4444' }}>{filteredDaily.reduce((a, d) => a + d.stockOut, 0)}</strong>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={filteredDaily}>
              <defs>
                <linearGradient id="gIn"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Outfit' }} />
              <Area type="monotone" dataKey="stockIn"  name="Stock In"  stroke="#22c55e" fill="url(#gIn)"  strokeWidth={2.5} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#ef4444" fill="url(#gOut)" strokeWidth={2.5} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top Products ── */}
      {(s?.topProducts || []).length > 0 && (
        <div className="card card-p">
          <h3 className="font-semibold text-heading mb-4">Most Active Products (All Time)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {s.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--r-sm)', flexShrink: 0,
                  background: i === 0 ? 'var(--brand-muted)' : 'var(--gray-100)',
                  color: i === 0 ? 'var(--brand)' : 'var(--gray-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12,
                }}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-body truncate">{p.name}</div>
                  <div className="progress-bar" style={{ marginTop: 4 }}>
                    <div className="progress-bar__fill" style={{ width: `${Math.min((p.count / (s.topProducts[0]?.count || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', flexShrink: 0 }}>{p.count} txns</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Low Stock Alert Table ── */}
      {lowStock.length > 0 && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="var(--warning)" />
              <h3 className="font-semibold text-heading">Low / Out of Stock Alert ({lowStock.length})</h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportCSV(lowStock, 'scantrack-low-stock.csv')}
            >
              <Download size={13} /> Export
            </button>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Threshold</th>
                  <th>Cost Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td><span className="font-semibold text-body">{p.name}</span></td>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                    <td>{p.category}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: p.quantity === 0 ? 'var(--danger-text)' : 'var(--warning-text)' }}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>{p.low_stock_threshold}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>
                        ₹{((p.quantity * (p.cost_price || 0))).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'OUT_OF_STOCK' ? 'badge-out-stock' : 'badge-low-stock'}`}>
                        {p.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
