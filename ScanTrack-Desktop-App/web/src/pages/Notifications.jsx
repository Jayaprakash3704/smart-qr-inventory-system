import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_ICONS = {
  LOW_STOCK:      '⚠️',
  OUT_OF_STOCK:   '🚨',
  STOCK_IN:       '📦',
  STOCK_OUT:      '📤',
  ORDER_PENDING:  '🛒',
  ORDER_APPROVED: '✅',
  INFO:           'ℹ️',
}

export default function Notifications() {
  const qc = useQueryClient()

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => axios.get('/api/notifications').then(r => r.data).catch(() => []),
    refetchInterval: 15_000,
  })

  const unread = notifs.filter(n => !n.isRead)
  const read   = notifs.filter(n =>  n.isRead)

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read')
      toast.success('All notifications marked as read')
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['notifications-count'])
    } catch {
      toast.error('Failed to mark notifications')
    }
  }

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`)
      qc.invalidateQueries(['notifications'])
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {unread.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      )}

      {/* Unread */}
      {unread.length > 0 && (
        <div className="card">
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--gray-100)', background: '#fff7ed' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              🔔 Unread ({unread.length})
            </span>
          </div>
          {unread.map(n => (
            <NotifItem key={n.id} notif={n} onDelete={deleteNotif} />
          ))}
        </div>
      )}

      {/* Read */}
      {isLoading ? (
        <div className="card card-p">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 'var(--r-md)' }} />
          ))}
        </div>
      ) : read.length > 0 ? (
        <div className="card">
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Read ({read.length})
            </span>
          </div>
          {read.map(n => (
            <NotifItem key={n.id} notif={n} onDelete={deleteNotif} />
          ))}
        </div>
      ) : notifs.length === 0 && !isLoading ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon"><BellOff size={24} /></div>
            <h3>No notifications</h3>
            <p>System alerts will appear here when stock levels change or orders arrive</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NotifItem({ notif, onDelete }) {
  const icon = TYPE_ICONS[notif.type] || 'ℹ️'
  const isUnread = !notif.isRead
  const time = notif.createdAt || notif.created_at

  return (
    <div className={`notif-item ${isUnread ? 'unread' : ''}`}>
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 2 }}>{notif.title}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>{notif.message}</div>
        {time && (
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
            {new Date(time).toLocaleString()}
          </div>
        )}
      </div>
      {isUnread && <div className="notif-dot" />}
      <button
        className="btn btn-ghost btn-sm btn-icon"
        onClick={() => onDelete(notif.id)}
        title="Delete notification"
        style={{ flexShrink: 0, opacity: 0.5 }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
