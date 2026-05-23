'use client'

import { useRef } from 'react'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'
import AutoGrowTextarea from './AutoGrowTextarea'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

export default function SummaryEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
  const charCount = data.summary.length
  const isLong = charCount >= 500

  return (
    <div ref={rootRef} className="p-4">
      <label htmlFor="field-summary" className="block text-sm font-medium text-gray-600 mb-1.5">
        Professional Summary
      </label>
      <AutoGrowTextarea
        id="field-summary"
        value={data.summary}
        data-field-path="summary"
        onChange={(e) => onChange({ ...data, summary: e.target.value })}
        maxLength={2000}
        placeholder="Write a brief professional summary…"
        className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm leading-relaxed text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        // Start at one-line height when empty; auto-grow expands as the user
        // types and the resize handle still works to override.
        minHeight={42}
      />
      <p className={`mt-1.5 text-xs text-right ${isLong ? 'text-amber-500' : 'text-gray-500'}`}>
        {charCount} characters{isLong ? ' — consider trimming' : ''}
      </p>
    </div>
  )
}
