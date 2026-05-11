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
    <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-400/18 bg-[#07120d] p-4 text-white shadow-[0_18px_44px_rgba(2,109,50,0.22)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74,222,128,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
              <Sparkles size={12} />
              Tailoring live
            </p>
            <p className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.065] px-2.5 py-1 text-[11px] font-semibold text-emerald-50/70">
              can take 2-3 min
            </p>
            <p className="mt-3 text-sm font-black tracking-tight text-white">{active.label}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-50/62">{active.detail}</p>
          </div>

          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
            <span className="absolute inset-0 rounded-2xl bg-emerald-300/12 animate-ping" />
            <ActiveIcon size={18} className="relative text-emerald-200" />
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] items-center gap-3">
          <div className="rounded-[1rem] border border-white/8 bg-white/[0.055] p-3">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/48">
              <FileText size={12} />
              Resume
            </div>
            <div className="space-y-2">
              {[68, 92, 58, 82].map((width, index) => (
                <span
                  key={`${width}-${index}`}
                  className={`block h-2 rounded-full transition-all duration-500 ${
                    index === activeStep % 4 ? 'animate-pulse bg-emerald-300/70' : 'bg-white/14'
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
              <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-emerald-300/15 via-emerald-200/70 to-emerald-300/15" />
              <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-200 shadow-[0_0_16px_rgba(110,231,183,0.75)] animate-ping" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/25 bg-[#092015] shadow-[0_0_24px_rgba(52,211,153,0.18)]">
                <Wand2 size={18} className="text-emerald-200 animate-pulse" />
              </span>
            </div>
          </div>

          <div className="rounded-[1rem] border border-white/8 bg-white/[0.055] p-3">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/48">
              <Zap size={12} />
              JD
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAILORING_KEYWORDS.map((keyword, index) => (
                <span
                  key={keyword}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    index === activeStep
                      ? 'bg-emerald-300 text-[#062014]'
                      : 'bg-white/10 text-white/58'
                  }`}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#a7f3d0,#fef3c7)] transition-all duration-700 ease-out"
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
                  current ? 'bg-emerald-300/12 text-emerald-100' : done ? 'text-emerald-200/72' : 'text-white/30'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-300" />
                ) : current ? (
                  <Loader2 size={13} className="shrink-0 animate-spin text-emerald-200" />
                ) : (
                  <Icon size={13} className="shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{label}</span>
                {current && <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />}
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
    <div ref={panelScrollRef} className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#f8fbf8_0%,#ffffff_28%)]">
      <div className="border-b border-black/6 px-5 py-5">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-primary-container/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-primary-container">
            Tailor Mode
          </span>
          <h2 className="text-lg font-black tracking-tight text-zinc-950">Turn this resume into a closer fit.</h2>
          <p className="text-sm leading-6 text-zinc-600">
            Paste the target job description, choose how hard to tailor, then apply the rewrite plan directly into the builder.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="rounded-[1.35rem] border border-black/6 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase size={15} className="text-primary" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Job description</p>
          </div>
          <textarea
            value={jobDescription}
            onChange={(event) => onJobDescriptionChange(event.target.value)}
            rows={9}
            placeholder="Paste the role, responsibilities, must-have skills, preferred experience, and any recruiter language here."
            className="min-h-[220px] w-full resize-y rounded-[1rem] border border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbf9_100%)] px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition focus:border-primary/25 focus:ring-2 focus:ring-primary/15 placeholder:text-zinc-400"
          />
          <div className="mt-3 text-[11px] font-medium text-zinc-500">
            Stronger results come from pasting the full JD, not just the title. Minimum 20 words.
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-black/6 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Rewrite intensity</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">{selectedIntensity.label}</p>
            </div>
            <span className="rounded-full bg-primary-container/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-primary-container">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,rgba(161,247,173,0.55),rgba(15,118,60,0.9))]"
            style={{ accentColor: '#0f7a3d' }}
          />

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {INTENSITY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onIntensityChange(option.value)}
                className={`rounded-[1rem] px-3 py-3 text-left transition ${
                  option.value === intensity
                    ? 'bg-primary-container/40 text-on-primary-container shadow-[inset_0_0_0_1px_rgba(15,118,60,0.08)]'
                    : 'bg-surface-container-low text-zinc-500 hover:bg-surface-container'
                }`}
              >
                <span className="block text-[11px] font-bold leading-tight tracking-[0.08em]">
                  {option.label}
                </span>
                <span className={`mt-1 block text-[10px] leading-4 ${
                  option.value === intensity ? 'text-on-primary-container/75' : 'text-zinc-400'
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

          <p className="mt-3 text-xs leading-5 text-zinc-500">{selectedIntensity.hint}</p>
        </div>

        <button
          onClick={onAnalyse}
          disabled={isTailoringUiBusy || jobWordCount < 20}
          aria-busy={isTailoringUiBusy}
          className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed ${
            isTailoringUiBusy
              ? 'animate-pulse shadow-[0_0_0_6px_rgba(16,185,129,0.12),0_22px_42px_rgba(2,109,50,0.24)] ring-2 ring-emerald-300/35 disabled:opacity-100'
              : 'hover:-translate-y-0.5 hover:bg-zinc-900 disabled:opacity-50'
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
          <div className="rounded-[1.1rem] bg-red-50 px-4 py-3 text-sm text-red-700">
            {tailorError}
          </div>
        )}

        {jobWordCount > 0 && jobWordCount < 20 && !tailorError && (
          <div className="rounded-[1.1rem] bg-red-50 px-4 py-3 text-sm text-red-700">
            Add at least {20 - jobWordCount} more words to run Tailor Mode.
          </div>
        )}

        {visibleAnalysis && (() => {
          const analysis = visibleAnalysis

          return (
          <div ref={resultsRef} className="space-y-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(211,251,219,0.85),rgba(241,250,243,0.94))] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Match score</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{analysis.matchScore}</p>
                <p className="mt-1 text-xs text-zinc-600">{analysis.matchTier.replace('_', ' ')}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/92 p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Shortlisting odds</p>
                <div className="mt-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getProbabilityTone(analysis.shortlistingProbability)}`}>
                    {analysis.shortlistingProbability.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {previewScore !== null && currentScore !== null && previewScoreDelta !== null && (
              <div className="rounded-[1.25rem] border border-black/6 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Estimated ATS impact</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                      {previewScoreDelta >= 0 ? '+' : ''}{previewScoreDelta}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-950">{currentScore} → {previewScore}</p>
                    <p className="text-xs text-zinc-500">based on the builder scorer</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleApplyAll}
              disabled={!hasDirectTailorChanges || appliedSections.size >= 3}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              <Sparkles size={16} />
              {appliedSections.size >= 3 ? 'Changes applied to builder' : 'Apply all tailored changes'}
            </button>

            <div className="rounded-[1.25rem] border border-black/6 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <div className="mb-3 flex items-center gap-2">
                <Target size={15} className="text-primary" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Strategy</p>
              </div>
              <p className="text-sm leading-6 text-zinc-800">{analysis.overallStrategy}</p>
              <div className="mt-3 rounded-[1rem] bg-surface-container-low px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Honest assessment</p>
                </div>
                <p className="text-sm leading-6 text-zinc-700">{analysis.honestAssessment}</p>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-black/6 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Keyword map</p>

              {analysis.matchedKeywords.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Already covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.matchedKeywords.slice(0, 12).map(item => (
                      <span key={`${item.keyword}-${item.evidence}`} className="rounded-full bg-primary-container/45 px-2.5 py-1 text-[11px] font-medium text-on-primary-container">
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
                      <span key={`${item.keyword}-${item.suggestion}`} className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-700">
                        {item.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analysis.sectionFocus.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Section playbook</p>
                {analysis.sectionFocus.map(focus => {
                  const canApply = canApplyTailorSection(
                    analysis,
                    focus.sectionId as 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'volunteer'
                  )
                  const isApplied = appliedSections.has(focus.sectionId)

                  return (
                    <div key={`${focus.sectionId}-${focus.title}`} className="rounded-[1.2rem] border border-black/6 bg-white/90 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                            {SECTION_LABELS[focus.sectionId] ?? focus.sectionId}
                          </p>
                          <p className="mt-1 text-sm font-bold text-zinc-950">{focus.title}</p>
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
                      <p className="mt-2 text-sm leading-6 text-zinc-700">{focus.reason}</p>
                      {isApplied ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 border border-emerald-100">
                          <Check size={12} />
                          Applied
                        </div>
                      ) : canApply ? (
                        <button
                          onClick={() => handleApplySection(focus.sectionId)}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-900 transition hover:bg-surface-container-low"
                        >
                          Apply section
                        </button>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
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
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Highest-impact rewrites</p>
                {analysis.bulletRewrites.slice(0, 4).map((rewrite, index) => (
                  <div key={`${rewrite.companyOrProject}-${index}`} className="rounded-[1.2rem] border border-black/6 bg-white/90 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          {SECTION_LABELS[rewrite.sectionId] ?? rewrite.sectionId}
                        </p>
                        <p className="mt-1 text-sm font-bold text-zinc-950">{rewrite.companyOrProject}</p>
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
                    <div className="mt-3 space-y-2 rounded-[1rem] bg-surface-container-low px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">After</p>
                      <p className="text-sm leading-6 text-zinc-800">{rewrite.tailored}</p>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-zinc-500">{rewrite.rationale}</p>
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
