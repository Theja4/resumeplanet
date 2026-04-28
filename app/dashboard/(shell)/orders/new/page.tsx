'use client'

import { type ReactNode, type DragEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  Users,
  FileUp,
  Upload,
} from 'lucide-react'
import type { Resume } from '@/types'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { HUMAN_WRITTEN_ORDER } from '@/lib/pricing'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'
import { DashboardSurface } from '@/components/layout/DashboardSurface'

const STEPS = ['Resume', 'Role', 'Context', 'Review']

const INDUSTRIES = [
  'Technology', 'Finance', 'Consulting', 'Marketing',
  'Healthcare', 'Legal', 'Education', 'Engineering',
  'Operations', 'Sales', 'Design', 'Other',
]

const EXPERIENCE_LEVELS = [
  '5–7 years',
  '8–10 years',
  '11–15 years',
  '15+ years',
]


function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="rounded-[1.35rem] border border-black/6 bg-white/72 p-4 shadow-[0_16px_36px_rgba(25,28,29,0.04)]">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {Array.from({ length: total }, (_, i) => {
          const stepNumber = i + 1
          const isComplete = stepNumber < current
          const isCurrent = stepNumber === current

          return (
            <div key={STEPS[i]} className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors ${
                  isComplete
                    ? 'bg-primary text-white'
                    : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary-container/50'
                      : 'bg-black/8 text-on-surface-variant'
                }`}
              >
                {isComplete ? <Check size={14} /> : stepNumber}
              </div>
              <div className="hidden sm:block">
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isCurrent ? 'text-primary' : 'text-on-surface-variant/55'}`}>
                  Step {stepNumber}
                </p>
                <p className={`text-sm font-semibold ${isCurrent ? 'text-on-background' : 'text-on-surface-variant'}`}>
                  {STEPS[i]}
                </p>
              </div>
              {i < total - 1 ? <div className="hidden h-px w-8 bg-black/8 sm:block" /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
        {eyebrow}
      </p>
      <div className="space-y-1.5">
        <h2 className="text-[1.65rem] font-black tracking-tight text-on-background">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
          {description}
        </p>
      </div>
    </div>
  )
}

function InputLabel({
  children,
  required = false,
  helper,
}: {
  children: ReactNode
  required?: boolean
  helper?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-on-background">
        {children}
        {required ? <span className="text-rose-500"> *</span> : null}
        {helper ? <span className="text-xs font-normal text-on-surface-variant"> {helper}</span> : null}
      </span>
    </label>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="max-w-[58%] text-right font-semibold text-on-background">{value}</span>
    </div>
  )
}

function LeadershipSignalCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BriefcaseBusiness
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/6 bg-white/82 p-4 shadow-[0_14px_32px_rgba(25,28,29,0.04)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary-container/45 text-primary">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-on-background">{title}</p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{description}</p>
        </div>
      </div>
    </div>
  )
}

function SelectionCard({
  selected,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.35rem] border p-4 text-left transition-all ${
        selected
          ? 'border-primary/25 bg-primary-container/28 shadow-[0_16px_36px_rgba(2,109,50,0.08)]'
          : 'border-black/8 bg-white/84 hover:border-black/14 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-on-background">{title}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          selected ? 'bg-primary text-white' : 'bg-black/8 text-transparent'
        }`}>
          <Check size={13} />
        </div>
      </div>
    </button>
  )
}

function UploadZone({
  onFile,
  isExtracting,
  extractError,
}: {
  onFile: (file: File) => void
  isExtracting: boolean
  extractError: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-col">
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
        className={`relative flex min-h-[140px] w-full flex-col items-center justify-center rounded-[1.35rem] border-2 border-dashed transition-all ${
          isDragging
            ? 'border-primary bg-primary-container/15 scale-[1.01]'
            : 'border-black/8 bg-white/40 hover:border-primary/40 hover:bg-primary-container/5'
        } ${isExtracting ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
      >
        {isExtracting ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary" size={24} />
            <p className="text-sm font-semibold text-on-surface-variant">Extracting text…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/30">
              <Upload size={20} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-on-background">Upload a new resume</p>
              <p className="text-xs text-on-surface-variant/60">PDF or DOCX</p>
            </div>
          </div>
        )}
      </button>
      {extractError && (
        <p className="mt-2 text-center text-xs font-semibold text-rose-600">{extractError}</p>
      )}
    </div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const { openOrderCheckout } = usePaddleCheckout()

  const [step, setStep] = useState(1)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [uploadedResumeFile, setUploadedResumeFile] = useState<{ name: string; text: string } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingResumes, setIsLoadingResumes] = useState(true)

  useEffect(() => {
    async function loadResumes() {
      if (!HUMAN_WRITTEN_SERVICE_ENABLED) {
        router.replace('/dashboard')
        setIsLoadingResumes(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoadingResumes(false)
        return
      }

      const { data } = await supabase
        .from('resumes')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      setResumes((data ?? []) as Resume[])
      setIsLoadingResumes(false)
    }

    loadResumes()
  }, [router, supabase])

  if (!HUMAN_WRITTEN_SERVICE_ENABLED) {
    return null
  }

  async function handleFileUpload(file: File) {
    setIsExtracting(true)
    setExtractError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/ats/extract-text', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to extract text')
      
      setUploadedResumeFile({ name: file.name, text: json.text })
      setSelectedResumeId('') // Clear dashboard selection if uploading
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsExtracting(false)
    }
  }

  const selectedResume = resumes.find(resume => resume.id === selectedResumeId)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    await openOrderCheckout({
      resumeId: selectedResumeId || null,
      uploadedResumeText: uploadedResumeFile?.text || null,
      jobTitle,
      jobDescription: jobDescription || null,
      additionalNotes: additionalNotes || null,
      industry,
      yearsExp,
      onSuccess: () => setIsSubmitting(false),
      onError: (err) => {
        setError(err)
        setIsSubmitting(false)
      },
    })
  }

  const canAdvanceFromStepOne = Boolean(selectedResumeId || uploadedResumeFile)
  const canAdvanceFromStepTwo = Boolean(jobTitle && industry && yearsExp)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <DashboardSurface variant="subtle" className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                Senior/Leadership Service
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-on-background sm:text-4xl">
              Rewrite Your Resume.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-on-surface-variant">
              Get a narrative that survives a VP review. Expert hiring managers from Apple, Google, and Microsoft transform your experience into a high-impact story.
            </p>
          </div>

          <div className="flex gap-3">
            <DashboardSurface variant="default" className="flex flex-col items-center justify-center p-4 min-w-[120px] text-center border-black/5 bg-white/40 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">Price</p>
              <p className="text-xl font-black text-on-background">{'$'}{HUMAN_WRITTEN_ORDER.display.displayPrice.toFixed(0)}</p>
            </DashboardSurface>
            <DashboardSurface variant="default" className="flex flex-col items-center justify-center p-4 min-w-[120px] text-center border-black/5 bg-white/40 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">Delivery</p>
              <p className="text-sm font-black text-primary">3-4 Days</p>
            </DashboardSurface>
          </div>
        </div>
      </DashboardSurface>

      <div className="space-y-6">
        <StepIndicator current={step} total={4} />

        <DashboardSurface variant="default" className="p-6 sm:p-8">
          {step === 1 ? (
            <div className="space-y-8">
              <SectionHeader
                eyebrow="Step 1: Selection"
                title="Choose the resume to polish."
                description="Pick a version from your dashboard or upload a new file. Our expert writers will preserve your background while sharpening leadership signals."
              />

              <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] items-start">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 px-1">Select from dashboard</p>
                  {isLoadingResumes ? (
                    <div className="flex h-[140px] items-center justify-center">
                      <Loader2 className="animate-spin text-primary/20" size={24} />
                    </div>
                  ) : resumes.length === 0 ? (
                    <div className="flex h-[140px] items-center justify-center rounded-[1.35rem] border border-black/5 bg-black/2 px-4 text-center">
                      <p className="text-xs text-on-surface-variant/60">No resumes found</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {resumes.map(resume => (
                        <SelectionCard
                          key={resume.id}
                          selected={selectedResumeId === resume.id}
                          title={resume.title || 'Untitled Resume'}
                          subtitle={`Updated ${new Date(resume.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          onClick={() => {
                            setSelectedResumeId(resume.id)
                            setUploadedResumeFile(null)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden md:flex h-full flex-col items-center py-10">
                  <div className="w-px flex-1 bg-black/5" />
                  <span className="my-4 text-[10px] font-black text-on-surface-variant/30 uppercase">OR</span>
                  <div className="w-px flex-1 bg-black/5" />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 px-1">Upload new file</p>
                  {uploadedResumeFile ? (
                    <div className="flex h-[140px] flex-col items-center justify-center rounded-[1.35rem] border border-primary/20 bg-primary-container/10 p-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/30 mb-2">
                        <FileUp size={20} className="text-primary" />
                      </div>
                      <p className="text-sm font-bold text-on-background truncate w-full">{uploadedResumeFile.name}</p>
                      <button 
                        onClick={() => setUploadedResumeFile(null)}
                        className="mt-2 text-[10px] font-black uppercase text-primary/60 hover:text-primary transition-colors"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <UploadZone onFile={handleFileUpload} isExtracting={isExtracting} extractError={extractError} />
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canAdvanceFromStepOne}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-8 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 shadow-xl"
                >
                  Continue to Brief
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Role brief"
                  title="Tell us what level you want to land."
                  description="This service is geared toward candidates with at least five years of experience, especially people stepping into bigger ownership, larger teams, or more visible leadership scope."
                />

                <div className="grid gap-5">
                  <div className="space-y-2">
                    <InputLabel required>Target role</InputLabel>
                    <input
                      value={jobTitle}
                      onChange={event => setJobTitle(event.target.value)}
                      placeholder="e.g. Director of Product, Head of Operations, Senior Staff Engineer"
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-on-background outline-none transition focus:border-primary/25 focus:ring-4 focus:ring-primary-container/45"
                    />
                  </div>

                  <div className="space-y-2">
                    <InputLabel helper="optional but strongly recommended">Job description</InputLabel>
                    <textarea
                      value={jobDescription}
                      onChange={event => setJobDescription(event.target.value)}
                      rows={8}
                      placeholder="Paste the job description. The more clearly we can see scope, stakeholder exposure, team size, transformation work, and business outcomes, the stronger the rewrite will be."
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-on-background outline-none transition focus:border-primary/25 focus:ring-4 focus:ring-primary-container/45"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <InputLabel required>Industry</InputLabel>
                      <select
                        value={industry}
                        onChange={event => setIndustry(event.target.value)}
                        className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-on-background outline-none transition focus:border-primary/25 focus:ring-4 focus:ring-primary-container/45"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(item => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <InputLabel required>Experience band</InputLabel>
                      <select
                        value={yearsExp}
                        onChange={event => setYearsExp(event.target.value)}
                        className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-on-background outline-none transition focus:border-primary/25 focus:ring-4 focus:ring-primary-container/45"
                      >
                        <option value="">Select experience band</option>
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-background"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canAdvanceFromStepTwo}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Leadership context"
                  title="Add the nuance a senior rewrite needs."
                  description="Use this space for promotion targets, team size, strategic initiatives, board or executive visibility, international scope, turnaround work, or any context that helps the writer position you accurately."
                />

                <div className="space-y-2">
                  <InputLabel helper="optional">Additional notes</InputLabel>
                  <textarea
                    value={additionalNotes}
                    onChange={event => setAdditionalNotes(event.target.value.slice(0, 700))}
                    rows={10}
                    placeholder="Useful context for senior candidates: team size, P&L ownership, promotion target, strategic initiatives, board exposure, turnaround work, or any context that helps the writer position you accurately."
                    className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-on-background outline-none transition focus:border-primary/25 focus:ring-4 focus:ring-primary-container/45"
                  />
                  <p className="text-right text-xs text-on-surface-variant/70">
                    {additionalNotes.length}/700
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LeadershipSignalCard
                    icon={Target}
                    title="Built for bigger scope"
                    description="Ideal when the story needs to show leadership trajectory, strategic ownership, and stronger business context."
                  />
                  <LeadershipSignalCard
                    icon={Users}
                    title="Stronger management signals"
                    description="We help the writer surface team leadership, influence, and stakeholder credibility from your real background."
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-background"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                  >
                    Review order
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Step 4: Final review"
                  title="Confirm the brief before payment."
                  description="This order is tuned for experienced candidates who need a stronger leadership narrative and clearer business impact language."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-black/6 bg-white/84 p-5 shadow-[0_16px_36px_rgba(25,28,29,0.04)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/40 mb-4">Brief Details</p>
                    <div className="space-y-3">
                      <SummaryRow label="Resume" value={selectedResume?.title || uploadedResumeFile?.name || 'Uploaded File'} />
                      <SummaryRow label="Target role" value={jobTitle} />
                      <SummaryRow label="Industry" value={industry} />
                      <SummaryRow label="Experience" value={yearsExp} />
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-primary/12 bg-[linear-gradient(160deg,rgba(2,109,50,0.08),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_42px_rgba(2,109,50,0.08)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70 mb-4">
                      Total Payment
                    </p>
                    <p className="text-4xl font-black tracking-tight text-on-background">
                      {'$'}{HUMAN_WRITTEN_ORDER.display.displayPrice.toFixed(0)}
                    </p>
                    <p className="mt-2 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wide">
                      One-time · 3-4 Day Delivery
                    </p>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm text-rose-600">{error}</p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-black/5">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-background"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Opening payment…
                      </>
                    ) : (
                      <>
                        Pay & Book Rewrite
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </DashboardSurface>
        </div>
      </div>
  )
}
