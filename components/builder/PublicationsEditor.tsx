'use client'

import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import type { ResumeData, PublicationItem } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

const EMPTY: PublicationItem = { title: '', publisher: '', date: '' }

export default function PublicationsEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
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
    <div ref={rootRef} className="p-4 space-y-2">
      {data.publications.map((pub, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <input
            type="text"
            value={pub.title}
            data-field-path={`publications.${i}.title`}
            onChange={(e) => updateItem(i, { ...pub, title: e.target.value })}
            placeholder="Publication title"
            className="col-span-12 min-w-0 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 md:col-span-6"
          />
          <input
            type="text"
            value={pub.publisher}
            data-field-path={`publications.${i}.publisher`}
            onChange={(e) => updateItem(i, { ...pub, publisher: e.target.value })}
            placeholder="Publisher"
            className="col-span-7 min-w-0 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 md:col-span-4"
          />
          <input
            type="text"
            value={pub.date}
            data-field-path={`publications.${i}.date`}
            onChange={(e) => updateItem(i, { ...pub, date: e.target.value })}
            placeholder="Year"
            className="col-span-3 min-w-0 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 md:col-span-1"
          />
          <button onClick={() => removeItem(i)} className="col-span-2 mt-1 text-gray-300 hover:text-red-500 transition-colors justify-self-end md:col-span-1" aria-label="Remove">
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
