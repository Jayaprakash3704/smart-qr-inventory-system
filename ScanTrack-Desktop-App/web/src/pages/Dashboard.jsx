import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, RefreshCw, ShoppingCart
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308']

function StatCard({ title, value, sub, icon: Icon, color, to, delay = 0 }) {
  const inner = (
    <div className="card p-5 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2 rounded-xl ${color}`}><Icon size={18} /></div>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value ?? '—'}</p>
      <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function Dashboard() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => axios.get('/api/rolls').then(r => r.data).catch(() => []),
    refetchInterval: 60_000,
  })

  const { data: txns = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => axios.get('/api/transactions').then(r => r.data).catch(() => []),
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => axios.get('/api/orders').then(r => r.data).catch(() => []),
  })

  // Stats
  const total     = items.length
  const inStock   = items.filter(i => (i.state || '').toUpperCase() === 'IN STOCK').length
  const reserved  = items.filter(i => (i.state || '').toUpperCase() === 'RESERVED').length
  const dispatched = items.filter(i => (i.state || '').toUpperCase() === 'DISPATCHED').length
  const lowStock  = items.filter(i => (i.state || '').toUpperCase() === 'LOW').length
  const pending   = orders.filter(o => o.status === 'PENDING').length

  // Chart: category breakdown
  const typeMap = {}
  items.forEach(i => {
    const t = i.item_type || i.item_type || 'Unknown'
    typeMap[t] = (typeMap[t] || 0) + 1
  })
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }))

  // Chart: bar by state
  const barData = [
    { name: 'In Stock',   count: inStock },
    { name: 'Reserved',   count: reserved },
    { name: 'Dispatched', count: dispatched },
    { name: 'Low Stock',  count: lowStock },
  ]

  // Recent activity (last 5 txns)
  const recent = [...txns].slice(0, 5)

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Items"  value={total}     sub="All registered" icon={Package}         color="bg-blue-50 text-blue-600"   to="/inventory"  delay={0} />
        <StatCard title="In Stock"     value={inStock}   sub="Available"      icon={TrendingUp}      color="bg-green-50 text-green-600" to="/inventory"  delay={60} />
        <StatCard title="Reserved"     value={reserved}  sub="Pending orders" icon={ShoppingCart}    color="bg-orange-50 text-orange-500" to="/orders"   delay={120} />
        <StatCard title="Dispatched"   value={dispatched} sub="Delivered"     icon={TrendingDown}    color="bg-slate-50 text-slate-500" to="/inventory"  delay={180} />
        <StatCard title="Low Stock"    value={lowStock}  sub="Need reorder"   icon={AlertTriangle}   color="bg-amber-50 text-amber-600" to="/notifications" delay={240} />
        <StatCard title="Pending Orders" value={pending} sub="Awaiting approval" icon={ClipboardList} color="bg-purple-50 text-purple-600" to="/orders"  delay={300} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-700 mb-5">Stock by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-700 mb-5">Items by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-700 mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Stock In',       to: '/stock-in',      icon: ArrowDownToLine, color: 'text-green-600 bg-green-50' },
              { label: 'Stock Out',      to: '/stock-out',     icon: ArrowUpFromLine, color: 'text-red-500 bg-red-50' },
              { label: 'Generate QR',   to: '/qr-generator',  icon: Package,         color: 'text-orange-500 bg-orange-50' },
              { label: 'View Orders',   to: '/orders',         icon: ShoppingCart,    color: 'text-blue-600 bg-blue-50' },
            ].map(({ label, to, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                <div className={`p-1.5 rounded-lg ${color}`}><Icon size={15} /></div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="ml-auto text-slate-300 text-lg">›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent items */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">Recent Inventory</h3>
            <Link to="/inventory" className="text-xs text-orange-500 font-semibold hover:underline">View all →</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.slice(0, 5).length > 0 ? (
            <div className="space-y-2">
              {items.slice(0, 5).map(item => {
                const state = (item.state || 'IN STOCK').toUpperCase()
                const badgeClass = state === 'IN STOCK' ? 'badge-instock' : state === 'RESERVED' ? 'badge-reserved' : state === 'DISPATCHED' ? 'badge-dispatched' : 'badge-low'
                return (
                  <Link key={item.id} to={`/inventory/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Package size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{item.item_type || item.name || item.id}</p>
                      <p className="text-xs text-slate-400">{item.id}</p>
                    </div>
                    <span className={`badge ${badgeClass}`}>{state}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No items yet. <Link to="/stock-in" className="text-orange-500 hover:underline">Add your first item →</Link></div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClipboardList(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}
