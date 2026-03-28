'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutGrid,
  ChevronDown,
  User,
  AlignLeft,
  Briefcase,
  GraduationCap,
  Zap,
  Code,
  Award,
  Heart,
  Globe,
  Star,
  Trophy,
  BookOpen,
  Users,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProGate } from '@/lib/hooks/useProGate'
import { PlanProvider } from '@/lib/context/PlanContext'
import ProGateModal from '@/components/shared/ProGateModal'
import TemplateSwitcherModal from '@/components/builder/TemplateSwitcherModal'
import TailorPanel from '@/components/builder/TailorPanel'
import ContactEditor from '@/components/builder/ContactEditor'
import SummaryEditor from '@/components/builder/SummaryEditor'
import ExperienceEditor from '@/components/builder/ExperienceEditor'
import EducationEditor from '@/components/builder/EducationEditor'
import SkillsEditor from '@/components/builder/SkillsEditor'
import ProjectsEditor from '@/components/builder/ProjectsEditor'
import CertificationsEditor from '@/components/builder/CertificationsEditor'
import VolunteerEditor from '@/components/builder/VolunteerEditor'
import LanguagesEditor from '@/components/builder/LanguagesEditor'
import InterestsEditor from '@/components/builder/InterestsEditor'
import AwardsEditor from '@/components/builder/AwardsEditor'
import PublicationsEditor from '@/components/builder/PublicationsEditor'
import ReferencesEditor from '@/components/builder/ReferencesEditor'
import { getTemplateComponent } from '@/components/templates/registry'
import { generateDOCX } from '@/lib/docxGenerator'
import type { ResumeData, TemplateId, BuilderMode, TailorAnalysis, TemplateProps, Profile } from '@/types'

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'contact', label: 'Contact Info', Icon: User },
  { id: 'summary', label: 'Summary', Icon: AlignLeft },
  { id: 'experience', label: 'Work Experience', Icon: Briefcase },
  { id: 'education', label: 'Education', Icon: GraduationCap },
  { id: 'skills', label: 'Skills', Icon: Zap },
  { id: 'projects', label: 'Projects', Icon: Code },
  { id: 'certifications', label: 'Certificates', Icon: Award },
  { id: 'volunteer', label: 'Volunteer Work', Icon: Heart },
  { id: 'languages', label: 'Languages', Icon: Globe },
  { id: 'interests', label: 'Interests', Icon: Star },
  { id: 'awards', label: 'Awards', Icon: Trophy },
  { id: 'publications', label: 'Publications', Icon: BookOpen },
  { id: 'references', label: 'References', Icon: Users },
] as const

type SectionId = typeof SECTIONS[number]['id']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDITORS: Record<SectionId, React.ComponentType<any>> = {
  contact: ContactEditor,
  summary: SummaryEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  certifications: CertificationsEditor,
  volunteer: VolunteerEditor,
  languages: LanguagesEditor,
  interests: InterestsEditor,
  awards: AwardsEditor,
  publications: PublicationsEditor,
  references: ReferencesEditor,
}

function sectionHasData(sectionId: SectionId, data: ResumeData): boolean {
  switch (sectionId) {
    case 'contact': return !!(data.name || data.email || data.phone)
    case 'summary': return !!data.summary
    case 'experience': return data.experience.length > 0
    case 'education': return data.education.length > 0
    case 'skills': return data.skills.length > 0
    case 'projects': return data.projects.length > 0
    case 'certifications': return data.certifications.length > 0
    case 'volunteer': return data.volunteer.length > 0
    case 'languages': return data.languages.length > 0
    case 'interests': return data.interests.length > 0
    case 'awards': return data.awards.length > 0
    case 'publications': return data.publications.length > 0
    case 'references': return data.references.length > 0
  }
}

// ─── Inner builder (needs PlanContext) ────────────────────────────────────────

interface BuilderInnerProps {
  resumeId: string
  isPro: boolean
  profile: Profile
}

function BuilderInner({ resumeId, isPro, profile }: BuilderInnerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const { requirePro, blockedFeature, clearBlockedFeature } = useProGate()

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [savedData, setSavedData] = useState<ResumeData | null>(null)
  const [resumeTitle, setResumeTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    (searchParams.get('template') as TemplateId) ?? 'modern-minimal'
  )
  const [activeMode, setActiveMode] = useState<BuilderMode>('builder')
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('contact')
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [tailorAnalysis, setTailorAnalysis] = useState<TailorAnalysis | null>(null)
  const [isTailoring, setIsTailoring] = useState(false)
  const [sectionHints, setSectionHints] = useState<Set<string>>(new Set())
  const [previewScale, setPreviewScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const saveTimerRef = useRef<NodeJS.Timeout>()
  const userId = profile.id

  // ── Load resume on mount ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: resume, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', userId)
        .single()

      if (error || !resume) {
        router.replace('/dashboard/resumes')
        return
      }

      // TODO: validate shape
      const data = resume.parsed_data as ResumeData
      setResumeData(data)
      setSavedData(data)
      setResumeTitle(resume.title ?? '')
      setIsLoading(false)
    }
    load()
  }, [resumeId, userId])

  // ── Preview scale ───────────────────────────────────────────────────────────
  useEffect(() => {
    function updateScale() {
      setPreviewScale(Math.min(1.0, (window.innerHeight - 48) / 1123))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // ── Auto-save (debounced 500ms) ─────────────────────────────────────────────
  useEffect(() => {
    if (!resumeData) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true)
      const { error } = await supabase
        .from('resumes')
        .update({ parsed_data: resumeData, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .eq('user_id', userId)
      if (error) {
        console.error('Auto-save failed:', error)
        setIsSaving(false)
        return
      }
      setSavedData(resumeData)
      setIsSaving(false)
    }, 500)
    return () => clearTimeout(saveTimerRef.current)
  }, [resumeData, supabase, resumeId, userId])

  const hasUnsavedChanges =
    !!resumeData && JSON.stringify(resumeData) !== JSON.stringify(savedData)

  // ── beforeunload guard ──────────────────────────────────────────────────────
  // Browsers do not await async beforeunload handlers, so we rely on the
  // 500ms debounce above to keep data fresh. On unload, just cancel any
  // pending timer to avoid a redundant in-flight save after the tab closes.
  useEffect(() => {
    function handleUnload() {
      clearTimeout(saveTimerRef.current)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [resumeId, userId, supabase, hasUnsavedChanges])

  function handleDataChange(updated: ResumeData) {
    setResumeData(updated)
  }

  function handleTailorClick() {
    if (!requirePro('tailor')) return
    setActiveMode('tailor')
  }

  async function handleAnalyse() {
    if (!resumeData) return
    setIsTailoring(true)
    try {
      const resumeText = [
        resumeData.name,
        resumeData.summary,
        ...resumeData.experience.flatMap(e => [e.title, e.company, ...e.bullets]),
        ...resumeData.skills,
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/ats/tailor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })
      if (!res.ok) {
        console.error('Tailor analysis failed:', res.status)
        return
      }
      const json = await res.json()
      if (json.success) {
        setTailorAnalysis(json.data)
      }
    } finally {
      setIsTailoring(false)
    }
  }

  function handleApplySuggestion(sectionId: string) {
    setActiveMode('builder')
    setExpandedSection(sectionId as SectionId)
    setSectionHints(prev => new Set(prev).add(sectionId))
  }

  async function handleDownloadDOCX() {
    if (!requirePro('docx_download') || !resumeData) return
    await generateDOCX(resumeData, `${resumeTitle || 'resume'}.docx`)
    setIsDownloadOpen(false)
  }

  const TemplateComponent = getTemplateComponent(selectedTemplateId) as React.ComponentType<TemplateProps>

  if (isLoading || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#builder-print-wrapper) { display: none !important; }
          #builder-print-wrapper {
            position: fixed;
            top: 0; left: 0;
            width: 794px;
            transform: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* ── Top bar ── */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 relative z-10">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/resumes"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Resumes
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
              {resumeTitle}
            </span>
            {isSaving ? (
              <span className="text-xs text-gray-400">Saving…</span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : (
              <span className="text-xs text-green-600">Saved ✓</span>
            )}
          </div>

          {/* Centre — mode tabs */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveMode('builder')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                activeMode === 'builder'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              BUILDER
            </button>
            <button
              onClick={handleTailorClick}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                activeMode === 'tailor'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              TAILOR
              {!isPro && (
                <span className="ml-1 text-amber-500 text-[10px] font-bold">PRO</span>
              )}
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              <LayoutGrid size={15} />
              Templates
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                Download
                <ChevronDown size={13} />
              </button>
              {isDownloadOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 w-36 z-20">
                  <button
                    onClick={() => { window.print(); setIsDownloadOpen(false) }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    DOCX
                    {!isPro && <span className="text-[10px] text-amber-500 font-bold">PRO</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
            {activeMode === 'tailor' ? (
              <TailorPanel
                resumeData={resumeData}
                analysis={tailorAnalysis}
                isTailoring={isTailoring}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                onAnalyse={handleAnalyse}
                onApplySuggestion={handleApplySuggestion}
              />
            ) : (
              <div className="py-2">
                {SECTIONS.map(({ id, label, Icon }) => {
                  const hasData = sectionHasData(id, resumeData)
                  const isExpanded = expandedSection === id
                  const hasHint = sectionHints.has(id)
                  const Editor = EDITORS[id]

                  return (
                    <div key={id} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-gray-300 text-xs select-none">⠿</span>
                        <Icon size={14} className="text-gray-500 shrink-0" />
                        <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                        {hasHint && (
                          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            hasData ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        >
                          {hasData ? 'EDIT' : '+ ADD'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          <Editor data={resumeData} onChange={handleDataChange} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </aside>

          {/* Preview */}
          <main className="flex-1 bg-gray-100 overflow-auto flex justify-center py-6">
            <div
              id="builder-print-wrapper"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
                width: '794px',
              }}
            >
              <TemplateComponent
                data={resumeData}
                isEditing={false}
                onFieldChange={() => {}}
              />
            </div>
          </main>
        </div>
      </div>

      <TemplateSwitcherModal
        isOpen={isTemplateModalOpen}
        currentTemplateId={selectedTemplateId}
        resumeData={resumeData}
        onSelect={setSelectedTemplateId}
        onClose={() => setIsTemplateModalOpen(false)}
      />
      <ProGateModal feature={blockedFeature} onClose={clearBlockedFeature} />
    </>
  )
}

// ─── Mobile fallback ──────────────────────────────────────────────────────────

function MobileFallback({ resumeId }: { resumeId: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Builder works best on desktop</h1>
      <p className="text-sm text-gray-500 mb-6">
        The resume builder requires a larger screen. Use a laptop or desktop to edit your resume.
      </p>
      <div className="flex flex-col gap-2">
        <Link href={`/dashboard/resumes/${resumeId}`} className="text-sm text-indigo-600 hover:underline">
          View Resume
        </Link>
        <Link href="/dashboard/ats-checker" className="text-sm text-indigo-600 hover:underline">
          Run ATS Check
        </Link>
        <Link href="/dashboard/templates" className="text-sm text-indigo-600 hover:underline">
          Browse Templates
        </Link>
      </div>
    </div>
  )
}

// ─── Page wrapper — fetches auth + provides PlanContext ───────────────────────

export default function BuilderPage() {
  const params = useParams()
  const resumeId = params.resumeId as string
  const [profileState, setProfileState] = useState<Profile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile) { router.replace('/auth/login'); return }
      setProfileState(profile as Profile)
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  if (!authChecked || !profileState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  if (isMobile) {
    return <MobileFallback resumeId={resumeId} />
  }

  return (
    <PlanProvider isPro={profileState.plan === 'pro'} profile={profileState}>
      <BuilderInner
        resumeId={resumeId}
        isPro={profileState.plan === 'pro'}
        profile={profileState}
      />
    </PlanProvider>
  )
}
