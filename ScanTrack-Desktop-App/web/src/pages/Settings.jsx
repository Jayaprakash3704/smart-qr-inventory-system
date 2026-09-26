import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Settings as SettingsIcon, Shield, Info, User, Users,
  Edit2, Trash2, RefreshCw, Plus, Check, X, LogOut,
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { auth } from '../firebase'
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ─── My Profile Section ───────────────────────────────────────────────────────
function MyProfile({ currentUser }) {
  const [displayName, setDisplayName] = useState(currentUser?.display_name || currentUser?.displayName || '')
  const [editingName, setEditingName] = useState(false)
  const [oldPass, setOldPass]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [savingName, setSavingName]   = useState(false)
  const [savingPass, setSavingPass]   = useState(false)

  const saveName = async () => {
    setSavingName(true)
    try {
      await axios.patch('/api/users/me', { display_name: displayName })
      toast.success('Display name updated!')
      setEditingName(false)
    } catch {
      toast.error('Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (newPass.length < 6) return toast.error('Password must be at least 6 characters')
    setSavingPass(true)
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPass)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPass)
      toast.success('Password changed successfully!')
      setOldPass(''); setNewPass('')
    } catch (err) {
      toast.error(err.code === 'auth/wrong-password' ? 'Current password is wrong' : 'Failed to change password')
    } finally {
      setSavingPass(false)
    }
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="card card-p">
      <div className="flex items-center gap-3 mb-6">
        <div className="icon-box icon-box-md icon-box-brand"><User size={18} /></div>
        <div>
          <h3 className="font-semibold text-heading">My Profile</h3>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Your account information</p>
        </div>
      </div>

      {/* Avatar + Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--r-lg)' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--brand), #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: 'white',
        }}>
          {(displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex gap-2" style={{ marginBottom: 4 }}>
              <input
                className="input"
                style={{ height: 36, fontSize: 14 }}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
              <button className="btn btn-primary btn-sm btn-icon" onClick={saveName} disabled={savingName}><Check size={14} /></button>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditingName(false)}><X size={14} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)' }}>
                {displayName || 'Set your name'}
              </span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingName(true)} title="Edit name">
                <Edit2 size={13} />
              </button>
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{currentUser?.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              background: isAdmin ? 'var(--brand-light)' : 'var(--gray-100)',
              color: isAdmin ? 'var(--brand)' : 'var(--gray-500)',
            }}>
              {currentUser?.role || 'staff'}
            </span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Email', value: currentUser?.email || '—' },
          { label: 'User ID', value: currentUser?.uid || '—' },
          { label: 'Role', value: (currentUser?.role || 'staff').toUpperCase() },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', fontFamily: label === 'User ID' ? 'monospace' : undefined, fontSize: label === 'User ID' ? 11 : 13 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Change Password</div>
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="input" type="password"
            placeholder="Current password"
            value={oldPass} onChange={e => setOldPass(e.target.value)}
            style={{ fontSize: 13 }}
          />
          <input
            className="input" type="password"
            placeholder="New password (min 6 chars)"
            value={newPass} onChange={e => setNewPass(e.target.value)}
            style={{ fontSize: 13 }}
          />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={savingPass || !oldPass || !newPass}>
            {savingPass ? 'Changing...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── User Management Section (Admin only) ────────────────────────────────────
function UserManagement() {
  const qc = useQueryClient()
  const [newEmail, setNewEmail]   = useState('')
  const [newPass,  setNewPass]    = useState('')
  const [adding,   setAdding]     = useState(false)
  const [showAdd,  setShowAdd]    = useState(false)

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => axios.get('/api/users').then(r => r.data).catch(() => []),
  })

  const addUser = async (e) => {
    e.preventDefault()
    if (!newEmail || !newPass) return toast.error('Email and password required')
    setAdding(true)
    try {
      await axios.post('/api/users', { email: newEmail, password: newPass, role: 'staff' })
      toast.success(`Staff user ${newEmail} created!`)
      setNewEmail(''); setNewPass(''); setShowAdd(false)
      qc.invalidateQueries(['users-list'])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user')
    } finally {
      setAdding(false)
    }
  }

  const changeRole = async (uid, role) => {
    try {
      await axios.patch(`/api/users/${uid}`, { role })
      toast.success('Role updated')
      qc.invalidateQueries(['users-list'])
    } catch {
      toast.error('Failed to update role')
    }
  }

  const deleteUser = async (uid, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return
    try {
      await axios.delete(`/api/users/${uid}`)
      toast.success(`User ${email} deleted`)
      qc.invalidateQueries(['users-list'])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user')
    }
  }

  return (
    <div className="card card-p">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-md icon-box-purple"><Users size={18} /></div>
          <div>
            <h3 className="font-semibold text-heading">User Management</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{users.length} active accounts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => qc.invalidateQueries(['users-list'])} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}>
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAdd && (
        <form onSubmit={addUser} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
          <input
            type="email" className="input" placeholder="staff@email.com" value={newEmail}
            onChange={e => setNewEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} required
          />
          <input
            type="password" className="input" placeholder="Min 6 chars" value={newPass}
            onChange={e => setNewPass(e.target.value)} style={{ flex: 1, minWidth: 160 }} minLength={6} required
          />
          <button type="submit" className="btn btn-primary" disabled={adding} style={{ height: 40 }}>
            {adding ? 'Adding...' : 'Create'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ height: 40 }}>Cancel</button>
        </form>
      )}

      {/* Users Table */}
      {usersLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 'var(--r-md)' }} />)
      ) : (
        <div style={{ border: '1px solid var(--gray-100)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
                {['User', 'Role', 'UID', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.uid} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand), #ea580c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
                      }}>
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {u.display_name && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{u.display_name}</div>}
                        <div style={{ fontSize: 12, color: u.display_name ? 'var(--gray-400)' : 'var(--gray-700)', fontWeight: u.display_name ? 400 : 600 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <select
                      className="input"
                      style={{ width: 100, height: 32, fontSize: 12, padding: '4px 8px' }}
                      value={u.role}
                      onChange={e => changeRole(u.uid, e.target.value)}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <code style={{ fontSize: 10, color: 'var(--gray-400)', fontFamily: 'monospace' }}>
                      {u.uid.substring(0, 18)}...
                    </code>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => deleteUser(u.uid, u.email)}
                      title="Delete user"
                      style={{ color: 'var(--danger-text)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── App Preferences Section ─────────────────────────────────────────────────
function AppPreferences() {
  const [lowStockThreshold, setLowStockThreshold] = useState(
    parseInt(localStorage.getItem('scantrack_low_threshold') || '5')
  )
  const [currency, setCurrency] = useState(localStorage.getItem('scantrack_currency') || '₹')
  const [autoRefresh, setAutoRefresh] = useState(localStorage.getItem('scantrack_auto_refresh') !== 'false')

  const save = () => {
    localStorage.setItem('scantrack_low_threshold', String(lowStockThreshold))
    localStorage.setItem('scantrack_currency', currency)
    localStorage.setItem('scantrack_auto_refresh', String(autoRefresh))
    toast.success('Preferences saved!')
  }

  return (
    <div className="card card-p">
      <div className="flex items-center gap-3 mb-5">
        <div className="icon-box icon-box-md icon-box-brand"><SettingsIcon size={18} /></div>
        <h3 className="font-semibold text-heading">App Preferences</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Currency Symbol</label>
          <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
            {['₹', '$', '€', '£', '¥', 'AED', 'SGD'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Default Low Stock Alert</label>
          <input className="input" type="number" min={1} value={lowStockThreshold} onChange={e => setLowStockThreshold(parseInt(e.target.value) || 5)} />
          <div className="form-hint">Threshold used for new products if not specified</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Auto-refresh data</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Refresh inventory every 60 seconds</div>
          </div>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: autoRefresh ? 'var(--brand)' : 'var(--gray-300)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: autoRefresh ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
        <button className="btn btn-primary" onClick={save}><Shield size={15} /> Save Preferences</button>
      </div>
    </div>
  )
}


// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const isAdmin = currentUser?.role === 'admin'

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, paddingTop: 10 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24, alignItems: 'start' }}>
        <MyProfile currentUser={currentUser} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AppPreferences />
        </div>
      </div>

      {/* User Management — Admin Only */}
      {isAdmin && <UserManagement />}
    </div>
  )
}
