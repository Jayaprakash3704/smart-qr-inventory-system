import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, QrCode, ArrowDownToLine,
  ArrowUpFromLine, BarChart3, ClipboardList, Bell,
  Settings, ScanLine, LogOut,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/inventory',     icon: Package,           label: 'Inventory' },
  { to: '/qr-generator',  icon: QrCode,            label: 'QR Generator' },
  { to: '/stock-in',      icon: ArrowDownToLine,   label: 'Stock In' },
  { to: '/stock-out',     icon: ArrowUpFromLine,   label: 'Stock Out' },
  { to: '/reports',       icon: BarChart3,         label: 'Reports' },
  { to: '/orders',        icon: ClipboardList,     label: 'Orders' },
  { to: '/notifications', icon: Bell,              label: 'Notifications' },
  { to: '/settings',      icon: Settings,          label: 'Settings' },
]

export default function Navbar() {
  const { data: notifs } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => axios.get('/api/notifications').then(r => r.data).catch(() => []),
    refetchInterval: 30_000,
  })
  const unreadCount = Array.isArray(notifs) ? notifs.filter(n => !n.is_read).length : 0

  return (
    <aside className="fixed left-0 top-0 h-screen w-[230px] bg-white border-r border-slate-100 flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
            <ScanLine size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-none">ScanTrack</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-orange-600 font-bold text-xs">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">Admin</p>
            <p className="text-[10px] text-slate-400">System Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
