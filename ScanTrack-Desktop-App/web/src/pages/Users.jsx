import { useState, useEffect } from 'react'
import { Users, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function UsersPage() {
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
          <h1>Users & Access</h1>
          <p>Manage staff accounts and system access</p>
        </div>
      </div>

      <div className="card card-p">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-box icon-box-md icon-box-purple"><Users size={18} /></div>
          <h3 className="font-semibold text-heading">Add New User</h3>
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
    </div>
  )
}
