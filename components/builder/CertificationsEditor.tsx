'use client'

import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import type { ResumeData, CertificationItem } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

const EMPTY: CertificationItem = { name: '', issuer: '', date: '' }

export default function CertificationsEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })

  function updateItem(index: number, updated: CertificationItem) {
    const next = [...data.certifications]
    next[index] = updated
    onChange({ ...data, certifications: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, certifications: data.certifications.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, certifications: [...data.certifications, { ...EMPTY }] })
  }

  return (
    <div ref={rootRef} className="p-4 space-y-2">
      {data.certifications.map((cert, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            data-field-path={`certifications.${i}.name`}
            value={cert.name}
            onChange={(e) => updateItem(i, { ...cert, name: e.target.value })}
            placeholder="Certification name"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            data-field-path={`certifications.${i}.issuer`}
            value={cert.issuer}
            onChange={(e) => updateItem(i, { ...cert, issuer: e.target.value })}
            placeholder="Issuer"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            data-field-path={`certifications.${i}.date`}
            value={cert.date}
            onChange={(e) => updateItem(i, { ...cert, date: e.target.value })}
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
        <Plus size={13} /> Add certification
      </button>
    </div>
  )
}

