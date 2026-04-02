'use client'

import { Loader2, Sparkles } from 'lucide-react'

interface Suggestion {
  id: string
  type: 'action-verb' | 'metric' | 'keyword' | 'format' | 'section'
  title: string
  beforeText: string
  afterText: string
  sectionHint: 'experience' | 'summary' | 'skills' | 'education' | 'projects'
}

interface Props {
  suggestion: Suggestion
  onApply: () => void
  isApplying: boolean
  label: string
  colorClass: string
}

export default function AIInsightCard({ suggestion, onApply, isApplying, label, colorClass }: Props) {
  return (
    <div className="p-4 bg-primary-container/20 rounded-2xl border border-primary-container/30">
      <div className="flex items-start gap-3 mb-2">
        <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border mb-1.5 ${colorClass}`}>
            {label}
          </span>
          <h3 className="text-xs font-bold text-on-primary-container">{suggestion.title}</h3>
        </div>
      </div>

      {suggestion.beforeText && suggestion.afterText && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] leading-relaxed">
            <span className="text-zinc-400 font-medium">Before: </span>
            <span className="text-zinc-500 line-through decoration-primary/50">{suggestion.beforeText}</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            <span className="text-zinc-400 font-medium">After: </span>
            <span className="text-primary font-medium">{suggestion.afterText}</span>
          </p>
        </div>
      )}

      <button
        onClick={onApply}
        disabled={isApplying}
        className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isApplying ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Applying fix...
          </>
        ) : (
          <>
            <Sparkles size={12} />
            Apply Fix
          </>
        )}
      </button>
    </div>
  )
}
