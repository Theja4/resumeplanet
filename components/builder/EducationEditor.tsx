'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResumeData, EducationItem } from '@/types'
import { getEducationDateLabel, syncResumeData } from '@/lib/resume-data'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY_EDU: EducationItem = { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }

export default function EducationEditor({ data, onChange }: EditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateItem(index: number, updated: EducationItem) {
    const next = [...data.education]
    next[index] = { ...updated, graduationDate: updated.endDate }
    onChange(syncResumeData({ ...data, education: next }))
  }

  function removeItem(index: number) {
    onChange(syncResumeData({ ...data, education: data.education.filter((_, i) => i !== index) }))
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.education, { ...EMPTY_EDU }]
    onChange(syncResumeData({ ...data, education: next }))
    setExpandedIndex(next.length - 1)
  }

  return (
    <div className="p-4 space-y-2">
      {data.education.map((edu, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{edu.institution || 'New School'}</p>
              <p className="text-xs text-gray-500 truncate">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}{getEducationDateLabel(edu) ? ` · ${getEducationDateLabel(edu)}` : ''}</p>
            </div>
            {expandedIndex === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
              {(
                [
                  ['institution', 'Institution'],
                  ['degree', 'Degree'],
                  ['field', 'Field of Study'],
                  ['startDate', 'Start Date'],
                  ['endDate', 'End Date'],
                  ['gpa', 'GPA (optional)'],
                ] as [keyof EducationItem, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={edu[key] ?? ''}
                    onChange={(e) => updateItem(i, { ...edu, [key]: e.target.value })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <button onClick={() => removeItem(i)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove this entry
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={14} /> Add education
      </button>
    </div>
  )
}
