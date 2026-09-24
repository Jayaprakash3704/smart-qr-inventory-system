import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowDownToLine, Loader2, Package, MapPin, Hash, User, Tag, CheckCircle } from 'lucide-react'

const FIELDS = [
  { id: 'name',     label: 'Item Name',    placeholder: 'e.g. A4 Paper Ream',     required: true,  col: 2 },
  { id: 'sku',      label: 'SKU',          placeholder: 'e.g. PAP-A4-500',        required: false, col: 1 },
  { id: 'category', label: 'Category',     placeholder: 'e.g. Office Supplies',   required: true,  col: 1 },
  { id: 'unit',     label: 'Unit',         placeholder: 'Pcs / Box / Kg',         required: true,  col: 1 },
  { id: 'quantity', label: 'Quantity Received', placeholder: '0',                required: true,  col: 1, type: 'number' },
  { id: 'low_stock_threshold', label: 'Low-Stock Threshold', placeholder: '10', required: false, col: 1, type: 'number' },
  { id: 'supplier', label: 'Supplier',     placeholder: 'e.g. ABC Distributors',  required: false, col: 1 },
  { id: 'lot',      label: 'Lot / Batch No.', placeholder: 'Auto-generated if blank', required: false, col: 1 },
  { id: 'location', label: 'Storage Location', placeholder: 'e.g. Rack A / Shelf 2', required: false, col: 2 },
  { id: 'note',     label: 'Note',         placeholder: 'Optional note…',         required: false, col: 2 },
]

export default function StockIn() {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => axios.post('/api/rolls', {
      yarn_type: data.name,
      yarn_count: data.sku || data.category || '—',
      weight: parseFloat(data.quantity) || 1,
      supplier_name: data.supplier,
      lot_number: data.lot,
      order_id: data.location,
      name: data.name, sku: data.sku, category: data.category,
      unit: data.unit, quantity: parseInt(data.quantity) || 0,
      low_stock_threshold: parseInt(data.low_stock_threshold) || 10,
      location: data.location, note: data.note,
    }),
    onSuccess: (res) => {
      setSuccess(res.data)
      queryClient.invalidateQueries(['items'])
      toast.success(`✅ Stocked in: ${res.data.id}`)
      setForm({})
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message),
  })

  const validate = () => {
    const errs = {}
    FIELDS.filter(f => f.required).forEach(f => { if (!form[f.id]) errs[f.id] = 'Required' })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    setSuccess(null)
    mutation.mutate(form)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
            <ArrowDownToLine size={22} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Stock In</h2>
            <p className="text-sm text-slate-400">Record incoming inventory & auto-generate QR code</p>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="card p-5 border-green-200 bg-green-50 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-green-800">Item registered successfully!</p>
              <p className="text-sm text-green-700 mt-0.5">ID: <span className="font-mono font-bold">{success.id}</span> — QR code generated.</p>
            </div>
            <img src={`/qrcodes/${success.id}.png`} alt="QR" className="w-16 h-16 rounded-lg border border-green-200"
              onError={e => e.target.style.display = 'none'} />
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.id} className={f.col === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                {f.id === 'note' ? (
                  <textarea
                    rows={2}
                    placeholder={f.placeholder}
                    value={form[f.id] || ''}
                    onChange={e => { setForm(p => ({ ...p, [f.id]: e.target.value })); setErrors(p => ({ ...p, [f.id]: '' })) }}
                    className={`input resize-none ${errors[f.id] ? 'border-red-400' : ''}`}
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.id] || ''}
                    onChange={e => { setForm(p => ({ ...p, [f.id]: e.target.value })); setErrors(p => ({ ...p, [f.id]: '' })) }}
                    className={`input ${errors[f.id] ? 'border-red-400' : ''}`}
                  />
                )}
                {errors[f.id] && <p className="text-xs text-red-400 mt-1">{errors[f.id]}</p>}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button type="button" onClick={() => { setForm({}); setErrors({}); setSuccess(null) }} className="btn-secondary">
              Clear
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending
                ? <><Loader2 size={15} className="animate-spin" /> Registering…</>
                : <><ArrowDownToLine size={15} /> Stock In</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
