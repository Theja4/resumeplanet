'use client'

import { useRef, useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react'
import type { ResumeData, ExperienceItem } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'
import AutoGrowTextarea from './AutoGrowTextarea'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
}

const EMPTY_ROLE: ExperienceItem = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [],
}

export default function VolunteerEditor({ data, onChange, focusPath, onFocusHandled }: EditorProps) {
  const initialFocusIndex = focusPath?.startsWith('volunteer.') ? Number(focusPath.match(/^volunteer\.(\d+)/)?.[1]) : null
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    initialFocusIndex !== null && !isNaN(initialFocusIndex) ? initialFocusIndex : null
  )
  const [prevFocusPath, setPrevFocusPath] = useState(focusPath)
  const rootRef = useRef<HTMLDivElement>(null)

  if (focusPath !== prevFocusPath) {
    setPrevFocusPath(focusPath)
    if (focusPath && focusPath.startsWith('volunteer.')) {
      const match = focusPath.match(/^volunteer\.(\d+)/)
      if (match) {
        setExpandedIndex(Number(match[1]))
      }
    }
  }

  const focusIndex = focusPath?.startsWith('volunteer.') ? Number(focusPath.match(/^volunteer\.(\d+)/)?.[1]) : null

  useFocusFieldPath({
    focusPath: (expandedIndex !== null && expandedIndex === focusIndex) ? focusPath : null,
    rootRef,
    onHandled: onFocusHandled
  })

  function updateItem(index: number, updated: ExperienceItem) {
    const next = [...data.volunteer]
    next[index] = updated
    onChange({ ...data, volunteer: next })
  }

  function removeItem(index: number) {
    onChange({ ...data, volunteer: data.volunteer.filter((_, i) => i !== index) })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function addItem() {
    const next = [...data.volunteer, { ...EMPTY_ROLE }]
    onChange({ ...data, volunteer: next })
    setExpandedIndex(next.length - 1)
  }

  function updateBullet(roleIndex: number, bulletIndex: number, value: string) {
    const item = { ...data.volunteer[roleIndex], bullets: [...data.volunteer[roleIndex].bullets] }
    item.bullets[bulletIndex] = value
    updateItem(roleIndex, item)
  }

  function addBullet(roleIndex: number) {
    const item = { ...data.volunteer[roleIndex], bullets: [...data.volunteer[roleIndex].bullets, ''] }
    updateItem(roleIndex, item)
  }

  function removeBullet(roleIndex: number, bulletIndex: number) {
    const item = {
      ...data.volunteer[roleIndex],
      bullets: data.volunteer[roleIndex].bullets.filter((_, i) => i !== bulletIndex),
    }
    updateItem(roleIndex, item)
  }

  return (
    <div ref={rootRef} className="space-y-3 bg-gradient-to-b from-emerald-50/30 to-white p-4">
      {data.volunteer.map((role, i) => (
        <div key={i} className="overflow-hidden rounded-[1.15rem] border border-zinc-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all hover:border-emerald-200">
          <button
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-emerald-50/50"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">{role.company || 'New Role'}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                {role.title}{role.startDate ? ` · ${role.startDate}${role.endDate ? `–${role.endDate}` : ''}` : ''}
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              {expandedIndex === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {expandedIndex === i && (
            <div className="space-y-3 border-t border-emerald-100 bg-gradient-to-b from-emerald-50/35 to-white px-4 pb-4 pt-3">
              {(
                [
                  ['title', 'Role Title', null],
                  ['company', 'Organisation', null],
                  ['location', 'Location', null],
                  ['startDate', 'Start Date', null],
                  ['endDate', 'End Date', null],
                  ['url', 'Link (optional)', <LinkIcon key="link-icon" size={11} className="text-gray-400" />],
                ] as [keyof ExperienceItem, string, React.ReactNode][]
              ).map(([key, label, icon]) => (
                <div key={key}>
                  <label className="mb-1.5 flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
                    {icon}
                    {label}
                  </label>
                  <input
                    type={key === 'url' ? 'url' : 'text'}
                    value={(role[key] as string) ?? ''}
                    data-field-path={`volunteer.${i}.${key}`}
                    placeholder={key === 'url' ? 'https://organization.org' : undefined}
                    maxLength={key === 'url' ? 500 : undefined}
                    onChange={(e) => updateItem(i, { ...role, [key]: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              ))}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">Bullet Points</label>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                    {role.bullets.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {role.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex items-start gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                      <AutoGrowTextarea
                        value={bullet}
                        data-field-path={`volunteer.${i}.bullets.${bi}`}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                        maxLength={2000}
                        className="flex-1 resize-none rounded-xl border border-transparent bg-zinc-50/60 px-3 py-2 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        minHeight={36}
                      />
                      <button onClick={() => removeBullet(i, bi)} className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Remove bullet">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addBullet(i)} className="mt-2 flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100">
                  <Plus size={11} /> Add bullet
                </button>
              </div>
              <button onClick={() => removeItem(i)} className="mt-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700">
                Remove this role
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1rem] border border-dashed border-emerald-200 bg-white/80 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.99]"
      >
        <Plus size={14} /> Add role
      </button>
    </div>
  )
}
