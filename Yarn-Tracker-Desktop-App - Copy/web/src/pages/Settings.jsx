import { useState } from 'react'
import { Settings as SettingsIcon, Server, Bell, Database, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SECTIONS = [
  {
    title: 'API Configuration',
    icon: Server,
    fields: [
      { id: 'api_url',        label: 'Backend API URL',       placeholder: 'http://localhost:5000', type: 'text' },
      { id: 'refresh_interval', label: 'Auto-refresh (seconds)', placeholder: '60', type: 'number' },
    ],
  },
  {
    title: 'Inventory Rules',
    icon: Database,
    fields: [
      { id: 'low_stock_threshold', label: 'Default Low-Stock Threshold', placeholder: '10', type: 'number' },
      { id: 'bin_capacity',         label: 'Default Bin Capacity',        placeholder: '10', type: 'number' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    fields: [
      { id: 'notif_low_stock', label: 'Low-Stock Alerts', type: 'toggle' },
      { id: 'notif_orders',    label: 'New Order Alerts', type: 'toggle' },
    ],
  },
]

export default function Settings() {
  const [values, setValues] = useState({
    api_url: 'http://localhost:5000',
    refresh_interval: '60',
    low_stock_threshold: '10',
    bin_capacity: '10',
    notif_low_stock: true,
    notif_orders: true,
  })
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem('scantrack_settings', JSON.stringify(values))
    setSaved(true)
    toast.success('Settings saved!')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <SettingsIcon size={22} className="text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <p className="text-sm text-slate-400">Configure ScanTrack Inventory</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ title, icon: Icon, fields }) => (
        <div key={title} className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Icon size={15} className="text-orange-500" />
            </div>
            <h3 className="font-bold text-slate-700">{title}</h3>
          </div>
          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.id}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                {f.type === 'toggle' ? (
                  <button
                    onClick={() => setValues(p => ({ ...p, [f.id]: !p[f.id] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${values[f.id] ? 'bg-orange-500' : 'bg-slate-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${values[f.id] ? 'translate-x-5' : ''}`} />
                  </button>
                ) : (
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={values[f.id] || ''}
                    onChange={e => setValues(p => ({ ...p, [f.id]: e.target.value }))}
                    className="input"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* System info */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-700 mb-4">System Info</h3>
        <div className="space-y-2">
          {[
            { label: 'App Version',    value: 'ScanTrack v1.0.0' },
            { label: 'Platform',       value: 'React + Node.js + Firebase' },
            { label: 'Project ID',     value: 'WD004' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{label}</span>
              <span className="font-semibold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save} className="btn-primary px-8">
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>
    </div>
  )
}
