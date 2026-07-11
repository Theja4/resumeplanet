'use client'

import Link from 'next/link'
import { CheckCircle2, ChevronDown, ChevronUp, Eye, Loader2, Lock, MessageSquarePlus, RefreshCw, ShieldAlert, Sparkles, Target, Unlock, Wand2, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AIInsightCard from './AIInsightCard'
import { getInsightSuggestionScoreDelta, hasBreakdownRegression } from '@/lib/ai-insights'
import { getEducationDateLabel, getProjectBullets, getResumeSkills } from '@/lib/resume-data'
import type { OptimizeResult } from '@/components/ats/RoadToNinetyPanel'
import { buildATSRoadmap, scoreResume, type ScorerBreakdown } from '@/lib/ats-scorer'
import type { ATSScoreRoadmap, ResumeData } from '@/types'

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

interface InsightsData {
  score: number
  scoreLabel: string
  summary: string
  breakdown: Record<string, ScorerBreakdown>
  roadmap: ATSScoreRoadmap
  suggestions: Suggestion[]
}

interface Props {
  resumeData: ResumeData | null
  /**
   * `silent` (default false) tells the parent to skip side effects like
   * scroll-into-view and section-expand. Apply-All passes `silent: true` for
   * the first N-1 suggestions so the preview doesn't scroll-thrash through
   * every fix, then sends the last one normally to end up at a sensible scroll
   * position.
   */
  onApplyFix: (suggestion: Suggestion, options?: { silent?: boolean }) => void
  onUndoFix: () => void
  onStartTailoring: () => void
  resumeId: string
  isPro: boolean
  autoStartOptimize?: boolean
  onAutoStartOptimizeConsumed?: () => void
}

interface CachedInsights {
  version: number
  signature: string
  insights: InsightsData
}

// 8 = SCORER_VERSION 3 (expanded verbs/metrics/polish) — matches the server
// cache version so stale local caches refresh together.
const INSIGHTS_CACHE_VERSION = 8
const INSIGHTS_LOCK_TTL_MS = 20000
const inFlightInsights = new Map<string, Promise<InsightsData>>()
const browserSessionId =
  typeof window === 'undefined'
    ? 'server'
    : window.sessionStorage.getItem('rezoomed-ai-insights-session') ??
      (() => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        window.sessionStorage.setItem('rezoomed-ai-insights-session', id)
        return id
      })()

const TYPE_LABELS: Record<string, string> = {
  'action-verb': 'Stronger Verbs',
  'metric': 'Add Metrics',
  'keyword': 'Keywords',
  'format': 'Formatting',
  'section': 'Section Fix',
}

const TYPE_COLORS: Record<string, string> = {
  'action-verb': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'metric': 'bg-amber-50 text-amber-700 border-amber-200',
  'keyword': 'bg-blue-50 text-blue-700 border-blue-200',
  'format': 'bg-purple-50 text-purple-700 border-purple-200',
  'section': 'bg-rose-50 text-rose-700 border-rose-200',
}

const LOCKED_STATE_HIGHLIGHTS = [
  'Catch ATS blockers before you apply',
  'Fix weak bullets and missing keywords fast',
  'Tailor your resume to each job description',
]

function scoreColor(score: number) {
  if (score >= 80) return '#026d32'
  if (score >= 71) return '#22c55e'
  if (score >= 60) return '#ca8a04'
  return '#ef4444'
}

function normalizeInsightsData(data: InsightsData): InsightsData {
  return {
    ...data,
    suggestions: (data.suggestions ?? []).map((suggestion, index) => ({
      ...suggestion,
      id:
        suggestion.id ||
        `${suggestion.type}-${suggestion.sectionHint}-${suggestion.title}-${index}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
    })),
  }
}

function getCacheKey(resumeId: string) {
  return `rezoomed-ai-insights:${resumeId}`
}

function getLockKey(resumeId: string) {
  return `rezoomed-ai-insights-lock:${resumeId}`
}

function normalizeResumeSignature(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function readCachedInsights(resumeId: string): CachedInsights | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getCacheKey(resumeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedInsights
    if (parsed.version !== INSIGHTS_CACHE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeCachedInsights(resumeId: string, signature: string, insights: InsightsData) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      getCacheKey(resumeId),
      JSON.stringify({ version: INSIGHTS_CACHE_VERSION, signature, insights })
    )
  } catch {
    // Ignore localStorage failures and keep the in-memory view working.
  }
}

function readActiveLock(resumeId: string) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getLockKey(resumeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { owner: string; signature: string; expiresAt: number }
    if (parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(getLockKey(resumeId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeActiveLock(resumeId: string, signature: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      getLockKey(resumeId),
      JSON.stringify({
        owner: browserSessionId,
        signature,
        expiresAt: Date.now() + INSIGHTS_LOCK_TTL_MS,
      })
    )
  } catch {
    // Ignore localStorage failures and rely on in-memory dedupe.
  }
}

function clearActiveLock(resumeId: string, signature: string) {
  if (typeof window === 'undefined') return
  const active = readActiveLock(resumeId)
  if (!active) return
  if (active.owner !== browserSessionId || active.signature !== signature) return
  try {
    window.localStorage.removeItem(getLockKey(resumeId))
  } catch {
    // Ignore localStorage failures.
  }
}

async function waitForCachedInsights(resumeId: string, signature: string) {
  if (typeof window === 'undefined') return null

  const startedAt = Date.now()
  while (Date.now() - startedAt < INSIGHTS_LOCK_TTL_MS) {
    const cached = readCachedInsights(resumeId)
    if (cached?.signature === signature) return cached.insights

    const lock = readActiveLock(resumeId)
    if (!lock || lock.signature !== signature) break

    await new Promise(resolve => window.setTimeout(resolve, 250))
  }

  const cached = readCachedInsights(resumeId)
  return cached?.signature === signature ? cached.insights : null
}

function buildResumeText(data: ResumeData): string {
  const parts: string[] = []
  if (data.name) parts.push(data.name)
  if (data.currentRole) parts.push(data.currentRole)
  if (data.email) parts.push(data.email)
  if (data.phone) parts.push(data.phone)
  if (data.location) parts.push(data.location)
  if (data.linkedin) parts.push(data.linkedin)
  if (data.website) parts.push(data.website)
  if (data.summary) parts.push(`Summary: ${data.summary}`)

  if (data.experience.length > 0) {
    parts.push('\nExperience:')
    for (const exp of data.experience) {
      parts.push(`${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`)
      if (exp.summary) parts.push(`  ${exp.summary}`)
      for (const bullet of exp.bullets) {
        parts.push(`  - ${bullet}`)
      }
    }
  }

  if (data.education.length > 0) {
    parts.push('\nEducation:')
    for (const edu of data.education) {
      parts.push(`${edu.degree} in ${edu.field} at ${edu.institution} (${getEducationDateLabel(edu)})`)
    }
  }

  if (getResumeSkills(data).length > 0) {
    parts.push(`\nSkills: ${getResumeSkills(data).join(', ')}`)
  }

  if (data.projects.length > 0) {
    parts.push('\nProjects:')
    for (const proj of data.projects) {
      parts.push(`${proj.name}: ${proj.description}`)
      for (const bullet of getProjectBullets(proj)) {
        parts.push(`  - ${bullet}`)
      }
      if (proj.technologies?.length) {
        parts.push(`  Technologies: ${proj.technologies.join(', ')}`)
      }
    }
  }

  if (data.certifications.length > 0) {
    parts.push('\nCertifications:')
    for (const cert of data.certifications) {
      parts.push(`${cert.name} - ${cert.issuer} (${cert.date})`)
    }
  }

  if (data.volunteer.length > 0) {
    parts.push('\nVolunteer:')
    for (const item of data.volunteer) {
      parts.push(`${item.title} at ${item.company} (${item.startDate} - ${item.endDate})`)
      for (const bullet of item.bullets) {
        parts.push(`  - ${bullet}`)
      }
    }
  }

  if (data.languages.length > 0) {
    parts.push(`\nLanguages: ${data.languages.join(', ')}`)
  }

  if (data.interests.length > 0) {
    parts.push(`\nInterests: ${data.interests.join(', ')}`)
  }

  if (data.awards.length > 0) {
    parts.push('\nAwards:')
    for (const award of data.awards) {
      parts.push(`${award.title} - ${award.issuer} (${award.date})`)
    }
  }

  if (data.publications.length > 0) {
    parts.push('\nPublications:')
    for (const publication of data.publications) {
      parts.push(`${publication.title} - ${publication.publisher} (${publication.date})`)
    }
  }

  if (data.references.length > 0) {
    parts.push(`\nReferences: ${data.references.join(', ')}`)
  }

  if (data.customSections?.length) {
    parts.push('\nCustom Sections:')
    for (const section of data.customSections) {
      parts.push(section.title)
      if (section.type === 'text' && section.text) {
        parts.push(section.text)
      }
      if (section.type === 'tags' && section.tags?.length) {
        parts.push(section.tags.join(', '))
      }
      if (section.type === 'complex' && section.items?.length) {
        for (const item of section.items) {
          parts.push(`${item.title} at ${item.company} (${item.startDate} - ${item.endDate})`)
          if (item.summary) parts.push(`  ${item.summary}`)
          for (const bullet of item.bullets) {
            parts.push(`  - ${bullet}`)
          }
        }
      }
    }
  }

  return normalizeResumeSignature(parts.join('\n'))
}

const ANALYSIS_STEPS: { label: string; color: string }[] = [
  { label: 'Parsing resume structure', color: '#60a5fa' },
  { label: 'Scanning action verbs & strength', color: '#34d399' },
  { label: 'Measuring keyword density', color: '#a78bfa' },
  { label: 'Evaluating ATS compatibility', color: '#fbbf24' },
  { label: 'Reviewing section order & gaps', color: '#22d3ee' },
  { label: 'Identifying missing metrics', color: '#f87171' },
  { label: 'Compiling improvement suggestions', color: '#4ade80' },
]

const STEP_DURATION_MS = 8571 // ~60s total across 7 steps
const FAST_FORWARD_MS = 180   // per step when API has responded

function AnalysisLoader({ apiDone, onFinished }: { apiDone: boolean; onFinished: () => void }) {
  const [step, setStep] = useState(0)
  const [dots, setDots] = useState(1)
  const stepRef = useRef(0)
  const onFinishedRef = useRef(onFinished)
  const fastForwardStartedRef = useRef(false)

  useEffect(() => {
    onFinishedRef.current = onFinished
  }, [onFinished])

  // Normal step progression
  useEffect(() => {
    const id = setInterval(() => {
      setStep(prev => {
        const next = prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev
        stepRef.current = next
        return next
      })
    }, STEP_DURATION_MS)
    return () => clearInterval(id)
  }, [])

  // Fast-forward when API responds
  useEffect(() => {
    if (!apiDone || fastForwardStartedRef.current) return
    fastForwardStartedRef.current = true
    const advance = () => {
      setStep(prev => {
        const next = prev + 1
        stepRef.current = next
        if (next >= ANALYSIS_STEPS.length) {
          setTimeout(() => onFinishedRef.current(), 400)
          return prev
        }
        setTimeout(advance, FAST_FORWARD_MS)
        return next
      })
    }
    setTimeout(advance, FAST_FORWARD_MS)
  }, [apiDone])

  // Dots animation
  useEffect(() => {
    const id = setInterval(() => setDots(p => (p === 3 ? 1 : p + 1)), 500)
    return () => clearInterval(id)
  }, [])

  const clampedStep = Math.min(step, ANALYSIS_STEPS.length - 1)
  const pct = Math.round(((clampedStep + 1) / ANALYSIS_STEPS.length) * 100)
  const activeColor = ANALYSIS_STEPS[clampedStep]?.color ?? '#4ade80'
  const allDone = step >= ANALYSIS_STEPS.length
  const fastForwarding = apiDone && !allDone

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_42%,#f8faf9_100%)]">

      {/* Top hero section */}
      <div className="px-5 pb-5 pt-6">
        <div className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-white p-5 text-center shadow-sm shadow-emerald-950/[0.04]">
        {/* Scanner mark */}
        <div className="relative mx-auto mb-5 w-fit">
          <span
            className="absolute inset-0 animate-ping rounded-2xl"
            style={{ backgroundColor: `${activeColor}25`, transition: 'background-color 1s' }}
          />
          <span
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${activeColor}14`, transition: 'background-color 1s', border: `1.5px solid ${activeColor}35` }}
          >
            <Sparkles size={24} style={{ color: activeColor, transition: 'color 1s' }} />
          </span>
        </div>

        <p className="mb-1 text-base font-black tracking-tight text-slate-950">
          {allDone ? 'Analysis Complete' : 'Deep Analysis Running'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-slate-500">
            {allDone ? 'Preparing results' : 'Processing' + '.'.repeat(dots)}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ color: activeColor, backgroundColor: `${activeColor}18`, transition: 'all 1s' }}
          >
            {pct}%
          </span>
        </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-6 mb-5 h-1.5 overflow-hidden rounded-full bg-emerald-100/70">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #026d32, ${activeColor})`,
            transition: fastForwarding
              ? `width ${FAST_FORWARD_MS}ms ease-out`
              : `width ${STEP_DURATION_MS}ms ease-in-out`,
          }}
        />
      </div>

      {/* Steps list */}
      <div className="flex-1 space-y-2 overflow-hidden px-5">
        {ANALYSIS_STEPS.map(({ label, color }, i) => {
          const done = i < clampedStep
          const active = i === clampedStep && !allDone
          return (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-sm transition-all"
              style={{
                backgroundColor: active ? `${color}12` : done || allDone ? '#ffffff' : '#f8fafc',
                borderColor: active ? `${color}35` : done || allDone ? '#d1fae5' : '#e5e7eb',
                transition: 'all 0.4s ease',
              }}
            >
              <span className="flex w-5 shrink-0 items-center justify-center">
                {done || allDone ? (
                  <CheckCircle2 size={14} style={{ color }} />
                ) : active ? (
                  <Loader2 size={13} className="animate-spin" style={{ color }} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className="flex-1 text-[12px]"
                style={{
                  color: done || allDone ? '#334155' : active ? color : '#94a3b8',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.4s ease',
                }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ color, backgroundColor: `${color}20` }}
                >
                  Active
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mx-5 mb-5 mt-4 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
        <Zap size={12} className="mt-px shrink-0 text-amber-500" />
        <p className="text-[11px] leading-relaxed text-amber-800">
          Deep analysis can take <span className="font-semibold">2-3 minutes</span>. We&apos;re running a thorough ATS audit worth the wait.
        </p>
      </div>
    </div>
  )
}

function ReviewChangesSection({
  suggestions,
  appliedSuggestions,
  pendingSuggestions,
  staleSuggestionCount,
  onApply,
  onUndo,
  defaultOpen,
}: {
  suggestions: (Suggestion & { isApplied: boolean; isStale?: boolean; estimatedPoints: number })[]
  appliedSuggestions: (Suggestion & { isApplied: boolean })[]
  pendingSuggestions: (Suggestion & { isApplied: boolean })[]
  staleSuggestionCount: number
  onApply: (suggestion: Suggestion) => void
  onUndo: (id: string) => void
  defaultOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const summaryText = appliedSuggestions.length > 0
    ? `${appliedSuggestions.length} applied${pendingSuggestions.length > 0 ? `, ${pendingSuggestions.length} pending` : ''}`
    : `${pendingSuggestions.length} suggestion${pendingSuggestions.length !== 1 ? 's' : ''}`

  return (
    <div className="overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white shadow-sm shadow-emerald-950/[0.04]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-emerald-50/55"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
          <Wand2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-950">Review changes</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{summaryText}</p>
        </div>
        {isOpen
          ? <ChevronUp size={16} className="shrink-0 text-slate-400" />
          : <ChevronDown size={16} className="shrink-0 text-slate-400" />
        }
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-emerald-100/70 bg-emerald-50/30 px-3 pb-4 pt-3">
          {staleSuggestionCount > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              {staleSuggestionCount} stale — re-optimize to refresh
            </div>
          )}
          {suggestions.map((suggestion) => (
            <AIInsightCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={() => onApply(suggestion)}
              onUndo={() => onUndo(suggestion.id)}
              isApplied={suggestion.isApplied}
              label={TYPE_LABELS[suggestion.type] ?? suggestion.type}
              colorClass={TYPE_COLORS[suggestion.type] ?? 'bg-zinc-50 text-zinc-700 border-zinc-200'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIInsightsPanel({
  resumeData,
  onApplyFix,
  onUndoFix,
  onStartTailoring,
  resumeId,
  isPro,
  autoStartOptimize = false,
  onAutoStartOptimizeConsumed,
}: Props) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [isApplyingAll, setIsApplyingAll] = useState(false)
  const [needsRescan, setNeedsRescan] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [preOptimizeScore, setPreOptimizeScore] = useState<number | null>(null)
  const autoApplyPendingRef = useRef(false)
  const hasAutoStartedOptimizeRef = useRef(false)

  useEffect(() => {
    if (isLoading) setShowLoader(true)
  }, [isLoading])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const resumeSignature = useMemo(
    () => (resumeData ? buildResumeText(resumeData) : ''),
    [resumeData]
  )

  const liveScorerResult = useMemo(
    () => (resumeData && insights ? scoreResume(resumeData) : null),
    [insights, resumeData]
  )

  const liveRoadmap = useMemo(
    () => (liveScorerResult ? buildATSRoadmap(liveScorerResult) : (insights?.roadmap ?? null)),
    [insights, liveScorerResult]
  )

  const suggestionsWithLiveImpact = useMemo(() => {
    if (!resumeData || !insights) return []

    let workingData = resumeData

    return insights.suggestions
      .map(suggestion => {
        const isApplied = appliedIds.has(suggestion.id)
        if (isApplied) {
          return {
            ...suggestion,
            estimatedPoints: suggestion.estimatedPoints,
            isApplied: true,
            isStale: false,
          }
        }

        const evaluation = getInsightSuggestionScoreDelta(workingData, suggestion)
        const hasRegression =
          evaluation.after.score < evaluation.before.score ||
          hasBreakdownRegression(evaluation.before, evaluation.after)
        const isStale = evaluation.updatedData === workingData || hasRegression
        if (!isStale) {
          workingData = evaluation.updatedData
        }

        return {
          ...suggestion,
          estimatedPoints: isStale
            ? 0
            : Math.max(1, evaluation.delta, suggestion.estimatedPoints ?? 0),
          isApplied: false,
          isStale,
        }
      })
      .filter(suggestion => suggestion.isApplied || !suggestion.isStale)
  }, [appliedIds, insights, resumeData])

  const staleSuggestionCount = useMemo(() => {
    if (!resumeData || !insights) return 0

    return insights.suggestions.reduce((count, suggestion) => {
      if (appliedIds.has(suggestion.id)) return count
      const evaluation = getInsightSuggestionScoreDelta(resumeData, suggestion)
      const isStale =
        evaluation.updatedData === resumeData ||
        evaluation.after.score < evaluation.before.score ||
        hasBreakdownRegression(evaluation.before, evaluation.after)
      return count + (isStale ? 1 : 0)
    }, 0)
  }, [appliedIds, insights, resumeData])

  useEffect(() => {
    if (!toastMessage) return
    const id = window.setTimeout(() => setToastMessage(null), 2400)
    return () => window.clearTimeout(id)
  }, [toastMessage])

  const fetchInsights = useCallback(async (signature: string) => {
    if (!resumeData) return

    const cacheKey = `${resumeId}:${signature}`
    const cached = readCachedInsights(resumeId)
    if (cached?.signature === signature) {
      setInsights(cached.insights)
      setNeedsRescan(false)
      setError(null)
      return
    }

    const existingRequest = inFlightInsights.get(cacheKey)
    if (existingRequest) {
      setIsLoading(true)
      try {
        const sharedInsights = await existingRequest
        setInsights(sharedInsights)
        setNeedsRescan(false)
        setError(null)
      } catch (e) {
        console.error('Insights error:', e)
        setError(e instanceof Error ? e.message : 'Failed to analyze')
      } finally {
        setIsLoading(false)
      }
      return
    }

    const activeLock = readActiveLock(resumeId)
    if (activeLock && activeLock.owner !== browserSessionId && activeLock.signature === signature) {
      const sharedInsights = await waitForCachedInsights(resumeId, signature)
      if (sharedInsights) {
        setInsights(sharedInsights)
        setNeedsRescan(false)
        setError(null)
        return
      }
    }

    setIsLoading(true)
    setError(null)
    setAppliedIds(new Set())
    writeActiveLock(resumeId, signature)

    const requestPromise = (async () => {
      const res = await fetch('/api/ats/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, resumeId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to analyze')
      }

      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to analyze')
      }

      return normalizeInsightsData(json.data as InsightsData)
    })()

    inFlightInsights.set(cacheKey, requestPromise)

    try {
      const nextInsights = await requestPromise
      setInsights(nextInsights)
      setNeedsRescan(false)
      writeCachedInsights(resumeId, signature, nextInsights)
    } catch (e) {
      console.error('Insights error:', e)
      setError(e instanceof Error ? e.message : 'Failed to analyze')
    } finally {
      inFlightInsights.delete(cacheKey)
      clearActiveLock(resumeId, signature)
      setIsLoading(false)
    }
  }, [resumeData, resumeId])

  useEffect(() => {
    if (!isPro || !resumeData || !resumeSignature) return

    const cached = readCachedInsights(resumeId)
    if (cached?.insights) {
      setInsights(cached.insights)
      setHasStarted(true)
      setNeedsRescan(cached.signature !== resumeSignature)
      setError(null)
      return
    }

    const cacheKey = `${resumeId}:${resumeSignature}`
    const existingRequest = inFlightInsights.get(cacheKey)
    const activeLock = readActiveLock(resumeId)
    const hasInFlightScan =
      !!existingRequest ||
      (activeLock?.signature === resumeSignature)

    if (hasInFlightScan) {
      setHasStarted(true)
      void fetchInsights(resumeSignature)
    }
  }, [fetchInsights, isPro, resumeData, resumeId, resumeSignature])

  useEffect(() => {
    if (!hasStarted || !resumeData || !insights) return
    const cached = readCachedInsights(resumeId)
    setNeedsRescan(!cached || cached.signature !== resumeSignature)
  }, [hasStarted, insights, resumeData, resumeId, resumeSignature])

  function handleStartInsightsClick() {
    if (!resumeData || isLoading) return
    // Capture score before optimization starts
    setPreOptimizeScore(scoreResume(resumeData).score)
    autoApplyPendingRef.current = true
    setOptimizeResult(null)
    setHasStarted(true)
    void fetchInsights(resumeSignature)
  }

  useEffect(() => {
    if (!autoStartOptimize) {
      hasAutoStartedOptimizeRef.current = false
      return
    }

    if (hasAutoStartedOptimizeRef.current || !isPro || !resumeData || !resumeSignature || isLoading) {
      return
    }

    hasAutoStartedOptimizeRef.current = true
    handleStartInsightsClick()
    onAutoStartOptimizeConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartOptimize, isPro, resumeData, resumeSignature, isLoading])

  function handleApplyWithAnimation(suggestion: Suggestion) {
    if (!resumeData) return
    const evaluation = getInsightSuggestionScoreDelta(resumeData, suggestion)
    const isStale =
      evaluation.updatedData === resumeData ||
      evaluation.after.score < evaluation.before.score ||
      hasBreakdownRegression(evaluation.before, evaluation.after)
    if (isStale) {
      setToastMessage('That suggestion is outdated after your recent edits. Rescan to refresh insights.')
      setNeedsRescan(true)
      return
    }
    setAppliedIds(prev => new Set(prev).add(suggestion.id))
    onApplyFix(suggestion)
    setNeedsRescan(true)
  }

  function handleUndoFix(suggestionId: string) {
    setAppliedIds(prev => {
      const next = new Set(prev)
      next.delete(suggestionId)
      return next
    })
    onUndoFix()
  }

  function handleApplyAllWithResult() {
    if (!resumeData || !insights || isApplyingAll) return
    const pending = suggestionsWithLiveImpact.filter(s => !s.isApplied && !s.isStale)

    const scoreBefore = preOptimizeScore ?? liveScorerResult?.score ?? insights.score

    if (pending.length === 0) {
      setOptimizeResult({ appliedCount: 0, skippedCount: 0, scoreBefore, scoreAfter: scoreBefore })
      return
    }

    let workingData = resumeData
    const accepted: Suggestion[] = []
    let skipped = 0

    for (const suggestion of pending) {
      const evaluation = getInsightSuggestionScoreDelta(workingData, suggestion)
      const isStillSafe =
        evaluation.updatedData !== workingData &&
        evaluation.after.score >= evaluation.before.score &&
        !hasBreakdownRegression(evaluation.before, evaluation.after)

      if (!isStillSafe) {
        skipped++
        continue
      }

      accepted.push(suggestion)
      workingData = evaluation.updatedData
    }

    if (accepted.length === 0) {
      setOptimizeResult({ appliedCount: 0, skippedCount: skipped, scoreBefore, scoreAfter: scoreBefore })
      setNeedsRescan(true)
      return
    }

    setIsApplyingAll(true)
    // Apply the first N-1 silently (no scroll, no expand) so the preview
    // doesn't bounce around for every fix. The final apply runs normally so
    // we end at a sensible scroll position.
    for (let i = 0; i < accepted.length; i++) {
      const suggestion = accepted[i]
      setAppliedIds(prev => new Set(prev).add(suggestion.id))
      const isLast = i === accepted.length - 1
      onApplyFix(suggestion, { silent: !isLast })
    }

    const scoreAfter = scoreResume(workingData).score
    setOptimizeResult({ appliedCount: accepted.length, skippedCount: skipped, scoreBefore, scoreAfter })
    setNeedsRescan(true)
    setIsApplyingAll(false)
  }

  const handleImpactSuggestions = useCallback((incoming: Suggestion[]) => {
    if (incoming.length === 0) return
    setInsights(prev => {
      if (!prev) return prev
      const existingIds = new Set(prev.suggestions.map(s => s.id))
      const merged = [...prev.suggestions, ...incoming.filter(s => !existingIds.has(s.id))]
      return { ...prev, suggestions: merged }
    })
    setToastMessage(`${incoming.length} rewrite${incoming.length === 1 ? '' : 's'} with your numbers ready in Review changes.`)
  }, [])

  function handleRescanClick() {
    if (isLoading || !resumeData) return
    if (!hasStarted) {
      handleStartInsightsClick()
      return
    }
    if (!insights) {
      void fetchInsights(resumeSignature)
      return
    }
    if (!needsRescan) {
      setToastMessage('Make changes to your resume before rescanning.')
      return
    }
    // Re-optimize: rescan then auto-apply
    handleStartInsightsClick()
  }

  // Live score preview for the initial screen
  const previewScore = useMemo(
    () => (resumeData ? scoreResume(resumeData).score : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resumeData?.summary, resumeData?.experience?.length, resumeData?.skills?.length]
  )

  // Auto-apply after loader finishes and insights are ready
  useEffect(() => {
    if (!showLoader && autoApplyPendingRef.current && insights && !isLoading) {
      autoApplyPendingRef.current = false
      handleApplyAllWithResult()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoader, insights, isLoading])

  if (!isPro) {
    return (
      <div className="flex h-full overflow-hidden bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_34%,#f8faf9_100%)] text-slate-900">
        <div className="flex min-h-full flex-1 flex-col justify-between p-5">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-sm">
            <Lock size={12} />
            Pro Only
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">AI Insights</h3>
            <p className="text-[24px] font-black leading-[1.03] tracking-tight text-slate-950">
              Tired of applying and <span className="text-emerald-700">never hearing back</span>?
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Most rejections happen before a human ever sees your resume. A single missing keyword or weak bullet is enough to get filtered out by ATS software.
            </p>
          </div>

          <div className="mt-4 rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              <Sparkles size={12} />
              Unlock With Pro
            </div>
            <div className="mt-3 space-y-2.5">
              {LOCKED_STATE_HIGHLIGHTS.map(point => (
                <div key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-[12px] font-medium leading-relaxed text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#ecfdf3_100%)] p-4 shadow-sm shadow-emerald-950/[0.04]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              <Wand2 size={12} />
              The Hard Truth
            </div>
            <p className="mt-3 text-sm font-bold leading-snug text-slate-950">
              75% of resumes are rejected by ATS before a recruiter ever opens them.
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
              If you&apos;re getting ghosted, it&apos;s probably not you — it&apos;s your resume formatting and missing keywords. Pro catches what you can&apos;t see.
            </p>
          </div>

          <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-sm shadow-emerald-950/[0.04]">
            <div className="flex items-start gap-3">
              <Zap size={15} className="mt-0.5 shrink-0 text-emerald-700" />
              <p className="text-[12px] font-bold leading-relaxed">
                Every application you send unreviewed is another chance to get ghosted.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href="/dashboard/pricing"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_38px_rgba(2,109,50,0.22)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              <Unlock size={16} />
              Unlock Insights + Tailor
            </Link>

            <p className="mt-3 text-center text-[11px] font-medium leading-relaxed text-slate-500">
              Stop guessing. Start getting callbacks.
            </p>
          </div>
        </div>
      </div>
	  )
	}

  if (showLoader) {
    return (
      <AnalysisLoader
        apiDone={!isLoading}
        onFinished={() => setShowLoader(false)}
      />
    )
  }

  if (!hasStarted && !insights) {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_36%,#f8faf9_100%)] rezoomed-thin-scrollbar">
        <div className="flex flex-1 flex-col p-5">
          {/* Score preview */}
          {previewScore !== null && (
            <div className="mb-5 flex flex-col items-center rounded-[26px] border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/[0.04]">
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#e4e4e7" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="38" fill="none"
                    stroke={scoreColor(previewScore)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - previewScore / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black leading-none tracking-tighter text-slate-950">{previewScore}</span>
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800">
                {previewScore >= 80 ? 'Looking good!' : previewScore >= 60 ? 'Room to improve' : 'Needs work'}
              </p>
              {previewScore < 80 && (
                <p className="mt-1 text-xs font-medium text-slate-400">AI can likely boost this by 5–15 points</p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mb-5 rounded-[24px] border border-emerald-100 bg-white p-5 text-center shadow-sm shadow-emerald-950/[0.04]">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Sparkles size={18} />
            </div>
            <h3 className="mb-2 text-lg font-black text-slate-950">Optimize with AI</h3>
            <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-slate-600">
              One click. AI rewrites weak bullets, fixes formatting, and boosts keywords — only safe, verified changes.
            </p>
          </div>

          <button
            onClick={handleStartInsightsClick}
            disabled={!resumeData || isLoading}
            className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-[0_18px_38px_rgba(2,109,50,0.22)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #026d32 0%, #19793c 100%)' }}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={18} />
              Optimize My Resume
            </span>
          </button>

          <p className="mt-3 text-center text-xs font-medium text-slate-500">Takes 1–3 minutes. You can undo any change.</p>

          {/* Tailor nudge */}
          <div className="mt-auto pt-6">
            <button
              onClick={onStartTailoring}
              disabled={!resumeData || isLoading}
              className="flex w-full items-center gap-3 rounded-[22px] border border-emerald-100 bg-white p-4 text-left shadow-sm shadow-emerald-950/[0.04] transition-all hover:border-emerald-200 hover:bg-emerald-50/55 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Target size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">Tailor for a specific job</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">Match keywords to a job description</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pendingSuggestions = suggestionsWithLiveImpact.filter(s => !s.isApplied && !s.isStale)
  const appliedSuggestions = suggestionsWithLiveImpact.filter(s => s.isApplied)
  const displayScore = liveScorerResult?.score ?? insights?.score ?? 0
  const displayLabel = liveScorerResult?.scoreLabel ?? insights?.scoreLabel ?? ''
  const hasRemainingRoadmap = Boolean(liveRoadmap && liveRoadmap.truthfulCeiling > displayScore)

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_32%,#f8faf9_100%)] rezoomed-thin-scrollbar">
      <div className="flex-1 p-5">

        {toastMessage && (
          <div className="mb-4 animate-in rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-semibold text-slate-600 shadow-sm shadow-emerald-950/[0.04] fade-in slide-in-from-top-1 duration-200">
            {toastMessage}
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-red-100 bg-white px-5 py-12 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <span className="text-xl">!</span>
            </div>
            <p className="text-center text-xs leading-relaxed text-slate-500">{error}</p>
            <button
              onClick={() => void fetchInsights(resumeSignature)}
              className="rounded-xl bg-primary-container px-4 py-2 text-xs font-bold text-on-primary-container transition-all active:scale-95"
            >
              Retry
            </button>
          </div>
        ) : insights && (
          <div className="space-y-5">

            {/* ── Hero: Score + optimization result ── */}
            <div
              className="relative overflow-hidden rounded-[26px] p-[1.5px] shadow-sm shadow-emerald-950/[0.04]"
              style={{ background: optimizeResult && optimizeResult.appliedCount > 0
                ? 'linear-gradient(135deg, #026d3280, #22c55e40, #e4e4e7)'
                : `linear-gradient(135deg, ${scoreColor(displayScore)}80, ${scoreColor(displayScore)}20, #e4e4e7)` }}
            >
              <div className="relative flex flex-col items-center overflow-hidden rounded-[calc(1.625rem-1.5px)] bg-white p-5">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-10 blur-2xl pointer-events-none"
                  style={{ backgroundColor: scoreColor(displayScore) }}
                />

                {/* Before/After when optimization happened */}
                {optimizeResult && optimizeResult.appliedCount > 0 ? (
                  <div className="relative z-10 w-full">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <span className="text-base font-bold text-slate-950">
                        {optimizeResult.appliedCount} improvement{optimizeResult.appliedCount !== 1 ? 's' : ''} applied
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-5">
                      {/* Before */}
                      <div className="text-center">
                        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Before</p>
                        <span className="text-4xl font-black tracking-tighter text-slate-300">{optimizeResult.scoreBefore}</span>
                      </div>

                      {/* Arrow + delta */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="h-[2px] w-8 rounded-full bg-slate-200" />
                        {optimizeResult.scoreAfter > optimizeResult.scoreBefore && (
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            +{optimizeResult.scoreAfter - optimizeResult.scoreBefore}
                          </span>
                        )}
                      </div>

                      {/* After */}
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Now</p>
                        <span className="text-4xl font-black tracking-tighter" style={{ color: scoreColor(displayScore) }}>
                          {displayScore}
                        </span>
                      </div>
                    </div>

                    {optimizeResult.skippedCount > 0 && (
                      <p className="mt-3 text-center text-xs text-slate-500">{optimizeResult.skippedCount} unsafe change{optimizeResult.skippedCount !== 1 ? 's' : ''} skipped</p>
                    )}

                    {insights.summary && (
                      <p className="mt-3 px-1 text-center text-sm leading-relaxed text-slate-600">{insights.summary}</p>
                    )}
                  </div>
                ) : (
                  /* Score ring when no optimization yet (cached insights) */
                  <div className="relative z-10 flex flex-col items-center">
                    <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#e4e4e7" strokeWidth="7" />
                      <circle
                        cx="50" cy="50" r="38" fill="none"
                        stroke={scoreColor(displayScore)}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={displayScore > 94 ? '0' : `${2 * Math.PI * 38 * (1 - displayScore / 100)}`}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 'auto', height: 112 }}>
                      <span className="text-3xl font-black leading-none tracking-tighter text-slate-950">{displayScore}</span>
                      <span className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">/ 100</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: scoreColor(displayScore) }} />
                      <span className="text-sm font-bold text-slate-800">{displayLabel}</span>
                    </div>
                    {insights.summary && (
                      <p className="mt-3 px-1 text-center text-sm leading-relaxed text-slate-600">{insights.summary}</p>
                    )}
                  </div>
                )}

                {/* Chips */}
                <div className="mt-3 flex items-center gap-2 flex-wrap justify-center relative z-10">
                  {appliedIds.size > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {appliedIds.size} applied
                    </span>
                  )}
                </div>

                {/* Apply remaining (if user undid some, or loaded from cache) */}
                {pendingSuggestions.length > 0 && (
                  <button
                    onClick={handleApplyAllWithResult}
                    disabled={isApplyingAll}
                    className="relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(2,109,50,0.18)]
                      hover:brightness-110 hover:shadow-lg hover:shadow-primary/20
                      active:scale-[0.98] active:brightness-95
                      transition-all duration-150
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    style={{ background: 'linear-gradient(135deg, #026d32 0%, #19793c 100%)' }}
                  >
                    <Sparkles size={15} />
                    {optimizeResult ? 'Apply Remaining Fixes' : 'Apply All Fixes'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Next steps ── */}
            <div className="space-y-2.5">
              {/* Re-optimize: only when resume changed */}
              {needsRescan && (
                <button
                  onClick={handleRescanClick}
                  disabled={isLoading}
                  className="flex w-full items-center gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-left shadow-sm shadow-emerald-950/[0.04] transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600">
                    {isLoading ? <Loader2 size={16} className="text-white animate-spin" /> : <RefreshCw size={16} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Re-optimize</p>
                    <p className="mt-0.5 text-xs font-medium text-emerald-700">Resume changed — run AI again</p>
                  </div>
                </button>
              )}

              {/* Tailor CTA */}
              <button
                onClick={onStartTailoring}
                disabled={!resumeData || isLoading}
                className="flex w-full items-center gap-3 rounded-[22px] border border-emerald-100 bg-white p-4 text-left shadow-sm shadow-emerald-950/[0.04] transition-all hover:border-emerald-200 hover:bg-emerald-50/55 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">Tailor for a job</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Match keywords to a specific posting</p>
                </div>
              </button>
            </div>

            {/* ── Collapsible: Review changes ── */}
            {suggestionsWithLiveImpact.length > 0 && (
              <ReviewChangesSection
                suggestions={suggestionsWithLiveImpact}
                appliedSuggestions={appliedSuggestions}
                pendingSuggestions={pendingSuggestions}
                staleSuggestionCount={staleSuggestionCount}
                onApply={handleApplyWithAnimation}
                onUndo={handleUndoFix}
                defaultOpen={!optimizeResult || optimizeResult.appliedCount === 0}
              />
            )}

            {suggestionsWithLiveImpact.length === 0 && (
              <p className="rounded-[22px] border border-emerald-100 bg-white px-5 py-6 text-center text-sm leading-relaxed text-slate-500 shadow-sm shadow-emerald-950/[0.04]">
                {insights.score >= 80 && !hasRemainingRoadmap
                  ? 'No suggestions — your resume looks good!'
                  : 'No safe auto-fixes found. Try editing manually or tailoring for a specific job.'}
              </p>
            )}

            {/* ── Evidence blockers (subtle) ── */}
            {liveRoadmap && liveRoadmap.evidenceBlockers.length > 0 && (
              <details className="group rounded-[22px] border border-amber-100 bg-white p-4 shadow-sm shadow-amber-950/[0.03]">
                <summary className="flex cursor-pointer list-none items-center gap-2 select-none text-xs font-bold uppercase tracking-[0.12em] text-amber-700 transition-colors hover:text-amber-800">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span>What AI can&apos;t fix ({liveRoadmap.evidenceBlockers.length})</span>
                  <ChevronDown size={14} className="ml-auto group-open:hidden" />
                  <ChevronUp size={14} className="ml-auto hidden group-open:block" />
                </summary>
                <div className="mt-3 space-y-2">
                  {liveRoadmap.evidenceBlockers.slice(0, 4).map(action => (
                    <div key={action.criterionId} className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{action.reason}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* ── Impact interview: turn the user's real numbers into rewrites ── */}
            {resumeData && (
              <ImpactInterviewSection
                resumeData={resumeData}
                onSuggestionsReady={handleImpactSuggestions}
              />
            )}

            {/* ── Recruiter skim simulation ── */}
            {resumeData && <RecruiterSkimSection resumeData={resumeData} />}

          </div>
        )}
      </div>
    </div>
  )
}

// ─── Impact interview (evidence elicitation) ────────────────────────────────
// The AI can't invent metrics — but the user has them. Ask targeted questions
// about unquantified bullets, then turn the answers into scorer-validated
// rewrites that flow into the normal Review Changes list.

interface ImpactQuestionItem {
  id: string
  bullet: string
  question: string
  hint: string
}

function ImpactInterviewSection({
  resumeData,
  onSuggestionsReady,
}: {
  resumeData: ResumeData
  onSuggestionsReady: (suggestions: Suggestion[]) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'answering' | 'generating' | 'done'>('idle')
  const [questions, setQuestions] = useState<ImpactQuestionItem[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [acceptedCount, setAcceptedCount] = useState(0)

  async function loadQuestions() {
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch('/api/ats/impact-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'questions', resumeData }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load questions')
      const items = (json.data?.questions ?? []) as ImpactQuestionItem[]
      if (items.length === 0) {
        setError('No unquantified bullets found — your experience bullets already carry concrete impact.')
        setPhase('idle')
        return
      }
      setQuestions(items)
      setPhase('answering')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load questions')
      setPhase('idle')
    }
  }

  async function generateRewrites() {
    const answered = questions
      .map(q => ({ bullet: q.bullet, question: q.question, answer: (answers[q.id] ?? '').trim() }))
      .filter(item => item.answer.length >= 2)

    if (answered.length === 0) {
      setError('Answer at least one question first — even a rough number works.')
      return
    }

    setPhase('generating')
    setError(null)
    try {
      const res = await fetch('/api/ats/impact-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rewrite', resumeData, answers: answered }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to generate rewrites')

      const runKey = Date.now().toString(36)
      const suggestions = ((json.data?.suggestions ?? []) as Suggestion[]).map((item, index) => ({
        ...item,
        id: `impact-${runKey}-${index}`,
      }))

      setAcceptedCount(suggestions.length)
      setPhase('done')
      if (suggestions.length > 0) {
        onSuggestionsReady(suggestions)
      } else {
        setError('None of the answers contained a usable fact — try again with rough numbers (team size, volume, frequency).')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate rewrites')
      setPhase('answering')
    }
  }

  return (
    <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
        <MessageSquarePlus size={14} />
        Add your real numbers
      </div>

      {phase === 'idle' && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            AI never invents metrics — but you know them. Answer a few quick questions and we&apos;ll rewrite your weakest bullets with your real numbers.
          </p>
          <button
            onClick={loadQuestions}
            className="mt-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-800 transition-all hover:bg-emerald-100 active:scale-[0.98]"
          >
            Start the 2-minute interview
          </button>
        </>
      )}

      {phase === 'loading' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Finding bullets that need numbers…
        </div>
      )}

      {(phase === 'answering' || phase === 'generating') && (
        <div className="mt-3 space-y-3">
          {questions.map(q => (
            <div key={q.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-xs leading-relaxed text-slate-500">&ldquo;{q.bullet}&rdquo;</p>
              <p className="mt-1.5 text-sm font-semibold text-slate-800">{q.question}</p>
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder={q.hint || 'A rough number is fine'}
                disabled={phase === 'generating'}
                className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none disabled:opacity-60"
              />
            </div>
          ))}
          <button
            onClick={generateRewrites}
            disabled={phase === 'generating'}
            className="w-full rounded-2xl py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #026d32 0%, #19793c 100%)' }}
          >
            {phase === 'generating' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Rewriting with your numbers…
              </span>
            ) : (
              'Generate rewrites'
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400">Skip any question — only answered bullets get rewritten.</p>
        </div>
      )}

      {phase === 'done' && acceptedCount > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-emerald-700">
          <CheckCircle2 size={14} className="mr-1 inline" />
          {acceptedCount} rewrite{acceptedCount === 1 ? '' : 's'} added to Review changes below — apply them like any other fix.
        </p>
      )}

      {error && <p className="mt-2 text-xs leading-relaxed text-amber-700">{error}</p>}
    </div>
  )
}

// ─── Recruiter skim simulation ──────────────────────────────────────────────

interface RecruiterSkimData {
  verdict: 'interview' | 'maybe' | 'pass'
  firstImpression: string
  perceivedRole: string
  perceivedSeniority: string
  signalsRead: string[]
  signalsMissed: string[]
  topChanges: Array<{ change: string; why: string }>
}

const SKIM_VERDICT_STYLES: Record<RecruiterSkimData['verdict'], { label: string; className: string }> = {
  interview: { label: 'Would keep reading', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  maybe: { label: 'On the fence', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pass: { label: 'Would move on', className: 'bg-rose-50 text-rose-700 border-rose-200' },
}

function RecruiterSkimSection({ resumeData }: { resumeData: ResumeData }) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RecruiterSkimData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runSkim() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ats/recruiter-skim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Skim simulation failed')
      setResult(json.data as RecruiterSkimData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Skim simulation failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
        <Eye size={14} />
        The 6-second skim
      </div>

      {!result && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Recruiters decide in seconds. See exactly what a first skim reads on your resume — and what it misses.
          </p>
          <button
            onClick={runSkim}
            disabled={isLoading}
            className="mt-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-800 transition-all hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Simulating the skim…
              </span>
            ) : (
              'Simulate a recruiter skim'
            )}
          </button>
        </>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${SKIM_VERDICT_STYLES[result.verdict].className}`}>
            {SKIM_VERDICT_STYLES[result.verdict].label}
          </span>

          <p className="text-sm leading-relaxed text-slate-700">{result.firstImpression}</p>

          {(result.perceivedRole || result.perceivedSeniority) && (
            <p className="text-xs leading-relaxed text-slate-500">
              Reads as: <span className="font-semibold text-slate-700">{[result.perceivedRole, result.perceivedSeniority].filter(Boolean).join(' · ')}</span>
            </p>
          )}

          {result.signalsMissed.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">Buried below the skim line</p>
              <ul className="mt-2 space-y-1.5">
                {result.signalsMissed.map((signal, index) => (
                  <li key={index} className="text-xs leading-relaxed text-slate-600">• {signal}</li>
                ))}
              </ul>
            </div>
          )}

          {result.topChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">3 changes that alter the skim</p>
              {result.topChanges.map((item, index) => (
                <div key={index} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{item.change}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.why}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={runSkim}
            disabled={isLoading}
            className="w-full rounded-xl border border-emerald-100 bg-white py-2 text-xs font-bold text-slate-500 transition-all hover:bg-emerald-50/60 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Re-running…' : 'Re-run after edits'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs leading-relaxed text-amber-700">{error}</p>}
    </div>
  )
}
