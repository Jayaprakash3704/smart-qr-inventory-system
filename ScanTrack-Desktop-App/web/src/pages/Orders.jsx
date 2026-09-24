import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ClipboardList, CheckCircle, Loader2, RefreshCw, User, Package } from 'lucide-react'

function OrderCard({ order, onApprove, loading }) {
  const isPending = order.status === 'PENDING'
  return (
    <div className={`card p-5 animate-fade-in-up ${isPending ? 'border-orange-200' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-slate-800 text-sm">{order.id}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <User size={12} className="text-slate-400" />
            <p className="text-xs text-slate-500">{order.customer_name || 'Unknown Customer'}</p>
          </div>
        </div>
        <span className={`badge ${isPending ? 'badge-low' : 'badge-instock'}`}>{order.status}</span>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {(order.items || [{ item_type: order.item_type, quantity: order.quantity }]).map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2">
            <Package size={12} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 font-medium flex-1 truncate">{item.item_type || item.name || '—'}</span>
            <span className="text-orange-600 font-bold">×{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </p>
        {isPending && (
          <button disabled={loading} onClick={() => onApprove(order.id)} className="btn-primary text-xs px-4 py-1.5">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <><CheckCircle size={12} /> Approve</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Orders() {
  const queryClient = useQueryClient()
  const [approvingId, setApprovingId] = useState(null)

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: () => axios.get('/api/orders').then(r => r.data).catch(() => []),
    refetchInterval: 30_000,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => axios.post(`/api/orders/${id}/approve`),
    onSuccess: () => {
      toast.success('✅ Order approved!')
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['items'])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to approve'),
    onSettled: () => setApprovingId(null),
  })

  const pending  = orders.filter(o => o.status === 'PENDING')
  const approved = orders.filter(o => o.status !== 'PENDING')

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders',   value: orders.length,    color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending',         value: pending.length,   color: 'bg-amber-50 text-amber-600' },
          { label: 'Approved',        value: approved.length,  color: 'bg-green-50 text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">All Orders</h2>
        <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-2">
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...pending, ...approved].map(order => (
            <OrderCard
              key={order.id}
              order={order}
              loading={approvingId === order.id && approveMutation.isPending}
              onApprove={(id) => { setApprovingId(id); approveMutation.mutate(id) }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card">
          <ClipboardList size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No orders yet. Orders placed from the mobile app appear here.</p>
        </div>
      )}
    </div>
  )
}
