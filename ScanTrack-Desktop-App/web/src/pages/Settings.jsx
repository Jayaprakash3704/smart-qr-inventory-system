import { useState } from 'react'
import { Settings as SettingsIcon, Shield, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const [lowStockThreshold, setLowStockThreshold] = useState(
    parseInt(localStorage.getItem('scantrack_low_threshold') || '5')
  )
  const [appName, setAppName] = useState(localStorage.getItem('scantrack_app_name') || 'ScanTrack')
  const [currency, setCurrency] = useState(localStorage.getItem('scantrack_currency') || '₹')
  const [autoRefresh, setAutoRefresh] = useState(localStorage.getItem('scantrack_auto_refresh') !== 'false')
  const navigate = useNavigate()

  const saveSettings = () => {
    localStorage.setItem('scantrack_low_threshold', String(lowStockThreshold))
    localStorage.setItem('scantrack_app_name', appName)
    localStorage.setItem('scantrack_currency', currency)
    localStorage.setItem('scantrack_auto_refresh', String(autoRefresh))
    toast.success('Settings saved!')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Settings</h1>
          <p>Configure ScanTrack preferences and manage system access</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* General Settings */}
        <div className="card card-p">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box icon-box-md icon-box-brand"><SettingsIcon size={18} /></div>
            <h3 className="font-semibold text-heading">General</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Application Name</label>
              <input className="input" value={appName} onChange={e => setAppName(e.target.value)} placeholder="ScanTrack" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                {['₹', '$', '€', '£', '¥', 'AED', 'SGD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Auto-refresh data</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Automatically refresh inventory data every minute</div>
              </div>
              <button
                onClick={() => setAutoRefresh(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: autoRefresh ? 'var(--brand)' : 'var(--gray-300)',
                  border: 'none', cursor: 'pointer',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  left: autoRefresh ? 22 : 2,
                  width: 20, height: 20,
                  borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card card-p">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box icon-box-md icon-box-gray"><Info size={18} /></div>
            <h3 className="font-semibold text-heading">System Information</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Application', 'ScanTrack QR Inventory'],
              ['Version', '2.0.0'],
              ['Backend', 'Node.js + Express + Firebase Admin'],
              ['Database', 'SQLite (WAL Mode)'],
              ['Frontend', 'React 19 + Vite'],
              ['Authentication', 'Firebase Auth (JWT)'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <button 
          className="btn" 
          onClick={async () => {
            await signOut(auth)
            navigate('/login')
          }}
          style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', border: 'none' }}
        >
          Sign Out
        </button>
        <button className="btn btn-primary btn-lg" onClick={saveSettings}>
          <Shield size={16} /> Save Settings
        </button>
      </div>
    </div>
  )
}
