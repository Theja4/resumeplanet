'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { X } from 'lucide-react'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

export default function LanguagesEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || data.languages.includes(tag)) {
      setInput('')
      return
    }
    onChange({ ...data, languages: [...data.languages, tag] })
    setInput('')
  }

  function removeTag(index: number) {
    onChange({ ...data, languages: data.languages.filter((_, i) => i !== index) })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input.replace(/,$/, ''))
    }
  }

  return (
    <div ref={rootRef} className="p-4">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {data.languages.map((lang, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
          >
            {lang}
            <button
              onClick={() => removeTag(i)}
              className="text-indigo-400 hover:text-indigo-700"
              aria-label={`Remove ${lang}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        data-field-path={focusPath?.startsWith('languages.') ? focusPath : 'languages'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder="English (Native)"
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
