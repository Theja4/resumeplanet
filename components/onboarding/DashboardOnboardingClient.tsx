'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileUp,
  Loader2,
  PencilLine,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resumeDataToPlainText, syncResumeData } from '@/lib/resume-data'
import UploadZone from '@/components/resumes/UploadZone'
import {
  DEFAULT_UNIVERSAL_CONFIG,
  DEFAULT_VISIBILITY,
  EMPTY_RESUME_DATA,
  type EducationItem,
  type ExperienceItem,
  type Resume,
  type ResumeData,
} from '@/types'

interface DashboardOnboardingClientProps {
  userId: string
  initialEmail: string
  initialName: string
}

type OnboardingView = 'splash' | 'upload' | 'scratch'
type ScratchStepId = 'contact' | 'summary' | 'experience' | 'education'

const SCRATCH_STEPS: Array<{
  id: ScratchStepId
  title: string
  description: string
}> = [
  {
    id: 'contact',
    title: 'Contact',
    description: 'Start with the basics recruiters and ATS parsers expect to see first.',
  },
  {
    id: 'summary',
    title: 'Summary',
    description: 'Write 2-3 sentences that explain the role you want and the value you bring.',
  },
  {
    id: 'experience',
    title: 'Work Experience',
    description: 'Add at least one role with concrete bullet points. You can skip this if needed.',
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Capture your most relevant education details. Add another entry only if it matters.',
  },
]

const EMPTY_EXPERIENCE_ITEM: ExperienceItem = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: ['', ''],
  bulletVisibility: [true, true],
  summary: '',
}

const EMPTY_EDUCATION_ITEM: EducationItem = {
  institution: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  graduationDate: '',
  gpa: '',
}

function textValue(value: string) {
  return value.trim()
}

const resumeDataToText = resumeDataToPlainText

function hasAnyResumeContent(data: ResumeData) {
  return Boolean(
    textValue(data.name) ||
      textValue(data.currentRole) ||
      textValue(data.summary) ||
      textValue(data.email) ||
      textValue(data.phone) ||
      textValue(data.location) ||
      textValue(data.linkedin) ||
      textValue(data.website) ||
      data.experience.some(item =>
        textValue(item.title) ||
        textValue(item.company) ||
        textValue(item.location) ||
        textValue(item.startDate) ||
        textValue(item.endDate) ||
        item.bullets.some(bullet => textValue(bullet))
      ) ||
      data.education.some(item =>
        textValue(item.institution) ||
        textValue(item.degree) ||
        textValue(item.field) ||
        textValue(item.startDate ?? '') ||
        textValue(item.endDate ?? '') ||
        textValue(item.graduationDate) ||
        textValue(item.gpa)
      )
  )
}

function cleanExperienceItem(item: ExperienceItem): ExperienceItem | null {
  const bullets = item.bullets.map(bullet => bullet.trim()).filter(Boolean)

  if (
    !textValue(item.company) &&
    !textValue(item.title) &&
    !textValue(item.location) &&
    !textValue(item.startDate) &&
    !textValue(item.endDate) &&
    bullets.length === 0
  ) {
    return null
  }

  return {
    ...item,
    company: item.company.trim(),
    title: item.title.trim(),
    location: item.location.trim(),
    startDate: item.startDate.trim(),
    endDate: item.endDate.trim(),
    summary: item.summary?.trim() ?? '',
    bullets,
    bulletVisibility: bullets.map(() => true),
  }
}

function cleanEducationItem(item: EducationItem): EducationItem | null {
  if (
    !textValue(item.institution) &&
    !textValue(item.degree) &&
    !textValue(item.field) &&
    !textValue(item.startDate ?? '') &&
    !textValue(item.endDate ?? '') &&
    !textValue(item.graduationDate) &&
    !textValue(item.gpa)
  ) {
    return null
  }

  return {
    institution: item.institution.trim(),
    degree: item.degree.trim(),
    field: item.field.trim(),
    startDate: item.startDate?.trim() ?? '',
    endDate: item.endDate?.trim() ?? '',
    graduationDate: item.graduationDate.trim(),
    gpa: item.gpa.trim(),
  }
}

function sanitizeOnboardingResumeData(data: ResumeData): ResumeData {
  return syncResumeData({
    ...data,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    location: data.location.trim(),
    linkedin: data.linkedin.trim(),
    website: data.website.trim(),
    summary: data.summary.trim(),
    currentRole: data.currentRole.trim(),
    experience: data.experience.map(cleanExperienceItem).filter((item): item is ExperienceItem => Boolean(item)),
    education: data.education.map(cleanEducationItem).filter((item): item is EducationItem => Boolean(item)),
    skills: [],
    skillSections: [],
    certifications: [],
    projects: [],
    languages: [],
    volunteer: [],
    interests: [],
    awards: [],
    publications: [],
    references: [],
    customSections: [],
  })
}

function buildResumeTitle(data: ResumeData) {
  const name = data.name.trim()
  return name ? `${name} Resume` : 'Untitled Resume'
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: 'text' | 'email' | 'tel' | 'url'
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  )
}

export default function DashboardOnboardingClient({
  userId,
  initialEmail,
  initialName,
}: DashboardOnboardingClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [view, setView] = useState<OnboardingView>('splash')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData>({
    ...EMPTY_RESUME_DATA,
    email: initialEmail,
    name: initialName,
    experience: [{ ...EMPTY_EXPERIENCE_ITEM }],
    education: [{ ...EMPTY_EDUCATION_ITEM }],
  })

  const activeStep = SCRATCH_STEPS[activeStepIndex]
  const sanitizedResumeData = useMemo(() => sanitizeOnboardingResumeData(resumeData), [resumeData])
  const resumeText = useMemo(() => resumeDataToText(sanitizedResumeData), [sanitizedResumeData])
  const canRunInstantAts = resumeText.trim().length >= 50

  function exitOnboarding() {
    router.replace('/dashboard')
  }

  function handleUploadSuccess(resume: Resume) {
    router.replace(`/dashboard/ats-checker?resumeId=${resume.id}&autoRun=1`)
  }

  function updateContactField<K extends keyof ResumeData>(field: K, value: ResumeData[K]) {
    setResumeData(current => ({ ...current, [field]: value }))
  }

  function updateExperienceItem(index: number, patch: Partial<ExperienceItem>) {
    setResumeData(current => {
      const next = [...current.experience]
      next[index] = { ...next[index], ...patch }
      return { ...current, experience: next }
    })
  }

  function updateExperienceBullet(itemIndex: number, bulletIndex: number, value: string) {
    setResumeData(current => {
      const next = [...current.experience]
      const item = { ...next[itemIndex], bullets: [...next[itemIndex].bullets] }
      item.bullets[bulletIndex] = value
      next[itemIndex] = item
      return { ...current, experience: next }
    })
  }

  function addExperienceItem() {
    setResumeData(current => ({
      ...current,
      experience: [...current.experience, { ...EMPTY_EXPERIENCE_ITEM }],
    }))
  }

  function removeExperienceItem(index: number) {
    setResumeData(current => ({
      ...current,
      experience: current.experience.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function addExperienceBullet(itemIndex: number) {
    setResumeData(current => {
      const next = [...current.experience]
      const item = { ...next[itemIndex], bullets: [...next[itemIndex].bullets, ''] }
      next[itemIndex] = item
      return { ...current, experience: next }
    })
  }

  function updateEducationItem(index: number, patch: Partial<EducationItem>) {
    setResumeData(current => {
      const next = [...current.education]
      next[index] = { ...next[index], ...patch }
      return { ...current, education: next }
    })
  }

  function addEducationItem() {
    setResumeData(current => ({
      ...current,
      education: [...current.education, { ...EMPTY_EDUCATION_ITEM }],
    }))
  }

  function removeEducationItem(index: number) {
    setResumeData(current => ({
      ...current,
      education: current.education.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function goToNextStep() {
    setActiveStepIndex(current => Math.min(current + 1, SCRATCH_STEPS.length - 1))
  }

  function goToPreviousStep() {
    setActiveStepIndex(current => Math.max(current - 1, 0))
  }

  async function handleFinishScratch() {
    setSubmitError(null)

    const nextResumeData = sanitizeOnboardingResumeData(resumeData)

    if (!hasAnyResumeContent(nextResumeData)) {
      router.replace('/dashboard')
      return
    }

    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          title: buildResumeTitle(nextResumeData),
          raw_text: resumeText || null,
          parsed_data: nextResumeData,
          builder_visibility: DEFAULT_VISIBILITY,
          template_config: DEFAULT_UNIVERSAL_CONFIG,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error || !data?.id) {
        throw error ?? new Error('Failed to create onboarding resume')
      }

      if (canRunInstantAts) {
        router.replace(`/dashboard/ats-checker?resumeId=${data.id}&autoRun=1`)
        return
      }

      router.replace(`/dashboard/builder/${data.id}`)
    } catch {
      setSubmitError('Could not save your first resume. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function renderSplash() {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,420px)]">
        <div className="rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_24px_80px_rgba(25,28,29,0.08)] backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            <ShieldCheck size={14} />
            First-run setup
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950">
            Start fast. Get to your first ATS score in minutes.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
            Upload an existing resume for the fastest path, or answer a few guided questions and we will build your
            first version with you.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setView('upload')}
              className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 text-left transition hover:-translate-y-0.5 hover:border-emerald-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <FileUp size={22} />
              </div>
              <div className="mt-5 text-xl font-bold text-zinc-950">Upload your resume</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Best if you already have a PDF. We will save it and jump straight into ATS scoring.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setView('scratch')}
              className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-zinc-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 shadow-sm">
                <PencilLine size={22} />
              </div>
              <div className="mt-5 text-xl font-bold text-zinc-950">Start from scratch</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Answer the major resume questions step by step: contact, summary, experience, and education.
              </p>
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-zinc-500">
            <Sparkles size={16} className="text-emerald-600" />
            You can skip onboarding at any time and go straight to the dashboard.
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,#0b7a3d_0%,#07592d_100%)] p-8 text-white shadow-[0_24px_80px_rgba(2,109,50,0.18)]">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-emerald-100/90">What happens next</div>
          <div className="mt-6 space-y-5">
            {[
              'Create or upload your first resume.',
              'Land immediately in ATS scoring instead of an empty workspace.',
              'Use the builder afterward only if you want to refine details.',
            ].map((line) => (
              <div key={line} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-200" />
                <p className="text-sm leading-6 text-emerald-50/90">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderUpload() {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_24px_80px_rgba(25,28,29,0.08)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Upload path</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Upload and score your resume</h1>
              <p className="mt-3 text-base leading-7 text-zinc-600">
                Drop in your resume and we will send you directly to ATS scoring.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView('splash')}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          <div className="mt-8">
            <UploadZone onUploadSuccess={handleUploadSuccess} variant="compact" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white/88 p-6 shadow-[0_18px_44px_rgba(25,28,29,0.05)]">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Tip</div>
          <h2 className="mt-3 text-xl font-bold text-zinc-950">Fastest route to value</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            If you already have a resume, upload first. ATS scoring will be more useful immediately because it has more
            evidence to evaluate.
          </p>
        </div>
      </div>
    )
  }

  function renderScratchContent() {
    if (activeStep.id === 'contact') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Full name"
            value={resumeData.name}
            onChange={(value) => updateContactField('name', value)}
            placeholder="Jane Doe"
          />
          <InputField
            label="Current role"
            value={resumeData.currentRole}
            onChange={(value) => updateContactField('currentRole', value)}
            placeholder="Product Analyst"
          />
          <InputField
            label="Email"
            type="email"
            value={resumeData.email}
            onChange={(value) => updateContactField('email', value)}
            placeholder="jane@example.com"
          />
          <InputField
            label="Phone"
            type="tel"
            value={resumeData.phone}
            onChange={(value) => updateContactField('phone', value)}
            placeholder="+1 555 123 4567"
          />
          <InputField
            label="Location"
            value={resumeData.location}
            onChange={(value) => updateContactField('location', value)}
            placeholder="Austin, TX"
          />
          <InputField
            label="LinkedIn"
            type="url"
            value={resumeData.linkedin}
            onChange={(value) => updateContactField('linkedin', value)}
            placeholder="linkedin.com/in/janedoe"
          />
          <div className="md:col-span-2">
            <InputField
              label="Website"
              type="url"
              value={resumeData.website}
              onChange={(value) => updateContactField('website', value)}
              placeholder="janedoe.dev"
            />
          </div>
        </div>
      )
    }

    if (activeStep.id === 'summary') {
      return (
        <TextAreaField
          label="Professional summary"
          value={resumeData.summary}
          onChange={(value) => updateContactField('summary', value)}
          placeholder="Example: Product analyst with 4+ years of experience in enterprise platforms, analytics, and cross-functional delivery. Strong in SQL, stakeholder communication, and turning ambiguous business problems into measurable improvements."
          rows={7}
        />
      )
    }

    if (activeStep.id === 'experience') {
      return (
        <div className="space-y-5">
          {resumeData.experience.map((item, index) => (
            <div key={index} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Role {index + 1}
                </div>
                {resumeData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperienceItem(index)}
                    className="text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Job title"
                  value={item.title}
                  onChange={(value) => updateExperienceItem(index, { title: value })}
                  placeholder="Senior Product Analyst"
                />
                <InputField
                  label="Company"
                  value={item.company}
                  onChange={(value) => updateExperienceItem(index, { company: value })}
                  placeholder="Acme Inc."
                />
                <InputField
                  label="Location"
                  value={item.location}
                  onChange={(value) => updateExperienceItem(index, { location: value })}
                  placeholder="Remote"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Start date"
                    value={item.startDate}
                    onChange={(value) => updateExperienceItem(index, { startDate: value })}
                    placeholder="Jan 2022"
                  />
                  <InputField
                    label="End date"
                    value={item.endDate}
                    onChange={(value) => updateExperienceItem(index, { endDate: value })}
                    placeholder="Present"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {item.bullets.map((bullet, bulletIndex) => (
                  <TextAreaField
                    key={bulletIndex}
                    label={`Achievement bullet ${bulletIndex + 1}`}
                    value={bullet}
                    onChange={(value) => updateExperienceBullet(index, bulletIndex, value)}
                    placeholder="Example: Reduced onboarding time by 30% by standardizing implementation playbooks and handoff workflows."
                    rows={3}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => addExperienceBullet(index)}
                className="mt-4 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                + Add another bullet
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addExperienceItem}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            + Add another role
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        {resumeData.education.map((item, index) => (
          <div key={index} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
                Education {index + 1}
              </div>
              {resumeData.education.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEducationItem(index)}
                  className="text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Institution"
                value={item.institution}
                onChange={(value) => updateEducationItem(index, { institution: value })}
                placeholder="University of Michigan"
              />
              <InputField
                label="Degree"
                value={item.degree}
                onChange={(value) => updateEducationItem(index, { degree: value })}
                placeholder="B.S."
              />
              <InputField
                label="Field of study"
                value={item.field}
                onChange={(value) => updateEducationItem(index, { field: value })}
                placeholder="Computer Science"
              />
              <InputField
                label="Start date"
                value={item.startDate ?? ''}
                onChange={(value) => updateEducationItem(index, { startDate: value })}
                placeholder="Sep 2018"
              />
              <InputField
                label="End date"
                value={item.endDate ?? ''}
                onChange={(value) => updateEducationItem(index, { endDate: value, graduationDate: value || item.graduationDate })}
                placeholder="Present or May 2022"
              />
              <InputField
                label="Graduation date"
                value={item.graduationDate}
                onChange={(value) => updateEducationItem(index, { graduationDate: value, endDate: item.endDate || value })}
                placeholder="May 2022"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEducationItem}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
        >
          + Add another education entry
        </button>
      </div>
    )
  }

  function renderScratch() {
    const isLastStep = activeStepIndex === SCRATCH_STEPS.length - 1

    return (
      <div className="rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_24px_80px_rgba(25,28,29,0.08)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Guided resume setup</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{activeStep.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">{activeStep.description}</p>
          </div>

          <button
            type="button"
            onClick={exitOnboarding}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            Skip all questions
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {SCRATCH_STEPS.map((step, index) => {
            const isActive = index === activeStepIndex
            const isComplete = index < activeStepIndex

            return (
              <div
                key={step.id}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : isComplete
                      ? 'bg-zinc-100 text-zinc-700'
                      : 'bg-zinc-50 text-zinc-400'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-black">
                  {index + 1}
                </span>
                {step.title}
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          {renderScratchContent()}
        </div>

        {submitError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6">
          <div className="text-sm text-zinc-500">
            {canRunInstantAts
              ? 'You have enough detail for an immediate ATS score.'
              : 'Add a little more detail for instant ATS scoring. If you finish now, we will open the builder.'}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeStepIndex > 0 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('splash')}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}

            {!isLastStep ? (
              <>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                >
                  Skip this section
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-900"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinishScratch()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                {canRunInstantAts ? 'Create resume & run ATS score' : 'Save draft in builder'}
                {!isSaving ? <ArrowRight size={16} /> : null}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Rezoomed onboarding</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
              {initialName ? `Welcome, ${initialName.split(' ')[0]}.` : 'Welcome.'}
            </div>
          </div>

          <button
            type="button"
            onClick={exitOnboarding}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
            aria-label="Skip onboarding and go to dashboard"
          >
            <X size={18} />
          </button>
        </div>

        {view === 'splash' ? renderSplash() : null}
        {view === 'upload' ? renderUpload() : null}
        {view === 'scratch' ? renderScratch() : null}
      </div>
    </div>
  )
}
