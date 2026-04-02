'use client'

import { Lock, Sparkles, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Wand2 } from 'lucide-react'
import AIInsightCard from './AIInsightCard'
import type { ResumeData } from '@/types'

interface Suggestion {
  id: string
  type: 'action-verb' | 'metric' | 'keyword' | 'format' | 'section'
  title: string
  beforeText: string
  afterText: string
  sectionHint: 'experience' | 'summary' | 'skills' | 'education' | 'projects'
}

interface InsightsData {
  score: number
  scoreLabel: string
  summary: string
  suggestions: Suggestion[]
}

interface Props {
  resumeData: ResumeData | null
  onApplyFix: (suggestion: Suggestion) => void
  isApplyingFix: boolean
  resumeId: string
  isPro: boolean
}

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

function scoreColor(score: number) {
  if (score >= 80) return '#026d32'
  if (score >= 60) return '#ca8a04'
  return '#ef4444'
}

export default function AIInsightsPanel({
  resumeData,
  onApplyFix,
  isApplyingFix,
  resumeId,
  isPro,
}: Props) {
  // Pro-gated for free users — show upgrade CTA
  if (!isPro) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
            <Lock size={24} className="text-zinc-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800 mb-2">AI Insights</h3>
          <p className="text-xs text-zinc-500 leading-relaxed mb-2">
            Get detailed AI-powered resume analysis with actionable suggestions to beat the ATS.
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mt-2 mb-6">
            <Sparkles size={14} />
            Available with Pro
          </div>
          <Link
            href="/dashboard/pricing"
            className="w-full py-3 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Unlock size={16} />
            Upgrade to Pro
          </Link>
        </div>

        {/* Tailoring CTA */}
        <div className="p-6 bg-zinc-900 text-white rounded-t-[2rem] mt-auto">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="text-primary-container" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tailor for Job</span>
          </div>
          <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
            Instantly adjust your resume keywords for a specific job description.
          </p>
          <Link
            href="/dashboard/pricing"
            className="w-full py-2.5 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl inline-block text-center active:scale-95 transition-all"
          >
            Unlock with Pro
          </Link>
        </div>
      </div>
    )
  }

  // ── Pro users get the full AI insights panel ──────────────────────────────
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!resumeData) return

    setIsLoading(true)
    setError(null)
    setAppliedIds(new Set())

    async function loadInsights() {
      if (!resumeData) return
      try {
        const resumeText = buildResumeText(resumeData)
        const res = await fetch('/api/ats/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, resumeId }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to analyze')
        }

        const json = await res.json()
        if (json.success && json.data) {
          setInsights(json.data)
        } else {
          throw new Error(json.error || 'Failed to analyze')
        }
      } catch (e: any) {
        console.error('Insights error:', e)
        setError(e.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadInsights()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  async function handleApplyWithAnimation(suggestion: Suggestion) {
    // Mark as applied first — this triggers a smooth collapse via padding-top/padding-bottom/opacity → 0
    setAppliedIds(prev => new Set(prev).add(suggestion.id))

    // Wait for collapse animation to finish (400ms)
    await new Promise(resolve => setTimeout(resolve, 400))

    // Apply the fix to the resume
    await onApplyFix(suggestion)

    // Remove from insights
    setInsights((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
      }
    })
    setAppliedIds(new Set())
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">AI Insights</h2>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              Analyzing your resume against ATS<br />best practices...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">AI Insights</h2>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <span className="text-xl">!</span>
            </div>
            <p className="text-xs text-zinc-500 text-center leading-relaxed">{error}</p>
            <button
              onClick={() => { setError(null); window.location.reload() }}
              className="px-4 py-2 text-xs font-semibold bg-primary-container text-on-primary-container rounded-lg active:scale-95 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 overflow-y-auto flex-1">
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">AI Insights</h2>

          {/* Score Meter */}
          {insights && (
            <div className="relative flex flex-col items-center p-6 bg-surface-container-low rounded-3xl mb-6">
              <div className="w-24 h-24 rounded-full border-[6px] border-zinc-200 flex items-center justify-center relative">
                <div
                  className="absolute inset-[-6px] rounded-full border-[6px]"
                  style={{
                    borderColor: scoreColor(insights.score),
                    clipPath: `polygon(0 0, 100% 0, 100% ${(insights.score / 100) * 100}%, 0 ${(insights.score / 100) * 100}%)`,
                  }}
                />
                <span className="text-3xl font-black text-zinc-800 tracking-tighter">{insights.score}</span>
              </div>
              <span className="mt-4 text-[13px] font-bold text-zinc-700">Resume Strength: {insights.scoreLabel}</span>
              {insights.summary && (
                <p className="mt-1 text-[11px] text-zinc-500 text-center leading-tight">{insights.summary}</p>
              )}
            </div>
          )}

          {/* Suggestion Cards */}
          {insights?.suggestions && insights.suggestions.length > 0 ? (
            <div className="space-y-3 transition-all duration-300">
              {insights.suggestions.map((suggestion) => {
                const isApplied = appliedIds.has(suggestion.id)
                return (
                  <div
                    key={suggestion.id}
                    className={`transition-all duration-400 ease-in-out overflow-hidden ${
                      isApplied
                        ? 'max-h-0 opacity-0 mb-0'
                        : 'max-h-[600px] opacity-100'
                    }`}
                  >
                    <div className="py-3">
                      <AIInsightCard
                        suggestion={suggestion}
                        onApply={() => handleApplyWithAnimation(suggestion)}
                        isApplying={isApplyingFix}
                        label={TYPE_LABELS[suggestion.type] ?? suggestion.type}
                        colorClass={TYPE_COLORS[suggestion.type] ?? 'bg-zinc-50 text-zinc-700 border-zinc-200'}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-8">No suggestions — your resume looks good!</p>
          )}
        </div>
      </div>

      {/* Tailoring CTA */}
      <div className="p-6 bg-zinc-900 text-white rounded-t-[2rem] mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="text-primary-container" size={16} />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tailor for Job</span>
        </div>
        <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
          Instantly adjust your resume keywords for a specific job description.
        </p>
        <button className="w-full py-2.5 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl active:scale-95 transition-all">
          Start Tailoring
        </button>
      </div>
    </div>
  )
}

function buildResumeText(data: ResumeData): string {
  const parts: string[] = []
  if (data.name) parts.push(data.name)
  if (data.email) parts.push(data.email)
  if (data.phone) parts.push(data.phone)
  if (data.summary) parts.push(`Summary: ${data.summary}`)

  if (data.experience.length > 0) {
    parts.push('\nExperience:')
    for (const exp of data.experience) {
      parts.push(`${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`)
      for (const bullet of exp.bullets) {
        parts.push(`  - ${bullet}`)
      }
    }
  }

  if (data.education.length > 0) {
    parts.push('\nEducation:')
    for (const edu of data.education) {
      parts.push(`${edu.degree} in ${edu.field} at ${edu.institution} (${edu.graduationDate})`)
    }
  }

  if (data.skills.length > 0) {
    parts.push(`\nSkills: ${data.skills.join(', ')}`)
  }

  if (data.projects.length > 0) {
    parts.push('\nProjects:')
    for (const proj of data.projects) {
      parts.push(`${proj.name}: ${proj.description}`)
    }
  }

  return parts.join('\n')
}
