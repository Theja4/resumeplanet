'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { isPro, getRemainingFreeScans } from '@/lib/planUtils'
import AdBanner from '@/components/shared/AdBanner'
import type { ATSResult, ATSScanTier, Profile, ResumeData } from '@/types'
import {
  FileText,
  Briefcase,
  Upload,
  ArrowRight,
  Lightbulb,
  Sparkles,
  ChevronRight,
  X,
  FileUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeOption {
  id: string
  title: string
  raw_text: string | null
  parsed_data: ResumeData | null
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
  if (score >= 80) return '#026d32'
  if (score >= 60) return '#ca8a04'
  return '#ef4444'
}

function severityBadge(severity: 'high' | 'medium' | 'low') {
  const map = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-surface-container-high text-on-surface-variant',
  }
  return map[severity]
}

function resumeDataToText(data: ResumeData | null): string {
  if (!data) return ''

  const parts: string[] = [
    data.name,
    data.currentRole,
    data.summary,
    data.email,
    data.phone,
    data.location,
    data.linkedin,
    data.website,
  ]

  for (const item of data.experience) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of data.education) {
    parts.push(item.institution, item.degree, item.field, item.graduationDate, item.gpa)
  }

  parts.push(...data.skills)

  for (const item of data.projects) {
    parts.push(item.name, item.description, ...(item.technologies ?? []))
  }

  for (const item of data.certifications) {
    parts.push(item.name, item.issuer, item.date)
  }

  for (const item of data.volunteer) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of data.awards) {
    parts.push(item.title, item.issuer, item.date)
  }

  for (const item of data.publications) {
    parts.push(item.title, item.publisher, item.date)
  }

  parts.push(...data.languages, ...data.interests, ...data.references)

  for (const section of data.customSections ?? []) {
    parts.push(section.title)
    if (section.type === 'text') parts.push(section.text ?? '')
    if (section.type === 'tags') parts.push(...(section.tags ?? []))
    if (section.type === 'complex') {
      for (const item of section.items ?? []) {
        parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
        parts.push(...(item.bullets ?? []))
      }
    }
  }

  return parts.map(part => part?.trim()).filter(Boolean).join('\n')
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
  const color = scoreColour(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#becabc" strokeWidth="8" />
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x="64" y="64"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 28, fill: color, fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }}
        >
          {score}
        </text>
      </svg>
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">ATS Score</span>
    </div>
  )
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs text-on-surface-variant shrink-0">{label}</span>
      <div className="flex-1 bg-surface-container-high rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-bold text-on-surface">{value}</span>
    </div>
  )
}

// ─── Diff View ────────────────────────────────────────────────────────────────

function DiffView({ original, optimised }: { original: string; optimised: string }) {
  const origLines = original.split('\n')
  const optLines = optimised.split('\n')

  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Original</p>
        <div className="bg-red-50 rounded-xl p-3 space-y-0.5 max-h-64 overflow-auto">
          {origLines.map((line, i) => (
            <div key={i} className={line !== (optLines[i] ?? '') ? 'text-red-700' : 'text-on-surface-variant'}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Optimised</p>
        <div className="bg-primary-container/20 rounded-xl p-3 space-y-0.5 max-h-64 overflow-auto">
          {optLines.map((line, i) => (
            <div key={i} className={line !== (origLines[i] ?? '') ? 'text-on-primary-container font-medium' : 'text-on-surface-variant'}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────

interface UploadZoneProps {
  uploadedFile: { name: string; text: string } | null
  isExtracting: boolean
  extractError: string | null
  wordCount: number
  onFile: (file: File) => void
  onClear: () => void
}

function UploadZone({ uploadedFile, isExtracting, extractError, wordCount, onFile, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  if (uploadedFile) {
    return (
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between p-4 bg-primary-container/20 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-container/50 rounded-lg flex items-center justify-center shrink-0">
              <FileUp size={18} className="text-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{uploadedFile.name}</p>
              <p className="text-[10px] text-on-surface-variant">{wordCount} words extracted</p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="ml-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors shrink-0"
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs text-primary font-semibold hover:underline text-left px-1"
        >
          Upload a different file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
      <button
        type="button"
        onClick={() => !isExtracting && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={isExtracting}
        className={`flex-1 min-h-[280px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-primary bg-primary-container/15 scale-[1.01]'
            : 'border-outline-variant hover:border-primary/50 hover:bg-primary-container/5'
        } ${isExtracting ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
      >
        {isExtracting ? (
          <>
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm font-semibold text-on-surface-variant">Extracting text…</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-primary-container/30 rounded-2xl flex items-center justify-center">
              <Upload size={26} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-on-surface">Drop your resume here</p>
              <p className="text-xs text-on-surface-variant">or click to browse</p>
              <p className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mt-2">
                PDF · DOCX · Max 5 MB
              </p>
            </div>
          </>
        )}
      </button>
      {extractError && (
        <p className="mt-3 text-xs text-red-600 text-center">{extractError}</p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ATSCheckerClient({ resumes, profile }: ATSCheckerClientProps) {
  const pro = isPro(profile)
  const initialScansLeft = getRemainingFreeScans(profile)
  const searchParams = useSearchParams()

  const [inputMode, setInputMode] = useState<'resume' | 'upload'>(resumes.length > 0 ? 'resume' : 'upload')
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? '')
  const [linkedResumeId, setLinkedResumeId] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; text: string } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')

  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [scansLeft, setScansLeft] = useState(initialScansLeft)

  const [isOptimising, setIsOptimising] = useState(false)
  const [optimiseError, setOptimiseError] = useState<string | null>(null)
  const [optimiseResult, setOptimiseResult] = useState<OptimiseResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'optimised'>('results')

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const requestedResumeId = searchParams.get('resumeId')
    if (!requestedResumeId) return
    const matchedResume = resumes.find(r => r.id === requestedResumeId)
    if (!matchedResume) return

    setSelectedResumeId(requestedResumeId)
    setLinkedResumeId(requestedResumeId)
    setInputMode('resume')
  }, [searchParams, resumes])

  const getResumeText = (): string => {
    if (inputMode === 'upload') return uploadedFile?.text ?? ''
    const found = resumes.find(r => r.id === selectedResumeId)
    return found?.raw_text?.trim() || resumeDataToText(found?.parsed_data ?? null)
  }

  const wordCount = inputMode === 'upload'
    ? (uploadedFile?.text.trim().split(/\s+/).filter(Boolean).length ?? 0)
    : (getResumeText().trim().split(/\s+/).filter(Boolean).length ?? 0)

  const jobWordCount = jobDescription.trim().split(/\s+/).filter(Boolean).length

  const canScan = !isScanning && !isExtracting && (
    inputMode === 'upload' ? (uploadedFile?.text.trim().length ?? 0) >= 100 : !!selectedResumeId
  ) && (pro || scansLeft > 0)

  async function handleFileChange(file: File | null) {
    if (!file) return
    setExtractError(null)
    setUploadedFile(null)
    setIsExtracting(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/ats/extract-text', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json.success) {
        const msgs: Record<string, string> = {
          INVALID_FILE_TYPE: 'Only PDF and DOCX files are supported.',
          FILE_TOO_LARGE: 'File is too large (max 5 MB).',
          SCANNED_OR_EMPTY: 'Could not extract text — the file may be a scanned image or empty.',
          EXTRACTION_FAILED: 'Failed to read the file. Please try another.',
        }
        setExtractError(msgs[json.error] ?? 'Failed to read file.')
        return
      }
      setUploadedFile({ name: file.name, text: json.text })
    } catch {
      setExtractError('Failed to read file. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleScan() {
    setScanError(null)
    setScanResult(null)
    setOptimiseResult(null)
    setIsScanning(true)

    const resumeText = getResumeText()
    const resumeId = inputMode === 'resume' ? selectedResumeId : (linkedResumeId ?? undefined)


    try {
      const res = await fetch('/api/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: jobDescription || undefined, resumeId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setScanError(ERROR_MESSAGES[json.error ?? 'INTERNAL_ERROR'] ?? json.error)
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
        body: JSON.stringify({ resumeText, jobDescription: jobDescription || undefined, atsResult: scanResult, scoreId: scanResult.scoreId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setOptimiseError(ERROR_MESSAGES[json.error ?? 'INTERNAL_ERROR'] ?? json.error)
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        <div className="md:col-span-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3 leading-tight">
            Refine Your Professional Edge
          </h2>
          <p className="text-on-surface-variant text-base leading-relaxed max-w-2xl">
            Compare your experience against target roles with surgical precision. Our AI-driven ATS scanner identifies keyword gaps and semantic misalignment in seconds.
          </p>
        </div>

        <div className="flex justify-end pb-2">
          {pro ? (
            <div className="relative overflow-hidden bg-primary p-5 rounded-xl space-y-1.5 max-w-xs w-full shadow-lg shadow-primary/20">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Sparkles size={80} className="text-white" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">Pro Access</p>
              <p className="text-white font-bold leading-tight text-sm">AI-powered tailoring & unlimited scans active.</p>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-primary p-5 rounded-xl space-y-2 max-w-xs w-full shadow-lg shadow-primary/20">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Sparkles size={80} className="text-white" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">Free Plan</p>
              <p className="text-white font-bold leading-tight text-sm">{scansLeft} of 3 scans remaining today.</p>
              <a href="/dashboard/pricing" className="inline-flex items-center gap-1 text-xs text-primary-container font-semibold hover:underline">
                Upgrade for unlimited <ChevronRight size={12} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Ad banner — free users only */}
      {!pro && <AdBanner size="leaderboard" className="mx-auto" />}

      {/* ── Scanning Workspace ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Your Resume */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <FileText size={18} className="text-primary" strokeWidth={1.75} />
              <h3 className="text-base font-bold tracking-tight text-on-surface">Your Resume</h3>
            </div>
            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">
              Required
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm min-h-[480px] flex flex-col gap-5">
            {/* Mode toggle */}
            {resumes.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInputMode('resume')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                    inputMode === 'resume'
                      ? 'bg-primary-container/30 border-2 border-primary/30'
                      : 'bg-surface-container-low border-2 border-transparent hover:border-primary/20'
                  }`}
                >
                  <FileText
                    size={24}
                    className={`mb-1.5 ${inputMode === 'resume' ? 'text-primary' : 'text-on-surface-variant'}`}
                    strokeWidth={1.5}
                  />
                  <span className={`text-sm font-semibold ${inputMode === 'resume' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    Saved Resume
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">{resumes.length} available</span>
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                    inputMode === 'upload'
                      ? 'bg-primary-container/30 border-2 border-primary/30'
                      : 'border-2 border-dashed border-outline-variant hover:border-primary/40 hover:bg-primary-container/10'
                  }`}
                >
                  <Upload
                    size={24}
                    className={`mb-1.5 ${inputMode === 'upload' ? 'text-primary' : 'text-on-surface-variant'}`}
                    strokeWidth={1.5}
                  />
                  <span className={`text-sm font-semibold ${inputMode === 'upload' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    Upload File
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">PDF, DOCX</span>
                </button>
              </div>
            )}

            {/* Input area */}
            <div className="flex-1 relative flex flex-col">
              {inputMode === 'resume' && resumes.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedResumeId}
                    onChange={e => {
                      setSelectedResumeId(e.target.value)
                      setLinkedResumeId(e.target.value)
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                  {wordCount > 0 && (
                    <span className="text-[10px] font-bold text-on-surface-variant px-1">
                      Word count: {wordCount}
                    </span>
                  )}
                </div>
              ) : (
                <UploadZone
                  uploadedFile={uploadedFile}
                  isExtracting={isExtracting}
                  extractError={extractError}
                  wordCount={wordCount}
                  onFile={handleFileChange}
                  onClear={() => { setUploadedFile(null); setExtractError(null) }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <Briefcase size={18} className="text-primary" strokeWidth={1.75} />
              <h3 className="text-base font-bold tracking-tight text-on-surface">Job Description</h3>
            </div>
            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">
              Target Role
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm min-h-[480px] flex flex-col gap-5">
            {/* Pro tip */}
            <div className="flex items-start gap-3 p-3 bg-secondary-container/40 rounded-xl">
              <Lightbulb size={16} className="text-on-secondary-container mt-0.5 shrink-0" strokeWidth={1.75} />
              <p className="text-xs text-on-secondary-container leading-snug">
                Pro tip: Including the full requirements list increases keyword accuracy by 40%.
              </p>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job title and full description here…"
                className="w-full h-full min-h-[320px] p-4 bg-surface-container-low border-none rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-on-surface-variant/50 leading-relaxed"
              />
              <div className="absolute bottom-3 right-3">
                {jobWordCount > 0 && (
                  <span className="text-[10px] font-bold text-on-surface-variant bg-white/80 backdrop-blur px-2 py-1 rounded-md">
                    {jobWordCount} words
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {!pro && scansLeft === 0 && (
          <div className="rounded-xl bg-amber-50 px-5 py-3 text-sm text-amber-800 text-center">
            You have used all 3 free scans today. Scans reset every 24 hours.{' '}
            <a href="/dashboard/pricing" className="font-semibold underline">Upgrade to Pro</a> for unlimited scans.
          </div>
        )}

        {scanError && (
          <div className="rounded-xl bg-red-50 px-5 py-3 text-sm text-red-700 text-center">
            {scanError}
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={handleScan}
            disabled={!canScan}
            className="flex items-center gap-3 px-12 py-4 bg-primary-container text-on-primary-container rounded-xl font-bold text-base hover:shadow-xl hover:shadow-primary/10 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none group"
          >
            {isScanning ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analysing…
              </>
            ) : (
              <>
                <Sparkles size={18} strokeWidth={1.75} />
                Run Precision Scan
                <ArrowRight size={18} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {!pro && (
          <p className="text-center text-xs text-on-surface-variant">
            Free plan: 3 scans / day with basic analysis.{' '}
            <a href="/dashboard/pricing" className="text-primary font-semibold hover:underline">
              Upgrade for advanced AI analysis + resume optimisation.
            </a>
          </p>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {scanResult && (
        <div ref={resultsRef} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">

          {/* Tab bar */}
          {optimiseResult && (
            <div className="flex bg-surface-container-low">
              {(['results', 'optimised'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3.5 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-primary text-primary bg-surface-container-lowest'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab === 'results' ? 'Analysis Results' : 'Optimised Resume'}
                </button>
              ))}
            </div>
          )}

          {/* Results tab */}
          {activeTab === 'results' && (
            <div className="p-8 space-y-8">

              {/* Score + tier */}
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={scanResult.score} />
                <div className="flex-1 space-y-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                    scanResult.scanTier === 'advanced'
                      ? 'bg-primary-container/40 text-on-primary-container'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {scanResult.scanTier === 'advanced' ? 'Advanced Analysis' : 'Basic Analysis'}
                  </span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{scanResult.summary}</p>
                  {!pro && scanResult.scansRemaining !== null && (
                    <p className="text-xs text-on-surface-variant">{scanResult.scansRemaining} free scans remaining today.</p>
                  )}
                </div>
              </div>

              {/* Score breakdown */}
              {scanResult.scoreBreakdown && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Score Breakdown</h3>
                  <BreakdownBar label="Keyword Match" value={scanResult.scoreBreakdown.keywordMatch} />
                  <BreakdownBar label="Formatting" value={scanResult.scoreBreakdown.formatting} />
                  <BreakdownBar label="Relevance" value={scanResult.scoreBreakdown.relevance} />
                  <BreakdownBar label="Completeness" value={scanResult.scoreBreakdown.completeness} />
                  <BreakdownBar label="Keyword Density" value={scanResult.scoreBreakdown.keywordDensity} />
                </div>
              )}

              {/* Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {scanResult.missingKeywords.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.missingKeywords.map(kw => (
                        <span key={kw} className="px-2.5 py-1 rounded-md text-xs bg-red-100 text-red-700 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scanResult.presentKeywords.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Present Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.presentKeywords.map(kw => (
                        <span key={kw} className="px-2.5 py-1 rounded-md text-xs bg-primary-container/50 text-on-primary-container font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced keyword analysis */}
              {scanResult.keywordAnalysis && (
                <div className="bg-surface-container-low rounded-xl p-5 space-y-4">
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Keyword Analysis</h3>
                  {scanResult.keywordAnalysis.mustHave.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-red-700">Must-Have (Critical)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.keywordAnalysis.mustHave.map(kw => (
                          <span key={kw} className="px-2.5 py-1 rounded-md text-xs bg-red-100 text-red-700">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scanResult.keywordAnalysis.niceToHave.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-amber-700">Nice-to-Have</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.keywordAnalysis.niceToHave.map(kw => (
                          <span key={kw} className="px-2.5 py-1 rounded-md text-xs bg-amber-100 text-amber-700">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scanResult.keywordAnalysis.overused.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-on-surface-variant">Overused</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.keywordAnalysis.overused.map(kw => (
                          <span key={kw} className="px-2.5 py-1 rounded-md text-xs bg-surface-container-high text-on-surface-variant">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formatting issues */}
              {scanResult.formattingIssues && scanResult.formattingIssues.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Formatting Issues</h3>
                  <ul className="space-y-1.5">
                    {scanResult.formattingIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Industry insight */}
              {scanResult.industryInsight && (
                <div className="bg-primary-container/20 rounded-xl px-5 py-4">
                  <p className="text-[10px] font-bold text-on-primary-container uppercase tracking-widest mb-1.5">Industry Insight</p>
                  <p className="text-sm text-on-surface leading-relaxed">{scanResult.industryInsight}</p>
                </div>
              )}

              {/* Suggestions */}
              {scanResult.suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Recommendations</h3>
                  <div className="space-y-3">
                    {scanResult.suggestions.map((s, i) => (
                      <div key={i} className="bg-surface-container-low rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${severityBadge(s.severity)}`}>
                            {s.severity}
                          </span>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wide font-semibold">{s.category}</span>
                        </div>
                        <p className="text-sm font-semibold text-on-surface">{s.issue}</p>
                        <p className="text-sm text-on-surface-variant">
                          <span className="font-semibold text-primary">Fix: </span>{s.fix}
                        </p>
                        {s.example && (
                          <p className="text-xs text-on-surface-variant bg-surface-container-highest rounded-lg px-3 py-2 italic">
                            {s.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimiser CTA */}
              <div className="pt-2 border-t border-outline-variant/10">
                {pro ? (
                  <div className="space-y-3">
                    {optimiseError && (
                      <div className="rounded-xl bg-red-50 px-5 py-3 text-sm text-red-700">{optimiseError}</div>
                    )}
                    <button
                      onClick={handleOptimise}
                      disabled={isOptimising}
                      className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center justify-center gap-2.5 group"
                    >
                      {isOptimising ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Optimising with AI…
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} strokeWidth={2} />
                          Optimise Resume with AI
                          <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-on-surface-variant">
                      AI rewrites your resume to incorporate missing keywords and fix issues.
                    </p>
                  </div>
                ) : (
                  <div className="bg-primary p-6 rounded-xl text-center space-y-3">
                    <p className="text-sm font-bold text-white">Unlock AI Resume Optimisation</p>
                    <p className="text-xs text-primary-container leading-relaxed">
                      Pro users get their resume automatically rewritten to target missing keywords, fix formatting issues, and maximise ATS scores.
                    </p>
                    <a
                      href="/dashboard/pricing"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container text-sm font-bold rounded-lg hover:brightness-95 transition-all"
                    >
                      Upgrade to Pro <ArrowRight size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optimised tab */}
          {activeTab === 'optimised' && optimiseResult && (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-primary-container/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-on-primary-container">{optimiseResult.improvementsCount}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Improvements Made</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-primary">{optimiseResult.keywordsAdded.length}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Keywords Added</p>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl px-5 py-4">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">What Changed</p>
                <p className="text-sm text-on-surface leading-relaxed">{optimiseResult.changesSummary}</p>
              </div>

              {optimiseResult.keywordsAdded.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Keywords Added</p>
                  <div className="flex flex-wrap gap-1.5">
                    {optimiseResult.keywordsAdded.map(kw => (
                      <span key={kw} className="px-2.5 py-1 rounded-md text-xs bg-primary-container/50 text-on-primary-container font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-on-surface mb-3">Side-by-Side Comparison</p>
                <DiffView original={getResumeText()} optimised={optimiseResult.optimisedText} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold hover:brightness-95 transition-all"
                >
                  Download Optimised Resume (.txt)
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className="px-5 py-3 bg-surface-container-low text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors"
                >
                  Back to Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ambient background accents */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-10 left-80 w-48 h-48 bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
    </div>
  )
}
