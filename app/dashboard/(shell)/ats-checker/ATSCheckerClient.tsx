'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { isPro, getRemainingFreeScans } from '@/lib/planUtils'
import { createClient } from '@/lib/supabase/client'
import { Analytics } from '@/lib/analytics'
import AdBanner from '@/components/shared/AdBanner'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { DEFAULT_UNIVERSAL_CONFIG, DEFAULT_VISIBILITY, type ATSResult, type ATSScanTier, type Profile, type ResumeData, type UniversalConfig } from '@/types'
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
  CheckCircle2,
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
  resumeData: ResumeData
}

interface OptimiseResponse {
  optimisedText: string
  keywordsAdded: string[]
  improvementsCount: number
  changesSummary: string
  resumeData: ResumeData
}

interface ATSCheckerClientProps {
  resumes: ResumeOption[]
  profile: Profile | null
  publicMode?: boolean
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

const ATS_PREVIEW_CONFIG: UniversalConfig = {
  ...DEFAULT_UNIVERSAL_CONFIG,
  layout: 'single-column',
  headerStyle: 'banner',
  accentColor: '#0B7A3D',
  density: 'compressed',
  skillsStyle: 'inline',
  bulletStyle: 'plain',
}

const ATS_PREVIEW_SECTION_ORDER = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'certifications',
  'languages',
  'volunteer',
  'awards',
  'publications',
  'interests',
  'references',
]

const ATS_PREVIEW_PAGE_WIDTH = 794
const ATS_PREVIEW_PAGE_HEIGHT = 1123

function normalizeResumeTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.replace(/\.(pdf|docx)\s*$/i, '').trim() || 'Uploaded Resume'
}

function buildAtsBuilderHref(resumeId: string) {
  const params = new URLSearchParams({
    layout: ATS_PREVIEW_CONFIG.layout,
    header: ATS_PREVIEW_CONFIG.headerStyle,
    bullet: ATS_PREVIEW_CONFIG.bulletStyle,
    density: ATS_PREVIEW_CONFIG.density,
    accent: ATS_PREVIEW_CONFIG.accentColor,
    trimOverflow: '1',
    source: 'ats',
  })

  return `/dashboard/builder/${resumeId}?${params.toString()}`
}

function getScoreState(score: number) {
  if (score >= 85) {
    return {
      label: 'Excellent',
      toneClassName: 'bg-emerald-100 text-emerald-700',
    }
  }

  if (score >= 70) {
    return {
      label: 'Strong',
      toneClassName: 'bg-primary-container/45 text-on-primary-container',
    }
  }

  if (score >= 55) {
    return {
      label: 'Fair',
      toneClassName: 'bg-amber-100 text-amber-700',
    }
  }

  return {
    label: 'Needs work',
    toneClassName: 'bg-red-100 text-red-700',
  }
}

function getReviewSections(result: ScanResponse) {
  const counts = {
    summary: 0,
    skills: 0,
    experience: 0,
    education: 0,
    formatting: 0,
  }

  for (const suggestion of result.suggestions) {
    if (suggestion.category === 'summary') counts.summary += 1
    if (suggestion.category === 'skills' || suggestion.category === 'keywords') counts.skills += 1
    if (suggestion.category === 'experience') counts.experience += 1
    if (suggestion.category === 'education') counts.education += 1
    if (suggestion.category === 'formatting') counts.formatting += 1
  }

  counts.formatting += result.formattingIssues?.length ?? 0

  return [
    { key: 'summary', label: 'Professional Summary', count: counts.summary },
    { key: 'skills', label: 'Skills & Keywords', count: counts.skills },
    { key: 'experience', label: 'Work History', count: counts.experience },
    { key: 'education', label: 'Education', count: counts.education },
    { key: 'formatting', label: 'Formatting', count: counts.formatting },
  ]
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5">
      <span className="text-sm font-medium text-on-surface-variant">{label}</span>
      <span className="text-right text-xs font-bold text-on-surface">{value}</span>
      <div className="col-span-2 bg-surface-container-high rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
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

export default function ATSCheckerClient({ resumes, profile, publicMode = false }: ATSCheckerClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const pro = isPro(profile)
  const initialScansLeft = publicMode ? Number.POSITIVE_INFINITY : getRemainingFreeScans(profile)
  const searchParams = useSearchParams()

  const [inputMode, setInputMode] = useState<'resume' | 'upload'>(resumes.length > 0 ? 'resume' : 'upload')
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? '')
  const [uploadedFile, setUploadedFile] = useState<{ name: string; text: string } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')

  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [scansLeft, setScansLeft] = useState(initialScansLeft)
  const [scannedResumeId, setScannedResumeId] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState(0.72)
  const [isPreparingBuilder, setIsPreparingBuilder] = useState(false)
  const [customizeError, setCustomizeError] = useState<string | null>(null)
  const [optimisedResumeId, setOptimisedResumeId] = useState<string | null>(null)
  const [isOpeningOptimisedEditor, setIsOpeningOptimisedEditor] = useState(false)
  const [openOptimisedError, setOpenOptimisedError] = useState<string | null>(null)

  const [isOptimising, setIsOptimising] = useState(false)
  const [optimiseError, setOptimiseError] = useState<string | null>(null)
  const [optimiseResult, setOptimiseResult] = useState<OptimiseResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'optimised'>('results')
  const [previewViewportNode, setPreviewViewportNode] = useState<HTMLDivElement | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)
  const lastTrackedUpgradePromptScoreRef = useRef<number | null>(null)
  const previewViewportRef = useCallback((node: HTMLDivElement | null) => {
    setPreviewViewportNode(node)
  }, [])

  useEffect(() => {
    if (!(previewViewportNode instanceof HTMLDivElement)) return
    const observedNode = previewViewportNode

    function updatePreviewScale() {
      const availableWidth = observedNode.getBoundingClientRect().width
      if (!availableWidth) return

      const nextScale = Math.max(0.46, Math.min(0.92, (availableWidth - 24) / ATS_PREVIEW_PAGE_WIDTH))
      setPreviewScale(nextScale)
    }

    updatePreviewScale()
    const observer = new ResizeObserver(updatePreviewScale)
    observer.observe(observedNode)
    window.addEventListener('resize', updatePreviewScale)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePreviewScale)
    }
  }, [previewViewportNode])

  useEffect(() => {
    const requestedResumeId = searchParams.get('resumeId')
    if (!requestedResumeId) return
    const matchedResume = resumes.find(r => r.id === requestedResumeId)
    if (!matchedResume) return

    setSelectedResumeId(requestedResumeId)
    setInputMode('resume')
  }, [searchParams, resumes])

  useEffect(() => {
    if (!scanResult) return
    if (pro && !publicMode) return
    if (lastTrackedUpgradePromptScoreRef.current === scanResult.score) return

    lastTrackedUpgradePromptScoreRef.current = scanResult.score
    Analytics.atsScoreUpgradePromptShown({
      currentScore: scanResult.score,
      location: publicMode ? 'public_ats_results' : 'dashboard_ats_results',
    })
  }, [pro, publicMode, scanResult])

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
  ) && (publicMode || pro || scansLeft > 0)

  async function handleFileChange(file: File | null) {
    if (!file) return
    setExtractError(null)
    setUploadedFile(null)
    setIsExtracting(true)
    const extractionStartedAt = performance.now()
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
        Analytics.resumeParseFailed({
          error: json.error ?? 'EXTRACTION_FAILED',
        })
        setExtractError(msgs[json.error] ?? 'Failed to read file.')
        return
      }
      Analytics.resumeUploaded({
        fileSize: file.size,
        pageCount: Number(json.pageCount) || 1,
        fileType: file.type || 'application/octet-stream',
      })
      Analytics.resumeParseCompleted({
        sectionCount: Math.max(1, String(json.text ?? '').split(/\n{2,}/).filter(Boolean).length),
        durationMs: Math.round(performance.now() - extractionStartedAt),
      })
      setUploadedFile({ name: file.name, text: json.text })
    } catch {
      Analytics.resumeParseFailed({
        error: 'EXTRACTION_FAILED',
      })
      setExtractError('Failed to read file. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleScan() {
    setScanError(null)
    setCustomizeError(null)
    setOpenOptimisedError(null)
    setScanResult(null)
    setOptimiseResult(null)
    setOptimisedResumeId(null)
    setIsScanning(true)

    const resumeText = getResumeText()
    const resumeId = inputMode === 'resume' ? selectedResumeId : undefined

    Analytics.atsScoreRequested({
      tier: pro ? 'advanced' : 'basic',
    })

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
      Analytics.atsScoreViewed({
        tier: json.data.scanTier === 'advanced' ? 'advanced' : 'basic',
        score: json.data.score,
      })
      setScannedResumeId(resumeId ?? null)
      if (!pro && !publicMode) setScansLeft(json.data.scansRemaining ?? 0)
      setActiveTab('results')
      if (!publicMode) {
        // The scan updates shared dashboard data, so refresh router state and warm fresh payloads.
        router.refresh()
        void router.prefetch('/dashboard')
        void router.prefetch('/dashboard/resumes')
      }
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
    setOpenOptimisedError(null)
    setOptimisedResumeId(null)
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
          resumeData: scanResult.resumeData,
        }),
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

  function getSourceResumeTitle() {
    if (inputMode === 'resume') {
      return resumes.find(resume => resume.id === selectedResumeId)?.title ?? 'Optimised Resume'
    }

    return uploadedFile?.name ?? 'Optimised Resume'
  }

  function handleOptimiseCTA() {
    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }
    if (pro) {
      void handleOptimise()
      return
    }
    if (scanResult) {
      Analytics.atsScoreUpgradePromptClicked({
        currentScore: scanResult.score,
      })
    }
    router.push('/dashboard/pricing')
  }

  async function handleTemplateCustomize() {
    setCustomizeError(null)

    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }

    if (scannedResumeId) {
      router.push(buildAtsBuilderHref(scannedResumeId))
      return
    }

    if (!scanResult || !profile?.id) {
      setCustomizeError('Run a scan first before opening the builder.')
      return
    }

    setIsPreparingBuilder(true)

    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: profile.id,
          title: normalizeResumeTitle(uploadedFile?.name ?? 'Uploaded Resume'),
          raw_text: getResumeText(),
          parsed_data: scanResult.resumeData,
          ats_score: scanResult.score,
          builder_visibility: {
            ...DEFAULT_VISIBILITY,
            density: ATS_PREVIEW_CONFIG.density,
          },
          template_config: ATS_PREVIEW_CONFIG,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error || !data?.id) {
        throw error ?? new Error('Failed to prepare resume builder')
      }

      setScannedResumeId(data.id)
      router.push(buildAtsBuilderHref(data.id))
    } catch (error) {
      console.error('Failed to create ATS builder draft:', error)
      setCustomizeError('Could not open the builder for this upload. Please try again.')
    } finally {
      setIsPreparingBuilder(false)
    }
  }

  async function handleOpenOptimisedEditor() {
    setOpenOptimisedError(null)

    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }

    if (!optimiseResult || !profile?.id) {
      setOpenOptimisedError('Optimise the resume first before opening it in the editor.')
      return
    }

    if (optimisedResumeId) {
      router.push(buildAtsBuilderHref(optimisedResumeId))
      return
    }

    setIsOpeningOptimisedEditor(true)

    try {
      const baseTitle = normalizeResumeTitle(getSourceResumeTitle())
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: profile.id,
          title: `${baseTitle} Optimised`,
          raw_text: optimiseResult.optimisedText,
          parsed_data: optimiseResult.resumeData,
          ats_score: scanResult?.score ?? null,
          builder_visibility: {
            ...DEFAULT_VISIBILITY,
            density: ATS_PREVIEW_CONFIG.density,
          },
          template_config: ATS_PREVIEW_CONFIG,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error || !data?.id) {
        throw error ?? new Error('Failed to prepare optimised resume')
      }

      setOptimisedResumeId(data.id)
      router.push(buildAtsBuilderHref(data.id))
    } catch (error) {
      console.error('Failed to open optimised resume in editor:', error)
      setOpenOptimisedError('Could not open the optimised resume in the editor. Please try again.')
    } finally {
      setIsOpeningOptimisedEditor(false)
    }
  }

  const previewFrameHeight = Math.round(ATS_PREVIEW_PAGE_HEIGHT * previewScale) + 28
  const previewFrameWidth = Math.round(ATS_PREVIEW_PAGE_WIDTH * previewScale)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <DashboardPageIntro
        kicker={publicMode ? 'Free ATS Score' : 'ATS Diagnostics'}
        title={publicMode ? 'Scan your resume before you create an account.' : 'Refine your professional edge.'}
        description={
          publicMode
            ? 'Upload your resume, compare it against a target role, and get an instant ATS score for free. Create an account only when you want AI optimisation and builder editing.'
            : 'Compare your resume against target roles with the same calm, premium visual system across the rest of the app. The scanner highlights keyword gaps, semantic misses, and optimisation opportunities in one workspace.'
        }
        aside={
          publicMode ? (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Free Access</p>
              <p className="text-lg font-black leading-tight text-on-background">ATS scoring is open before signup.</p>
              <p className="text-sm leading-6 text-on-surface-variant">
                AI optimise and template editing unlock after you create your account.
              </p>
            </div>
          ) : pro ? (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Pro Access</p>
              <p className="text-lg font-black leading-tight text-on-background">Unlimited scans and advanced tailoring are active.</p>
              <p className="text-sm leading-6 text-on-surface-variant">
                Compare against every role without daily limits and unlock the deeper optimization flow.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Free Plan</p>
              <p className="text-lg font-black leading-tight text-on-background">{scansLeft} of 3 scans remaining today.</p>
              <a href="/dashboard/pricing" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Upgrade for unlimited <ChevronRight size={12} />
              </a>
            </div>
          )
        }
      />

      {/* Ad banner — free users only */}
      {!pro && !publicMode && <AdBanner size="leaderboard" className="mx-auto" />}

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

          <DashboardSurface variant="default" className="min-h-[480px] p-6 flex flex-col gap-5">
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
                  onClick={() => {
                    setInputMode('upload')
                  }}
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
          </DashboardSurface>
        </div>

        {/* Job Description */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <Briefcase size={18} className="text-primary" strokeWidth={1.75} />
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold tracking-tight text-on-surface">Job Description</h3>
                <span className="text-xs font-medium text-on-surface-variant">(optional)</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">
              Target Role
            </span>
          </div>

          <DashboardSurface variant="default" className="min-h-[480px] p-6 flex flex-col gap-5">
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
          </DashboardSurface>
        </div>
      </div>

      {/* ── Action Bar ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {!pro && !publicMode && scansLeft === 0 && (
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
            className="group flex items-center gap-3 rounded-full bg-zinc-950 px-12 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 hover:shadow-[0_24px_42px_rgba(24,24,27,0.18)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
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

        {!pro && !publicMode && (
          <p className="text-center text-xs text-on-surface-variant">
            Free plan: 3 scans / day with basic analysis.{' '}
            <a href="/dashboard/pricing" className="text-primary font-semibold hover:underline">
              Upgrade for advanced AI analysis + resume optimisation.
            </a>
          </p>
        )}

        {publicMode && (
          <p className="text-center text-xs text-on-surface-variant">
            Free ATS scoring is open here. Create an account when you want AI optimise and builder editing.
          </p>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {scanResult && (
        <div ref={resultsRef} className="space-y-5">
          {optimiseResult && (
            <div className="flex flex-wrap gap-2">
              {(['results', 'optimised'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-zinc-950 text-white shadow-[0_12px_28px_rgba(17,24,39,0.14)]'
                      : 'border border-black/8 bg-white/84 text-on-surface-variant hover:bg-white'
                  }`}
                >
                  {tab === 'results' ? 'Analysis Results' : 'AI Optimised'}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-5">
                <DashboardSurface variant="default" className="p-5 sm:p-6">
                  <div className="space-y-6">
                    <div className="space-y-5">
                      <h2 className="text-[1.75rem] font-black tracking-tight text-on-background">Your Resume Check Score</h2>
                      <div className="flex items-center gap-4">
                        <ScoreRing score={scanResult.score} />
                        <div className="space-y-2">
                          <p className="text-4xl font-black tracking-tight text-on-background">{getScoreState(scanResult.score).label}</p>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getScoreState(scanResult.score).toneClassName}`}>
                            Resume Strength
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          scanResult.scanTier === 'advanced'
                            ? 'bg-primary-container/40 text-on-primary-container'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {scanResult.scanTier === 'advanced' ? 'Advanced analysis' : 'Basic analysis'}
                        </span>
                        <p className="text-sm leading-6 text-on-surface-variant">{scanResult.summary}</p>
                        {!pro && scanResult.scansRemaining !== null && (
                          <p className="text-xs text-on-surface-variant">{scanResult.scansRemaining} free scans remaining today.</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-black/6 pt-5">
                      <p className="text-lg font-bold tracking-tight text-on-background">Review what to fix.</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        Start with the highest-count areas to move the score fastest.
                      </p>
                      <div className="mt-4 space-y-2.5">
                        {getReviewSections(scanResult).map(section => (
                          <div
                            key={section.key}
                            className={`flex items-center justify-between rounded-[1.1rem] px-4 py-3 ${
                              section.count > 0
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {section.count > 0 ? (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-700">
                                  !
                                </span>
                              ) : (
                                <CheckCircle2 size={18} className="text-emerald-600" />
                              )}
                              <span className="text-sm font-semibold">{section.label}</span>
                            </div>
                            {section.count > 0 ? (
                              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white">
                                {section.count}
                              </span>
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-[0.16em]">Good</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DashboardSurface>

                {scanResult.scoreBreakdown && (
                  <DashboardSurface variant="subtle" className="p-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Score breakdown</p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">Where the score comes from.</h3>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label="Keyword Match" value={scanResult.scoreBreakdown.keywordMatch} />
                        <BreakdownBar label="Formatting" value={scanResult.scoreBreakdown.formatting} />
                        <BreakdownBar label="Relevance" value={scanResult.scoreBreakdown.relevance} />
                        <BreakdownBar label="Completeness" value={scanResult.scoreBreakdown.completeness} />
                        <BreakdownBar label="Keyword Density" value={scanResult.scoreBreakdown.keywordDensity} />
                      </div>
                    </div>
                  </DashboardSurface>
                )}

                <DashboardSurface variant="subtle" className="p-5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Keyword insights</p>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">Coverage across the role.</h3>
                    </div>

                    {scanResult.missingKeywords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">Missing keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.missingKeywords.map(keyword => (
                            <span key={keyword} className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.presentKeywords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Present keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.presentKeywords.map(keyword => (
                            <span key={keyword} className="rounded-md bg-primary-container/45 px-2.5 py-1 text-xs font-medium text-on-primary-container">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.keywordAnalysis?.mustHave?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">Must-have</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.keywordAnalysis.mustHave.map(keyword => (
                            <span key={keyword} className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {scanResult.keywordAnalysis?.niceToHave?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Nice-to-have</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.keywordAnalysis.niceToHave.map(keyword => (
                            <span key={keyword} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </DashboardSurface>
              </div>

              <div className="space-y-5">
                <DashboardSurface variant="default" className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-on-background">Universal template preview</p>
                      <p className="text-xs text-on-surface-variant">Banner header selected with Rezoomed green accent. Only the first page is shown here.</p>
                    </div>
                    <span className="rounded-full bg-primary-container/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-primary-container">
                      Page 1 · Banner · Green
                    </span>
                  </div>

                  <div
                    ref={previewViewportRef}
                    className="overflow-hidden bg-[linear-gradient(180deg,#eef4ef_0%,#f7f8f5_100%)] px-2 py-3 sm:px-3 sm:py-4"
                    style={{ height: previewFrameHeight }}
                  >
                    <div className="mx-auto overflow-hidden rounded-[1.6rem] border border-black/8 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.12)]" style={{ width: previewFrameWidth, height: Math.round(ATS_PREVIEW_PAGE_HEIGHT * previewScale) }}>
                      <div
                        className="origin-top-left"
                        style={{
                          width: `${ATS_PREVIEW_PAGE_WIDTH}px`,
                          transform: `scale(${previewScale})`,
                          pointerEvents: 'none',
                        }}
                      >
                        <UniversalTemplate
                          data={scanResult.resumeData}
                          isEditing={false}
                          config={ATS_PREVIEW_CONFIG}
                          sectionOrder={ATS_PREVIEW_SECTION_ORDER}
                          sidebarSectionOrder={[]}
                        />
                      </div>
                    </div>
                  </div>
                </DashboardSurface>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleOptimiseCTA}
                    disabled={isPreparingBuilder || (pro && isOptimising)}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {pro && isOptimising ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        AI Optimising… can take 1-2 min
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} strokeWidth={2} />
                        AI Optimise
                        <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => { void handleTemplateCustomize() }}
                    disabled={isPreparingBuilder}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-6 py-3.5 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isPreparingBuilder ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Opening builder…
                      </>
                    ) : (
                      <>
                        Customize this template
                        <ArrowRight size={16} strokeWidth={2} />
                      </>
                    )}
                  </button>
                </div>

                {(optimiseError || customizeError) && (
                  <div className="rounded-[1.2rem] bg-red-50 px-5 py-3 text-sm text-red-700">
                    {optimiseError ?? customizeError}
                  </div>
                )}

                {scanResult.suggestions.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Suggestions</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-on-background">What to fix next.</h3>
                    </div>
                    <div className="space-y-4">
                      {scanResult.suggestions.map((suggestion, index) => (
                        <DashboardSurface key={index} variant="subtle" className="p-5">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${severityBadge(suggestion.severity)}`}>
                                {suggestion.severity}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                {suggestion.category}
                              </span>
                            </div>
                            <p className="text-lg font-bold tracking-tight text-on-background">{suggestion.issue}</p>
                            <p className="text-sm leading-7 text-on-surface-variant">
                              <span className="font-semibold text-primary">Fix: </span>{suggestion.fix}
                            </p>
                            {suggestion.example && (
                              <div className="rounded-[1rem] bg-white px-4 py-3 text-sm italic leading-6 text-on-surface-variant shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
                                {suggestion.example}
                              </div>
                            )}
                          </div>
                        </DashboardSurface>
                      ))}
                    </div>
                  </div>
                )}

                {(scanResult.formattingIssues?.length || scanResult.industryInsight) && (
                  <DashboardSurface variant="subtle" className="p-5">
                    <div className="space-y-4">
                      {scanResult.formattingIssues && scanResult.formattingIssues.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Formatting issues</p>
                          <ul className="space-y-2">
                            {scanResult.formattingIssues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-2.5 text-sm leading-6 text-on-surface-variant">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scanResult.industryInsight && (
                        <div className="rounded-[1.2rem] bg-primary-container/25 px-4 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-primary-container">Industry insight</p>
                          <p className="mt-2 text-sm leading-7 text-on-surface">{scanResult.industryInsight}</p>
                        </div>
                      )}
                    </div>
                  </DashboardSurface>
                )}
              </div>
            </div>
          )}

          {activeTab === 'optimised' && optimiseResult && (
            <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-5">
                <DashboardSurface variant="default" className="p-5 sm:p-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Optimisation summary</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-on-background">What improved.</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[1.2rem] bg-primary-container/30 p-4 text-center">
                        <p className="text-3xl font-black tracking-tight text-on-primary-container">{optimiseResult.improvementsCount}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Improvements made</p>
                      </div>
                      <div className="rounded-[1.2rem] bg-surface-container-low p-4 text-center">
                        <p className="text-3xl font-black tracking-tight text-primary">{optimiseResult.keywordsAdded.length}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Keywords added</p>
                      </div>
                    </div>

                    <div className="rounded-[1.2rem] bg-surface-container-low px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">What changed</p>
                      <p className="mt-2 text-sm leading-7 text-on-surface">{optimiseResult.changesSummary}</p>
                    </div>
                  </div>
                </DashboardSurface>

                {optimiseResult.keywordsAdded.length > 0 && (
                  <DashboardSurface variant="subtle" className="p-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Keywords added</p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">Included where the resume supported them.</h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {optimiseResult.keywordsAdded.map(kw => (
                          <span key={kw} className="rounded-md bg-primary-container/50 px-2.5 py-1 text-xs font-medium text-on-primary-container">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </DashboardSurface>
                )}
              </div>

              <div className="space-y-5">
                <DashboardSurface variant="subtle" className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-on-background">Optimised resume preview</p>
                      <p className="text-xs text-on-surface-variant">Rendered in the same universal template with banner header and Rezoomed green accent.</p>
                    </div>
                    <span className="rounded-full bg-primary-container/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-primary-container">
                      Page 1 · Banner · Green
                    </span>
                  </div>

                  <div
                    ref={previewViewportRef}
                    className="overflow-hidden bg-[linear-gradient(180deg,#eef4ef_0%,#f7f8f5_100%)] px-2 py-3 sm:px-3 sm:py-4"
                    style={{ height: previewFrameHeight }}
                  >
                    <div className="mx-auto overflow-hidden rounded-[1.6rem] border border-black/8 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.12)]" style={{ width: previewFrameWidth, height: Math.round(ATS_PREVIEW_PAGE_HEIGHT * previewScale) }}>
                      <div
                        className="origin-top-left"
                        style={{
                          width: `${ATS_PREVIEW_PAGE_WIDTH}px`,
                          transform: `scale(${previewScale})`,
                          pointerEvents: 'none',
                        }}
                      >
                        <UniversalTemplate
                          data={optimiseResult.resumeData}
                          isEditing={false}
                          config={ATS_PREVIEW_CONFIG}
                          sectionOrder={ATS_PREVIEW_SECTION_ORDER}
                          sidebarSectionOrder={[]}
                        />
                      </div>
                    </div>
                  </div>
                </DashboardSurface>

                <div className="flex gap-3">
                  <button
                    onClick={() => { void handleOpenOptimisedEditor() }}
                    disabled={isOpeningOptimisedEditor}
                    className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold hover:brightness-95 transition-all disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isOpeningOptimisedEditor ? 'Opening editor…' : 'Open in editor'}
                  </button>
                  <button
                    onClick={() => setActiveTab('results')}
                    className="px-5 py-3 bg-surface-container-low text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors"
                  >
                    Back to Analysis
                  </button>
                </div>

                {openOptimisedError && (
                  <div className="rounded-[1.2rem] bg-red-50 px-5 py-3 text-sm text-red-700">
                    {openOptimisedError}
                  </div>
                )}
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
