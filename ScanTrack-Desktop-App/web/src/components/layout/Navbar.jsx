import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, QrCode, ArrowDownToLine,
  ArrowUpFromLine, BarChart3, ClipboardList, Bell,
  Settings, ScanLine, Users as UsersIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

const ADMIN_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Dashboard'    },
  { to: '/inventory',    icon: Package,           label: 'Inventory'    },
  { to: '/qr-generator', icon: QrCode,            label: 'QR Generator' },
  { to: '/stock-in',     icon: ArrowDownToLine,   label: 'Stock In'     },
  { to: '/stock-out',    icon: ArrowUpFromLine,   label: 'Stock Out'    },
  { to: '/reports',      icon: BarChart3,         label: 'Reports'      },
  { to: '/orders',       icon: ClipboardList,     label: 'Sales'        },
  { to: '/notifications',icon: Bell,              label: 'Notifications'},
  { to: '/settings',     icon: Settings,          label: 'Settings'     },
]

const STAFF_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Dashboard'    },
  { to: '/inventory',    icon: Package,           label: 'Inventory'    },
  { to: '/stock-in',     icon: ArrowDownToLine,   label: 'Stock In'     },
  { to: '/stock-out',    icon: ArrowUpFromLine,   label: 'Stock Out'    },
  { to: '/reports',      icon: BarChart3,         label: 'Reports'      },
  { to: '/orders',       icon: ClipboardList,     label: 'Sales'        },
  { to: '/notifications',icon: Bell,              label: 'Notifications'},
  { to: '/settings',     icon: Settings,          label: 'Settings'     },
]

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const nav = isAdmin ? ADMIN_NAV : STAFF_NAV

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => axios.get('/api/notifications').then(r => r.data).catch(() => []),
    refetchInterval: 30_000,
  })

  // Fix: SQLite returns isRead as 0/1 integer — treat both false and 0 as unread
  const unreadCount = notifs.filter(n => n.isRead === false || n.isRead === 0).length

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

        {nav.map(({ to, icon: Icon, label }) => (
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
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="sidebar__avatar">{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="flex-1 min-w-0">
            <div className="sidebar__user-name truncate">{currentUser?.email || 'User'}</div>
            <div className="sidebar__user-role capitalize">
              <span style={{
                display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 10,
                fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                background: isAdmin ? 'var(--brand-light)' : 'var(--gray-100)',
                color: isAdmin ? 'var(--brand)' : 'var(--gray-500)',
              }}>
                {currentUser?.role || 'staff'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
