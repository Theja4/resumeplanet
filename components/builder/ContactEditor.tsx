'use client'

import { useRef } from 'react'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

const FIELDS: { key: keyof ResumeData; label: string; type: string; placeholder?: string }[] = [
  { key: 'name', label: 'Full Name', type: 'text' },
  { key: 'currentRole', label: 'Current Role', type: 'text', placeholder: 'e.g. Senior Software Engineer' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
  { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
  { key: 'website', label: 'Website URL', type: 'url' },
]

export default function ContactEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })

  function handleChange(key: keyof ResumeData, value: string) {
    onChange({ ...data, [key]: value })
  }

  return (
    <div ref={rootRef} className="space-y-3 p-4">
      {FIELDS.map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <input
            type={type}
            value={(data[key] as string) ?? ''}
            data-field-path={key}
            placeholder={placeholder}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      ))}
    </div>
  )
}
