'use client'

import { ShieldAlert, Target, TrendingUp } from 'lucide-react'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import type { ATSScoreRoadmap } from '@/types'

function formatGainRange(min: number, max: number) {
  if (max <= 0) return 'No gain'
  if (min === max) return `+${max}`
  return `+${min} to +${max}`
}

export default function RoadToNinetyPanel({
  roadmap,
}: {
  roadmap: ATSScoreRoadmap
}) {
  const fixableActions = roadmap.fixableNow.slice(0, 4)
  const evidenceBlockers = roadmap.evidenceBlockers.slice(0, 3)

  let headline = `Truthful presentation fixes can likely take this resume to ${roadmap.truthfulCeiling}.`
  let subcopy = 'Start with the highest-impact fixes below. These are the fastest honest ways to move the score.'

  if (roadmap.currentScore >= roadmap.targetScore) {
    headline = `This resume is already above ${roadmap.targetScore}.`
    subcopy = 'Keep the fundamentals stable and spend the effort on role fit, interviewing, and stronger real evidence.'
  } else if (roadmap.canReachTargetNow) {
    headline = `${roadmap.targetScore} is still reachable with truthful presentation fixes.`
    subcopy = 'You do not need new credentials first. The biggest remaining gains are still in how the existing evidence is presented.'
  } else if (roadmap.fixablePotential <= 0) {
    headline = `Presentation fixes alone will not move this resume to ${roadmap.targetScore}.`
    subcopy = 'The main limit is evidence strength now, not formatting polish.'
  }

  return (
    <DashboardSurface variant="subtle" className="p-5">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Road to 90</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">{headline}</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{subcopy}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Target size={14} className="text-primary" strokeWidth={1.9} />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Current</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{roadmap.currentScore}</p>
          </div>
          <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <TrendingUp size={14} className="text-primary" strokeWidth={1.9} />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Truthful ceiling</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{roadmap.truthfulCeiling}</p>
          </div>
          <div className="rounded-[1.2rem] border border-black/6 bg-white/90 px-4 py-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <ShieldAlert size={14} className="text-primary" strokeWidth={1.9} />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Still blocked</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{roadmap.blockedPotential}</p>
          </div>
        </div>

        {fixableActions.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold tracking-tight text-on-background">Fixable now</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                These are presentation or structure changes the user can make without inventing new experience.
              </p>
            </div>
            <div className="space-y-3">
              {fixableActions.map(action => (
                <div key={action.criterionId} className="rounded-[1.2rem] border border-emerald-200 bg-white/92 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.85)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold tracking-tight text-on-background">{action.title}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        {action.section}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                      {formatGainRange(action.estimatedGainMin, action.estimatedGainMax)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{action.reason}</p>
                  {action.evidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {action.evidence.map(item => (
                        <span key={item} className="rounded-md bg-primary-container/35 px-2.5 py-1 text-xs font-medium text-on-primary-container">
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

        {evidenceBlockers.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold tracking-tight text-on-background">Needs stronger evidence</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                These points usually require clearer impact proof, more scope, or stronger real experience, not just cleaner wording.
              </p>
            </div>
            <div className="space-y-3">
              {evidenceBlockers.map(action => (
                <div key={action.criterionId} className="rounded-[1.2rem] border border-amber-200 bg-amber-50/65 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold tracking-tight text-on-background">{action.title}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        {action.section}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                      {formatGainRange(action.estimatedGainMin, action.estimatedGainMax)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{action.reason}</p>
                  {action.evidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {action.evidence.map(item => (
                        <span key={item} className="rounded-md bg-white/85 px-2.5 py-1 text-xs font-medium text-amber-800">
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
