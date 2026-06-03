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

export default function InterestsEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || data.interests.includes(tag)) {
      setInput('')
      return
    }
    onChange({ ...data, interests: [...data.interests, tag] })
    setInput('')
  }

  function removeTag(index: number) {
    onChange({ ...data, interests: data.interests.filter((_, i) => i !== index) })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input.replace(/,$/, ''))
    }
  }

  return (
    <div ref={rootRef} className="bg-gradient-to-b from-emerald-50/30 to-white p-4">
      <div className="rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">Interests</div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
            {data.interests.length}
          </span>
        </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {data.interests.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100"
          >
            {item}
            <button
              onClick={() => removeTag(i)}
              className="text-emerald-400 transition-colors hover:text-emerald-800"
              aria-label={`Remove ${item}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        data-field-path={focusPath?.startsWith('interests.') ? focusPath : 'interests'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder="Type an interest, press Enter or comma to add"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
      </div>
    </div>
  )
}
