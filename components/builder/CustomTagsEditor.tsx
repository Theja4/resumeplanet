'use client'

import { useRef, useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  sectionId: string
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

export default function CustomTagsEditor({ sectionId, data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const [input, setInput] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })

  const customSection = data.customSections?.find(c => c.id === sectionId)
  if (!customSection) return null

  const tags = customSection.tags || []

  function updateTags(newTags: string[]) {
    const newSections = [...(data.customSections || [])]
    const idx = newSections.findIndex(c => c.id === sectionId)
    if (idx !== -1) {
      newSections[idx] = { ...newSections[idx], tags: newTags }
      onChange({ ...data, customSections: newSections })
    }
  }

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || tags.includes(tag)) {
      setInput('')
      return
    }
    updateTags([...tags, tag])
    setInput('')
  }

  function removeTag(index: number) {
    updateTags(tags.filter((_, i) => i !== index))
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
        {tags.map((skill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-xs px-2 py-0.5 rounded-full shadow-sm"
          >
            {skill}
            <button
              onClick={() => removeTag(i)}
              className="text-emerald-400 hover:text-emerald-700 transition-colors"
              aria-label={`Remove ${skill}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        data-field-path={focusPath?.startsWith(`${sectionId}.tags`) ? focusPath : `${sectionId}.tags`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={`Type an item for ${customSection.title}, press Enter or comma to add`}
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
      />
    </div>
  )
}
