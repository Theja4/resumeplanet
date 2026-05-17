'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Globe,
  Eye,
  EyeOff,
  Download,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  ChevronDown,
  LayoutTemplate,
  Save,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Settings,
  Edit3,
  Crown,
  Sparkles,
  X,
  Zap,
  Wand2,
  Brain,
  Target as TargetIcon,
  BarChart3
} from 'lucide-react'
import UploadZone from '@/components/resumes/UploadZone'
import { ResumeLioTemplateRenderer, TEMPLATE_INFO } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { createResumeLioSite, updateResumeLioSite, deleteResumeLioSite, checkSlugAvailability } from './actions'
import { ResumeLioEditorView } from './ResumeLioEditorView'
import type { Resume, ResumeData, ResumeLioSite, ResumeLioTemplateId, ResumeLioSocialLinks } from '@/types'
import { syncResumeData } from '@/lib/resume-data'
import { usePlan } from '@/lib/context/PlanContext'

const TEMPLATES: Array<{ id: ResumeLioTemplateId; name: string; description: string }> = [
  { id: 'jane', name: TEMPLATE_INFO.jane.name, description: TEMPLATE_INFO.jane.description },
  { id: 'portfolite', name: TEMPLATE_INFO.portfolite.name, description: TEMPLATE_INFO.portfolite.description },
  { id: 'velora', name: TEMPLATE_INFO.velora.name, description: TEMPLATE_INFO.velora.description },
  { id: 'welvet', name: TEMPLATE_INFO.welvet.name, description: TEMPLATE_INFO.welvet.description },
  { id: 'stelvio', name: TEMPLATE_INFO.stelvio.name, description: TEMPLATE_INFO.stelvio.description },
  { id: 'yuya', name: TEMPLATE_INFO.yuya.name, description: TEMPLATE_INFO.yuya.description },
  { id: 'casefile', name: TEMPLATE_INFO.casefile.name, description: TEMPLATE_INFO.casefile.description },
  { id: 'signal', name: TEMPLATE_INFO.signal.name, description: TEMPLATE_INFO.signal.description },
  { id: 'pearltech', name: TEMPLATE_INFO.pearltech.name, description: TEMPLATE_INFO.pearltech.description },
]

interface ResumeLioClientProps {
  initialSite: ResumeLioSite | null
  resumes: Resume[]
}

type WizardStep = 'template' | 'source' | 'details'

function emptySocialLinks(): ResumeLioSocialLinks {
  return { linkedin: '', github: '', gitlab: '', website: '', email: '', phone: '' }
}

function getSocialLinksFromResumeData(data: ResumeData | null | undefined): ResumeLioSocialLinks {
  if (!data) return emptySocialLinks()
  return {
    linkedin: data.linkedin || '',
    github: '',
    gitlab: '',
    website: data.website || '',
    email: data.email || '',
    phone: data.phone || '',
  }
}

function FomoPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-[linear-gradient(90deg,#dc2626,#f59e0b,#16a34a)]" />

        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          {/* Left — content */}
          <div className="px-10 pt-10 pb-2">
            {/* Stat callout */}
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
              <span className="text-4xl font-black text-red-600">98%</span>
            </div>

            <h3 className="text-2xl font-black text-on-surface tracking-tight leading-snug">
              of applicants leave this field <span className="text-red-600">blank</span>
            </h3>

            <p className="mt-4 text-base text-on-surface-variant leading-relaxed">
              Job applications have a <strong className="text-on-surface">&ldquo;Personal Website&rdquo;</strong> field. Recruiters notice when it&apos;s empty.
            </p>

            {/* Social proof strip */}
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <div className="flex -space-x-2 shrink-0">
                {[
                  { initials: 'AK', bg: 'bg-violet-500' },
                  { initials: 'SR', bg: 'bg-sky-500' },
                  { initials: 'MP', bg: 'bg-amber-500' },
                  { initials: 'JL', bg: 'bg-rose-500' },
                ].map((u, i) => (
                  <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-full ${u.bg} border-2 border-white text-[10px] font-bold text-white`}>
                    {u.initials}
                  </div>
                ))}
              </div>
              <p className="text-xs text-emerald-800 leading-snug">
                <strong>2,400+ users</strong> already built theirs this month
              </p>
            </div>

            {/* Comparison */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1">Without</p>
                <p className="text-3xl font-black text-red-600">-22%</p>
                <p className="text-xs text-red-500 mt-0.5">callback rate</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-1">With website</p>
                <p className="text-3xl font-black text-emerald-600">+34%</p>
                <p className="text-xs text-emerald-500 mt-0.5">callback rate</p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-7 pb-9 flex flex-col items-center gap-3">
              <Link
                href="/dashboard/pricing"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1a8a4a,#2a9d5c)] px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:brightness-110"
              >
                <Sparkles size={18} /> Build Mine Now
              </Link>
              <button onClick={onClose} className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition">
                I&apos;ll keep the field empty
              </button>
            </div>
          </div>

          {/* Right — illustration */}
          <div className="hidden md:block relative overflow-hidden bg-[#d4edda] border-l border-outline-variant/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fomo-bunny.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-5 rounded-full p-1.5 text-on-surface-variant/40 hover:bg-black/5 hover:text-on-surface-variant transition">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

function ProUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-[1.3fr_0.7fr]">
          {/* Left — content */}
          <div className="px-8 pt-9 pb-8">
            {/* Hook */}
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-3 py-1.5 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-700">Pro feature — you&apos;re on Free</span>
            </div>

            <h3 className="text-2xl font-black text-on-surface tracking-tight leading-tight">
              You&apos;re <span className="text-red-600">1 step away</span> from standing out
            </h3>

            <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
              Candidates with a personal website get <strong className="text-on-surface">3.7x more callbacks</strong>. Upgrade and build yours in under 2 minutes.
            </p>

            {/* Compact benefits — 2 columns */}
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                'Personal Website Builder',
                'Advanced ATS Analysis',
                'AI-powered Match Score',
                'Tailor Mode rewrites',
                'Unlimited resumes',
                'PDF + DOCX exports',
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-on-surface-variant">{b}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-5 flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                {[
                  { initials: 'AK', bg: 'bg-violet-500' },
                  { initials: 'SR', bg: 'bg-sky-500' },
                  { initials: 'MP', bg: 'bg-amber-500' },
                ].map((u, i) => (
                  <div key={i} className={`flex h-6 w-6 items-center justify-center rounded-full ${u.bg} border-2 border-white text-[8px] font-bold text-white`}>
                    {u.initials}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-on-surface-variant"><strong className="text-on-surface">1,200+</strong> upgraded this week</span>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/dashboard/pricing"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1a8a4a,#2a9d5c)] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:brightness-110"
              >
                <Crown size={16} /> Unlock Pro
              </Link>
              <button onClick={onClose} className="text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition">
                Stay on Free plan
              </button>
            </div>
          </div>

          {/* Right — bunny illustration */}
          <div className="hidden md:block relative overflow-hidden bg-[#d4edda]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fomo-bunny.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-on-surface-variant/40 hover:bg-black/5 hover:text-on-surface-variant transition md:text-white/60 md:hover:bg-white/10 md:hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

function SavedToast({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    if (show) {
      setMounted(true)
      t1 = setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
      t2 = setTimeout(() => setMounted(false), 350)
    }
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [show])

  if (!mounted) return null

  return (
    <div
      className="fixed bottom-8 left-1/2 z-[9999] pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0px' : '14px'})`,
        opacity: visible ? 1 : 0,
        transition: visible
          ? 'opacity 300ms ease, transform 450ms cubic-bezier(0.34,1.56,0.64,1)'
          : 'opacity 280ms ease-in, transform 280ms ease-in',
      }}
    >
      <div className="flex items-center gap-2.5 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        Saved
      </div>
    </div>
  )
}

export default function ResumeLioClient({ initialSite, resumes }: ResumeLioClientProps) {
  const { isPro: userIsPro } = usePlan()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showFomoPopup, setShowFomoPopup] = useState(false)
  const [site, setSite] = useState<ResumeLioSite | null>(initialSite)
  
  // Wizard state
  const [step, setStep] = useState<WizardStep>('template')
  
  // Form state
  const [slug, setSlug] = useState(initialSite?.slug ?? '')
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeLioTemplateId>(initialSite?.template_id ?? 'jane')
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(initialSite?.source_resume_id ?? null)
  const [socialLinks, setSocialLinks] = useState<ResumeLioSocialLinks>(
    (initialSite?.social_links as ResumeLioSocialLinks) ?? emptySocialLinks()
  )
  const [resumeData, setResumeData] = useState<ResumeData | null>(
    initialSite?.resume_data ? syncResumeData(initialSite.resume_data as ResumeData) : null
  )
  const [published, setPublished] = useState(initialSite?.published ?? false)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)
  const [zipLoading, setZipLoading] = useState(false)
  
  // Edit mode in dashboard
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [showChangeTemplate, setShowChangeTemplate] = useState(false)

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)
  
  const hasChanges =
    !site ||
    site.slug !== slug.trim().toLowerCase() ||
    site.template_id !== selectedTemplate ||
    site.source_resume_id !== selectedResumeId ||
    site.published !== published ||
    JSON.stringify(site.social_links) !== JSON.stringify(socialLinks) ||
    JSON.stringify(site.resume_data) !== JSON.stringify(resumeData)

  useEffect(() => {
    if (selectedResume?.parsed_data) {
      setResumeData(syncResumeData(selectedResume.parsed_data as ResumeData))
      const fromResume = getSocialLinksFromResumeData(selectedResume.parsed_data as ResumeData)
      setSocialLinks((prev) => ({
        linkedin: prev?.linkedin || fromResume.linkedin || '',
        github: prev?.github || '',
        gitlab: prev?.gitlab || '',
        website: prev?.website || fromResume.website || '',
        email: prev?.email || fromResume.email || '',
        phone: prev?.phone || fromResume.phone || '',
      }))
    }
  }, [selectedResume])

  // Show FOMO popup for free users on first visit
  useEffect(() => {
    if (!userIsPro && !initialSite) {
      const timer = setTimeout(() => setShowFomoPopup(true), 600)
      return () => clearTimeout(timer)
    }
  }, [userIsPro, initialSite])

  async function handleCheckSlug(value: string) {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed || trimmed === site?.slug) {
      setSlugError(null)
      return
    }
    const result = await checkSlugAvailability(trimmed)
    if (result.error) {
      setSlugError(result.error)
    } else if (!result.available) {
      setSlugError('Slug is already taken.')
    } else {
      setSlugError(null)
    }
  }

  async function handleCreate() {
    setError(null)
    if (!slug.trim()) {
      setError('Please enter a slug.')
      return
    }
    if (!resumeData) {
      setError('Please select a resume or upload a PDF.')
      return
    }
    setLoading(true)
    const result = await createResumeLioSite({
      slug,
      source_resume_id: selectedResumeId,
      template_id: selectedTemplate,
      resume_data: resumeData,
      social_links: socialLinks,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.data) {
      setSite(result.data as ResumeLioSite)
      setPublished(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }

  async function handleUpdate() {
    setError(null)
    if (!site) return
    setLoading(true)
    const result = await updateResumeLioSite({
      slug,
      source_resume_id: selectedResumeId,
      template_id: selectedTemplate,
      resume_data: resumeData ?? undefined,
      social_links: socialLinks,
      published,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.data) {
      setSite(result.data as ResumeLioSite)
      setJustSaved(true)
      setIsEditingSettings(false)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete your Resume Lio site? This cannot be undone.')) return
    setLoading(true)
    const result = await deleteResumeLioSite()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSite(null)
    setSlug('')
    setSelectedTemplate('jane')
    setSelectedResumeId(null)
    setSocialLinks(emptySocialLinks())
    setResumeData(null)
    setPublished(false)
    setStep('template')
  }

  async function handleDownloadZip() {
    if (!resumeData) return
    setZipLoading(true)
    try {
      const response = await fetch('/api/resume-lio/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: site?.slug || slug || 'my-site',
          data: resumeData,
          templateId: selectedTemplate,
          socialLinks,
          imageOverrides: site?.image_overrides ?? {},
        }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.error || 'ZIP export failed')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(site?.slug || slug || 'my-site').replace(/[^\w-]/g, '')}-site.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ZIP export failed')
    } finally {
      setZipLoading(false)
    }
  }

  async function handleCopyPublicUrl() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = publicUrl
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setUrlCopied(true)
    window.setTimeout(() => setUrlCopied(false), 1800)
  }

  const handleUploadSuccess = useCallback(
    (resume: Resume) => {
      setSelectedResumeId(resume.id)
      if (resume.parsed_data) {
        setResumeData(syncResumeData(resume.parsed_data as ResumeData))
      }
    },
    []
  )

  const publicUrl = site?.slug ? `https://rezoomed.com/r/${site.slug}` : ''

  // -- WIZARD VIEWS --

  if (!site) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardPageIntro
          kicker="Personal Website in seconds"
          title={step === 'template' ? 'Design + Resume = Website' : step === 'source' ? 'Connect your Resume' : 'Final Details'}
          description={
            step === 'template' ? 'Select a design for your public resume site.' :
            step === 'source' ? 'Select an existing resume or upload a new one to populate your site.' :
            'Set your public URL and contact details before launching.'
          }
          aside={
            <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <span className={step === 'template' ? 'text-primary' : ''}>1. Design</span>
              <span>&rarr;</span>
              <span className={step === 'source' ? 'text-primary' : ''}>2. Content</span>
              <span>&rarr;</span>
              <span className={step === 'details' ? 'text-primary' : ''}>3. Details</span>
            </div>
          }
        />

        {error && (
          <DashboardSurface className="flex items-center gap-3 border-red-200 bg-red-50">
            <AlertCircle size={18} className="text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </DashboardSurface>
        )}

        {step === 'template' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedTemplate === t.id ? 'border-primary ring-4 ring-primary/20' : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    <img
                      src={`/templates/lio/${t.id}.webp`}
                      alt={`Preview of ${t.name} template`}
                      className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                      <a
                        href={`/resume-lio/preview?template=${t.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-black px-6 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 pointer-events-auto hover:bg-slate-100 hover:scale-105 transition-all shadow-lg"
                      >
                        <ExternalLink size={16} /> Open Preview
                      </a>
                      <button
                        onClick={() => {
                          if (!userIsPro) { setShowUpgradeModal(true); return }
                          setSelectedTemplate(t.id)
                          setStep('source')
                        }}
                        className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 pointer-events-auto hover:bg-primary/90 hover:scale-105 transition-all shadow-lg"
                      >
                        {userIsPro ? <CheckCircle2 size={16} /> : <Crown size={16} />} Select Design
                      </button>
                    </div>
                  </div>
                  <div
                    className="p-4 bg-white flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      if (!userIsPro) { setShowUpgradeModal(true); return }
                      setSelectedTemplate(t.id)
                      setStep('source')
                    }}
                  >

                    <div>
                      <h4 className="font-bold text-on-surface">{t.name}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{t.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTemplate === t.id ? 'bg-primary border-primary text-white' : 'border-outline-variant/40'}`}>
                      {selectedTemplate === t.id && <CheckCircle2 size={14} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* More coming soon */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <span className="text-sm font-semibold text-on-surface-variant/50 uppercase tracking-wider">More templates coming soon</span>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  if (!userIsPro) { setShowUpgradeModal(true); return }
                  setStep('source')
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                {!userIsPro && <Crown size={16} />} Next Step <ArrowRight size={18} />
              </button>
            </div>
            <ProUpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
          </div>
        )}

        {step === 'source' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <DashboardSurface className="p-8 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:divide-x lg:divide-outline-variant/20">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Select from library</h3>
                    <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">Choose one of your existing resumes to populate your site.</p>
                  </div>

                  {resumes.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedResumeId ?? ''}
                        onChange={(e) => setSelectedResumeId(e.target.value || null)}
                        className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-white px-4 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">— Choose a resume —</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-outline-variant/20 rounded-2xl text-center bg-surface-container-lowest/50">
                      <p className="text-sm text-on-surface-variant">No saved resumes found.</p>
                    </div>
                  )}

                  {selectedResumeId && selectedResume && (
                    <div className="p-4 rounded-xl bg-primary-container/30 border border-primary/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 className="text-primary" size={20} />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">Selected: {selectedResume.title}</p>
                        <p className="text-xs text-on-surface-variant">Content ready to import.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:pl-12 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Upload new PDF</h3>
                    <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">Or upload a fresh PDF to extract your latest details.</p>
                  </div>
                  <div className="h-[220px]">
                    <UploadZone onUploadSuccess={handleUploadSuccess} variant="compact" />
                  </div>
                </div>
              </div>
            </DashboardSurface>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep('template')}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-outline-variant/40 px-6 py-3 text-base font-semibold text-on-surface shadow-sm transition hover:bg-surface-container"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!resumeData}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <DashboardSurface className="p-8 sm:p-10 flex flex-col justify-center">
                <h3 className="mb-4 text-xl font-bold text-on-surface">Set your public URL</h3>
                <div className="flex items-center gap-2">
                  <span className="text-base text-on-surface-variant font-medium bg-surface-container px-4 py-3.5 rounded-xl border border-outline-variant/30">rezoomed.com/r/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    onBlur={() => handleCheckSlug(slug)}
                    placeholder="your-name"
                    className="flex-1 rounded-xl border border-outline-variant/40 bg-white px-4 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {slugError && <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><AlertCircle size={14}/> {slugError}</p>}
                <p className="mt-3 text-sm text-on-surface-variant">Lowercase letters, numbers, and hyphens only.</p>
              </DashboardSurface>

              <DashboardSurface className="p-8 sm:p-10">
                <h3 className="mb-6 text-xl font-bold text-on-surface">Social & Contact Links <span className="text-sm font-normal text-on-surface-variant ml-1">(Optional)</span></h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {([
                    { key: 'linkedin', label: 'LinkedIn URL' },
                    { key: 'github', label: 'GitHub URL' },
                    { key: 'email', label: 'Public Email' },
                  ] as { key: keyof ResumeLioSocialLinks; label: string }[]).map((field) => (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">{field.label}</label>
                      <input
                        value={(socialLinks[field.key] as string) || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder={field.key === 'email' ? 'hello@example.com' : 'https://...'}
                      />
                    </div>
                  ))}
                </div>
              </DashboardSurface>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep('source')}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-outline-variant/40 px-6 py-3 text-base font-semibold text-on-surface shadow-sm transition hover:bg-surface-container"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !slug.trim() || !!slugError}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50 hover:shadow-lg"
              >
                <Globe size={20} />
                {loading ? 'Creating Site…' : 'Create Resume Site'}
              </button>
            </div>
          </div>
        )}

        <FomoPopup open={showFomoPopup} onClose={() => setShowFomoPopup(false)} />
      </div>
    )
  }

  // -- POST-CREATE MANAGEMENT DASHBOARD --

  // Full-screen editor overlay
  if (isEditorOpen && site) {
    return (
      <ResumeLioEditorView
        site={site}
        onClose={() => setIsEditorOpen(false)}
        onSaved={(updated) => {
          setSite(updated)
          setResumeData(updated.resume_data ? syncResumeData(updated.resume_data as ResumeData) : resumeData)
          setSocialLinks((updated.social_links as ResumeLioSocialLinks) ?? socialLinks)
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <DashboardPageIntro
        kicker="Personal Website"
        title="Your Public Resume Site"
        description="Manage your published personal website."
        aside={
          <div className="flex flex-col items-start gap-3 text-left xl:items-end xl:text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1.5">
              <span className={`inline-flex h-2 w-2 rounded-full ${published ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-amber-400'}`} />
              <span className="text-sm font-semibold text-on-surface">{published ? 'Live' : 'Draft'}</span>
            </div>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                <span className="truncate">Open public site</span>
                <ExternalLink size={14} className="shrink-0" />
              </a>
            )}
          </div>
        }
      />

      {error && (
        <DashboardSurface className="flex items-center gap-3 border-red-200 bg-red-50 py-3">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </DashboardSurface>
      )}
      <SavedToast show={justSaved} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── LEFT: scaled template preview ── */}
        <DashboardSurface className="p-0 overflow-hidden border-2 border-outline-variant/30">
          <div className="border-b border-outline-variant/20 px-4 py-2.5 flex items-center gap-2 bg-surface-container-lowest">
            <Globe size={14} className="text-on-surface-variant" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Preview</span>
          </div>
          <div className="relative bg-slate-100 overflow-hidden" style={{ height: 600 }}>
            <div className="absolute inset-0 flex justify-center overflow-hidden">
              <div
                className="w-[1100px] shrink-0 pointer-events-none"
                style={{ transform: 'scale(0.56)', transformOrigin: 'top center' }}
              >
                {resumeData && (
                  <ResumeLioTemplateRenderer
                    templateId={selectedTemplate}
                    data={resumeData}
                    socialLinks={socialLinks}
                    imageOverrides={(site.image_overrides as Record<string, string>) ?? {}}
                  />
                )}
              </div>
            </div>
          </div>
        </DashboardSurface>

        {/* ── RIGHT: action buttons ── */}
        <div className="flex flex-col gap-3">

          {/* Publish toggle */}
          <button
            onClick={async () => {
              const next = !published
              setPublished(next)
              setLoading(true)
              const result = await updateResumeLioSite({ published: next })
              setLoading(false)
              if (result.error) { setError(result.error); setPublished(!next) }
              else if (result.data) { setSite(result.data as ResumeLioSite); setJustSaved(true); setTimeout(() => setJustSaved(false), 2000) }
            }}
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition shadow-sm ${
              published
                ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
            }`}
          >
            {published ? <EyeOff size={16} /> : <Eye size={16} />}
            {published ? 'Unpublish Site' : 'Publish Site'}
          </button>

          {/* Edit */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition"
          >
            <Edit3 size={16} /> Edit Site
          </button>

          {/* Change Template */}
          <button
            onClick={() => setShowChangeTemplate(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition"
          >
            <LayoutTemplate size={16} /> Change Template
          </button>

          {/* Download ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={zipLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition disabled:opacity-50"
          >
            <Download size={16} /> {zipLoading ? 'Preparing…' : 'Download Code (.zip)'}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 size={16} /> Delete Site
          </button>

          {/* URL display */}
          {publicUrl && (
            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant/30 bg-white px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  {urlCopied ? 'Copied' : 'Copy public URL'}
                </span>
                <span className="mt-1 block truncate text-sm font-medium text-on-surface">
                  rezoomed.com/r/{site.slug}
                </span>
              </span>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${urlCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container text-on-surface-variant'}`}>
                {urlCopied ? <Check size={16} /> : <Copy size={16} />}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Change Template Modal ── */}
      {showChangeTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowChangeTemplate(false)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <h3 className="text-base font-semibold text-on-surface">Choose a Template</h3>
              <button onClick={() => setShowChangeTemplate(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={async () => {
                      setSelectedTemplate(t.id)
                      setShowChangeTemplate(false)
                      setLoading(true)
                      const result = await updateResumeLioSite({ template_id: t.id })
                      setLoading(false)
                      if (result.error) setError(result.error)
                      else if (result.data) { setSite(result.data as ResumeLioSite); setJustSaved(true); setTimeout(() => setJustSaved(false), 2000) }
                    }}
                    className={`relative group rounded-xl overflow-hidden border-2 text-left transition ${selectedTemplate === t.id ? 'border-primary ring-4 ring-primary/20' : 'border-outline-variant/20 hover:border-primary/50'}`}
                  >
                    <div className="aspect-[3/4] bg-slate-100">
                      <img src={`/templates/lio/${t.id}.webp`} alt={t.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="px-3 py-2 bg-white">
                      <p className="text-sm font-semibold text-on-surface">{t.name}</p>
                      {selectedTemplate === t.id && <p className="text-xs text-primary">Current</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
