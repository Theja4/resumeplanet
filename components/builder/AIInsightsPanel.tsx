'use client'

import Link from 'next/link'
import { CheckCircle2, Loader2, Lock, RefreshCw, Sparkles, Unlock, Wand2, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AIInsightCard from './AIInsightCard'
import { getInsightSuggestionScoreDelta, hasBreakdownRegression, improvesIntendedCriterion } from '@/lib/ai-insights'
import { getEducationDateLabel, getProjectBullets, getResumeSkills } from '@/lib/resume-data'
import RoadToNinetyPanel from '@/components/ats/RoadToNinetyPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  onApplyFix: (suggestion: Suggestion) => void
  onUndoFix: () => void
  onStartTailoring: () => void
  resumeId: string
  isPro: boolean
}

interface CachedInsights {
  version: number
  signature: string
  insights: InsightsData
}

const INSIGHTS_CACHE_VERSION = 4
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

const ANALYSIS_STEPS: { label: string; color: string; dimColor: string }[] = [
  { label: 'Parsing resume structure',          color: '#60a5fa', dimColor: '#172554' },
  { label: 'Scanning action verbs & strength',  color: '#34d399', dimColor: '#022c22' },
  { label: 'Measuring keyword density',         color: '#a78bfa', dimColor: '#2e1065' },
  { label: 'Evaluating ATS compatibility',      color: '#fbbf24', dimColor: '#422006' },
  { label: 'Reviewing section order & gaps',    color: '#22d3ee', dimColor: '#082f49' },
  { label: 'Identifying missing metrics',       color: '#f87171', dimColor: '#450a0a' },
  { label: 'Compiling improvement suggestions', color: '#4ade80', dimColor: '#052e16' },
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
    <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">

      {/* Top hero section */}
      <div className="flex flex-col items-center justify-center pt-10 pb-6 px-6">
        {/* Orb */}
        <div className="relative mb-5">
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: `${activeColor}25`, transition: 'background-color 1s' }}
          />
          <span
            className="absolute inset-[-10px] rounded-full opacity-20 blur-xl"
            style={{ backgroundColor: activeColor, transition: 'background-color 1s' }}
          />
          <span
            className="relative flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: `${activeColor}18`, transition: 'background-color 1s', border: `1.5px solid ${activeColor}40` }}
          >
            <Sparkles size={24} style={{ color: activeColor, transition: 'color 1s' }} />
          </span>
        </div>

        <p className="text-base font-bold text-white mb-1">
          {allDone ? 'Analysis Complete' : 'Deep Analysis Running'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-zinc-400">
            {allDone ? 'Preparing results' : 'Processing' + '.'.repeat(dots)}
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: activeColor, backgroundColor: `${activeColor}18`, transition: 'all 1s' }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-6 h-[3px] bg-zinc-800 rounded-full overflow-hidden mb-6">
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
      <div className="flex-1 px-4 space-y-1 overflow-hidden">
        {ANALYSIS_STEPS.map(({ label, color, dimColor }, i) => {
          const done = i < clampedStep
          const active = i === clampedStep && !allDone
          return (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: active ? dimColor : 'transparent',
                borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                transition: 'all 0.4s ease',
              }}
            >
              <span className="shrink-0 w-4 flex items-center justify-center">
                {done || allDone ? (
                  <CheckCircle2 size={14} style={{ color }} />
                ) : active ? (
                  <Loader2 size={13} className="animate-spin" style={{ color }} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                )}
              </span>
              <span
                className="text-[12px] flex-1"
                style={{
                  color: done || allDone ? '#3f3f46' : active ? color : '#27272a',
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
      <div className="mx-6 mb-6 mt-4 flex items-start gap-2 pt-4 border-t border-zinc-800">
        <Zap size={12} className="text-amber-400 mt-px shrink-0" />
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Deep analysis can take <span className="text-amber-400 font-semibold">2–3 minutes</span>. We&apos;re running a thorough ATS audit — worth the wait.
        </p>
      </div>
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
}: Props) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [isApplyingAll, setIsApplyingAll] = useState(false)
  const [needsRescan, setNeedsRescan] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [tailorDismissed, setTailorDismissed] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [activeTab, setActiveTab] = useState<'fixes' | 'roadmap'>('fixes')

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

        const evaluation = getInsightSuggestionScoreDelta(resumeData, suggestion)
        return {
          ...suggestion,
          estimatedPoints: Math.max(0, evaluation.delta),
          isApplied: false,
          isStale:
            evaluation.delta <= 0 ||
            hasBreakdownRegression(evaluation.before, evaluation.after) ||
            !improvesIntendedCriterion(evaluation.before, evaluation.after, suggestion.criterionId),
        }
      })
      .filter(suggestion => suggestion.isApplied || suggestion.estimatedPoints > 0)
      .sort((a, b) => {
        if (a.isApplied && !b.isApplied) return -1
        if (!a.isApplied && b.isApplied) return 1
        return b.estimatedPoints - a.estimatedPoints
      })
  }, [appliedIds, insights, resumeData])

  const staleSuggestionCount = useMemo(() => {
    if (!resumeData || !insights) return 0

    return insights.suggestions.reduce((count, suggestion) => {
      if (appliedIds.has(suggestion.id)) return count
      const evaluation = getInsightSuggestionScoreDelta(resumeData, suggestion)
      const isStale =
        evaluation.delta <= 0 ||
        hasBreakdownRegression(evaluation.before, evaluation.after) ||
        !improvesIntendedCriterion(evaluation.before, evaluation.after, suggestion.criterionId)
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
    setHasStarted(true)
    void fetchInsights(resumeSignature)
  }

  function handleApplyWithAnimation(suggestion: Suggestion) {
    if (!resumeData) return
    const evaluation = getInsightSuggestionScoreDelta(resumeData, suggestion)
    const isStale =
      evaluation.delta <= 0 ||
      hasBreakdownRegression(evaluation.before, evaluation.after) ||
      !improvesIntendedCriterion(evaluation.before, evaluation.after, suggestion.criterionId)
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

  function handleApplyAllFixes() {
    if (!resumeData || !insights || isApplyingAll) return
    const pending = suggestionsWithLiveImpact.filter(s => !s.isApplied && s.estimatedPoints > 0)
    if (pending.length === 0) return

    let workingData = resumeData
    const accepted: Suggestion[] = []

    for (const suggestion of pending) {
      const evaluation = getInsightSuggestionScoreDelta(workingData, suggestion)
      const isStillSafe =
        evaluation.delta > 0 &&
        !hasBreakdownRegression(evaluation.before, evaluation.after) &&
        improvesIntendedCriterion(evaluation.before, evaluation.after, suggestion.criterionId)

      if (!isStillSafe) continue

      accepted.push(suggestion)
      workingData = evaluation.updatedData
    }

    if (accepted.length === 0) {
      setToastMessage('Those suggestions are outdated after your recent edits. Rescan to refresh insights.')
      setNeedsRescan(true)
      return
    }

    setIsApplyingAll(true)
    for (const suggestion of accepted) {
      setAppliedIds(prev => new Set(prev).add(suggestion.id))
      onApplyFix(suggestion)
    }
    if (accepted.length < pending.length) {
      setToastMessage('Some outdated suggestions were skipped. Rescan to refresh the remaining insights.')
    }
    setNeedsRescan(true)
    setIsApplyingAll(false)
  }

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
    void fetchInsights(resumeSignature)
  }

  if (!isPro) {
    return (
      <div className="relative flex h-full overflow-hidden bg-[linear-gradient(180deg,#026d32_0%,#015128_42%,#012d17_100%)] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#7bf1a8]/20 blur-3xl animate-pulse" />
          <div className="absolute top-24 -right-16 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-x-6 top-24 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_44%)]" />
        </div>

        <div className="relative flex min-h-full flex-1 flex-col justify-between p-5">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/85 shadow-sm backdrop-blur">
            <Lock size={12} />
            Pro Only
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">AI Insights</h3>
            <p className="text-[24px] font-black tracking-tight leading-[1.03] text-white">
              Tired of applying and <span className="text-[#9df7bf]">never hearing back</span>?
            </p>
            <p className="text-sm leading-relaxed text-white/82">
              Most rejections happen before a human ever sees your resume. A single missing keyword or weak bullet is enough to get filtered out by ATS software.
            </p>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/12 bg-black/18 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7ffd0]">
              <Sparkles size={12} />
              Unlock With Pro
            </div>
            <div className="mt-3 space-y-2.5">
              {LOCKED_STATE_HIGHLIGHTS.map(point => (
                <div key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#9df7bf]" />
                  <p className="text-[12px] leading-relaxed text-white/88">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4 shadow-lg shadow-black/15">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              <Wand2 size={12} className="text-[#9df7bf]" />
              The Hard Truth
            </div>
            <p className="mt-3 text-sm font-bold leading-snug text-white">
              75% of resumes are rejected by ATS before a recruiter ever opens them.
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-white/78">
              If you&apos;re getting ghosted, it&apos;s probably not you — it&apos;s your resume formatting and missing keywords. Pro catches what you can&apos;t see.
            </p>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-[#9df7bf]/25 bg-[#d9ffe6] px-4 py-3 text-[#014621] shadow-xl shadow-black/10">
            <div className="flex items-start gap-3">
              <Zap size={15} className="mt-0.5 shrink-0 text-[#026d32]" />
              <p className="text-[12px] font-bold leading-relaxed">
                Every application you send unreviewed is another chance to get ghosted.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href="/dashboard/pricing"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-[#015128] shadow-2xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#e8fff0] active:scale-[0.98] animate-[pulse_2.8s_ease-in-out_infinite]"
            >
              <Unlock size={16} />
              Unlock Insights + Tailor
            </Link>

            <p className="mt-3 text-center text-[11px] font-medium leading-relaxed text-white/65">
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
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <Sparkles size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800 mb-2">AI Insights</h3>
          <p className="text-xs text-zinc-500 leading-relaxed mb-6 max-w-[240px]">
            Run AI Insights when you&apos;re ready. You&apos;ll get paste-ready fixes plus a truthful Road to 90 for the current resume.
          </p>
          <button
            onClick={handleStartInsightsClick}
            disabled={!resumeData || isLoading}
            className="w-full py-3 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run AI Insights
          </button>
        </div>

        {!tailorDismissed && (
          <div className="relative p-6 bg-zinc-900 text-white rounded-t-[2rem] mt-auto">
            <button
              onClick={() => setTailorDismissed(true)}
              className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-90"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="text-primary-container" size={16} />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tailor for Job</span>
            </div>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Instantly adjust your resume keywords for a specific job description.
            </p>
            <button
              onClick={onStartTailoring}
              disabled={!resumeData || isLoading}
              className="w-full py-2.5 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Tailoring
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 overflow-y-auto flex-1">
        <div className="mb-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">AI Insights</h2>
            <button
              onClick={handleRescanClick}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all ${
                isLoading
                  ? 'bg-zinc-100 text-zinc-400 cursor-wait'
                  : insights && !needsRescan
                    ? 'bg-zinc-100 text-zinc-400'
                    : 'bg-primary-container text-on-primary-container hover:brightness-95 active:scale-95'
              }`}
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Rescan
            </button>
          </div>

          {toastMessage && (
            <div className="mb-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-600 shadow-sm">
              {toastMessage}
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <span className="text-xl">!</span>
              </div>
              <p className="text-xs text-zinc-500 text-center leading-relaxed">{error}</p>
              <button
                onClick={() => void fetchInsights(resumeSignature)}
                className="px-4 py-2 text-xs font-semibold bg-primary-container text-on-primary-container rounded-lg active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {insights && (() => {
                const displayScore = liveScorerResult?.score ?? insights.score
                const displayLabel = liveScorerResult?.scoreLabel ?? insights.scoreLabel
                const scoreDelta = liveScorerResult ? liveScorerResult.score - insights.score : 0
                return (
                <div className="relative mb-6 rounded-3xl p-[1.5px]"
                  style={{ background: `linear-gradient(135deg, ${scoreColor(displayScore)}80, ${scoreColor(displayScore)}20, #e4e4e7)` }}>
                  <div className="relative flex flex-col items-center p-5 bg-white rounded-[calc(1.5rem-1.5px)] overflow-hidden">
                    {/* Subtle radial glow behind ring */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-10 blur-2xl pointer-events-none"
                      style={{ backgroundColor: scoreColor(displayScore) }}
                    />

                    {/* SVG progress ring */}
                    <div className="relative z-10">
                      <svg width="96" height="96" viewBox="0 0 100 100" className="-rotate-90">
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-zinc-800 tracking-tighter leading-none">{displayScore}</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">/ 100</span>
                      </div>
                    </div>

                    {/* Score label + live delta */}
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: scoreColor(displayScore) }}
                      />
                      <span className="text-[13px] font-bold text-zinc-700">Resume Strength: {displayLabel}</span>
                      {scoreDelta > 0 && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          +{scoreDelta}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {insights.summary && (
                      <p className="mt-2 text-[11px] text-zinc-500 text-center leading-relaxed px-1">{insights.summary}</p>
                    )}

                    {/* Stats chips */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-full">
                        <span className="text-[10px] font-bold text-zinc-600">
                          {suggestionsWithLiveImpact.filter(s => !s.isApplied).length} suggestion{suggestionsWithLiveImpact.filter(s => !s.isApplied).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {liveRoadmap && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                          <span className="text-[10px] font-bold text-emerald-700">
                            Ceiling {liveRoadmap.truthfulCeiling}
                          </span>
                        </div>
                      )}
                      {appliedIds.size > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-700">
                            {appliedIds.size} applied
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Apply All button */}
                    {insights.suggestions.length > 0 && (
                      <button
                        onClick={handleApplyAllFixes}
                        disabled={isApplyingAll || suggestionsWithLiveImpact.every(s => s.isApplied)}
                        className="mt-4 w-full relative overflow-hidden flex items-center justify-center gap-2 py-2.5 text-white text-xs font-bold rounded-xl
                          hover:brightness-110 hover:shadow-lg hover:shadow-primary/20
                          active:scale-[0.98] active:brightness-95
                          transition-all duration-150
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                        style={{ background: 'linear-gradient(135deg, #026d32 0%, #19793c 100%)' }}
                      >
                        {isApplyingAll ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            Applying all fixes...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            Apply All Fixes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                )
              })()}

              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'fixes' | 'roadmap')}
                className="gap-4"
              >
                <TabsList
                  variant="default"
                  className="grid !h-auto w-full grid-cols-2 items-stretch overflow-hidden rounded-[1.75rem] bg-zinc-100 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                >
                  <TabsTrigger
                    value="fixes"
                    className="min-h-[3.75rem] rounded-[1.35rem] border-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 shadow-none data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    Fixes
                  </TabsTrigger>
                  <TabsTrigger
                    value="roadmap"
                    className="min-h-[3.75rem] rounded-[1.35rem] border-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 shadow-none data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    Road to 90
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fixes" className="mt-0">
                  {staleSuggestionCount > 0 && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                      {staleSuggestionCount} suggestion{staleSuggestionCount !== 1 ? 's are' : ' is'} no longer guaranteed to improve your score after your recent edits. Rescan to refresh.
                    </div>
                  )}

                  {suggestionsWithLiveImpact.length > 0 ? (
                    <div className="space-y-3">
                      {suggestionsWithLiveImpact.map((suggestion) => {
                        return (
                          <AIInsightCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            onApply={() => handleApplyWithAnimation(suggestion)}
                            onUndo={() => handleUndoFix(suggestion.id)}
                            isApplied={suggestion.isApplied}
                            label={TYPE_LABELS[suggestion.type] ?? suggestion.type}
                            colorClass={TYPE_COLORS[suggestion.type] ?? 'bg-zinc-50 text-zinc-700 border-zinc-200'}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-8">
                      {insights
                        ? insights.score >= 80
                          ? 'No suggestions — your resume looks good!'
                          : 'No direct AI rewrites are safe to auto-apply right now. Manual improvements are still needed.'
                        : 'No AI analysis yet.'}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="roadmap" className="mt-0">
                  {liveRoadmap ? (
                    <RoadToNinetyPanel roadmap={liveRoadmap} />
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-8">
                      Run AI Insights to build your Road to 90.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {!tailorDismissed && (
        <div className="relative p-6 bg-zinc-900 text-white rounded-t-[2rem] mt-auto">
          <button
            onClick={() => setTailorDismissed(true)}
            className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-90"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="text-primary-container" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tailor for Job</span>
          </div>
          <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
            Instantly adjust your resume keywords for a specific job description.
          </p>
          <button
            onClick={onStartTailoring}
            disabled={!resumeData || isLoading}
            className="w-full py-2.5 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Tailoring
          </button>
        </div>
      )}
    </div>
  )
}
