'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Wand2,
  ChevronDown,
} from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL_SPACED } from '@/lib/uploadLimits'
import type { MetadataAuditResult, MetadataField, MetadataFieldStatus } from '@/app/api/resume/metadata-audit/route'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResumeOption {
  id: string
  title: string
}

interface MetadataEnhancerClientProps {
  resumes: ResumeOption[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusConfig(status: MetadataFieldStatus) {
  if (status === 'good') {
    return {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/70',
      chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: 'Good',
    }
  }
  if (status === 'weak') {
    return {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-200/70',
      chip: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'Weak',
    }
  }
  return {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200/70',
    chip: 'bg-red-100 text-red-700 border-red-200',
    label: 'Critical',
  }
}

function sanitizePdfFilename(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldCard({
  field,
  isFixed,
  onFix,
  showFixButton,
}: {
  field: MetadataField
  isFixed: boolean
  onFix: (fieldId: string) => void
  showFixButton: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const displayStatus: MetadataFieldStatus = isFixed ? 'good' : field.status
  const cfg = statusConfig(displayStatus)
  const Icon = cfg.icon

  return (
    <div className={`rounded-[1.25rem] border p-5 transition-all duration-300 ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={18} className={`mt-0.5 shrink-0 ${cfg.color}`} strokeWidth={2} />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-on-background">{field.label}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${cfg.chip}`}>
                {isFixed ? 'Fixed' : cfg.label}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate max-w-xs">
              {isFixed
                ? field.suggestedValue || '(set)'
                : field.currentValue || '(not set)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isFixed && field.status !== 'good' && showFixButton && (
            <button
              onClick={() => onFix(field.id)}
              className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 hover:-translate-y-0.5"
            >
              Fix Issue
            </button>
          )}
          {field.status !== 'good' && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-black/5"
              aria-label="Toggle explanation"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {expanded && !isFixed && field.status !== 'good' && (
        <div className="mt-4 space-y-3 border-t border-black/6 pt-4">
          <p className="text-sm leading-6 text-on-surface-variant">{field.explanation}</p>
          {field.suggestedValue && (
            <div className="rounded-[0.75rem] bg-white/80 px-4 py-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                Suggested value
              </p>
              <p className="text-sm font-medium text-on-background">{field.suggestedValue}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MagicLoadingCard() {
  return (
    <DashboardSurface variant="accent" className="overflow-hidden px-6 py-6 sm:px-7">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_28%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#026d32]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#30c06b]" />
              Rezoomed AI at work
            </div>
            <h3 className="text-xl font-black tracking-tight text-on-background">
              Rezoomed AI is doing its magic...
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
              Reading the resume text, checking hidden PDF metadata fields, and generating ATS-safe recommendations.
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-on-surface-variant/80">
              This can take 1-2 min
            </p>
          </div>

          <div className="grid w-full max-w-sm gap-3 sm:w-[20rem]">
            {[
              'Extracting resume text',
              'Auditing metadata fields',
              'Generating suggested values',
            ].map((label, index) => (
              <div
                key={label}
                className="rounded-[1rem] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(18,24,21,0.04)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-on-background">{label}</span>
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-[#30c06b]"
                    style={{
                      animation: `metadata-loading-pulse 1.4s ease-in-out ${index * 0.18}s infinite`,
                    }}
                  />
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#026d32,#30c06b,#A3FFB3)]"
                    style={{
                      width: '62%',
                      animation: `metadata-loading-bar 1.6s ease-in-out ${index * 0.14}s infinite`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardSurface>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MetadataEnhancerClient({ resumes }: MetadataEnhancerClientProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'resume'>('upload')
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? '')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [auditResult, setAuditResult] = useState<MetadataAuditResult | null>(null)
  const [fixedFields, setFixedFields] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      setAuditError('Only PDF files are supported.')
      return
    }
    if (file.size > MAX_RESUME_UPLOAD_BYTES) {
      setAuditError(`File must be under ${MAX_RESUME_UPLOAD_LABEL_SPACED}.`)
      return
    }
    setUploadedFile(file)
    setAuditError(null)
    setAuditResult(null)
    setFixedFields(new Set())
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Audit ────────────────────────────────────────────────────────────────────

  async function runAudit() {
    setAuditError(null)
    setAuditResult(null)
    setFixedFields(new Set())
    setIsAuditing(true)

    try {
      const fd = new FormData()

      if (inputMode === 'upload') {
        if (!uploadedFile) {
          setAuditError('Please upload a PDF first.')
          setIsAuditing(false)
          return
        }
        fd.append('file', uploadedFile)
      } else {
        if (!selectedResumeId) {
          setAuditError('Please select a resume.')
          setIsAuditing(false)
          return
        }
        fd.append('resumeId', selectedResumeId)
      }

      const res = await fetch('/api/resume/metadata-audit', { method: 'POST', body: fd })
      const data = await res.json()

      if (!data.success) {
        setAuditError(
          data.error === 'INSUFFICIENT_RESUME_TEXT'
            ? 'We could not extract enough text from this PDF. Try a different file.'
            : data.error === 'AUDIT_TIMEOUT'
              ? 'Metadata audit timed out. Please try again in a moment.'
              : data.error === 'LLM_NOT_CONFIGURED'
                ? 'Metadata audit is not configured on the server right now.'
                : data.error === 'LLM_PROVIDER_ERROR'
                  ? 'The metadata audit provider failed. Please try again.'
                  : 'Audit failed. Please try again.'
        )
        return
      }

      setAuditResult(data)
    } catch {
      setAuditError('Network error. Please try again.')
    } finally {
      setIsAuditing(false)
    }
  }

  // ── Fix logic ─────────────────────────────────────────────────────────────────

  function fixField(fieldId: string) {
    setFixedFields(prev => new Set([...prev, fieldId]))
  }

  function fixAll() {
    if (!auditResult) return
    const issueIds = auditResult.fields
      .filter(f => f.status !== 'good')
      .map(f => f.id)
    setFixedFields(new Set(issueIds))
  }

  const issueFields = auditResult?.fields.filter(f => f.status !== 'good') ?? []
  const allFixed = issueFields.length > 0 && issueFields.every(f => fixedFields.has(f.id))
  const anyFixed = fixedFields.size > 0

  // ── Download ─────────────────────────────────────────────────────────────────

  async function handleDownload() {
    if (!auditResult || !uploadedFile) return
    setDownloadError(null)
    setIsDownloading(true)

    try {
      const fixes: Record<string, string> = {}
      for (const field of auditResult.fields) {
        const shouldApply = fixedFields.has(field.id) || field.status === 'good'
        if (shouldApply && field.suggestedValue) {
          fixes[field.id] = field.suggestedValue
        }
      }

      const fd = new FormData()
      fd.append('file', uploadedFile)
      fd.append('fixes', JSON.stringify(fixes))

      const res = await fetch('/api/resume/metadata-patch', { method: 'POST', body: fd })

      if (!res.ok) {
        setDownloadError('Download failed. Please try again.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const titleField = auditResult.fields.find(field => field.id === 'title')
      const preferredTitle =
        titleField && (fixedFields.has('title') || titleField.status === 'good')
          ? titleField.suggestedValue || titleField.currentValue
          : null
      const safeTitle = preferredTitle ? sanitizePdfFilename(preferredTitle) : ''
      const fallbackBaseName = uploadedFile.name.replace(/\.pdf$/i, '')
      const baseName = safeTitle || fallbackBaseName
      a.href = url
      a.download = `${baseName}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Network error during download.')
    } finally {
      setIsDownloading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const canAudit = inputMode === 'upload' ? !!uploadedFile : !!selectedResumeId
  const canDownload = auditResult?.sourceMode === 'upload' && !!uploadedFile && anyFixed

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DashboardPageIntro
        kicker="Pro · Metadata Enhancer"
        title="Optimize your resume's hidden metadata."
        description="ATS systems read more than your resume text — they parse embedded PDF metadata fields. Surface hidden issues and fix them in one click."
      />

      {/* Input Section */}
      <DashboardSurface variant="default" className="p-6 sm:p-8">
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            {(['upload', 'resume'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setInputMode(mode)
                  setAuditResult(null)
                  setAuditError(null)
                  setFixedFields(new Set())
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  inputMode === mode
                    ? 'bg-zinc-950 text-white'
                    : 'bg-black/5 text-on-surface-variant hover:bg-black/10'
                }`}
              >
                {mode === 'upload' ? 'Upload PDF' : 'Saved Resume'}
              </button>
            ))}
          </div>

          {/* Upload Zone */}
          {inputMode === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed px-8 py-12 text-center transition-all ${
                isDragging
                  ? 'border-primary bg-primary-container/20'
                  : uploadedFile
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-outline-variant/40 hover:border-primary/40 hover:bg-primary-container/8'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {uploadedFile ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={22} className="text-emerald-500" strokeWidth={2} />
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-background">{uploadedFile.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {(uploadedFile.size / 1024).toFixed(0)} KB · Click to replace
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mb-3 text-on-surface-variant/50" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-on-surface">Drop your resume PDF here</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    or click to browse · PDF only · max {MAX_RESUME_UPLOAD_LABEL_SPACED}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Saved Resume Selector */}
          {inputMode === 'resume' && (
            <div className="space-y-2">
              {resumes.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  No saved resumes found. Build one in the Resume Builder first.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {resumes.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedResumeId(r.id)
                        setAuditResult(null)
                        setFixedFields(new Set())
                      }}
                      className={`flex items-center gap-3 rounded-[1rem] border px-4 py-3 text-left transition-all ${
                        selectedResumeId === r.id
                          ? 'border-primary/30 bg-primary-container/30 font-semibold text-on-primary-container'
                          : 'border-outline-variant/30 bg-white/60 text-on-surface hover:border-primary/20 hover:bg-white/80'
                      }`}
                    >
                      <FileText size={16} strokeWidth={1.75} className="shrink-0" />
                      <span className="truncate text-sm">{r.title || 'Untitled Resume'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {auditError && (
            <p className="rounded-[0.75rem] bg-red-50 px-4 py-3 text-sm text-red-600">{auditError}</p>
          )}

          <button
            onClick={runAudit}
            disabled={!canAudit || isAuditing}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {isAuditing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing metadata…
              </>
            ) : (
              <>
                <Sparkles size={16} strokeWidth={2} />
                Run Metadata Audit
              </>
            )}
          </button>
        </div>
      </DashboardSurface>

      {isAuditing && <MagicLoadingCard />}

      {/* Results */}
      {auditResult && (
        <div className="space-y-4">
          {/* Fix All Banner */}
          {issueFields.length > 0 && !allFixed && (
            <DashboardSurface variant="accent" className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-on-background">
                    {issueFields.length} metadata {issueFields.length === 1 ? 'issue' : 'issues'} found
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Apply all suggested fixes in one click.
                  </p>
                </div>
                <button
                  onClick={fixAll}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-800"
                >
                  <Wand2 size={15} strokeWidth={2} />
                  Fix All
                </button>
              </div>
            </DashboardSurface>
          )}

          {allFixed && (
            <DashboardSurface variant="accent" className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-on-background">All issues fixed!</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {auditResult.sourceMode === 'upload'
                        ? 'Download your optimized PDF below.'
                        : 'These optimized values will improve ATS parseability when you export your resume.'}
                    </p>
                  </div>
                </div>
                {canDownload && (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Download size={15} strokeWidth={2} />
                    )}
                    Download Optimized PDF
                  </button>
                )}
              </div>
              {downloadError && (
                <p className="mt-3 text-xs text-red-500">{downloadError}</p>
              )}
              {auditResult.sourceMode === 'saved' && (
                <p className="mt-3 text-xs text-on-surface-variant">
                  To download a PDF with these metadata fields applied, export your resume from the
                  Resume Builder and re-upload it here.
                </p>
              )}
            </DashboardSurface>
          )}

          {/* Field Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {auditResult.fields.map(field => (
              <FieldCard
                key={field.id}
                field={field}
                isFixed={fixedFields.has(field.id)}
                onFix={fixField}
                showFixButton={issueFields.length > 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
