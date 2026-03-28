'use client'

import { Loader2 } from 'lucide-react'
import type { TailorAnalysis } from '@/types'

const SECTION_LABELS: Record<string, string> = {
  contact: 'Contact Info',
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certificates',
  volunteer: 'Volunteer Work',
  languages: 'Languages',
  interests: 'Interests',
  awards: 'Awards',
  publications: 'Publications',
  references: 'References',
}

function scoreRingColor(score: number) {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

interface Props {
  analysis: TailorAnalysis | null
  isTailoring: boolean
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onAnalyse: () => void
  onApplySuggestion: (sectionId: string) => void
}

export default function TailorPanel({
  analysis,
  isTailoring,
  jobDescription,
  onJobDescriptionChange,
  onAnalyse,
  onApplySuggestion,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Tailor to a job</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Paste a job description and get AI-powered improvement hints.
        </p>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          rows={8}
          placeholder="Paste the job description here…"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
        <button
          onClick={onAnalyse}
          disabled={isTailoring || jobDescription.trim().length < 50}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {isTailoring ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analysing…
            </>
          ) : (
            'Analyse'
          )}
        </button>
      </div>

      {analysis && (
        <div className="px-4 pb-6 space-y-4">
          {/* Match score */}
          <div className="flex items-center gap-3">
            <div
              className="h-14 w-14 rounded-full border-4 flex items-center justify-center shrink-0"
              style={{ borderColor: scoreRingColor(analysis.matchScore) }}
            >
              <span
                className="text-lg font-bold"
                style={{ color: scoreRingColor(analysis.matchScore) }}
              >
                {analysis.matchScore}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Match Score</p>
              <p className="text-xs text-gray-500">
                {analysis.matchScore >= 70
                  ? 'Strong match'
                  : analysis.matchScore >= 40
                  ? 'Moderate match — some gaps'
                  : 'Weak match — significant gaps'}
              </p>
            </div>
          </div>

          {/* Missing keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Missing Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Suggestions
              </p>
              <div className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800 mb-1">
                      {SECTION_LABELS[s.sectionId] ?? s.sectionId}
                    </p>
                    <p className="text-xs text-amber-700 mb-2">{s.hint}</p>
                    <button
                      onClick={() => onApplySuggestion(s.sectionId)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      + Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
