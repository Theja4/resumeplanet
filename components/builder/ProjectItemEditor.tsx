'use client'

import { X, Link as LinkIcon } from 'lucide-react'
import type { ProjectItem } from '@/types'
import AutoGrowTextarea from './AutoGrowTextarea'

interface Props {
  item: ProjectItem
  pathPrefix: string
  onChange: (updated: ProjectItem) => void
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
          <button
            aria-label="Clear field"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ProjectItemEditor({ item, pathPrefix, onChange }: Props) {
  const descId = `field-${pathPrefix.replace(/[^a-zA-Z0-9]+/g, '-')}-description`
  const techId = `field-${pathPrefix.replace(/[^a-zA-Z0-9]+/g, '-')}-technologies`
  const bulletsId = `field-${pathPrefix.replace(/[^a-zA-Z0-9]+/g, '-')}-bullets`

  return (
    <div className="space-y-5 rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
      <InputField label="Project Name" path={`${pathPrefix}.name`} value={item.name} onChange={v => onChange({ ...item, name: v })} placeholder="My Project" />
      <InputField label="Link (optional)" path={`${pathPrefix}.url`} value={item.url ?? ''} onChange={v => onChange({ ...item, url: v })} placeholder="https://github.com/you/project" labelIcon={<LinkIcon size={13} className="text-gray-400" />} />
      <div>
        <label htmlFor={descId} className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">Description</label>
        <AutoGrowTextarea
          id={descId}
          data-field-path={`${pathPrefix}.description`}
          value={item.description}
          maxLength={2000}
          onChange={e => onChange({ ...item, description: e.target.value })}
          placeholder="What does this project do?"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          minHeight={42}
        />
      </div>
      <div>
        <label htmlFor={techId} className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">Technologies (comma separated)</label>
        <input
          id={techId}
          data-field-path={`${pathPrefix}.technologies`}
          value={(item.technologies ?? []).join(', ')}
          onChange={e => onChange({
            ...item,
            technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
          })}
          placeholder="React, Next.js, Tailwind..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
      </div>
      <div>
        <label htmlFor={bulletsId} className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">Key Achievements (one per line)</label>
        <AutoGrowTextarea
          id={bulletsId}
          data-field-path={`${pathPrefix}.bullets`}
          value={(item.bullets ?? []).join('\n')}
          maxLength={6000}
          onChange={e => onChange({
            ...item,
            bullets: e.target.value.split('\n').map(b => b.trim()).filter(Boolean)
          })}
          placeholder="Describe your contributions..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          minHeight={42}
        />
      </div>
    </div>
  )
}
