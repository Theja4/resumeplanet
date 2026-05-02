'use client'

import { useRef } from 'react'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  sectionId: string
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

export default function CustomTextEditor({ sectionId, data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })

  const customSection = data.customSections?.find(c => c.id === sectionId)
  if (!customSection) return null

  const textValue = customSection.text || ''
  const charCount = textValue.length
  const isLong = charCount >= 1000

  function handleChange(text: string) {
    const newSections = [...(data.customSections || [])]
    const idx = newSections.findIndex(c => c.id === sectionId)
    if (idx === -1) return
    newSections[idx] = { ...newSections[idx], text }
    onChange({ ...data, customSections: newSections })
  }

  return (
    <div ref={rootRef} className="p-4">
      <textarea
        data-field-path={`${sectionId}.text`}
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        placeholder={`Write the content for ${customSection.title}…`}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        style={{ minHeight: '96px' }}
      />
      <p className={`mt-1 text-xs text-right ${isLong ? 'text-amber-500' : 'text-gray-400'}`}>
        {charCount} characters{isLong ? ' — consider trimming' : ''}
      </p>
    </div>
  )
}
