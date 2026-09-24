import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const titles = {
  '/dashboard':     'Dashboard',
  '/inventory':     'Inventory',
  '/qr-generator':  'QR Generator',
  '/stock-in':      'Stock In',
  '/stock-out':     'Stock Out',
  '/reports':       'Reports & Analytics',
  '/orders':        'Orders',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
}

export default function Layout() {
  const { pathname } = useLocation()
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? 'ScanTrack'

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 ml-[230px] min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">ScanTrack Inventory · Real-time management</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
