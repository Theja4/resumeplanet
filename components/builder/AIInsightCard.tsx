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
        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${accent.appliedBg} ${accent.appliedBorder}`}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/80 shadow-sm shrink-0">
          <CheckCircle2 size={14} className="text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-semibold truncate ${accent.appliedText}`}>{suggestion.title}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Fix applied successfully</p>
        </div>
        <button
          onClick={onUndo}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-700 active:scale-[0.97] transition-all shadow-sm"
        >
          <RotateCcw size={10} />
          Undo
        </button>
      </div>
    )
  }

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-zinc-100/80 shadow-sm overflow-hidden
        hover:-translate-y-0.5 hover:shadow-lg hover:border-zinc-200
        ${accent.glow}
        transition-all duration-200 ease-out`}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 inset-y-0 w-[3px] rounded-r-full transition-all duration-200 group-hover:w-1"
        style={{ backgroundColor: accent.bar }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3.5">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110 ${accent.iconBg} ${accent.iconColor}`}
          >
            <Sparkles size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${colorClass}`}
            >
              {label}
            </span>
            <h3 className="text-[13px] font-bold text-zinc-800 leading-snug">{suggestion.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                +{suggestion.estimatedPoints} pts
              </span>
              <span className="text-zinc-400">{suggestion.reasoning}</span>
            </div>
          </div>
        </div>

        {/* Before → After comparison */}
        {suggestion.beforeText && suggestion.afterText && (
          <div className="space-y-1 mb-4">
            {/* Before */}
            <div className="rounded-xl px-3 py-2.5 bg-zinc-50 border border-zinc-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Before</p>
              <p className="text-[11px] leading-relaxed text-zinc-400 line-through decoration-zinc-300">
                {suggestion.beforeText}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-0.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100">
                <ArrowDown size={11} className="text-zinc-400" />
              </div>
            </div>

            {/* After */}
            <div className={`rounded-xl px-3 py-2.5 border ${accent.afterBg}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">After</p>
              <p className={`text-[11px] leading-relaxed font-semibold ${accent.afterText}`}>
                {suggestion.afterText}
              </p>
            </div>
          </div>
        )}

        {/* Apply button */}
        <button
          onClick={onApply}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary text-white text-xs font-bold rounded-xl
            hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25
            active:scale-[0.98] active:shadow-none
            group-hover:shadow-md group-hover:shadow-primary/15
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Sparkles size={12} className="transition-transform duration-200 group-hover:rotate-12" />
          Apply Fix
        </button>
      </div>
    </div>
  )
}
