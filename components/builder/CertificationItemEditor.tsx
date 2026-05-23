'use client'

import { X, Link as LinkIcon } from 'lucide-react'
import type { CertificationItem } from '@/types'

interface Props {
  item: CertificationItem
  pathPrefix: string
  onChange: (updated: CertificationItem) => void
}

function InputField({ label, path, value, onChange, placeholder, labelIcon }: {
  label: string; path: string; value: string; onChange: (v: string) => void; placeholder?: string; labelIcon?: React.ReactNode
}) {
  const inputId = `field-${path.replace(/[^a-zA-Z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={inputId} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-1.5">
        {labelIcon}
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          data-field-path={path}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {value && <button aria-label="Clear field" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>
    </div>
  )
}

export default function CertificationItemEditor({ item, pathPrefix, onChange }: Props) {
  return (
    <div className="space-y-4">
      <InputField label="Certificate Name" path={`${pathPrefix}.name`} value={item.name} onChange={v => onChange({ ...item, name: v })} placeholder="AWS Certified Developer" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Issuing Organisation" path={`${pathPrefix}.issuer`} value={item.issuer} onChange={v => onChange({ ...item, issuer: v })} placeholder="Amazon" />
        <InputField label="Date" path={`${pathPrefix}.date`} value={item.date} onChange={v => onChange({ ...item, date: v })} placeholder="March 2024" />
      </div>
      <InputField label="Link (optional)" path={`${pathPrefix}.url`} value={item.url ?? ''} onChange={v => onChange({ ...item, url: v })} placeholder="https://credly.com/badge/..." labelIcon={<LinkIcon size={13} className="text-gray-400" />} />
    </div>
  )
}
