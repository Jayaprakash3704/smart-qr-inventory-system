import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const PAGE_TITLES = {
  '/dashboard':     { title: 'Dashboard',           sub: 'Overview & analytics at a glance' },
  '/inventory':     { title: 'Inventory',            sub: 'Manage all products and stock levels' },
  '/qr-generator':  { title: 'QR Generator',        sub: 'Generate QR codes for products' },
  '/stock-in':      { title: 'Stock In',             sub: 'Record incoming inventory' },
  '/stock-out':     { title: 'Stock Out',            sub: 'Record outgoing inventory' },
  '/reports':       { title: 'Reports & Analytics',  sub: 'Inventory trends and insights' },
  '/orders':        { title: 'Orders',               sub: 'Customer orders and fulfillment' },
  '/notifications': { title: 'Notifications',        sub: 'Alerts and system messages' },
  '/settings':      { title: 'Settings',             sub: 'Application configuration' },
}

export default function Layout() {
  const { pathname } = useLocation()
  const match = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))
  const { title, sub } = match?.[1] ?? { title: 'ScanTrack', sub: 'QR Inventory Management' }

  return (
    <div className="app-shell">
      <Navbar />

      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div>
            <div className="topbar__title">{title}</div>
            <div className="topbar__sub">{sub}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
