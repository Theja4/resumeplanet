'use client'

import { useEffect, useRef } from 'react'
import { ArrowUpRight, Briefcase, Loader2, ShieldCheck, Sparkles, Target, Wand2 } from 'lucide-react'
import { countWords } from '@/lib/text'
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
  const jobWordCount = countWords(jobDescription)

  useEffect(() => {
    if (!analysis || !panelScrollRef.current || !resultsRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const resultsTop = resultsRef.current?.offsetTop ?? 0
      panelScrollRef.current?.scrollTo({
        top: Math.max(0, resultsTop - 20),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [analysis])

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
          disabled={isTailoring || jobWordCount < 20}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTailoring ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Tailoring… can take 1-2 min
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Tailor Resume
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>

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

        {analysis && (
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
              onClick={onApplyAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-105"
            >
              <Sparkles size={16} />
              Apply all tailored changes
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
                {analysis.sectionFocus.map(focus => (
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
                    <button
                      onClick={() => onApplySection(focus.sectionId)}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-900 transition hover:bg-surface-container-low"
                    >
                      Apply section
                    </button>
                  </div>
                ))}
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
        )}
      </div>
    </div>
  )
}
