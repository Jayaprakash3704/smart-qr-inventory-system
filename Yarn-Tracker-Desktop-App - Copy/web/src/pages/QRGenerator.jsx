import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState, useMemo } from 'react'
import { QrCode, Download, Search, Package, Grid3X3, List } from 'lucide-react'

export default function QRGenerator() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid') // grid | list

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => axios.get('/api/rolls').then(r => r.data).catch(() => []),
  })

  const filtered = useMemo(() => {
    const list = items.filter(i => i.id && !i.id.toLowerCase().includes('test'))
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(i =>
      (i.id || '').toLowerCase().includes(q) ||
      (i.yarn_type || i.name || '').toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 h-10" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 border border-slate-200 rounded-xl p-1 bg-white">
          <button onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
            <Grid3X3 size={15} />
          </button>
          <button onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
            <List size={15} />
          </button>
        </div>
        <div className="text-sm text-slate-500">{filtered.length} QR codes</div>
      </div>

      {/* Grid view */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card p-4 flex flex-col items-center text-center gap-3 animate-fade-in-up group">
              <img
                src={`/qrcodes/${item.id}.png`}
                alt={item.id}
                className="w-28 h-28 object-contain rounded-xl border border-slate-100 group-hover:scale-105 transition-transform"
                onError={e => {
                  e.target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f8fafc'/><text x='50' y='55' text-anchor='middle' font-size='10' fill='%23cbd5e1'>No QR</text></svg>`
                }}
              />
              <div className="w-full">
                <p className="text-xs font-bold text-slate-700 truncate">{item.yarn_type || item.name || item.id}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{item.id}</p>
              </div>
              <a
                href={`/qrcodes/${item.id}.png`}
                download={`${item.id}.png`}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 border border-orange-200 hover:border-orange-400 py-1.5 rounded-lg transition-all"
              >
                <Download size={12} /> Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="card divide-y divide-slate-50 overflow-hidden">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <img
                src={`/qrcodes/${item.id}.png`}
                alt={item.id}
                className="w-10 h-10 object-contain rounded-lg border border-slate-100 flex-shrink-0"
                onError={e => e.target.style.display = 'none'}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">{item.yarn_type || item.name || item.id}</p>
                <p className="text-xs text-slate-400 font-mono">{item.id}</p>
              </div>
              <span className={`badge ${(item.state || '').toUpperCase() === 'IN STOCK' ? 'badge-instock' : 'badge-reserved'}`}>
                {item.state || 'IN STOCK'}
              </span>
              <a href={`/qrcodes/${item.id}.png`} download={`${item.id}.png`}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold border border-orange-200 hover:border-orange-400 px-3 py-1.5 rounded-lg transition-all">
                <Download size={12} /> Download
              </a>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 card">
          <QrCode size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No QR codes found. Add items via Stock In.</p>
        </div>
      )}
    </div>
  )
}
