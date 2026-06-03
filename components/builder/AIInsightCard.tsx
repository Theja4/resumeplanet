'use client'

import { ArrowDown, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'

interface Suggestion {
  id: string
  type: 'action-verb' | 'metric' | 'keyword' | 'format' | 'section'
  title: string
  beforeText: string
  afterText: string
  sectionHint: 'experience' | 'summary' | 'skills' | 'education' | 'projects'
  estimatedPoints: number
  criterionId: string
  reasoning: string
}

interface Props {
  suggestion: Suggestion
  onApply: () => void
  onUndo: () => void
  isApplied: boolean
  label: string
  colorClass: string
}

const TYPE_ACCENT: Record<string, {
  bar: string
  iconBg: string
  iconColor: string
  afterBg: string
  afterText: string
  appliedBg: string
  appliedText: string
  appliedBorder: string
  glow: string
}> = {
  'action-verb': {
    bar: '#10b981',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    afterBg: 'bg-emerald-50/70 border-emerald-100',
    afterText: 'text-emerald-800',
    appliedBg: 'bg-emerald-50/60',
    appliedText: 'text-emerald-800',
    appliedBorder: 'border-emerald-100',
    glow: 'hover:shadow-emerald-100/60',
  },
  'metric': {
    bar: '#f59e0b',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    afterBg: 'bg-amber-50/70 border-amber-100',
    afterText: 'text-amber-900',
    appliedBg: 'bg-amber-50/60',
    appliedText: 'text-amber-900',
    appliedBorder: 'border-amber-100',
    glow: 'hover:shadow-amber-100/60',
  },
  'keyword': {
    bar: '#3b82f6',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    afterBg: 'bg-blue-50/70 border-blue-100',
    afterText: 'text-blue-900',
    appliedBg: 'bg-blue-50/60',
    appliedText: 'text-blue-900',
    appliedBorder: 'border-blue-100',
    glow: 'hover:shadow-blue-100/60',
  },
  'format': {
    bar: '#a855f7',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    afterBg: 'bg-purple-50/70 border-purple-100',
    afterText: 'text-purple-900',
    appliedBg: 'bg-purple-50/60',
    appliedText: 'text-purple-900',
    appliedBorder: 'border-purple-100',
    glow: 'hover:shadow-purple-100/60',
  },
  'section': {
    bar: '#f43f5e',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    afterBg: 'bg-rose-50/70 border-rose-100',
    afterText: 'text-rose-900',
    appliedBg: 'bg-rose-50/60',
    appliedText: 'text-rose-900',
    appliedBorder: 'border-rose-100',
    glow: 'hover:shadow-rose-100/60',
  },
}

const DEFAULT_ACCENT = TYPE_ACCENT['keyword']

export default function AIInsightCard({ suggestion, onApply, onUndo, isApplied, label, colorClass }: Props) {
  const accent = TYPE_ACCENT[suggestion.type] ?? DEFAULT_ACCENT

  if (isApplied) {
    return (
      <div
        className={`flex items-center gap-3 rounded-[22px] border p-4 shadow-sm shadow-emerald-950/[0.04] transition-all duration-300 ${accent.appliedBg} ${accent.appliedBorder}`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${accent.appliedText}`}>{suggestion.title}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Fix applied successfully</p>
        </div>
        <button
          onClick={onUndo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.97]"
        >
          <RotateCcw size={12} />
          Undo
        </button>
      </div>
    )
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm shadow-emerald-950/[0.04]
        hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg
        ${accent.glow}
        transition-all duration-200 ease-out`}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 inset-y-0 w-[3px] rounded-r-full transition-all duration-200 group-hover:w-1"
        style={{ backgroundColor: accent.bar }}
      />

      <div className="pb-5 pl-6 pr-5 pt-5">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 ${accent.iconBg} ${accent.iconColor}`}
          >
            <Sparkles size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={`mb-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${colorClass}`}
            >
              {label}
            </span>
            <h3 className="text-base font-bold leading-snug text-slate-950">{suggestion.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                +{suggestion.estimatedPoints} pts
              </span>
              <span className="leading-relaxed text-slate-500">{suggestion.reasoning}</span>
            </div>
          </div>
        </div>

        {/* Before → After comparison */}
        {suggestion.beforeText && suggestion.afterText && (
          <div className="mb-5 space-y-1.5">
            {/* Before */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Before</p>
              <p className="text-sm leading-relaxed text-slate-500 line-through decoration-slate-300">
                {suggestion.beforeText}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                <ArrowDown size={13} className="text-emerald-500" />
              </div>
            </div>

            {/* After */}
            <div className={`rounded-2xl border px-4 py-3 ${accent.afterBg}`}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">After</p>
              <p className={`text-sm leading-relaxed font-semibold ${accent.afterText}`}>
                {suggestion.afterText}
              </p>
            </div>
          </div>
        )}

        {/* Apply button */}
        <button
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(2,109,50,0.18)]
            hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25
            active:scale-[0.98] active:shadow-none
            group-hover:shadow-md group-hover:shadow-primary/15
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Sparkles size={14} className="transition-transform duration-200 group-hover:rotate-12" />
          Apply Fix
        </button>
      </div>
    </div>
  )
}
