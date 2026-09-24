import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { BarChart3, TrendingUp, Package, ArrowUpFromLine } from 'lucide-react'

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308']

export default function Reports() {
  const { data: items = [] } = useQuery({ queryKey: ['items'], queryFn: () => axios.get('/api/rolls').then(r => r.data).catch(() => []) })
  const { data: dispatched = [] } = useQuery({ queryKey: ['dispatched'], queryFn: () => axios.get('/api/dispatched').then(r => r.data).catch(() => []) })

  const clean = items.filter(i => i.id && !i.id.toLowerCase().includes('test'))

  // Status breakdown
  const statusData = ['IN STOCK', 'RESERVED', 'PICKED', 'DISPATCHED'].map(s => ({
    name: s.replace(' ', '\n'),
    count: clean.filter(i => (i.state || 'IN STOCK').toUpperCase() === s).length,
  }))

  // Category breakdown
  const catMap = {}
  clean.forEach(i => { const t = i.item_type || i.name || 'Unknown'; catMap[t] = (catMap[t] || 0) + 1 })
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Dispatched timeline (group by date)
  const dateMap = {}
  dispatched.forEach(d => {
    const date = (d.delivered_at || d.production_date || '').slice(0, 10)
    if (date) dateMap[date] = (dateMap[date] || 0) + 1
  })
  const timeline = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, count]) => ({ date: date.slice(5), count }))

  const totalDispatched = dispatched.length
  const totalValue = clean.reduce((a, i) => a + (parseFloat(i.weight) || 0), 0).toFixed(1)
  const categories = Object.keys(catMap).length

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items',      value: clean.length,     icon: Package,          color: 'bg-blue-50 text-blue-600' },
          { label: 'Dispatched',        value: totalDispatched,  icon: ArrowUpFromLine,  color: 'bg-green-50 text-green-600' },
          { label: 'Categories',        value: categories,       icon: BarChart3,        color: 'bg-purple-50 text-purple-600' },
          { label: 'Total Weight (kg)', value: totalValue,       icon: TrendingUp,       color: 'bg-orange-50 text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 animate-fade-in-up">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
              <div className={`p-2 rounded-xl ${color}`}><Icon size={16} /></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status bar */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-700 mb-5">Stock by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-700 mb-5">Items by Category</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={catData} cx="40%" cy="50%" outerRadius={90} dataKey="value"
                  label={({ name, percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle"
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Dispatch timeline */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-700 mb-5">Dispatch Timeline (Last 14 Days)</h3>
        {timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="orange-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Area type="monotone" dataKey="count" stroke="#f97316" fill="url(#orange-grad)" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No dispatch history yet</div>
        )}
      </div>
    </div>
  )
}
