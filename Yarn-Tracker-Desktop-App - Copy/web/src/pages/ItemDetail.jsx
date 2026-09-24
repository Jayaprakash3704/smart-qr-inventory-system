import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, QrCode, MapPin, Tag, User, Hash, Calendar, RefreshCw, Loader2 } from 'lucide-react'

function Field({ label, value, icon: Icon }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
      {Icon && <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0"><Icon size={14} className="text-slate-500" /></div>}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const STATES = ['IN STOCK', 'RESERVED', 'PICKED', 'DISPATCHED']

export default function ItemDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [newState, setNewState] = useState('')

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => axios.get(`/api/rolls/${id}`).then(r => r.data),
  })

  const updateState = useMutation({
    mutationFn: (state) => axios.post('/api/rolls/update-state', { rollIds: [id], state }),
    onSuccess: () => {
      toast.success('Status updated!')
      queryClient.invalidateQueries(['items'])
      queryClient.invalidateQueries(['item', id])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to update'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-orange-500" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Item not found.</p>
        <Link to="/inventory" className="text-orange-500 hover:underline text-sm mt-2 block">← Back to inventory</Link>
      </div>
    )
  }

  const state = (item.state || 'IN STOCK').toUpperCase()
  const badgeMap = { 'IN STOCK': 'badge-instock', 'RESERVED': 'badge-reserved', 'PICKED': 'badge bg-indigo-100 text-indigo-700', 'DISPATCHED': 'badge-dispatched', 'LOW': 'badge-low' }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Back */}
      <Link to="/inventory" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 transition-colors font-medium">
        <ArrowLeft size={15} /> Back to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Package size={24} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{item.yarn_type || item.name || id}</h2>
                  <p className="text-sm text-slate-400 mt-0.5 font-mono">{id}</p>
                </div>
              </div>
              <span className={`badge ${badgeMap[state] || 'badge-instock'}`}>{state}</span>
            </div>

            {/* Update status */}
            <div className="border-t border-slate-100 pt-4 flex items-center gap-3 flex-wrap">
              <select className="input h-9 text-xs" value={newState} onChange={e => setNewState(e.target.value)}>
                <option value="">Change status…</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                disabled={!newState || updateState.isPending}
                onClick={() => updateState.mutate(newState)}
                className="btn-primary h-9 text-xs px-4">
                {updateState.isPending ? <Loader2 size={13} className="animate-spin" /> : 'Update'}
              </button>
            </div>
          </div>

          {/* Fields grid */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-700 mb-4">Item Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Item Type" value={item.yarn_type || item.name} icon={Package} />
              <Field label="Yarn Count / SKU" value={item.yarn_count || item.sku} icon={Hash} />
              <Field label="Weight / Quantity" value={item.weight ? `${item.weight} kg` : item.quantity} icon={Tag} />
              <Field label="Supplier" value={item.supplier_name || item.supplier} icon={User} />
              <Field label="Lot Number" value={item.lot_number} icon={Hash} />
              <Field label="Order ID" value={item.order_id} icon={Tag} />
              <Field label="Location" value={item.rack_id ? `Rack ${item.rack_id} / Bin ${item.bin}` : item.location} icon={MapPin} />
              <Field label="Production Date" value={item.production_date ? new Date(item.production_date).toLocaleDateString() : null} icon={Calendar} />
            </div>
          </div>
        </div>

        {/* Right: QR Code */}
        <div className="space-y-5">
          <div className="card p-6 flex flex-col items-center text-center">
            <QrCode size={20} className="text-orange-500 mb-3" />
            <h3 className="font-bold text-slate-700 mb-4">QR Code</h3>
            <img
              src={`/qrcodes/${id}.png`}
              alt={`QR for ${id}`}
              className="w-full max-w-[180px] rounded-xl border border-slate-100 p-2 shadow-sm"
              onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50" y="55" text-anchor="middle" font-size="12" fill="%2394a3b8">No QR</text></svg>' }}
            />
            <p className="text-xs text-slate-400 mt-3 font-mono break-all">{id}</p>
            <a href={`/qrcodes/${id}.png`} download={`${id}.png`}
              className="btn-secondary mt-4 text-xs px-4 py-2 w-full justify-center">
              Download QR
            </a>
          </div>

          {/* Timestamps */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-slate-700 text-sm">Timeline</h3>
            {item.production_date && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Created {new Date(item.production_date).toLocaleDateString()}</span>
              </div>
            )}
            {item.last_state_change && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Updated {new Date(item.last_state_change).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
