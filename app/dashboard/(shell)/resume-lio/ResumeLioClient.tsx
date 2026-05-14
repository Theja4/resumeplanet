'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Globe,
  Eye,
  EyeOff,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  LayoutTemplate,
  Save,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Settings,
  Edit3
} from 'lucide-react'
import UploadZone from '@/components/resumes/UploadZone'
import { ResumeLioTemplateRenderer, TEMPLATE_INFO } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { createResumeLioSite, updateResumeLioSite, deleteResumeLioSite, checkSlugAvailability } from './actions'
import type { Resume, ResumeData, ResumeLioSite, ResumeLioTemplateId, ResumeLioSocialLinks } from '@/types'
import { syncResumeData } from '@/lib/resume-data'

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

export default function ResumeLioClient({ initialSite, resumes }: ResumeLioClientProps) {
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
  const [pdfLoading, setPdfLoading] = useState(false)
  
  // Edit mode in dashboard
  const [isEditingSettings, setIsEditingSettings] = useState(false)

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

  async function handleExportPdf() {
    if (!resumeData) return
    setPdfLoading(true)
    try {
      const response = await fetch('/api/resume-lio/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: site?.slug || slug || 'resume',
          data: resumeData,
          templateId: selectedTemplate,
          socialLinks,
          filename: `${resumeData.name || 'resume'}-resume-lio`,
        }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.error || 'PDF export failed')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeData.name || 'resume'}-resume-lio.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF export failed')
    } finally {
      setPdfLoading(false)
    }
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
          kicker="Resume Lio Setup"
          title={step === 'template' ? 'Choose a Template' : step === 'source' ? 'Connect your Resume' : 'Final Details'}
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
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
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
                          setSelectedTemplate(t.id)
                          setStep('source')
                        }}
                        className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 pointer-events-auto hover:bg-primary/90 hover:scale-105 transition-all shadow-lg"
                      >
                        <CheckCircle2 size={16} /> Select Design
                      </button>
                    </div>
                  </div>
                  <div
                    className="p-4 bg-white flex items-center justify-between cursor-pointer"
                    onClick={() => {
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
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep('source')}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
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
      </div>
    )
  }

  // -- POST-CREATE MANAGEMENT DASHBOARD --

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardPageIntro
        kicker="Resume Lio"
        title="Your Public Resume Site"
        description="Manage your published resume site, update its content, or download it as a PDF."
        aside={
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-end gap-2">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  published ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-semibold text-on-surface">{published ? 'Live & Published' : 'Draft Mode'}</span>
            </div>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
                resumeplanet.com/r/{site.slug} <ExternalLink size={14} />
              </a>
            )}
          </div>
        }
      />

      {error && (
        <DashboardSurface className="flex items-center gap-3 border-red-200 bg-red-50">
          <AlertCircle size={18} className="text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </DashboardSurface>
      )}

      {justSaved && (
        <DashboardSurface className="flex items-center gap-3 border-emerald-200 bg-emerald-50">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <p className="text-sm text-emerald-700">Changes saved successfully.</p>
        </DashboardSurface>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Preview */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardSurface className="p-0 overflow-hidden flex flex-col h-full border-2 border-outline-variant/30">
            <div className="border-b border-outline-variant/20 px-4 py-3 flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-on-surface-variant" />
                <span className="text-sm font-semibold text-on-surface-variant">Live Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const next = !published
                    setPublished(next)
                    setLoading(true)
                    const result = await updateResumeLioSite({ published: next })
                    setLoading(false)
                    if (result.error) {
                      setError(result.error)
                      setPublished(!next)
                    } else if (result.data) {
                      setSite(result.data as ResumeLioSite)
                      setJustSaved(true)
                      setTimeout(() => setJustSaved(false), 2000)
                    }
                  }}
                  disabled={loading}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    published
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {published ? <EyeOff size={14} /> : <Eye size={14} />}
                  {published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
            <div className="relative flex-1 bg-slate-100 overflow-hidden min-h-[600px]">
               {/* Show scaled actual component */}
               <div className="absolute inset-0 bg-slate-100 overflow-auto flex justify-center">
                 <div className="w-[1000px] origin-top scale-[0.65] md:scale-[0.75] lg:scale-[0.65] xl:scale-[0.8] mb-[-400px]">
                   {resumeData && (
                     <ResumeLioTemplateRenderer templateId={selectedTemplate} data={resumeData} socialLinks={socialLinks} />
                   )}
                 </div>
               </div>
            </div>
          </DashboardSurface>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          <DashboardSurface>
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-on-surface">Site Settings</h3>
                <button 
                  onClick={() => setIsEditingSettings(!isEditingSettings)}
                  className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                  title="Edit Settings"
                >
                  <Settings size={18} />
                </button>
             </div>
             
             {!isEditingSettings ? (
                <div className="space-y-4">
                   <div>
                     <p className="text-xs text-on-surface-variant mb-1">Public URL</p>
                     <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary break-all flex items-center gap-1">
                        resumeplanet.com/r/{site.slug} <ExternalLink size={12} />
                     </a>
                   </div>
                   <div>
                     <p className="text-xs text-on-surface-variant mb-1">Design Template</p>
                     <p className="text-sm font-medium text-on-surface">{TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'Unknown'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-on-surface-variant mb-1">Source Resume</p>
                     <p className="text-sm font-medium text-on-surface">{selectedResume?.title || 'Custom Upload'}</p>
                   </div>
                   <div className="pt-4 flex flex-col gap-2">
                      <button
                        onClick={handleExportPdf}
                        disabled={pdfLoading}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                      >
                        <Download size={16} />
                        {pdfLoading ? 'Exporting…' : 'Export as PDF'}
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Delete Site
                      </button>
                   </div>
                </div>
             ) : (
                <div className="space-y-4 border-t border-outline-variant/20 pt-4">
                   <div>
                      <label className="mb-1 block text-xs font-medium text-on-surface-variant">Update URL Slug</label>
                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        onBlur={() => handleCheckSlug(slug)}
                        className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
                   </div>
                   <div>
                      <label className="mb-1 block text-xs font-medium text-on-surface-variant">Change Template</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value as ResumeLioTemplateId)}
                        className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                   </div>
                   <div>
                      <label className="mb-1 block text-xs font-medium text-on-surface-variant">Update Content Source</label>
                      <select
                        value={selectedResumeId ?? ''}
                        onChange={(e) => setSelectedResumeId(e.target.value || null)}
                        className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">— Keep current —</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                   </div>
                   <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={handleUpdate}
                        disabled={loading || !!slugError || !hasChanges}
                        className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        onClick={() => setIsEditingSettings(false)}
                        className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
                      >
                        Cancel
                      </button>
                   </div>
                </div>
             )}
          </DashboardSurface>
        </div>
      </div>
    </div>
  )
}
