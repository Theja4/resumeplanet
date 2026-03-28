'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData, AwardItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY: AwardItem = { title: '', issuer: '', date: '' }

export default function AwardsEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, updated: AwardItem) {
    const next = [...data.awards]
    next[index] = updated
    onChange({ ...data, awards: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, awards: data.awards.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, awards: [...data.awards, { ...EMPTY }] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.awards.map((award, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={award.title}
            onChange={(e) => updateItem(i, { ...award, title: e.target.value })}
            placeholder="Award title"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={award.issuer}
            onChange={(e) => updateItem(i, { ...award, issuer: e.target.value })}
            placeholder="Issuer"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={award.date}
            onChange={(e) => updateItem(i, { ...award, date: e.target.value })}
            placeholder="Year"
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <Plus size={13} /> Add award
      </button>
    </div>
  )
}
