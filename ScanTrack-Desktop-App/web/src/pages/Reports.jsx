import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react'

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444']
const CATEGORY_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#06b6d4']

export default function Reports() {
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

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Products', value: s?.totalProducts ?? 0, icon: Package, cls: 'icon-box-brand' },
          { label: 'In Stock',       value: s?.inStock ?? 0,       icon: TrendingUp, cls: 'icon-box-green' },
          { label: 'Low Stock',      value: s?.lowStock ?? 0,      icon: AlertTriangle, cls: 'icon-box-yellow' },
          { label: 'Out of Stock',   value: s?.outOfStock ?? 0,    icon: TrendingDown, cls: 'icon-box-red' },
          { label: 'Stock In Qty',   value: s?.stockInQty ?? 0,    icon: TrendingUp, cls: 'icon-box-blue' },
          { label: 'Stock Out Qty',  value: s?.stockOutQty ?? 0,   icon: TrendingDown, cls: 'icon-box-purple' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card anim-fade-up">
            <div className={`icon-box icon-box-md ${cls}`}><Icon size={20} /></div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
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
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
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

      {/* 7-Day Transactions */}
      {(s?.dailyTransactions || []).length > 0 && (
        <div className="card card-p">
          <h3 className="font-semibold text-heading mb-4">7-Day Transaction History</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={s.dailyTransactions}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
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

      {/* Low Stock Alert Table */}
      {lowStock.length > 0 && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <h3 className="font-semibold text-heading">Low Stock / Out of Stock Alert ({lowStock.length})</h3>
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

      {/* Top Products */}
      {(s?.topProducts || []).length > 0 && (
        <div className="card card-p">
          <h3 className="font-semibold text-heading mb-4">Most Active Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {s.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--r-sm)',
                  background: i === 0 ? 'var(--brand-muted)' : 'var(--gray-100)',
                  color: i === 0 ? 'var(--brand)' : 'var(--gray-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12, flexShrink: 0,
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
    </div>
  )
}
