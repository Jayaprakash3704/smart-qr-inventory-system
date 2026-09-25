import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import ItemDetail from './pages/ItemDetail'
import QRGenerator from './pages/QRGenerator'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Reports from './pages/Reports'
import Orders from './pages/Orders'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/inventory"     element={<Inventory />} />
          <Route path="/inventory/:id" element={<ItemDetail />} />
          <Route path="/qr-generator"  element={<QRGenerator />} />
          <Route path="/stock-in"      element={<StockIn />} />
          <Route path="/stock-out"     element={<StockOut />} />
          <Route path="/reports"       element={<Reports />} />
          <Route path="/orders"        element={<Orders />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings"      element={<PrivateRoute requireAdmin><Settings /></PrivateRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
