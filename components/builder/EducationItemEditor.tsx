'use client'

import { X, Link as LinkIcon } from 'lucide-react'
import type { EducationItem } from '@/types'

interface Props {
  item: EducationItem
  pathPrefix: string
  onChange: (updated: EducationItem) => void
}

function InputField({ label, path, value, onChange, placeholder, labelIcon }: {
  label: string; path: string; value: string; onChange: (v: string) => void; placeholder?: string; labelIcon?: React.ReactNode
}) {
  const inputId = `field-${path.replace(/[^a-zA-Z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">
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
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 pr-9 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
        {value && (
          <button aria-label="Clear field" onClick={() => onChange('')} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function EducationItemEditor({ item, pathPrefix, onChange }: Props) {
  return (
    <div className="space-y-5 rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
      <InputField label="Institution" path={`${pathPrefix}.institution`} value={item.institution} onChange={v => onChange({ ...item, institution: v })} placeholder="University name" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Degree" path={`${pathPrefix}.degree`} value={item.degree} onChange={v => onChange({ ...item, degree: v })} placeholder="Bachelor of Science" />
        <InputField label="Field of Study" path={`${pathPrefix}.field`} value={item.field} onChange={v => onChange({ ...item, field: v })} placeholder="Computer Science" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Start Date" path={`${pathPrefix}.startDate`} value={item.startDate ?? ''} onChange={v => onChange({ ...item, startDate: v })} placeholder="Sep 2020" />
        <InputField label="End Date" path={`${pathPrefix}.endDate`} value={item.endDate ?? ''} onChange={v => onChange({ ...item, endDate: v, graduationDate: v })} placeholder="Present or May 2024" />
      </div>
      <InputField label="GPA (optional)" path={`${pathPrefix}.gpa`} value={item.gpa} onChange={v => onChange({ ...item, gpa: v })} placeholder="3.8" />
      <InputField label="Link (optional)" path={`${pathPrefix}.url`} value={item.url ?? ''} onChange={v => onChange({ ...item, url: v })} placeholder="https://university.edu/program" labelIcon={<LinkIcon size={13} className="text-gray-400" />} />
    </div>
  )
}
