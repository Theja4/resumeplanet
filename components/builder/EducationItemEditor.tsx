'use client'

import { X } from 'lucide-react'
import type { EducationItem } from '@/types'

interface Props {
  item: EducationItem
  pathPrefix: string
  onChange: (updated: EducationItem) => void
}

function InputField({ label, path, value, onChange, placeholder }: {
  label: string; path: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          data-field-path={path}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function EducationItemEditor({ item, pathPrefix, onChange }: Props) {
  return (
    <div className="space-y-3">
      <InputField label="Institution" path={`${pathPrefix}.institution`} value={item.institution} onChange={v => onChange({ ...item, institution: v })} placeholder="University name" />
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Degree" path={`${pathPrefix}.degree`} value={item.degree} onChange={v => onChange({ ...item, degree: v })} placeholder="Bachelor of Science" />
        <InputField label="Field of Study" path={`${pathPrefix}.field`} value={item.field} onChange={v => onChange({ ...item, field: v })} placeholder="Computer Science" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Start Date" path={`${pathPrefix}.startDate`} value={item.startDate ?? ''} onChange={v => onChange({ ...item, startDate: v })} placeholder="Sep 2020" />
        <InputField label="End Date" path={`${pathPrefix}.endDate`} value={item.endDate ?? ''} onChange={v => onChange({ ...item, endDate: v, graduationDate: v })} placeholder="Present or May 2024" />
      </div>
      <InputField label="GPA (optional)" path={`${pathPrefix}.gpa`} value={item.gpa} onChange={v => onChange({ ...item, gpa: v })} placeholder="3.8" />
    </div>
  )
}
