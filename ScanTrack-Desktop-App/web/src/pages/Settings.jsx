import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Bell, Package, Shield, Info, Users, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Settings() {
  const [lowStockThreshold, setLowStockThreshold] = useState(
    parseInt(localStorage.getItem('scantrack_low_threshold') || '5')
  )
  const [appName, setAppName] = useState(localStorage.getItem('scantrack_app_name') || 'ScanTrack')
  const [currency, setCurrency] = useState(localStorage.getItem('scantrack_currency') || '₹')
  const [autoRefresh, setAutoRefresh] = useState(localStorage.getItem('scantrack_auto_refresh') !== 'false')

  // User Management State
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('staff')
  const [loadingUser, setLoadingUser] = useState(false)
  const [users, setUsers] = useState([])

  const fetchUsers = () => {
    axios.get('/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to fetch users:', err))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const saveSettings = () => {
    localStorage.setItem('scantrack_low_threshold', String(lowStockThreshold))
    localStorage.setItem('scantrack_app_name', appName)
    localStorage.setItem('scantrack_currency', currency)
    localStorage.setItem('scantrack_auto_refresh', String(autoRefresh))
    toast.success('Settings saved!')
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newUserEmail || !newUserPassword) return toast.error('Email and password required')
    setLoadingUser(true)
    try {
      await axios.post('/api/users', { email: newUserEmail, password: newUserPassword, role: newUserRole })
      toast.success('User created successfully!')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('staff')
      fetchUsers() // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user')
    } finally {
      setLoadingUser(false)
    }
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
        {/* User Management */}
        <div className="card card-p" style={{ gridColumn: '1 / -1' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box icon-box-md icon-box-purple"><Users size={18} /></div>
            <h3 className="font-semibold text-heading">User Management</h3>
          </div>
          <form onSubmit={handleAddUser} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', paddingBottom: 24, borderBottom: '1px solid var(--gray-100)', marginBottom: 24 }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Email</label>
              <input type="email" className="input" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="user@example.com" required />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Password</label>
              <input type="password" className="input" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Min 6 characters" required minLength="6" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
              <label className="form-label">Role</label>
              <select className="input" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                <option value="staff">Staff (Inventory only)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loadingUser} style={{ height: 38 }}>
              <Plus size={16} /> {loadingUser ? 'Adding...' : 'Add User'}
            </button>
          </form>
          
          <h4 className="font-semibold text-heading" style={{ fontSize: 13, marginBottom: 16 }}>Active Users</h4>
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-100)', fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>UID</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No users loaded yet or loading...</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.uid} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, 
                          background: u.role === 'admin' ? 'var(--brand-light)' : 'var(--gray-200)',
                          color: u.role === 'admin' ? 'var(--brand)' : 'var(--gray-600)'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{u.uid}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="form-hint" style={{ marginTop: 16 }}>New users will be created in Firebase Auth and granted access in the SQLite database automatically.</div>
        </div>

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-primary btn-lg" onClick={saveSettings}>
          <Shield size={16} /> Save Settings
        </button>
      </div>
    </div>
  )
}
