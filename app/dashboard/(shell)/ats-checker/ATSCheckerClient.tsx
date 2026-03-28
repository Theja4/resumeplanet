'use client'

import { useState, useRef } from 'react'
import { isPro, getRemainingFreeScans } from '@/lib/planUtils'
import AdBanner from '@/components/shared/AdBanner'
import type { ATSResult, ATSScanTier, Profile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeOption {
  id: string
  title: string
  raw_text: string | null
}

interface ScanResponse extends ATSResult {
  scanTier: ATSScanTier
  scansRemaining: number | null
  scoreId: string
}

interface OptimiseResponse {
  optimisedText: string
  keywordsAdded: string[]
  improvementsCount: number
  changesSummary: string
}

interface ATSCheckerClientProps {
  resumes: ResumeOption[]
  profile: Profile | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColour(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-500'
}

function scoreRingColour(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#ca8a04'
  return '#ef4444'
}

function severityBadge(severity: 'high' | 'medium' | 'low') {
  const map = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  }
  return map[severity]
}

const ERROR_MESSAGES: Record<string, string> = {
  RESUME_TOO_SHORT: 'Resume text is too short (minimum 100 characters).',
  JOB_DESCRIPTION_TOO_SHORT: 'Job description is too short (minimum 50 characters).',
  FREE_LIMIT_REACHED: 'You have used all 3 free scans for today. Upgrade to Pro for unlimited scans.',
  CLAUDE_TIMEOUT: 'Analysis timed out. Please try again.',
  PARSE_FAILED: 'Failed to parse AI response. Please try again.',
  PRO_REQUIRED: 'Resume optimisation is a Pro feature. Upgrade to unlock it.',
  ATS_RESULT_REQUIRED: 'Please run an ATS scan first before optimising.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={scoreRingColour(score)}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x="64"
          y="64"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-bold"
          style={{ fontSize: 28, fill: scoreRingColour(score), fontWeight: 700 }}
        >
          {score}
        </text>
      </svg>
      <span className="text-sm text-gray-500 font-medium">ATS Score</span>
    </div>
  )
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-700">{value}</span>
    </div>
  )
}

// ─── Diff View ────────────────────────────────────────────────────────────────

function DiffView({ original, optimised }: { original: string; optimised: string }) {
  const origLines = original.split('\n')
  const optLines = optimised.split('\n')
  const maxLen = Math.max(origLines.length, optLines.length)

  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Original</p>
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-0.5 max-h-64 overflow-auto">
          {origLines.map((line, i) => (
            <div key={i} className={line !== (optLines[i] ?? '') ? 'text-red-700' : 'text-gray-600'}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Optimised</p>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 space-y-0.5 max-h-64 overflow-auto">
          {optLines.map((line, i) => (
            <div key={i} className={line !== (origLines[i] ?? '') ? 'text-green-700 font-medium' : 'text-gray-600'}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ATSCheckerClient({ resumes, profile }: ATSCheckerClientProps) {
  const pro = isPro(profile)
  const initialScansLeft = getRemainingFreeScans(profile)

  // Input state
  const [inputMode, setInputMode] = useState<'resume' | 'paste'>(resumes.length > 0 ? 'resume' : 'paste')
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? '')
  const [pastedText, setPastedText] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  // Scan state
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [scansLeft, setScansLeft] = useState(initialScansLeft)

  // Optimise state
  const [isOptimising, setIsOptimising] = useState(false)
  const [optimiseError, setOptimiseError] = useState<string | null>(null)
  const [optimiseResult, setOptimiseResult] = useState<OptimiseResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'optimised'>('results')

  const resultsRef = useRef<HTMLDivElement>(null)

  // ── Derived ──────────────────────────────────────────────────────────────────

  const getResumeText = (): string => {
    if (inputMode === 'paste') return pastedText
    const found = resumes.find(r => r.id === selectedResumeId)
    return found?.raw_text ?? ''
  }

  const canScan = !isScanning && (
    inputMode === 'paste' ? pastedText.trim().length >= 100 : !!selectedResumeId
  ) && (pro || scansLeft > 0)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleScan() {
    setScanError(null)
    setScanResult(null)
    setOptimiseResult(null)
    setIsScanning(true)

    const resumeText = getResumeText()
    const resumeId = inputMode === 'resume' ? selectedResumeId : undefined

    try {
      const res = await fetch('/api/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: jobDescription || undefined, resumeId }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        const key = json.error ?? 'INTERNAL_ERROR'
        setScanError(ERROR_MESSAGES[key] ?? key)
        return
      }

      setScanResult(json.data)
      if (!pro) setScansLeft(json.data.scansRemaining ?? 0)
      setActiveTab('results')
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {
      setScanError(ERROR_MESSAGES['INTERNAL_ERROR'])
    } finally {
      setIsScanning(false)
    }
  }

  async function handleOptimise() {
    if (!scanResult) return
    setOptimiseError(null)
    setIsOptimising(true)

    const resumeText = getResumeText()

    try {
      const res = await fetch('/api/ats/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription || undefined,
          atsResult: scanResult,
          scoreId: scanResult.scoreId,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        const key = json.error ?? 'INTERNAL_ERROR'
        setOptimiseError(ERROR_MESSAGES[key] ?? key)
        return
      }

      setOptimiseResult(json.data)
      setActiveTab('optimised')
    } catch {
      setOptimiseError(ERROR_MESSAGES['INTERNAL_ERROR'])
    } finally {
      setIsOptimising(false)
    }
  }

  function handleDownload() {
    if (!optimiseResult) return
    const blob = new Blob([optimiseResult.optimisedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimised-resume.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ATS Checker</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyse your resume against any job description.
          </p>
        </div>
        {!pro && (
          <div className="text-right">
            <span className="text-xs text-gray-500">Free scans today</span>
            <p className="text-lg font-bold text-indigo-600">{scansLeft} / 3</p>
          </div>
        )}
      </div>

      {/* Ad banner — free users only */}
      <AdBanner size="leaderboard" className="mx-auto" />

      {/* Input panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Resume</h2>

        {/* Input mode tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {resumes.length > 0 && (
            <button
              onClick={() => setInputMode('resume')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                inputMode === 'resume'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved Resume
            </button>
          )}
          <button
            onClick={() => setInputMode('paste')}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              inputMode === 'paste'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Paste Text
          </button>
        </div>

        {/* Resume selector or paste */}
        {inputMode === 'resume' && resumes.length > 0 ? (
          <select
            value={selectedResumeId}
            onChange={e => setSelectedResumeId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {resumes.map(r => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="Paste your resume text here (minimum 100 characters)…"
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        )}

        {/* Job description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description <span className="text-gray-400 font-normal">(optional but recommended)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the job posting here for a targeted analysis…"
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Free limit warning */}
        {!pro && scansLeft === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            You have used all 3 free scans for today. Scans reset every 24 hours.{' '}
            <a href="/dashboard/billing" className="font-semibold underline">
              Upgrade to Pro
            </a>{' '}
            for unlimited scans.
          </div>
        )}

        {scanError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {scanError}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!canScan}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          {isScanning ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analysing…
            </>
          ) : (
            'Run ATS Analysis'
          )}
        </button>

        {!pro && (
          <p className="text-center text-xs text-gray-400">
            Free plan: 3 scans/day with basic analysis.{' '}
            <a href="/dashboard/billing" className="text-indigo-600 hover:underline">
              Upgrade for advanced AI analysis + resume optimisation.
            </a>
          </p>
        )}
      </div>

      {/* Results panel */}
      {scanResult && (
        <div ref={resultsRef} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tab bar (only if optimised result exists) */}
          {optimiseResult && (
            <div className="flex border-b border-gray-200">
              {(['results', 'optimised'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'results' ? 'Analysis Results' : 'Optimised Resume'}
                </button>
              ))}
            </div>
          )}

          {/* Results tab */}
          {activeTab === 'results' && (
            <div className="p-6 space-y-6">
              {/* Score + tier badge */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={scanResult.score} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                        scanResult.scanTier === 'advanced'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {scanResult.scanTier === 'advanced' ? 'Advanced Analysis' : 'Basic Analysis'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{scanResult.summary}</p>
                  {!pro && scanResult.scansRemaining !== null && (
                    <p className="text-xs text-gray-400">{scanResult.scansRemaining} free scans remaining today.</p>
                  )}
                </div>
              </div>

              {/* Score breakdown — advanced only */}
              {scanResult.scoreBreakdown && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Score Breakdown</h3>
                  <BreakdownBar label="Keyword Match" value={scanResult.scoreBreakdown.keywordMatch} />
                  <BreakdownBar label="Formatting" value={scanResult.scoreBreakdown.formatting} />
                  <BreakdownBar label="Relevance" value={scanResult.scoreBreakdown.relevance} />
                  <BreakdownBar label="Completeness" value={scanResult.scoreBreakdown.completeness} />
                  <BreakdownBar label="Keyword Density" value={scanResult.scoreBreakdown.keywordDensity} />
                </div>
              )}

              {/* Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scanResult.missingKeywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.missingKeywords.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scanResult.presentKeywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Present Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.presentKeywords.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced keyword analysis */}
              {scanResult.keywordAnalysis && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-indigo-800">Keyword Analysis</h3>
                  {scanResult.keywordAnalysis.mustHave.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Must-Have (Critical)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.keywordAnalysis.mustHave.map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scanResult.keywordAnalysis.niceToHave.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-yellow-700 mb-1">Nice-to-Have</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.keywordAnalysis.niceToHave.map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scanResult.keywordAnalysis.overused.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Overused</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.keywordAnalysis.overused.map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formatting issues — advanced only */}
              {scanResult.formattingIssues && scanResult.formattingIssues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Formatting Issues</h3>
                  <ul className="space-y-1">
                    {scanResult.formattingIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Industry insight — advanced only */}
              {scanResult.industryInsight && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Industry Insight</p>
                  <p className="text-sm text-blue-800">{scanResult.industryInsight}</p>
                </div>
              )}

              {/* Suggestions */}
              {scanResult.suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Recommendations</h3>
                  <div className="space-y-3">
                    {scanResult.suggestions.map((s, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${severityBadge(s.severity)}`}
                          >
                            {s.severity}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">{s.category}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{s.issue}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-indigo-600">Fix:</span> {s.fix}
                        </p>
                        {s.example && (
                          <p className="text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1">
                            {s.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimiser CTA */}
              <div className="border-t border-gray-100 pt-5">
                {pro ? (
                  <div className="space-y-3">
                    {optimiseError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {optimiseError}
                      </div>
                    )}
                    <button
                      onClick={handleOptimise}
                      disabled={isOptimising}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isOptimising ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Optimising resume with AI…
                        </>
                      ) : (
                        '✦ Optimise Resume with AI'
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-400">
                      AI will rewrite your resume to incorporate missing keywords and fix issues.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-5 text-center space-y-3">
                    <p className="text-sm font-semibold text-indigo-900">
                      Unlock AI Resume Optimisation
                    </p>
                    <p className="text-xs text-indigo-700">
                      Pro users get their resume automatically rewritten to target missing keywords, fix formatting issues, and maximise ATS scores.
                    </p>
                    <a
                      href="/dashboard/billing"
                      className="inline-block px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Upgrade to Pro
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optimised tab */}
          {activeTab === 'optimised' && optimiseResult && (
            <div className="p-6 space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{optimiseResult.improvementsCount}</p>
                  <p className="text-xs text-green-600 mt-0.5">Improvements Made</p>
                </div>
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-700">{optimiseResult.keywordsAdded.length}</p>
                  <p className="text-xs text-indigo-600 mt-0.5">Keywords Added</p>
                </div>
              </div>

              {/* Changes summary */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">What Changed</p>
                <p className="text-sm text-gray-700">{optimiseResult.changesSummary}</p>
              </div>

              {/* Keywords added */}
              {optimiseResult.keywordsAdded.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Keywords Added</p>
                  <div className="flex flex-wrap gap-1.5">
                    {optimiseResult.keywordsAdded.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diff view */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Side-by-Side Comparison</p>
                <DiffView original={getResumeText()} optimised={optimiseResult.optimisedText} />
              </div>

              {/* Download */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Download Optimised Resume (.txt)
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Back to Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
