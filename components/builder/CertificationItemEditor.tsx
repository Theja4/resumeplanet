'use client'

import { X } from 'lucide-react'
import type { CertificationItem } from '@/types'

interface Props {
  item: CertificationItem
  onChange: (updated: CertificationItem) => void
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        {value && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13} /></button>}
      </div>
    </div>
  )
}

export default function CertificationItemEditor({ item, onChange }: Props) {
  return (
    <div className="space-y-3">
      <InputField label="Certificate Name" value={item.name} onChange={v => onChange({ ...item, name: v })} placeholder="AWS Certified Developer" />
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Issuing Organisation" value={item.issuer} onChange={v => onChange({ ...item, issuer: v })} placeholder="Amazon" />
        <InputField label="Date" value={item.date} onChange={v => onChange({ ...item, date: v })} placeholder="March 2024" />
      </div>
    </div>
  )
}
