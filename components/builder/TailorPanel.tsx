'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from 'lucide-react'
import { countWords } from '@/lib/text'
import { canApplyTailorSection } from '@/lib/tailorResume'
import type { TailorAnalysis, TailorIntensity } from '@/types'

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  volunteer: 'Volunteer',
}

const INTENSITY_OPTIONS: Array<{
  value: TailorIntensity
  label: string
  hint: string
}> = [
  {
    value: 'conservative',
    label: 'Conservative',
    hint: 'Light phrasing cleanup with minimal rewriting.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    hint: 'Sharper positioning without drifting far from the source.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    hint: 'Heavier bullet and summary rewrites for stronger fit.',
  },
  {
    value: 'overboard',
    label: 'Overboard',
    hint: 'Maximum truthful JD alignment and reprioritization.',
  },
]

const TAILORING_ANIMATION_STEPS = [
  {
    label: 'Reading job signals',
    detail: 'Role keywords, seniority, and must-have requirements',
    Icon: Search,
  },
  {
    label: 'Mapping resume evidence',
    detail: 'Matching real experience against the target role',
    Icon: ListChecks,
  },
  {
    label: 'Rewriting high-impact bullets',
    detail: 'Sharpening language while keeping claims truthful',
    Icon: Wand2,
  },
  {
    label: 'Scoring final fit',
    detail: 'Checking coverage, gaps, and section priority',
    Icon: Target,
  },
]

const TAILORING_KEYWORDS = ['Impact', 'Ownership', 'Stack', 'Scale']
const TAILORING_ANIMATION_DURATION_MS = 90_000
const TAILORING_FAST_FINISH_MS = 2_000

type TailoringAnimationState = {
  visible: boolean
  startedAt: number
  finishStartedAt: number | null
}

function getIntensityIndex(intensity: TailorIntensity) {
  return Math.max(0, INTENSITY_OPTIONS.findIndex(option => option.value === intensity))
}

function getProbabilityTone(probability: TailorAnalysis['shortlistingProbability']) {
  switch (probability) {
    case 'VERY_HIGH':
      return 'bg-emerald-100 text-emerald-700'
    case 'HIGH':
      return 'bg-primary-container/45 text-on-primary-container'
    case 'MODERATE':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-red-100 text-red-700'
  }
}

function TailoringLiveAnimation({
  startedAt,
  finishStartedAt,
}: {
  startedAt: number
  finishStartedAt: number | null
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 120)

    return () => window.clearInterval(id)
  }, [])

  const runProgress = Math.min(1, Math.max(0, (now - startedAt) / TAILORING_ANIMATION_DURATION_MS))
  const finishStartProgress = finishStartedAt
    ? Math.min(1, Math.max(0, (finishStartedAt - startedAt) / TAILORING_ANIMATION_DURATION_MS))
    : runProgress
  const finishProgress = finishStartedAt
    ? Math.min(1, Math.max(0, (now - finishStartedAt) / TAILORING_FAST_FINISH_MS))
    : 0
  const progress = finishStartedAt
    ? Math.min(1, finishStartProgress + (1 - finishStartProgress) * finishProgress)
    : runProgress
  const activeStep = Math.min(
    TAILORING_ANIMATION_STEPS.length - 1,
    Math.floor(progress * TAILORING_ANIMATION_STEPS.length)
  )
  const active = TAILORING_ANIMATION_STEPS[activeStep]
  const ActiveIcon = active.Icon
  const progressWidth = `${Math.round(progress * 100)}%`

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-white p-4 text-slate-900 shadow-sm shadow-emerald-950/[0.04]">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              <Sparkles size={12} />
              Tailoring live
            </p>
            <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
              can take 2-3 min
            </p>
            <p className="mt-3 text-sm font-black tracking-tight text-slate-950">{active.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{active.detail}</p>
          </div>

          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-emerald-300/20" />
            <ActiveIcon size={18} className="relative text-emerald-700" />
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] items-center gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <FileText size={12} />
              Resume
            </div>
            <div className="space-y-2">
              {[68, 92, 58, 82].map((width, index) => (
                <span
                  key={`${width}-${index}`}
                  className={`block h-2 rounded-full transition-all duration-500 ${
                    index === activeStep % 4 ? 'animate-pulse bg-emerald-500/70' : 'bg-white'
                  }`}
                  style={{
                    width: `${width}%`,
                    animationDelay: `${index * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex h-24 items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-emerald-300/10 via-emerald-500/50 to-emerald-300/10" />
              <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 animate-ping rounded-full bg-emerald-500" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <Wand2 size={18} className="animate-pulse text-emerald-700" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <Zap size={12} />
              JD
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAILORING_KEYWORDS.map((keyword, index) => (
                <span
                  key={keyword}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    index === activeStep
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-500'
                  }`}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#026d32,#34d399,#a7f3d0)] transition-all duration-700 ease-out"
            style={{ width: progressWidth }}
          />
        </div>

        <div className="space-y-1.5">
          {TAILORING_ANIMATION_STEPS.map(({ label, Icon }, index) => {
            const done = index < activeStep
            const current = index === activeStep

            return (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-[0.85rem] px-3 py-2 transition-colors ${
                  current ? 'bg-emerald-50 text-emerald-800' : done ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                ) : current ? (
                  <Loader2 size={13} className="shrink-0 animate-spin text-emerald-600" />
                ) : (
                  <Icon size={13} className="shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{label}</span>
                {current && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface Props {
  analysis: TailorAnalysis | null
  isTailoring: boolean
  tailorError: string | null
  jobDescription: string
  intensity: TailorIntensity
  previewScoreDelta: number | null
  previewScore: number | null
  currentScore: number | null
  onJobDescriptionChange: (value: string) => void
  onIntensityChange: (value: TailorIntensity) => void
  onAnalyse: () => void
  onApplyAll: () => void
  onApplySection: (sectionId: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'volunteer') => void
}

export default function TailorPanel({
  analysis,
  isTailoring,
  tailorError,
  jobDescription,
  intensity,
  previewScoreDelta,
  previewScore,
  currentScore,
  onJobDescriptionChange,
  onIntensityChange,
  onAnalyse,
  onApplyAll,
  onApplySection,
}: Props) {
  const selectedIntensity = INTENSITY_OPTIONS[getIntensityIndex(intensity)]
  const panelScrollRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const tailoringAnimationRef = useRef<HTMLDivElement>(null)
  const jobWordCount = countWords(jobDescription)
  
  const [appliedSections, setAppliedSections] = useState<Set<string>>(new Set())
  const [prevAnalysis, setPrevAnalysis] = useState(analysis)
  const [showTailorResults, setShowTailorResults] = useState(() => Boolean(analysis))
  const [tailoringAnimation, setTailoringAnimation] = useState<TailoringAnimationState>({
    visible: false,
    startedAt: 0,
    finishStartedAt: null,
  })

  if (analysis !== prevAnalysis) {
    setPrevAnalysis(analysis)
    setAppliedSections(new Set())
  }

  const visibleAnalysis = showTailorResults ? analysis : null
  const isTailoringUiBusy = isTailoring || tailoringAnimation.visible

  const hasDirectTailorChanges = visibleAnalysis
    ? ['summary', 'skills', 'experience', 'projects', 'volunteer'].some(sectionId =>
        canApplyTailorSection(visibleAnalysis, sectionId as 'summary' | 'skills' | 'experience' | 'projects' | 'volunteer')
      )
    : false

  function handleApplyAll() {
    onApplyAll()
    if (visibleAnalysis) {
      const all = ['summary', 'skills', 'experience', 'projects', 'volunteer'].filter(s => canApplyTailorSection(visibleAnalysis, s as 'summary' | 'skills' | 'experience' | 'projects' | 'volunteer'))
      setAppliedSections(new Set(all))
    }
  }

  function handleApplySection(sectionId: string) {
    onApplySection(sectionId as 'summary' | 'skills' | 'experience' | 'projects' | 'volunteer')
    setAppliedSections(prev => new Set(prev).add(sectionId))
  }

  useEffect(() => {
    if (!isTailoring) return

    const id = window.setTimeout(() => {
      setShowTailorResults(false)
      setTailoringAnimation({
        visible: true,
        startedAt: Date.now(),
        finishStartedAt: null,
      })
    }, 0)

    return () => window.clearTimeout(id)
  }, [isTailoring])

  useEffect(() => {
    if (isTailoring || tailoringAnimation.visible) return

    const id = window.setTimeout(() => {
      setShowTailorResults(Boolean(analysis) && !tailorError)
    }, 0)

    return () => window.clearTimeout(id)
  }, [analysis, isTailoring, tailorError, tailoringAnimation.visible])

  useEffect(() => {
    if (isTailoring || !tailoringAnimation.visible) return

    if (!analysis || tailorError) {
      const id = window.setTimeout(() => {
        setShowTailorResults(false)
        setTailoringAnimation(prev => ({ ...prev, visible: false, finishStartedAt: null }))
      }, 0)

      return () => window.clearTimeout(id)
    }

    const elapsed = Date.now() - tailoringAnimation.startedAt
    if (elapsed >= TAILORING_ANIMATION_DURATION_MS) {
      const id = window.setTimeout(() => {
        setTailoringAnimation(prev => ({ ...prev, visible: false, finishStartedAt: null }))
        setShowTailorResults(true)
      }, 0)

      return () => window.clearTimeout(id)
    }

    if (tailoringAnimation.finishStartedAt === null) {
      const id = window.setTimeout(() => {
        setTailoringAnimation(prev => ({ ...prev, finishStartedAt: Date.now() }))
      }, 0)

      return () => window.clearTimeout(id)
    }
  }, [analysis, isTailoring, tailorError, tailoringAnimation.finishStartedAt, tailoringAnimation.startedAt, tailoringAnimation.visible])

  useEffect(() => {
    if (!tailoringAnimation.visible || tailoringAnimation.finishStartedAt === null) return

    const id = window.setTimeout(() => {
      setTailoringAnimation(prev => ({ ...prev, visible: false, finishStartedAt: null }))
      setShowTailorResults(Boolean(analysis) && !tailorError)
    }, TAILORING_FAST_FINISH_MS)

    return () => window.clearTimeout(id)
  }, [analysis, tailorError, tailoringAnimation.finishStartedAt, tailoringAnimation.visible])

  useEffect(() => {
    if (!visibleAnalysis || !panelScrollRef.current || !resultsRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const resultsTop = resultsRef.current?.offsetTop ?? 0
      panelScrollRef.current?.scrollTo({
        top: Math.max(0, resultsTop - 20),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [visibleAnalysis])

  useEffect(() => {
    if (!tailoringAnimation.visible || !panelScrollRef.current || !tailoringAnimationRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const animationTop = tailoringAnimationRef.current?.offsetTop ?? 0
      panelScrollRef.current?.scrollTo({
        top: Math.max(0, animationTop - 18),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [tailoringAnimation.visible])

  return (
    <div ref={panelScrollRef} className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_34%,#f8faf9_100%)] rezoomed-thin-scrollbar">
      <div className="border-b border-emerald-100/70 bg-white/85 px-5 py-5 shadow-sm shadow-emerald-950/[0.03]">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            Tailor Mode
          </span>
          <h2 className="text-lg font-black tracking-tight text-slate-950">Turn this resume into a closer fit.</h2>
          <p className="text-sm leading-6 text-slate-600">
            Paste the target job description, choose how hard to tailor, then apply the rewrite plan directly into the builder.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase size={15} className="text-primary" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Job description</p>
          </div>
          <textarea
            value={jobDescription}
            onChange={(event) => onJobDescriptionChange(event.target.value)}
            rows={9}
            placeholder="Paste the role, responsibilities, must-have skills, preferred experience, and any recruiter language here."
            className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbf9_100%)] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          />
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            Stronger results come from pasting the full JD, not just the title. Minimum 20 words.
          </div>
        </div>

        <div className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rewrite intensity</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{selectedIntensity.label}</p>
            </div>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              {getIntensityIndex(intensity) + 1}/4
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={INTENSITY_OPTIONS.length - 1}
            step={1}
            value={getIntensityIndex(intensity)}
            onChange={(event) => onIntensityChange(INTENSITY_OPTIONS[Number(event.target.value)]?.value ?? 'balanced')}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,rgba(209,250,229,0.95),rgba(15,118,60,0.9))]"
            style={{ accentColor: '#0f7a3d' }}
          />

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {INTENSITY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onIntensityChange(option.value)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  option.value === intensity
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-950/[0.04]'
                    : 'border-slate-200 bg-slate-50/70 text-slate-500 hover:border-emerald-100 hover:bg-white'
                }`}
              >
                <span className="block text-[11px] font-bold leading-tight tracking-[0.08em]">
                  {option.label}
                </span>
                <span className={`mt-1 block text-[10px] leading-4 ${
                  option.value === intensity ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {option.value === 'conservative'
                    ? 'Light touch'
                    : option.value === 'balanced'
                    ? 'Best default'
                    : option.value === 'aggressive'
                    ? 'Stronger push'
                    : 'Max fit'}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">{selectedIntensity.hint}</p>
        </div>

        <button
          onClick={onAnalyse}
          disabled={isTailoringUiBusy || jobWordCount < 20}
          aria-busy={isTailoringUiBusy}
          className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_38px_rgba(2,109,50,0.22)] transition-all disabled:cursor-not-allowed ${
            isTailoringUiBusy
              ? 'animate-pulse shadow-[0_0_0_6px_rgba(16,185,129,0.12),0_22px_42px_rgba(2,109,50,0.24)] ring-2 ring-emerald-300/35 disabled:opacity-100'
              : 'hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50'
          }`}
        >
          {isTailoringUiBusy ? (
            <>
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.2)_36%,transparent_72%)] animate-pulse" />
              <Loader2 size={16} className="relative animate-spin" />
              <span className="relative inline-flex items-center gap-1.5">
                Tailoring
                <span className="flex items-center gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.2s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.1s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white" />
                </span>
              </span>
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Tailor Resume
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>

        {tailoringAnimation.visible && (
          <div ref={tailoringAnimationRef}>
            <TailoringLiveAnimation
              startedAt={tailoringAnimation.startedAt}
              finishStartedAt={tailoringAnimation.finishStartedAt}
            />
          </div>
        )}

        {tailorError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {tailorError}
          </div>
        )}

        {jobWordCount > 0 && jobWordCount < 20 && !tailorError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Add at least {20 - jobWordCount} more words to run Tailor Mode.
          </div>
        )}

        {visibleAnalysis && (() => {
          const analysis = visibleAnalysis

          return (
          <div ref={resultsRef} className="space-y-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-emerald-100 bg-[linear-gradient(180deg,rgba(211,251,219,0.85),rgba(255,255,255,0.96))] p-4 shadow-sm shadow-emerald-950/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Match score</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{analysis.matchScore}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">{analysis.matchTier.replace('_', ' ')}</p>
              </div>
              <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Shortlisting odds</p>
                <div className="mt-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getProbabilityTone(analysis.shortlistingProbability)}`}>
                    {analysis.shortlistingProbability.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {previewScore !== null && currentScore !== null && previewScoreDelta !== null && (
              <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Estimated ATS impact</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {previewScoreDelta >= 0 ? '+' : ''}{previewScoreDelta}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-950">{currentScore} → {previewScore}</p>
                    <p className="text-xs font-medium text-slate-500">based on the builder scorer</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleApplyAll}
              disabled={!hasDirectTailorChanges || appliedSections.size >= 3}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_38px_rgba(2,109,50,0.22)] transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              <Sparkles size={16} />
              {appliedSections.size >= 3 ? 'Changes applied to builder' : 'Apply all tailored changes'}
            </button>

            <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
              <div className="mb-3 flex items-center gap-2">
                <Target size={15} className="text-primary" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Strategy</p>
              </div>
              <p className="text-sm leading-6 text-slate-800">{analysis.overallStrategy}</p>
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/55 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Honest assessment</p>
                </div>
                <p className="text-sm leading-6 text-slate-700">{analysis.honestAssessment}</p>
              </div>
            </div>

            <div className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Keyword map</p>

              {analysis.matchedKeywords.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Already covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.matchedKeywords.slice(0, 12).map(item => (
                      <span key={`${item.keyword}-${item.evidence}`} className="rounded-full border border-emerald-100 bg-primary-container/45 px-2.5 py-1 text-[11px] font-semibold text-on-primary-container">
                        {item.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.missingKeywords.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">Real gaps</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missingKeywords.slice(0, 12).map(item => (
                      <span key={`${item.keyword}-${item.suggestion}`} className="rounded-full border border-red-100 bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                        {item.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analysis.sectionFocus.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Section playbook</p>
                {analysis.sectionFocus.map(focus => {
                  const canApply = canApplyTailorSection(
                    analysis,
                    focus.sectionId as 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'volunteer'
                  )
                  const isApplied = appliedSections.has(focus.sectionId)

                  return (
                    <div key={`${focus.sectionId}-${focus.title}`} className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {SECTION_LABELS[focus.sectionId] ?? focus.sectionId}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-950">{focus.title}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                          focus.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : focus.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-primary-container/35 text-on-primary-container'
                        }`}>
                          {focus.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{focus.reason}</p>
                      {isApplied ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 border border-emerald-100">
                          <Check size={12} />
                          Applied
                        </div>
                      ) : canApply ? (
                        <button
                          onClick={() => handleApplySection(focus.sectionId)}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-900 transition hover:bg-emerald-50"
                        >
                          Apply section
                        </button>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Guidance only
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {analysis.bulletRewrites.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Highest-impact rewrites</p>
                {analysis.bulletRewrites.slice(0, 4).map((rewrite, index) => (
                  <div key={`${rewrite.companyOrProject}-${index}`} className="rounded-[22px] border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          {SECTION_LABELS[rewrite.sectionId] ?? rewrite.sectionId}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-950">{rewrite.companyOrProject}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                        rewrite.impact === 'high'
                          ? 'bg-red-100 text-red-700'
                          : rewrite.impact === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-primary-container/35 text-on-primary-container'
                      }`}>
                        {rewrite.impact}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/55 px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">After</p>
                      <p className="text-sm leading-6 text-slate-800">{rewrite.tailored}</p>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{rewrite.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          )
        })()}
      </div>
    </div>
  )
}
