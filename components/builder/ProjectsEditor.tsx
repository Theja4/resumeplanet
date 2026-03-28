'use client'

import { useState, KeyboardEvent } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, ProjectItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_PROJECT: ProjectItem = { name: '', description: '', technologies: [] }

export default function ProjectsEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [techInputs, setTechInputs] = useState<Record<number, string>>({})

  function updateItem(index: number, updated: ProjectItem) {
    const next = [...data.projects]
    next[index] = updated
    onChange({ ...data, projects: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, projects: data.projects.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.projects, { ...EMPTY_PROJECT }]
    onChange({ ...data, projects: next })
    setExpandedIndex(next.length - 1)
  }

  function addTech(projectIndex: number, raw: string) {
    const tag = raw.trim()
    if (!tag || data.projects[projectIndex].technologies.includes(tag)) {
      setTechInputs(prev => ({ ...prev, [projectIndex]: '' }))
      return
    }
    updateItem(projectIndex, {
      ...data.projects[projectIndex],
      technologies: [...data.projects[projectIndex].technologies, tag],
    })
    setTechInputs(prev => ({ ...prev, [projectIndex]: '' }))
  }

  function removeTech(projectIndex: number, techIndex: number) {
    updateItem(projectIndex, {
      ...data.projects[projectIndex],
      technologies: data.projects[projectIndex].technologies.filter((_, i) => i !== techIndex),
    })
  }

  return (
    <div className="p-4 space-y-2">
      {data.projects.map((project, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <p className="text-sm font-medium text-gray-900 truncate">{project.name || 'New Project'}</p>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Project Name</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => updateItem(i, { ...project, name: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Description</label>
                <textarea
                  value={project.description}
                  onChange={(e) => updateItem(i, { ...project, description: e.target.value })}
                  rows={2}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Technologies</label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {project.technologies.map((tech, ti) => (
                    <span key={ti} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                      {tech}
                      <button onClick={() => removeTech(i, ti)} className="text-indigo-400 hover:text-indigo-700"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <input
                  value={techInputs[i] ?? ''}
                  onChange={(e) => setTechInputs(prev => ({ ...prev, [i]: e.target.value }))}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTech(i, (techInputs[i] ?? '').replace(/,$/, ''))
                    }
                  }}
                  onBlur={() => { if (techInputs[i]?.trim()) addTech(i, techInputs[i]) }}
                  placeholder="React, TypeScript…"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button onClick={() => removeItem(i)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove this project
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add project
      </button>
    </div>
  )
}
