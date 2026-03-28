'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { ProjectItem } from '@/types'

interface Props {
  item: ProjectItem
  onChange: (updated: ProjectItem) => void
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

export default function ProjectItemEditor({ item, onChange }: Props) {
  const [techInput, setTechInput] = useState('')

  function addTech() {
    const val = techInput.trim()
    if (val && !item.technologies.includes(val)) {
      onChange({ ...item, technologies: [...item.technologies, val] })
    }
    setTechInput('')
  }

  function removeTech(tech: string) {
    onChange({ ...item, technologies: item.technologies.filter(t => t !== tech) })
  }

  return (
    <div className="space-y-3">
      <InputField label="Project Name" value={item.name} onChange={v => onChange({ ...item, name: v })} placeholder="My Project" />
      <div>
        <label className="block text-xs text-gray-500 mb-1">Description</label>
        <textarea value={item.description} onChange={e => onChange({ ...item, description: e.target.value })}
          rows={3} placeholder="What does this project do?"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2">Technologies</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.technologies.map(tech => (
            <span key={tech} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs">
              {tech}
              <button onClick={() => removeTech(tech)} className="text-indigo-400 hover:text-indigo-600"><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={techInput} onChange={e => setTechInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTech() } }}
            placeholder="React, TypeScript…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button onClick={addTech} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-1">
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
