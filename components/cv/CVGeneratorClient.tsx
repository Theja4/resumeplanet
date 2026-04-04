'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { generateResumePdfBlobFromElement } from '@/lib/domPdf'
import { generateDOCX } from '@/lib/docxGenerator'
import {
  CV_SECTION_ORDER,
  CV_SIDEBAR_SECTION_ORDER,
  CV_TEMPLATE_CONFIG,
  sanitizeDocumentTitle,
} from '@/lib/cv/shared'
import type { GeneratedCVPayload } from '@/lib/cv/shared'
import type { Resume, ResumeData, TailorIntensity } from '@/types'

const PAGE_HEIGHT_PX = 1123

type ResumePickerItem = Pick<Resume, 'id' | 'title' | 'parsed_data'>
type SourceMode = 'saved' | 'upload'

const INTENSITY_OPTIONS: Array<{
  value: TailorIntensity
  label: string
  hint: string
}> = [
  {
    value: 'conservative',
    label: 'Conservative',
    hint: 'Light cleanup with minimal rewriting.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    hint: 'Sharper positioning without straying far from the source.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    hint: 'Heavier summary and bullet rewrites for stronger fit.',
  },
  {
    value: 'overboard',
    label: 'Overboard',
    hint: 'Maximum truthful reprioritization for the target role.',
  },
]

function buildDownloadName(sourceTitle: string) {
  return `${sanitizeDocumentTitle(sourceTitle) || 'generated-cv'}-cv`
}

export default function CVGeneratorClient({
  resumes,
}: {
  resumes: ResumePickerItem[]
}) {
  const availableResumes = useMemo(
    () => resumes.filter((resume): resume is ResumePickerItem & { parsed_data: ResumeData } => Boolean(resume.parsed_data)),
    [resumes],
  )

  const [sourceMode, setSourceMode] = useState<SourceMode>(availableResumes.length > 0 ? 'saved' : 'upload')
  const [selectedResumeId, setSelectedResumeId] = useState(availableResumes[0]?.id ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [intensity, setIntensity] = useState<TailorIntensity>('aggressive')
  const [result, setResult] = useState<GeneratedCVPayload | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadState, setDownloadState] = useState<'pdf' | 'docx' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const canGenerate =
    jobDescription.trim().length >= 80 &&
    (sourceMode === 'saved' ? Boolean(selectedResumeId) : Boolean(selectedFile))
  const selectedIntensity = INTENSITY_OPTIONS.find(option => option.value === intensity) ?? INTENSITY_OPTIONS[2]

  function resetGeneratedState(nextMode?: SourceMode) {
    setErrorMessage(null)
    setResult(null)
    if (nextMode) {
      setSourceMode(nextMode)
    }
  }

  async function handleGenerate() {
    if (!canGenerate) {
      setErrorMessage('Choose a resume source and add the full job description before generating.')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('jobDescription', jobDescription)
      formData.append('intensity', intensity)

      if (sourceMode === 'saved') {
        formData.append('resumeId', selectedResumeId)
      } else if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean
            data?: GeneratedCVPayload
            error?: string
          }
        | null

      if (!response.ok || !payload?.success || !payload.data) {
        if (payload?.error === 'CLAUDE_TIMEOUT') {
          setErrorMessage('The CV generation request took too long. Try again or drop the intensity one step.')
        } else if (payload?.error === 'PARSE_FAILED') {
          setErrorMessage('The model returned an invalid draft. Try again and keep the same job description.')
        } else if (payload?.error === 'OPENROUTER_PRIVACY_POLICY_BLOCK') {
          setErrorMessage('OpenRouter is blocking all allowed providers for this request. Keep DeepSeek v3.2 enabled or relax the privacy policy in your OpenRouter settings.')
        } else {
          setErrorMessage(payload?.error ?? 'We could not generate a CV for that role.')
        }
        return
      }

      setResult(payload.data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not generate a CV for that role.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownloadPDF() {
    if (!result || !previewRef.current) {
      return
    }

    setDownloadState('pdf')

    try {
      const contentHeight = Math.min(previewRef.current.scrollHeight, PAGE_HEIGHT_PX * 2)
      const blob = await generateResumePdfBlobFromElement(previewRef.current, {
        pageWidthPx: 794,
        pageHeightPx: PAGE_HEIGHT_PX,
        firstPageBreakPx: PAGE_HEIGHT_PX,
        secondPageTopOffsetPx: 0,
        contentHeightPx: contentHeight,
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${buildDownloadName(result.sourceTitle)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setDownloadState(null)
    }
  }

  async function handleDownloadDOCX() {
    if (!result) {
      return
    }

    setDownloadState('docx')

    try {
      await generateDOCX(
        result.generatedResumeData,
        `${buildDownloadName(result.sourceTitle)}.docx`,
        CV_TEMPLATE_CONFIG,
        CV_SECTION_ORDER,
        CV_SIDEBAR_SECTION_ORDER,
      )
    } finally {
      setDownloadState(null)
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        kicker="Resume Tools"
        title="Generate a targeted CV from a saved resume or fresh upload."
        description="Drop in a job description and Rezoomed will turn your source resume into a sharper, role-specific CV you can export as PDF or DOCX the moment the draft is ready."
        actions={
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {INTENSITY_OPTIONS.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIntensity(option.value)}
                  className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                    intensity === option.value
                      ? 'bg-[#008f44] text-white'
                      : 'border border-black/8 bg-white/90 text-on-surface-variant hover:bg-black/[0.03]'
                  }`}
                >
                  {index + 1}. {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} strokeWidth={2.4} />}
                {isGenerating ? 'Generating CV (1-2 min)' : 'Generate CV'}
              </button>
              <p className="text-xs text-on-surface-variant">{selectedIntensity.hint}</p>
            </div>
          </div>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.2rem] border border-black/6 bg-white/82 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">Source</p>
              <p className="mt-2 text-sm font-black text-on-background">Saved resume or upload</p>
            </div>
            <div className="rounded-[1.2rem] border border-black/6 bg-white/82 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">Engine</p>
              <p className="mt-2 text-sm font-black text-on-background">Role-specific CV rewrite</p>
            </div>
            <div className="rounded-[1.2rem] border border-black/6 bg-white/82 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">Exports</p>
              <p className="mt-2 text-sm font-black text-on-background">PDF and DOCX</p>
            </div>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <DashboardSurface variant="default" className="p-6">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetGeneratedState('saved')
                    setSelectedFile(null)
                    setSelectedResumeId(current => current || availableResumes[0]?.id || '')
                  }}
                  disabled={availableResumes.length === 0}
                  className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                    sourceMode === 'saved'
                      ? 'bg-[#008f44] text-white'
                      : 'border border-black/8 bg-white text-on-surface-variant hover:bg-black/[0.03]'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Use saved resume
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetGeneratedState('upload')
                    setSelectedResumeId('')
                  }}
                  className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                    sourceMode === 'upload'
                      ? 'bg-[#008f44] text-white'
                      : 'border border-black/8 bg-white text-on-surface-variant hover:bg-black/[0.03]'
                  }`}
                >
                  Upload resume
                </button>
              </div>

              {sourceMode === 'saved' ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                    Saved resume
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={event => {
                      setSelectedResumeId(event.target.value)
                      setResult(null)
                      setErrorMessage(null)
                    }}
                    className="w-full rounded-[1.3rem] border border-black/8 bg-white px-4 py-3.5 text-sm font-semibold text-on-background shadow-[0_16px_38px_rgba(25,28,29,0.04)] outline-none transition focus:border-[#008f44]/30"
                  >
                    {availableResumes.length === 0 ? (
                      <option value="">No parsed resumes available yet</option>
                    ) : null}
                    {availableResumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}
                      </option>
                    ))}
                  </select>
                  {availableResumes.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      Your library does not have a parsed resume yet, so use the upload flow for now.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                    Resume upload
                  </label>
                  <label className="flex cursor-pointer items-center justify-between rounded-[1.4rem] border border-dashed border-[#008f44]/24 bg-[#008f44]/[0.04] px-4 py-4 transition hover:bg-[#008f44]/[0.07]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#008f44] shadow-[0_14px_32px_rgba(2,109,50,0.08)]">
                        <Upload size={18} strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-on-background">
                          {selectedFile ? selectedFile.name : 'Choose a PDF or DOCX resume'}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Max 5MB. The file is parsed for this generation run only.
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#008f44]/16 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                      Browse
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      onChange={event => {
                        setSelectedFile(event.target.files?.[0] ?? null)
                        setResult(null)
                        setErrorMessage(null)
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="space-y-3">
                <label
                  htmlFor="cv-job-description"
                  className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70"
                >
                  Job description
                </label>
                <textarea
                  id="cv-job-description"
                  value={jobDescription}
                  onChange={event => {
                    setJobDescription(event.target.value)
                    setResult(null)
                    setErrorMessage(null)
                  }}
                  placeholder="Paste the full role description so the CV can be tuned to the actual responsibilities, requirements, and keywords."
                  rows={14}
                  className="min-h-[18rem] w-full rounded-[1.4rem] border border-black/8 bg-white px-4 py-4 text-sm leading-6 text-on-background shadow-[0_16px_38px_rgba(25,28,29,0.04)] outline-none transition focus:border-[#008f44]/30"
                />
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>A longer job description produces a much better CV.</span>
                  <span>{jobDescription.trim().length} chars</span>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DashboardSurface>

          <DashboardSurface variant="subtle" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                    How it works
                  </p>
                  <p className="mt-2 text-lg font-black text-on-background">Role-specific CV generation</p>
                </div>
                <div className="rounded-full border border-[#008f44]/18 bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                  Interview ready
                </div>
              </div>
              <div className="space-y-3 text-sm leading-7 text-on-surface-variant">
                <p>1. Pick a saved resume or upload one just for this run.</p>
                <p>2. Paste the exact job description.</p>
                <p>3. Rezoomed rewrites the CV around the role without inventing facts.</p>
                <p>4. Export the finished draft as PDF or editable DOCX.</p>
              </div>
            </div>
          </DashboardSurface>

          {result ? (
            <DashboardSurface variant="accent" className="p-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#026d32]/70">
                      CV brief
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                      {result.analysis.tailoredHeadline || 'Targeted CV generated'}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                      Match {result.analysis.matchScore}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                      {result.analysis.matchTier.replace('_', ' ')}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                      {result.analysis.shortlistingProbability.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-white/82 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                      Strategy
                    </p>
                    <p className="mt-2 text-sm leading-7 text-on-background">
                      {result.analysis.overallStrategy || 'The CV was reoriented toward the most important hiring signals in the role.'}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/82 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                      Honest read
                    </p>
                    <p className="mt-2 text-sm leading-7 text-on-background">
                      {result.analysis.honestAssessment || 'This draft stays truthful while pushing the strongest role-relevant evidence forward.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                      Matched keywords
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.analysis.matchedKeywords.slice(0, 10).map(item => (
                        <span
                          key={`${item.keyword}:${item.evidence}`}
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-on-background"
                        >
                          {item.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                      Missing or weaker signals
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.analysis.missingKeywords.slice(0, 8).map(item => (
                        <span
                          key={`${item.keyword}:${item.suggestion}`}
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-on-background"
                        >
                          {item.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSurface>
          ) : null}
        </div>

        <DashboardSurface variant="default" className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                Live CV preview
              </p>
              <p className="mt-2 text-lg font-black text-on-background">
                {result ? `${result.sourceTitle} tuned for the role` : 'Generate first to unlock preview'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!result || downloadState !== null}
                className="inline-flex items-center gap-2 rounded-full border border-[#008f44]/16 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#008f44] transition-all hover:-translate-y-0.5 hover:bg-[#008f44]/6 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloadState === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={2.4} />}
                PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadDOCX}
                disabled={!result || downloadState !== null}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloadState === 'docx' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} strokeWidth={2.4} />}
                DOCX
              </button>
            </div>
          </div>

          <div className="bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.18),transparent_30%),linear-gradient(180deg,#eef5f0_0%,#f7faf8_100%)] p-4 sm:p-6">
            {result ? (
              <div className="overflow-auto rounded-[1.5rem] border border-black/6 bg-white/68 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="mx-auto w-[794px] min-w-[794px]">
                  <div ref={previewRef} id="cv-generator-print-wrapper">
                    <UniversalTemplate
                      data={result.generatedResumeData}
                      isEditing={false}
                      onFieldChange={() => {}}
                      config={CV_TEMPLATE_CONFIG}
                      density={CV_TEMPLATE_CONFIG.density}
                      sectionOrder={CV_SECTION_ORDER}
                      sidebarSectionOrder={CV_SIDEBAR_SECTION_ORDER}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[820px] items-center justify-center rounded-[1.6rem] border border-dashed border-black/10 bg-white/70 px-6 text-center">
                <div className="max-w-md space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#008f44]/10 text-[#008f44]">
                    <CheckCircle2 size={28} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-on-background">
                      Your generated CV will appear here
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                      Once the draft is generated you can review the role-specific rewrite, then export it as PDF or DOCX immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {result ? (
            <div className="border-t border-black/5 px-6 py-4 text-sm text-on-surface-variant">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                  <ArrowUpRight size={12} strokeWidth={2.4} />
                  {result.changed ? 'Tailored draft ready' : 'Generated with light edits'}
                </span>
                <span>Sections touched: {result.touchedSections.length ? result.touchedSections.join(', ') : 'minimal changes'}</span>
                <span>Score delta: {result.scoreDelta >= 0 ? `+${result.scoreDelta}` : result.scoreDelta}</span>
              </div>
            </div>
          ) : null}
        </DashboardSurface>
      </div>
    </div>
  )
}
