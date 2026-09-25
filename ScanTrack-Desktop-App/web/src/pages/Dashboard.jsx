import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, ShoppingCart,
  ClipboardList, BarChart3, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts'

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#06b6d4']

function StatCard({ title, value, sub, icon: Icon, iconClass, to, delay = 0 }) {
  const inner = (
    <div className="stat-card anim-fade-up card-hover" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <div className={`icon-box icon-box-md ${iconClass}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-card__value">{value ?? '—'}</div>
      <div className="stat-card__label">{title}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

export default function Dashboard() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const eventSource = new EventSource('/api/stream')
    eventSource.addEventListener('stockUpdate', (e) => {
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-recent'] })
      queryClient.invalidateQueries({ queryKey: ['products-dashboard'] })
    })
    return () => eventSource.close()
  }, [queryClient])

  const { data: summary, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => axios.get('/api/reports/summary').then(r => r.data).catch(() => null),
    refetchInterval: 60_000,
  })

  const { data: recentTxns = [] } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => axios.get('/api/transactions?limit=6').then(r => r.data).catch(() => []),
    refetchInterval: 60_000,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products-dashboard'],
    queryFn: () => axios.get('/api/products').then(r => r.data).catch(() => []),
    refetchInterval: 60_000,
  })

  const s = summary || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
        <StatCard title="Total Products"  value={s.totalProducts} sub="All SKUs"        icon={Package}        iconClass="icon-box-brand"  to="/inventory"     delay={0} />
        <StatCard title="In Stock"        value={s.inStock}       sub="Available"       icon={TrendingUp}     iconClass="icon-box-green"  to="/inventory"     delay={60} />
        <StatCard title="Low Stock"       value={s.lowStock}      sub="Needs attention" icon={AlertTriangle}  iconClass="icon-box-yellow" to="/notifications" delay={120} />
        <StatCard title="Out of Stock"    value={s.outOfStock}    sub="Unavailable"     icon={TrendingDown}   iconClass="icon-box-red"    to="/inventory"     delay={180} />
        <StatCard title="Total Qty"       value={s.totalQuantity} sub="Units on hand"   icon={BarChart3}      iconClass="icon-box-blue"   delay={240} />
        <StatCard title="Pending Orders"  value={s.pendingOrders} sub="Awaiting approval" icon={ClipboardList} iconClass="icon-box-purple" to="/orders"       delay={300} />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Status Bar Chart */}
        <div className="card card-p anim-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-heading">Stock by Status</h3>
          </div>
          {summaryLoading ? (
            <div className="skeleton" style={{ height: 220 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.statusBreakdown || []} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontSize: 13 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(s.statusBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={['#22c55e', '#eab308', '#ef4444'][i % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie */}
        <div className="card card-p anim-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-heading">Items by Category</h3>
          </div>
          {summaryLoading ? (
            <div className="skeleton" style={{ height: 220 }} />
          ) : (s.categoryBreakdown || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={s.categoryBreakdown}
                  cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40}
                  dataKey="count"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(s.categoryBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}>
              <p>No category data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Transactions */}
      {(s.dailyTransactions || []).length > 0 && (
        <div className="card card-p anim-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-heading mb-4">7-Day Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={s.dailyTransactions}>
              <defs>
                <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Outfit' }} />
              <Area type="monotone" dataKey="stockIn"  name="Stock In"  stroke="#22c55e" fill="url(#gradIn)"  strokeWidth={2} />
              <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#ef4444" fill="url(#gradOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Row: Quick Actions + Recent Items + Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: 20 }}>

        {/* Quick Actions */}
        <div className="card card-p anim-fade-up" style={{ animationDelay: '240ms' }}>
          <h3 className="font-semibold text-heading mb-3">Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Stock In',      to: '/stock-in',      icon: ArrowDownToLine, cls: 'icon-box-green' },
              { label: 'Stock Out',     to: '/stock-out',     icon: ArrowUpFromLine, cls: 'icon-box-red' },
              { label: 'Generate QR',  to: '/qr-generator',  icon: Package,          cls: 'icon-box-brand' },
              { label: 'View Orders',  to: '/orders',         icon: ShoppingCart,    cls: 'icon-box-purple' },
            ].map(({ label, to, icon: Icon, cls }) => (
              <Link
                key={to} to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 'var(--r-md)',
                  transition: 'background var(--t-fast)', textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className={`icon-box icon-box-sm ${cls}`}><Icon size={13} /></div>
                <span className="text-sm font-medium text-body">{label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--gray-300)', fontSize: 16 }}>›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        <div className="card card-p anim-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-heading">Recent Products</h3>
            <Link to="/inventory" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>View all →</Link>
          </div>
          {products.slice(0, 5).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {products.slice(0, 5).map(item => {
                const statusMap = {
                  IN_STOCK: 'badge-in-stock', LOW_STOCK: 'badge-low-stock',
                  OUT_OF_STOCK: 'badge-out-stock',
                }
                const badgeCls = statusMap[item.status] || 'badge-info'
                const statusLabel = item.status?.replace('_', ' ') || 'IN STOCK'
                return (
                  <Link key={item.id} to={`/inventory/${item.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--r-md)',
                    transition: 'background var(--t-fast)', textDecoration: 'none', border: '1px solid transparent'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="icon-box icon-box-sm icon-box-brand"><Package size={13} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-body truncate">{item.name}</div>
                      <div className="text-xs text-muted">{item.sku} · {item.category}</div>
                    </div>
                    <span className={`badge ${badgeCls}`}>{statusLabel}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>No products yet. <Link to="/stock-in" style={{ color: 'var(--brand)' }}>Add first →</Link></p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card card-p anim-fade-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-heading">Recent Transactions</h3>
          </div>
          {recentTxns.slice(0, 5).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentTxns.slice(0, 5).map(txn => (
                <div key={txn.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 'var(--r-md)',
                }}>
                  <div className={`icon-box icon-box-sm ${txn.type === 'STOCK_IN' ? 'icon-box-green' : 'icon-box-red'}`}>
                    {txn.type === 'STOCK_IN' ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-body truncate">{txn.product_name}</div>
                    <div className="text-xs text-muted">{txn.type === 'STOCK_IN' ? '+' : '-'}{txn.quantity} units</div>
                  </div>
                  <span className="text-xs text-muted">{new Date(txn.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>No transactions yet</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
