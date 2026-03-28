'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

export default function ReferencesEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, value: string) {
    const next = [...data.references]
    next[index] = value
    onChange({ ...data, references: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, references: data.references.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, references: [...data.references, ''] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.references.map((ref, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={ref}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="Name, Title, Company, email@example.com"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Plus size={13} /> Add reference
      </button>
    </div>
  )
}
