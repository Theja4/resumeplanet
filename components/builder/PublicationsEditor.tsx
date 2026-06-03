'use client'

import { useRef } from 'react'
import { Plus, X, Link as LinkIcon } from 'lucide-react'
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
    <div ref={rootRef} className="space-y-3 bg-gradient-to-b from-emerald-50/30 to-white p-4">
      {data.publications.map((pub, i) => (
        <div key={i} className="grid grid-cols-12 items-start gap-2 rounded-[1.15rem] border border-zinc-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <input
            type="text"
            value={pub.title}
            maxLength={200}
            data-field-path={`publications.${i}.title`}
            onChange={(e) => updateItem(i, { ...pub, title: e.target.value })}
            placeholder="Publication title"
            className="col-span-12 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 md:col-span-6"
          />
          <input
            type="text"
            value={pub.publisher}
            maxLength={200}
            data-field-path={`publications.${i}.publisher`}
            onChange={(e) => updateItem(i, { ...pub, publisher: e.target.value })}
            placeholder="Publisher"
            className="col-span-7 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 md:col-span-4"
          />
          <input
            type="text"
            value={pub.date}
            maxLength={32}
            data-field-path={`publications.${i}.date`}
            onChange={(e) => updateItem(i, { ...pub, date: e.target.value })}
            placeholder="Year"
            className="col-span-3 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 md:col-span-1"
          />
          <button onClick={() => removeItem(i)} className="col-span-2 mt-1 flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-zinc-100 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 md:col-span-1" aria-label="Remove">
            <X size={13} />
          </button>
          <div className="col-span-12 relative">
            <LinkIcon size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={pub.url ?? ''}
              maxLength={500}
              data-field-path={`publications.${i}.url`}
              onChange={(e) => updateItem(i, { ...pub, url: e.target.value })}
              placeholder="Link (optional)"
              className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white py-2.5 pl-7 pr-3 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-dashed border-emerald-200 bg-white/80 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99]"
      >
        <Plus size={13} /> Add publication
      </button>
    </div>
  )
}
