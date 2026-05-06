'use client'

import { X } from 'lucide-react'
import type { ProjectItem } from '@/types'

interface Props {
  item: ProjectItem
  pathPrefix: string
  onChange: (updated: ProjectItem) => void
}

function InputField({ label, path, value, onChange, placeholder }: {
  label: string; path: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input data-field-path={path} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        {value && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13} /></button>}
      </div>
    </div>
  )
}

export default function ProjectItemEditor({ item, pathPrefix, onChange }: Props) {
  return (
    <div className="space-y-3">
      <InputField label="Project Name" path={`${pathPrefix}.name`} value={item.name} onChange={v => onChange({ ...item, name: v })} placeholder="My Project" />
      <div>
        <label className="block text-xs text-gray-500 mb-1">Description</label>
        <textarea data-field-path={`${pathPrefix}.description`} value={item.description} onChange={e => onChange({ ...item, description: e.target.value })}
          rows={2} placeholder="What does this project do?"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Technologies (comma separated)</label>
        <input
          data-field-path={`${pathPrefix}.technologies`}
          value={(item.technologies ?? []).join(', ')}
          onChange={e => onChange({
            ...item,
            technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
          })}
          placeholder="React, Next.js, Tailwind..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Key Achievements (one per line)</label>
        <textarea
          data-field-path={`${pathPrefix}.bullets`}
          value={(item.bullets ?? []).join('\n')}
          onChange={e => onChange({
            ...item,
            bullets: e.target.value.split('\n').map(b => b.trim()).filter(Boolean)
          })}
          rows={3}
          placeholder="Describe your contributions..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
    </div>
  )
}
