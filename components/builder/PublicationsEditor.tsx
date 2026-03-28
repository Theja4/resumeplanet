'use client'

import { Plus, X } from 'lucide-react'
import type { ResumeData, PublicationItem } from '@/types'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
}

const EMPTY: PublicationItem = { title: '', publisher: '', date: '' }

export default function PublicationsEditor({ data, onChange }: EditorProps) {
  function updateItem(index: number, updated: PublicationItem) {
    const next = [...data.publications]
    next[index] = updated
    onChange({ ...data, publications: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, publications: data.publications.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, publications: [...data.publications, { ...EMPTY }] })
  }

  return (
    <div className="p-4 space-y-2">
      {data.publications.map((pub, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={pub.title}
            onChange={(e) => updateItem(i, { ...pub, title: e.target.value })}
            placeholder="Publication title"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={pub.publisher}
            onChange={(e) => updateItem(i, { ...pub, publisher: e.target.value })}
            placeholder="Publisher"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={pub.date}
            onChange={(e) => updateItem(i, { ...pub, date: e.target.value })}
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
        <Plus size={13} /> Add publication
      </button>
    </div>
  )
}
