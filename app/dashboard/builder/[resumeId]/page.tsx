'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutGrid,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProGate } from '@/lib/hooks/useProGate'
import { PlanProvider } from '@/lib/context/PlanContext'
import ProGateModal from '@/components/shared/ProGateModal'
import TemplateSwitcherModal from '@/components/builder/TemplateSwitcherModal'
import TailorPanel from '@/components/builder/TailorPanel'
import SectionList from '@/components/builder/SectionList'
import { getVisibleResumeData, getOrderedSections } from '@/lib/visibilityUtils'
import type { BuilderVisibility } from '@/types'
import { DEFAULT_VISIBILITY } from '@/types'
import { getTemplateComponent } from '@/components/templates/registry'
import { generateDOCX } from '@/lib/docxGenerator'
import type { ResumeData, TemplateId, BuilderMode, TailorAnalysis, TemplateProps, Profile } from '@/types'


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
  const [expandedSection, setExpandedSection] = useState<string | null>('contact')
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [tailorAnalysis, setTailorAnalysis] = useState<TailorAnalysis | null>(null)
  const [isTailoring, setIsTailoring] = useState(false)
  const [sectionHints, setSectionHints] = useState<Set<string>>(new Set())
  const [previewScale, setPreviewScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [visibility, setVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedVisibility, setSavedVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)

  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const userId = profile.id

  // SESSION 4C — Run in Supabase SQL editor:
  // ALTER TABLE resumes ADD COLUMN IF NOT EXISTS builder_visibility jsonb DEFAULT '{}';

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
      // Load saved visibility, merging with defaults to handle new fields
      const savedVis = (resume as Record<string, unknown>).builder_visibility as Partial<BuilderVisibility> | null
      if (savedVis && Object.keys(savedVis).length > 0) {
        const merged: BuilderVisibility = {
          ...DEFAULT_VISIBILITY,
          ...savedVis,
          sections: { ...DEFAULT_VISIBILITY.sections, ...(savedVis.sections ?? {}) },
          items: {
            ...DEFAULT_VISIBILITY.items,
            ...(savedVis.items ?? {}),
          },
          sectionOrder: savedVis.sectionOrder ?? DEFAULT_VISIBILITY.sectionOrder,
        }
        setVisibility(merged)
        setSavedVisibility(merged)
      }
      setIsLoading(false)
    }
    load()
  }, [resumeId, userId, supabase, router])

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
        .update({
          parsed_data: resumeData,
          builder_visibility: visibility,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resumeId)
        .eq('user_id', userId)
      if (error) {
        console.error('Auto-save failed:', error.message, error.code, error.details)
        setIsSaving(false)
        return
      }
      setSavedData(resumeData)
      setSavedVisibility(visibility)
      setIsSaving(false)
    }, 500)
    return () => clearTimeout(saveTimerRef.current)
  }, [resumeData, visibility, supabase, resumeId, userId])

  const hasUnsavedChanges =
    !!resumeData && (
      JSON.stringify(resumeData) !== JSON.stringify(savedData) ||
      JSON.stringify(visibility) !== JSON.stringify(savedVisibility)
    )

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
    setExpandedSection(sectionId)
    setSectionHints(prev => new Set(prev).add(sectionId))
  }

  const visibleData = useMemo(
    () => resumeData ? getVisibleResumeData(resumeData, visibility) : null,
    [resumeData, visibility]
  )

  async function handleDownloadDOCX() {
    if (!requirePro('docx_download') || !resumeData || !visibleData) return
    await generateDOCX(visibleData, `${resumeTitle || 'resume'}.docx`)
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
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #builder-print-wrapper,
          #builder-print-wrapper * { visibility: visible; }
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
                analysis={tailorAnalysis}
                isTailoring={isTailoring}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                onAnalyse={handleAnalyse}
                onApplySuggestion={handleApplySuggestion}
              />
            ) : (
              <SectionList
                resumeData={resumeData}
                visibility={visibility}
                expandedSection={expandedSection}
                sectionHints={sectionHints}
                onDataChange={handleDataChange}
                onVisibilityChange={setVisibility}
                onExpandSection={(id) => setExpandedSection(id)}
              />
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
                data={visibleData ?? resumeData}
                isEditing={false}
                onFieldChange={() => {}}
                sectionOrder={getOrderedSections(visibility)}
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
  const [isMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const router = useRouter()
  const supabase = createClient()

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
  }, [supabase, router])

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
