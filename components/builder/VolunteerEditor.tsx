'use client'

import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, ExperienceItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_ROLE: ExperienceItem = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [],
}

export default function VolunteerEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateItem(index: number, updated: ExperienceItem) {
    const next = [...data.volunteer]
    next[index] = updated
    onChange({ ...data, volunteer: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, volunteer: data.volunteer.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.volunteer, { ...EMPTY_ROLE }]
    onChange({ ...data, volunteer: next })
    setExpandedIndex(next.length - 1)
  }

  function updateBullet(roleIndex: number, bulletIndex: number, value: string) {
    const item = { ...data.volunteer[roleIndex], bullets: [...data.volunteer[roleIndex].bullets] }
    item.bullets[bulletIndex] = value
    updateItem(roleIndex, item)
  }

  function addBullet(roleIndex: number) {
    const item = { ...data.volunteer[roleIndex], bullets: [...data.volunteer[roleIndex].bullets, ''] }
    updateItem(roleIndex, item)
  }

  function removeBullet(roleIndex: number, bulletIndex: number) {
    const item = {
      ...data.volunteer[roleIndex],
      bullets: data.volunteer[roleIndex].bullets.filter((_, i) => i !== bulletIndex),
    }
    updateItem(roleIndex, item)
  }

  return (
    <div className="p-4 space-y-2">
      {data.volunteer.map((role, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{role.company || 'New Role'}</p>
              <p className="text-xs text-gray-500 truncate">
                {role.title}{role.startDate ? ` · ${role.startDate}${role.endDate ? `–${role.endDate}` : ''}` : ''}
              </p>
            </div>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              {(
                [
                  ['title', 'Role Title'],
                  ['company', 'Organisation'],
                  ['location', 'Location'],
                  ['startDate', 'Start Date'],
                  ['endDate', 'End Date'],
                ] as [keyof ExperienceItem, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={(role[key] as string) ?? ''}
                    onChange={(e) => updateItem(i, { ...role, [key]: e.target.value })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bullet Points</label>
                <div className="space-y-1">
                  {role.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex items-start gap-1">
                      <textarea
                        value={bullet}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                        rows={2}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button onClick={() => removeBullet(i, bi)} className="mt-1 text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove bullet">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addBullet(i)} className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <Plus size={11} /> Add bullet
                </button>
              </div>
              <button onClick={() => removeItem(i)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove this role
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add role
      </button>
    </div>
  )
}
