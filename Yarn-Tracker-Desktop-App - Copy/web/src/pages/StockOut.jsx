import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowUpFromLine, Search, Package, Loader2, CheckCircle, X } from 'lucide-react'

export default function StockOut() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => axios.get('/api/rolls').then(r => r.data).catch(() => []),
  })

  const inStockItems = items.filter(i =>
    i.id && !i.id.toLowerCase().includes('test') &&
    ['IN STOCK', 'RESERVED', 'PICKED'].includes((i.state || '').toUpperCase())
  )

  const filtered = search
    ? inStockItems.filter(i =>
        (i.yarn_type || i.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.id || '').toLowerCase().includes(search.toLowerCase())
      )
    : inStockItems

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const mutation = useMutation({
    mutationFn: () => axios.post('/api/rolls/update-state', { rollIds: selected, state: 'DISPATCHED' }),
    onSuccess: () => {
      toast.success(`✅ ${selected.length} item(s) dispatched successfully!`)
      setSelected([])
      setNote('')
      queryClient.invalidateQueries(['items'])
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message),
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
            <ArrowUpFromLine size={22} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Stock Out</h2>
            <p className="text-sm text-slate-400">Select items to dispatch from inventory</p>
          </div>
        </div>
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="card p-5 border-orange-200 bg-orange-50 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-orange-800">{selected.length} item(s) selected</p>
            <button onClick={() => setSelected([])} className="text-orange-400 hover:text-orange-600">
              <X size={16} />
            </button>
          </div>
          <input
            className="input text-sm mb-3" placeholder="Add a dispatch note (optional)…"
            value={note} onChange={e => setNote(e.target.value)}
          />
          <button disabled={mutation.isPending} onClick={() => mutation.mutate()} className="btn-primary w-full justify-center">
            {mutation.isPending
              ? <><Loader2 size={15} className="animate-spin" /> Dispatching…</>
              : <><ArrowUpFromLine size={15} /> Confirm Stock Out ({selected.length})</>}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9 h-10" placeholder="Search items…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Item list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="card divide-y divide-slate-50 overflow-hidden">
          {filtered.map(item => {
            const sel = selected.includes(item.id)
            const state = (item.state || 'IN STOCK').toUpperCase()
            return (
              <div key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${sel ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${sel ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                  {sel && <CheckCircle size={12} className="text-white" />}
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{item.yarn_type || item.name || item.id}</p>
                  <p className="text-xs text-slate-400 font-mono">{item.id}</p>
                </div>
                <span className={`badge ${state === 'IN STOCK' ? 'badge-instock' : state === 'RESERVED' ? 'badge-reserved' : 'badge bg-indigo-100 text-indigo-700'}`}>{state}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 card">
          <Package size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No items available for stock-out.</p>
        </div>
      )}
    </div>
  )
}
