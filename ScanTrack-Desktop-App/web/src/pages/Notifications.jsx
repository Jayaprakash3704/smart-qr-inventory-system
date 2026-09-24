import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Bell, CheckCheck, AlertTriangle, ShoppingCart, Info, RefreshCw } from 'lucide-react'

const TYPE_ICONS = {
  LOW_STOCK:       { icon: AlertTriangle, color: 'bg-amber-50 text-amber-600',  border: 'border-amber-200' },
  ORDER_RECEIVED:  { icon: ShoppingCart,  color: 'bg-blue-50 text-blue-600',    border: 'border-blue-200' },
  ORDER_PENDING:   { icon: ShoppingCart,  color: 'bg-orange-50 text-orange-500',border: 'border-orange-200' },
  SYSTEM:          { icon: Info,          color: 'bg-slate-50 text-slate-600',   border: 'border-slate-200' },
}

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data: notifs = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => axios.get('/api/notifications').then(r => r.data).catch(() => []),
    refetchInterval: 20_000,
  })

  const markAll = useMutation({
    mutationFn: () => axios.post('/api/notifications/mark-all-read').catch(() => {}),
    onSuccess: () => { toast.success('All marked as read'); queryClient.invalidateQueries(['notifications', 'notifications-count']) },
  })

  const unread = notifs.filter(n => !n.is_read).length
  const sorted = [...notifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          {unread > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-2">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {unread > 0 && (
            <button onClick={() => markAll.mutate()} className="btn-secondary text-xs px-3 py-2">
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map(n => {
            const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM
            const Icon = cfg.icon
            return (
              <div key={n.id}
                className={`card p-4 flex items-start gap-4 animate-fade-in-up border ${n.is_read ? 'opacity-60' : cfg.border}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1 animate-pulse-orange" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 card">
          <Bell size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No notifications yet.</p>
          <p className="text-slate-400 text-xs mt-1">Low-stock alerts and order alerts will appear here.</p>
        </div>
      )}
    </div>
  )
}
