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
    <div ref={rootRef} className="bg-gradient-to-b from-emerald-50/30 to-white p-4">
      <div className="rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="field-summary" className="block text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">
            Professional Summary
          </label>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${isLong ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-400'}`}>
            {charCount} chars
          </span>
        </div>
      <AutoGrowTextarea
        id="field-summary"
        value={data.summary}
        data-field-path="summary"
        onChange={(e) => onChange({ ...data, summary: e.target.value })}
        maxLength={2000}
        placeholder="Write a brief professional summary…"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        // Start at one-line height when empty; auto-grow expands as the user
        // types and the resize handle still works to override.
        minHeight={42}
      />
        <p className={`mt-2 text-right text-xs font-medium ${isLong ? 'text-amber-600' : 'text-zinc-400'}`}>
          {isLong ? 'Consider trimming for stronger scanning.' : 'Keep it tight and specific.'}
        </p>
      </div>
    </div>
  )
}
