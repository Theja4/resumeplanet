'use client'

import { CheckCircle2, Loader2, Rocket, ShieldAlert, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import type { ATSScoreRoadmap } from '@/types'

export type OptimizeState = 'idle' | 'fetching' | 'applying' | 'done'

export interface OptimizeResult {
  appliedCount: number
  skippedCount: number
  scoreBefore: number
  scoreAfter: number
}

export default function RoadToNinetyPanel({
  roadmap,
  optimizeState = 'idle',
  optimizeResult = null,
  onOptimize,
  hasInsights = false,
}: {
  roadmap: ATSScoreRoadmap | null
  optimizeState?: OptimizeState
  optimizeResult?: OptimizeResult | null
  onOptimize?: () => void
  hasInsights?: boolean
}) {
  const evidenceBlockers = roadmap?.evidenceBlockers.slice(0, 3) ?? []
  const fixableActions = roadmap?.fixableNow.slice(0, 4) ?? []
  const isRunning = optimizeState === 'fetching' || optimizeState === 'applying'
  const isDone = optimizeState === 'done' && optimizeResult !== null
  const scoreDelta = optimizeResult ? optimizeResult.scoreAfter - optimizeResult.scoreBefore : 0
  const isReadOnly = !onOptimize

  return (
    <DashboardSurface variant="subtle" className="p-5">
      <div className="space-y-5">

        {/* Read-only mode (ATS Checker page) */}
        {isReadOnly && roadmap && (
          <>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Score Roadmap</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">
                {roadmap.currentScore >= roadmap.targetScore
                  ? `Already above ${roadmap.targetScore}.`
                  : `Truthful ceiling: ${roadmap.truthfulCeiling}`}
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {roadmap.canReachTargetNow
                  ? 'Presentation fixes alone can get you there. Open this resume in the builder to auto-optimize.'
                  : 'Some gaps need real experience. Open in the builder for one-click AI optimization of what can be improved.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <TrendingUp size={14} className="text-emerald-600" strokeWidth={1.9} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Current</span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{roadmap.currentScore}</p>
              </div>
              <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Zap size={14} className="text-emerald-600" strokeWidth={1.9} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Ceiling</span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{roadmap.truthfulCeiling}</p>
              </div>
              <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <ShieldAlert size={14} className="text-amber-500" strokeWidth={1.9} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Blocked</span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{roadmap.blockedPotential}</p>
              </div>
            </div>

            {fixableActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-700">What AI can fix:</p>
                {fixableActions.map(action => (
                  <div key={action.criterionId} className="flex items-center gap-2 text-xs text-zinc-600">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>{action.title}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Running state */}
        {!isReadOnly && isRunning && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              <span className="absolute inset-[-8px] rounded-full bg-emerald-400/10 blur-xl" />
              <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200">
                <Loader2 size={22} className="text-emerald-600 animate-spin" />
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-800">
                {optimizeState === 'fetching' ? 'Analyzing your resume...' : 'Applying improvements...'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {optimizeState === 'fetching'
                  ? 'Running deep ATS analysis to find safe improvements'
                  : 'Rewriting bullets, fixing formatting, boosting keywords'}
              </p>
            </div>
          </div>
        )}

        {/* Done state */}
        {!isReadOnly && isDone && optimizeResult && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <p className="text-lg font-black tracking-tight text-zinc-800">Optimization Complete</p>
              <p className="mt-1 text-xs text-zinc-500">
                {optimizeResult.appliedCount} improvement{optimizeResult.appliedCount !== 1 ? 's' : ''} applied
                {optimizeResult.skippedCount > 0 && ` (${optimizeResult.skippedCount} skipped as unsafe)`}
              </p>
            </div>

            {/* Before/After score */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.2rem] border border-zinc-200 bg-white px-4 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Before</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-zinc-400">{optimizeResult.scoreBefore}</p>
              </div>
              <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">After</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-emerald-700">{optimizeResult.scoreAfter}</p>
                {scoreDelta > 0 && (
                  <span className="inline-block mt-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    +{scoreDelta} pts
                  </span>
                )}
              </div>
            </div>

            {/* Re-optimize button */}
            <button
              onClick={onOptimize}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 active:scale-[0.98] transition-all"
            >
              <Sparkles size={14} />
              Run Again
            </button>
          </>
        )}

        {/* Idle state — the main CTA */}
        {!isReadOnly && optimizeState === 'idle' && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <span className="absolute inset-[-6px] rounded-full bg-emerald-400/15 blur-lg" />
                <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200">
                  <Rocket size={22} className="text-emerald-600" />
                </span>
              </div>
              <p className="text-xl font-black tracking-tight text-zinc-800">One-Click Optimize</p>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed max-w-[260px]">
                AI will analyze your resume and automatically apply every safe improvement — stronger verbs, better formatting, keyword boosts.
              </p>
            </div>

            {/* Potential gain preview */}
            {roadmap && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-3.5">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <TrendingUp size={13} className="text-emerald-600" strokeWidth={1.9} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Current Score</span>
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-tight text-zinc-800">{roadmap.currentScore}</p>
                </div>
                <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50/60 px-4 py-3.5">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Zap size={13} className="text-emerald-600" strokeWidth={1.9} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Potential Ceiling</span>
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-tight text-emerald-700">{roadmap.truthfulCeiling}</p>
                </div>
              </div>
            )}

            {/* Big CTA */}
            <button
              onClick={onOptimize}
              className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 py-4 text-white text-sm font-bold rounded-2xl
                hover:brightness-110 hover:shadow-lg hover:shadow-emerald-600/20
                active:scale-[0.98] active:brightness-95
                transition-all duration-150"
              style={{ background: 'linear-gradient(135deg, #026d32 0%, #19793c 100%)' }}
            >
              <Sparkles size={16} />
              {hasInsights ? 'Optimize Now' : 'Analyze & Optimize'}
            </button>

            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              Only safe, score-improving changes are applied. You can undo anytime.
            </p>
          </>
        )}

        {/* Evidence blockers — shown in optimize mode */}
        {!isReadOnly && evidenceBlockers.length > 0 && (optimizeState === 'idle' || isDone) && (
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <ShieldAlert size={13} className="text-amber-500" />
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Beyond AI&apos;s reach</p>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              These need real experience changes — AI won&apos;t fabricate them.
            </p>
            <div className="space-y-2">
              {evidenceBlockers.map(action => (
                <div key={action.criterionId} className="rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-3">
                  <p className="text-xs font-bold text-zinc-700">{action.title}</p>
                  <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">{action.reason}</p>
                  {action.evidence.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {action.evidence.map(item => (
                        <span key={item} className="rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardSurface>
  )
}
