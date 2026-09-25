import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, QrCode, ArrowDownToLine,
  ArrowUpFromLine, BarChart3, ClipboardList, Bell,
  Settings, ScanLine, ScanSearch,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const nav = [
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Dashboard'   },
  { to: '/inventory',    icon: Package,           label: 'Inventory'   },
  { to: '/qr-generator', icon: QrCode,            label: 'QR Generator'},
  { to: '/stock-in',     icon: ArrowDownToLine,   label: 'Stock In'    },
  { to: '/stock-out',    icon: ArrowUpFromLine,   label: 'Stock Out'   },
  { to: '/reports',      icon: BarChart3,         label: 'Reports'     },
  { to: '/orders',       icon: ClipboardList,     label: 'Orders'      },
  { to: '/notifications',icon: Bell,              label: 'Notifications'},
  { to: '/settings',     icon: Settings,          label: 'Settings'    },
]
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => axios.get('/api/notifications').then(r => r.data).catch(() => []),
    refetchInterval: 30_000,
  })

  // Fix: use isRead (not is_read)
  const unreadCount = notifs.filter(n => n.isRead === false).length

  return (
    <aside className="sidebar anim-fade-left">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <ScanLine size={18} color="white" />
        </div>
        <div>
          <div className="sidebar__logo-title">ScanTrack</div>
          <div className="sidebar__logo-sub">QR Inventory v2</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <div className="sidebar__section-label">Main Menu</div>

        {nav.map(({ to, icon: Icon, label }) => {
          if (label === 'Settings' && currentUser?.role !== 'admin') return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="sidebar__avatar">{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="flex-1 min-w-0">
            <div className="sidebar__user-name truncate">{currentUser?.email || 'User'}</div>
            <div className="sidebar__user-role capitalize">{currentUser?.role || 'Staff'}</div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
