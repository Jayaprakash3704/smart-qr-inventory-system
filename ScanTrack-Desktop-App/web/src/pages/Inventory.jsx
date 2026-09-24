import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Package, Search, Filter, Plus, QrCode, X, RefreshCw } from 'lucide-react'
import AddItemModal from '../components/forms/AddItemModal'

const STATE_TABS = ['All', 'In Stock', 'Reserved', 'Picked', 'Dispatched', 'Low']

function StatusBadge({ state }) {
  const s = (state || 'IN STOCK').toUpperCase()
  const map = {
    'IN STOCK':   'badge-instock',
    'RESERVED':   'badge-reserved',
    'PICKED':     'badge bg-indigo-100 text-indigo-700',
    'DISPATCHED': 'badge-dispatched',
    'LOW':        'badge-low',
  }
  return <span className={`badge ${map[s] || 'badge-instock'}`}>{s}</span>
}

function ItemCard({ item }) {
  return (
    <Link to={`/inventory/${item.id}`}
      className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer animate-fade-in-up block">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Package size={18} className="text-orange-500" />
        </div>
        <StatusBadge state={item.state} />
      </div>
      <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">{item.item_type || item.name || item.id}</h3>
      <p className="text-xs text-slate-400 mb-3">{item.id}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {item.weight && <div><span className="text-slate-400">Weight:</span> <span className="font-semibold text-slate-700">{item.weight} kg</span></div>}
        {item.supplier_name && <div><span className="text-slate-400">Supplier:</span> <span className="font-semibold text-slate-700 truncate block">{item.supplier_name}</span></div>}
        {item.rack_id && <div><span className="text-slate-400">Rack:</span> <span className="font-semibold text-slate-700">R{item.rack_id}</span></div>}
        {item.lot_number && <div><span className="text-slate-400">Lot:</span> <span className="font-semibold text-slate-700 truncate block">{item.lot_number}</span></div>}
      </div>
      {item.id && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          <img src={`/qrcodes/${item.id}.png`} alt="QR" className="w-8 h-8 rounded object-cover border border-slate-100"
            onError={e => { e.target.style.display = 'none' }} />
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <QrCode size={10} /> QR Ready
          </div>
        </div>
      )}
    </Link>
  )
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const queryClient = useQueryClient()

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: () => axios.get('/api/rolls').then(r => r.data).catch(() => []),
  })

  const filtered = useMemo(() => {
    let list = items.filter(i => i.id && !i.id.toLowerCase().includes('test'))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        (i.id || '').toLowerCase().includes(q) ||
        (i.item_type || i.name || '').toLowerCase().includes(q) ||
        (i.supplier_name || '').toLowerCase().includes(q) ||
        (i.lot_number || '').toLowerCase().includes(q)
      )
    }
    if (activeTab !== 'All') {
      list = list.filter(i => (i.state || 'IN STOCK').toUpperCase() === activeTab.toUpperCase())
    }
    return list
  }, [items, search, activeTab])

  const stateCount = (s) => s === 'All'
    ? items.filter(i => i.id && !i.id.toLowerCase().includes('test')).length
    : items.filter(i => i.id && !i.id.toLowerCase().includes('test') && (i.state || 'IN STOCK').toUpperCase() === s.toUpperCase()).length

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 h-10" placeholder="Search ID, type, supplier, lot…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={14} /></button>}
        </div>

        <button onClick={() => refetch()}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button onClick={() => setShowAdd(true)} className="btn-primary h-10">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATE_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === tab
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500'}`}>
            {tab} <span className="opacity-70 ml-0.5">({stateCount(tab)})</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="text-center py-20 card">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No items found</h3>
          <p className="text-slate-400 text-sm mt-1">
            {search ? 'Try a different search.' : 'Add your first inventory item to get started.'}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
              <Plus size={15} /> Add Item
            </button>
          )}
        </div>
      )}

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onSuccess={() => { queryClient.invalidateQueries(['items']); setShowAdd(false) }} />}
    </div>
  )
}
