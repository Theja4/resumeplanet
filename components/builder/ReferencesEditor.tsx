'use client'

import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import type { ResumeData } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

export default function ReferencesEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })
  function updateItem(index: number, value: string) {
    const next = [...data.references]
    next[index] = value
    onChange({ ...data, references: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, references: data.references.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...data, references: [...data.references, ''] })
  }

  return (
    <div ref={rootRef} className="space-y-3 bg-gradient-to-b from-emerald-50/30 to-white p-4">
      {data.references.map((ref, i) => (
        <div key={i} className="flex items-center gap-2 rounded-[1.15rem] border border-zinc-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <input
            type="text"
            value={ref}
            data-field-path={`references.${i}`}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="Name, Title, Company, email@example.com"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          <button onClick={() => removeItem(i)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-dashed border-emerald-200 bg-white/80 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99]"
      >
        <Plus size={13} /> Add reference
      </button>
    </div>
  )
}
