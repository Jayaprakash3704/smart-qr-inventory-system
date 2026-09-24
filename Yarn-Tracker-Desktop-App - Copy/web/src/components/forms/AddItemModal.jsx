import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, Package, Loader2 } from 'lucide-react'

const FIELDS = [
  { id: 'name',       label: 'Item Name',      placeholder: 'e.g. Ballpoint Pen Box',   required: true,  col: 2 },
  { id: 'sku',        label: 'SKU / Item ID',  placeholder: 'e.g. PEN-BLK-100',         required: false, col: 1 },
  { id: 'category',   label: 'Category',       placeholder: 'e.g. Stationery',          required: true,  col: 1 },
  { id: 'unit',       label: 'Unit',           placeholder: 'e.g. Box, Kg, Pcs',        required: true,  col: 1 },
  { id: 'quantity',   label: 'Initial Qty',    placeholder: 'e.g. 100',                 required: true,  col: 1, type: 'number' },
  { id: 'low_stock_threshold', label: 'Low Stock Alert Qty', placeholder: 'e.g. 10',   required: false, col: 1, type: 'number' },
  { id: 'supplier',   label: 'Supplier',       placeholder: 'e.g. ABC Distributors',    required: false, col: 1 },
  { id: 'location',   label: 'Location',       placeholder: 'e.g. Rack A / Shelf 2',   required: false, col: 2 },
]

export default function AddItemModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: (data) => axios.post('/api/rolls', {
      yarn_type: data.name || data.yarn_type,
      yarn_count: data.sku || data.yarn_count || data.category || '—',
      weight: parseFloat(data.quantity) || 1,
      supplier_name: data.supplier,
      lot_number: data.sku,
      order_id: data.location,
      // new generic fields
      name: data.name,
      sku: data.sku,
      category: data.category,
      unit: data.unit,
      quantity: parseInt(data.quantity) || 0,
      low_stock_threshold: parseInt(data.low_stock_threshold) || 10,
      location: data.location,
    }),
    onSuccess: (res) => {
      toast.success(`✅ Item ${res.data.id} created with QR code!`)
      onSuccess?.()
    },
    onError: (e) => toast.error(`❌ ${e.response?.data?.error || e.message}`),
  })

  const validate = () => {
    const errs = {}
    FIELDS.filter(f => f.required).forEach(f => {
      if (!form[f.id]?.trim?.() && !form[f.id]) errs[f.id] = 'Required'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate(form)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Package size={18} className="text-orange-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Add New Item</h2>
              <p className="text-xs text-slate-400 mt-0.5">Fill details to register & generate QR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.id} className={f.col === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.id] || ''}
                  onChange={e => { setForm(p => ({ ...p, [f.id]: e.target.value })); setErrors(p => ({ ...p, [f.id]: '' })) }}
                  className={`input ${errors[f.id] ? 'border-red-400 focus:border-red-400 ring-red-100' : ''}`}
                />
                {errors[f.id] && <p className="text-xs text-red-400 mt-1">{errors[f.id]}</p>}
              </div>
            ))}
          </div>

          {/* Result message */}
          {mutation.isSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              ✅ Item created! QR code is ready in the QR Generator.
            </div>
          )}

          <div className="flex gap-3 mt-6 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : '+ Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
