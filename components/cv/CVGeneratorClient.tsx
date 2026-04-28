'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { generateResumePdfBlobFromElement } from '@/lib/domPdf'
import { generateCoverLetterDOCX } from '@/lib/cv/docx'
import {
  buildCoverLetterDownloadName,
  formatCoverLetterContact,
  formatCoverLetterDate,
  sanitizeDocumentTitle,
  type GeneratedCoverLetterPayload,
} from '@/lib/cv/shared'
import { getCoverLetterDraftKey, readSessionDraft, writeSessionDraft } from '@/lib/sessionDrafts'
import { MAX_RESUME_UPLOAD_LABEL } from '@/lib/uploadLimits'
import { buildResumeTitleLabelMap, getResumeTitleLabel } from '@/lib/resumeTitleLabels'
import type { Resume, ResumeData, TailorIntensity } from '@/types'

const PAGE_HEIGHT_PX = 1123

type ResumePickerItem = Pick<Resume, 'id' | 'title' | 'parsed_data'>
type SourceMode = 'saved' | 'upload'

interface CoverLetterSessionDraft {
  sourceMode: SourceMode
  selectedResumeId: string
  jobDescription: string
  intensity: TailorIntensity
  result: GeneratedCoverLetterPayload | null
  errorMessage: string | null
}

const INTENSITY_OPTIONS: Array<{
  value: TailorIntensity
  label: string
  hint: string
}> = [
  {
    value: 'conservative',
    label: 'Conservative',
    hint: 'Formal and polished with restrained persuasion.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    hint: 'Tailored and confident without sounding overworked.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    hint: 'Sharper positioning and stronger persuasion for the role.',
  },
  {
    value: 'overboard',
    label: 'Overboard',
    hint: 'Maximum truthful persuasion while staying professional.',
  },
]

function CoverLetterPreview({
  result,
}: {
  result: GeneratedCoverLetterPayload
}) {
  const contactLine = formatCoverLetterContact(result.sender)

  return (
    <div className="rounded-[1.5rem] border border-black/6 bg-white/92 p-16 shadow-[0_22px_60px_rgba(25,28,29,0.08)]">
      <div className="space-y-8 text-[15px] leading-8 text-[#1a221d]">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[#10251d]">
            {result.sender.name || 'Your Name'}
          </h1>
          {result.sender.currentRole ? (
            <p className="text-base font-semibold text-[#008f44]">{result.sender.currentRole}</p>
          ) : null}
          {contactLine ? (
            <p className="text-sm font-medium text-[#5e6962]">{contactLine}</p>
          ) : null}
        </div>

        <div className="space-y-1 text-[15px] leading-8">
          <p>{formatCoverLetterDate()}</p>
          {result.coverLetter.companyName ? <p>{result.coverLetter.companyName}</p> : null}
          {result.coverLetter.roleTitle ? <p>{result.coverLetter.roleTitle}</p> : null}
        </div>

        {result.coverLetter.suggestedSubject ? (
          <div className="rounded-2xl border border-[#008f44]/14 bg-[#008f44]/[0.04] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#008f44]">Subject</p>
            <p className="mt-2 text-sm font-semibold text-[#173126]">{result.coverLetter.suggestedSubject}</p>
          </div>
        ) : null}

        <div className="space-y-6">
          <p>{result.coverLetter.greeting}</p>
          <p>{result.coverLetter.openingParagraph}</p>
          {result.coverLetter.bodyParagraphs.map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
          ))}
          <p>{result.coverLetter.closingParagraph}</p>
          <div className="space-y-2 pt-2">
            <p>{result.coverLetter.signOff}</p>
            <p className="font-semibold">{result.sender.name || 'Your Name'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CVGeneratorClient({
  resumes,
}: {
  resumes: ResumePickerItem[]
}) {
  const draftKey = getCoverLetterDraftKey('dashboard')
  const availableResumes = useMemo(
    () =>
      resumes.filter(
        (resume): resume is ResumePickerItem & { parsed_data: ResumeData } => Boolean(resume.parsed_data)
      ),
    [resumes],
  )
  const resumeTitleLabels = useMemo(() => buildResumeTitleLabelMap(availableResumes), [availableResumes])

  const [sourceMode, setSourceMode] = useState<SourceMode>(availableResumes.length > 0 ? 'saved' : 'upload')
  const [selectedResumeId, setSelectedResumeId] = useState(availableResumes[0]?.id ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [intensity, setIntensity] = useState<TailorIntensity>('aggressive')
  const [result, setResult] = useState<GeneratedCoverLetterPayload | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadState, setDownloadState] = useState<'pdf' | 'docx' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  const canGenerate =
    jobDescription.trim().length >= 80 &&
    (sourceMode === 'saved' ? Boolean(selectedResumeId) : Boolean(selectedFile))
  const selectedIntensity = INTENSITY_OPTIONS.find(option => option.value === intensity) ?? INTENSITY_OPTIONS[2]

  useEffect(() => {
    const draft = readSessionDraft<CoverLetterSessionDraft>(draftKey)

    if (draft) {
      setSourceMode(draft.sourceMode)
      setSelectedResumeId(draft.selectedResumeId)
      setJobDescription(draft.jobDescription)
      setIntensity(draft.intensity)
      setResult(draft.result)
      setErrorMessage(draft.errorMessage)
    }

    setHasRestoredDraft(true)
  }, [draftKey])

  useEffect(() => {
    if (sourceMode !== 'saved') {
      return
    }

    if (!selectedResumeId && availableResumes[0]?.id) {
      setSelectedResumeId(availableResumes[0].id)
      return
    }

    if (selectedResumeId && !availableResumes.some(resume => resume.id === selectedResumeId)) {
      setSelectedResumeId(availableResumes[0]?.id ?? '')
    }
  }, [availableResumes, selectedResumeId, sourceMode])

  useEffect(() => {
    if (!hasRestoredDraft) {
      return
    }

    writeSessionDraft(draftKey, {
      sourceMode,
      selectedResumeId,
      jobDescription,
      intensity,
      result,
      errorMessage,
    } satisfies CoverLetterSessionDraft)
  }, [draftKey, errorMessage, hasRestoredDraft, intensity, jobDescription, result, selectedResumeId, sourceMode])

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
            data?: GeneratedCoverLetterPayload
            error?: string
          }
        | null

      if (!response.ok || !payload?.success || !payload.data) {
        if (payload?.error === 'CLAUDE_TIMEOUT') {
          setErrorMessage('The cover letter request took too long. Try again or drop the intensity one step.')
        } else if (payload?.error === 'PARSE_FAILED') {
          setErrorMessage('The model returned an invalid draft. Try again and keep the same job description.')
        } else if (payload?.error === 'PARSE_LOW_CONFIDENCE') {
          setErrorMessage('We could not reliably extract enough resume content from that file. Export a text-based PDF or DOCX and try again.')
        } else if (payload?.error === 'OPENROUTER_PRIVACY_POLICY_BLOCK') {
          setErrorMessage('OpenRouter is blocking all allowed providers for this request. Keep DeepSeek v3.2 enabled or relax the privacy policy in your OpenRouter settings.')
        } else {
          setErrorMessage(payload?.error ?? 'We could not generate a cover letter for that role.')
        }
        return
      }

      setResult(payload.data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not generate a cover letter for that role.')
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
      link.download = `${buildCoverLetterDownloadName(result.sourceTitle)}.pdf`
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
      await generateCoverLetterDOCX({
        coverLetter: result.coverLetter,
        sender: result.sender,
        filename: `${buildCoverLetterDownloadName(result.sourceTitle)}.docx`,
      })
    } finally {
      setDownloadState(null)
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        kicker="Resume Tools"
        title="Generate a tailored cover letter from a saved resume or fresh upload."
        description="Drop in a job description and Rezoomed will turn your resume into a truthful, role-specific cover letter you can export as PDF or DOCX the moment the draft is ready."
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
                {isGenerating ? 'Generating Letter (1-2 min)' : 'Generate Cover Letter'}
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
              <p className="mt-2 text-sm font-black text-on-background">Role-specific cover letter</p>
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
                        {getResumeTitleLabel(resume, resumeTitleLabels)}
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
                          Max {MAX_RESUME_UPLOAD_LABEL}. The file is parsed for this generation run only.
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
                  htmlFor="cover-letter-job-description"
                  className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70"
                >
                  Job description
                </label>
                <textarea
                  id="cover-letter-job-description"
                  value={jobDescription}
                  onChange={event => {
                    setJobDescription(event.target.value)
                    setResult(null)
                    setErrorMessage(null)
                  }}
                  placeholder="Paste the full role description so the cover letter can focus on the actual responsibilities, requirements, and hiring signals."
                  rows={14}
                  className="min-h-[18rem] w-full rounded-[1.4rem] border border-black/8 bg-white px-4 py-4 text-sm leading-6 text-on-background shadow-[0_16px_38px_rgba(25,28,29,0.04)] outline-none transition focus:border-[#008f44]/30"
                />
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>A richer job description produces a much stronger letter.</span>
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
                  <p className="mt-2 text-lg font-black text-on-background">Role-specific cover letter generation</p>
                </div>
                <div className="rounded-full border border-[#008f44]/18 bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                  Hiring ready
                </div>
              </div>
              <div className="space-y-3 text-sm leading-7 text-on-surface-variant">
                <p>1. Pick a saved resume or upload one just for this run.</p>
                <p>2. Paste the exact job description.</p>
                <p>3. Rezoomed writes a truthful cover letter tuned to the role.</p>
                <p>4. Review the draft, then export it as PDF or editable DOCX.</p>
              </div>
            </div>
          </DashboardSurface>

          {result ? (
            <DashboardSurface variant="accent" className="p-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#026d32]/70">
                      Letter brief
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                      {result.coverLetter.roleTitle
                        ? `${result.coverLetter.roleTitle}${result.coverLetter.companyName ? ` · ${result.coverLetter.companyName}` : ''}`
                        : 'Targeted cover letter generated'}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#008f44]">
                      {result.coverLetter.intensity}
                    </span>
                    {result.coverLetter.companyName ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                        {result.coverLetter.companyName}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.2rem] bg-white/82 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                    Strategy
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-background">
                    {result.coverLetter.strategySummary}
                  </p>
                </div>

                {result.coverLetter.fitHighlights.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                      What the letter emphasizes
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.coverLetter.fitHighlights.map(item => (
                        <span
                          key={item}
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-on-background"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </DashboardSurface>
          ) : null}
        </div>

        <DashboardSurface variant="default" className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
                Live cover letter preview
              </p>
              <p className="mt-2 text-lg font-black text-on-background">
                {result ? `${sanitizeDocumentTitle(result.sourceTitle)} cover letter` : 'Generate first to unlock preview'}
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
                  <div ref={previewRef} id="cover-letter-print-wrapper">
                    <CoverLetterPreview result={result} />
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
                      Your generated cover letter will appear here
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                      Once the draft is generated you can review the full letter, then export it as PDF or DOCX immediately.
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
                  Cover letter ready
                </span>
                {result.coverLetter.suggestedSubject ? <span>Subject: {result.coverLetter.suggestedSubject}</span> : null}
                {result.coverLetter.fitHighlights.length ? (
                  <span>Focus: {result.coverLetter.fitHighlights.join(', ')}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </DashboardSurface>
      </div>
    </div>
  )
}
