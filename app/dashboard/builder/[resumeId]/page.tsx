'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  ArrowLeft,
  CloudUpload,
  Cloud,
  Check,
  Wand2,
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
import { DEFAULT_VISIBILITY, EMPTY_RESUME_DATA } from '@/types'
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

  // ── Load resume on mount ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (resumeId === 'draft') {
        setResumeData(EMPTY_RESUME_DATA)
        setSavedData(EMPTY_RESUME_DATA)
        setResumeTitle('Untitled Resume')
        setIsLoading(false)
        return
      }

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
          density: savedVis.density ?? 'relaxed',
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
      // Adjusted padding for the new Optic layout
      setPreviewScale(Math.min(1.0, (window.innerHeight - 100) / 1123))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const hasUnsavedChanges =
    !!resumeData && (
      JSON.stringify(resumeData) !== JSON.stringify(savedData) ||
      JSON.stringify(visibility) !== JSON.stringify(savedVisibility)
    )

  async function forceSave() {
    if (!resumeData || !hasUnsavedChanges || isSaving) return

    // Define what constitutes an 'empty' resume to avoid saving ghost records
    const isEmpty = 
      !resumeData.name?.trim() && 
      !resumeData.summary?.trim() &&
      resumeData.experience.length === 0 &&
      resumeData.education.length === 0 &&
      resumeData.skills.length === 0 &&
      resumeData.projects.length === 0

    if (isEmpty && resumeId === 'draft') return

    setIsSaving(true)
    clearTimeout(saveTimerRef.current)

    if (resumeId === 'draft') {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          title: resumeTitle || 'Untitled Resume',
          parsed_data: resumeData,
          builder_visibility: visibility,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error inserting draft:', error)
        setIsSaving(false)
        return
      }

      if (data) {
        setSavedData(resumeData)
        setSavedVisibility(visibility)
        setIsSaving(false)
        // Transition from draft to real ID without a full reload if possible, 
        // but router.replace is safest to sync all components.
        router.replace(`/dashboard/builder/${data.id}`)
      }
      return
    }

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
  }

  // ── Resizable Panels ────────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(360) // Increased from 288 for better breathing room
  const [rightWidth, setRightWidth] = useState(320) // Matches previous w-80 (20rem = 320px)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(240, Math.min(800, e.clientX)))
      } else if (isDraggingRight) {
        setRightWidth(Math.max(280, Math.min(800, window.innerWidth - e.clientX)))
      }
    }

    function handleMouseUp() {
      setIsDraggingLeft(false)
      setIsDraggingRight(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDraggingLeft, isDraggingRight])

  // ── Auto-save (debounced 500ms) ─────────────────────────────────────────────
  useEffect(() => {
    if (!resumeData || !hasUnsavedChanges) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      forceSave()
    }, 1500)
    return () => clearTimeout(saveTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, visibility])

  // ── Instant auto-save on clicking out of section ─────────────────────────────
  useEffect(() => {
    if (hasUnsavedChanges) {
      forceSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSection])

  // ── beforeunload guard ──────────────────────────────────────────────────────
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
  
  function handleVisibilityChange(updated: BuilderVisibility) {
    setVisibility(updated)
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
    if (activeMode !== 'builder') setActiveMode('builder')
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
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
        
        .glass-nav {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
        }
        .resume-canvas {
            aspect-ratio: 1 / 1.414;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
        }
      `}</style>
      
      {/* ── Optic Curator Layout Root ── */}
      <div className="bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
        
        {/* ── TopNavBar ── */}
        <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant/10 flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-6">
              <span className="text-xl font-bold text-emerald-900 tracking-tight font-headline">Rezoomed</span>
            <Link href="/dashboard/resumes" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors text-sm font-medium">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          </div>
          
          {/* Builder / Tailor Toggle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex bg-surface-container-low p-1 rounded-full">
            <button
              onClick={() => setActiveMode('builder')}
              className={`px-6 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all ${
                activeMode === 'builder' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              BUILDER
            </button>
            <button
              onClick={handleTailorClick}
              className={`px-6 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all flex justify-center items-center ${
                activeMode === 'tailor' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              TAILOR
              {!isPro && <span className="ml-1 text-[10px] text-amber-500 font-bold tracking-tighter">PRO</span>}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100/50 rounded-lg transition-all"
            >
              Template
            </button>
            
            {/* Save Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100/50 text-zinc-500 border border-zinc-200/50 transition-all duration-300">
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 animate-pulse opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Cloud className="w-4 h-4 fill-emerald-500/20 text-emerald-500" />
                    <Check className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-white bg-emerald-500 rounded-full p-0.5" strokeWidth={4} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">All changes saved</span>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="px-4 py-2 text-sm font-semibold bg-primary-container text-on-primary-container rounded-lg flex items-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <ChevronDown size={18} />
                <span>Download</span>
              </button>
              {isDownloadOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg border border-gray-100 shadow-lg py-1 w-36 z-[100]">
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

        {/* ── Main Workspace ── */}
        <main className="flex h-screen pt-16">
          
          {/* Left Sidebar: EDITOR SECTIONS */}
          <aside style={{ width: leftWidth }} className="bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto flex flex-col shrink-0">
             <SectionList
               resumeData={resumeData}
               visibility={visibility}
               expandedSection={expandedSection}
               sectionHints={sectionHints}
               onDataChange={handleDataChange}
               onVisibilityChange={handleVisibilityChange}
               onExpandSection={(id) => setExpandedSection(id)}
             />
          </aside>

          {/* Left Handle */}
          <div 
            className="w-1 bg-transparent hover:bg-emerald-500/30 cursor-col-resize z-10 shrink-0 select-none scale-x-150 transition-colors"
            onMouseDown={() => setIsDraggingLeft(true)}
          />

          {/* Center Canvas */}
          <section className="flex-1 overflow-y-auto bg-surface-container flex flex-col items-center py-8 px-8 min-w-[500px]">
            {/* Canvas Tools */}
            <div className="w-full max-w-[800px] flex justify-between items-center mb-6">
              <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1.5 rounded-full shadow-sm">
                <button
                  onClick={() => setVisibility({ ...visibility, density: 'compressed' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                    visibility.density === 'compressed' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Compressed
                </button>
                <div className="w-px h-4 bg-zinc-200"></div>
                <button
                  onClick={() => setVisibility({ ...visibility, density: 'relaxed' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                    visibility.density === 'relaxed' || !visibility.density ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Relaxed
                </button>
              </div>
              
              {/* Cloud Save Logic Status Badge */}
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm">
                {isSaving ? (
                  <>
                    <CloudUpload size={16} className="text-zinc-400 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <button 
                    onClick={forceSave} 
                    className="flex items-center gap-2 hover:bg-zinc-100 p-1.5 -mx-1.5 rounded-md transition-colors active:scale-95"
                    title="Click to instantly push changes"
                  >
                    <Cloud size={16} className="text-amber-400" />
                    <span className="text-amber-500">Unsaved changes</span>
                  </button>
                ) : (
                  <>
                    <div className="relative">
                      <Cloud size={16} fill="currentColor" className="text-primary" />
                      <Check size={8} strokeWidth={4} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%]" />
                    </div>
                    <span className="text-zinc-500">All changes saved</span>
                  </>
                )}
              </div>
            </div>

            {/* The Resume */}
            <div
              id="builder-print-wrapper"
              className="resume-canvas bg-white"
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
                density={visibility.density ?? 'relaxed'}
              />
            </div>
          </section>

          {/* Right Handle */}
          {!isRightCollapsed && (
            <div 
              className="w-1 bg-transparent hover:bg-emerald-500/30 cursor-col-resize z-10 shrink-0 select-none scale-x-150 transition-colors"
              onMouseDown={() => setIsDraggingRight(true)}
            />
          )}

          {/* Right Sidebar: AI INSIGHTS / TAILOR */}
          <aside 
            style={{ width: isRightCollapsed ? 48 : rightWidth }} 
            className="bg-surface-container-lowest border-l border-outline-variant/10 flex flex-col shrink-0 relative transition-all duration-300"
          >
            {/* Collapse Toggle */}
            <button
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className={`absolute top-4 ${isRightCollapsed ? 'left-1/2 -translate-x-1/2' : 'left-[-24px]'} z-50 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-primary shadow-sm hover:shadow-md active:scale-95 transition-all`}
              title={isRightCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
            >
              {isRightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            <div className="flex-1 flex flex-col overflow-hidden">
              {isRightCollapsed ? (
                <div className="flex-1 flex flex-col items-center pt-16 gap-8">
                  <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
                    {activeMode === 'tailor' ? 'Tailor Mode' : 'AI Assistant'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <Star size={16} />
                  </div>
                </div>
              ) : (
                activeMode === 'tailor' ? (
                  <TailorPanel
                    analysis={tailorAnalysis}
                    isTailoring={isTailoring}
                    jobDescription={jobDescription}
                    onJobDescriptionChange={setJobDescription}
                    onAnalyse={handleAnalyse}
                    onApplySuggestion={handleApplySuggestion}
                  />
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                      <div className="mb-8">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">AI Insights</h2>
                        {/* Score Meter */}
                        <div className="relative flex flex-col items-center p-6 bg-surface-container-low rounded-3xl mb-8">
                          <div className="w-24 h-24 rounded-full border-[6px] border-zinc-200 flex items-center justify-center relative">
                            <div className="absolute inset-[-6px] rounded-full border-[6px] border-primary" style={{ clipPath: "polygon(0 0, 100% 0, 100% 84%, 0 84%)" }}></div>
                            <span className="text-3xl font-black text-zinc-800 tracking-tighter">84</span>
                          </div>
                          <span className="mt-4 text-[13px] font-bold text-zinc-700">Resume Strength: Good</span>
                          <p className="mt-1 text-[11px] text-zinc-500 text-center leading-tight">Your summary is strong, but work experience needs more metrics.</p>
                        </div>
                        
                        {/* Suggestion Cards */}
                        <div className="space-y-4">
                          <div className="p-4 bg-primary-container/20 rounded-2xl border border-primary-container/30">
                            <div className="flex items-start gap-3 mb-2">
                              <Wand2 className="text-primary text-lg" size={18} />
                              <h3 className="text-xs font-bold text-on-primary-container uppercase">Action Verb Suggestion</h3>
                            </div>
                            <p className="text-xs text-on-secondary-container leading-normal">
                              Replace <span className="font-bold underline decoration-primary">"Led"</span> with <span className="font-bold text-primary italic">"Orchestrated"</span> for stronger impact.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Tailoring CTA */}
                    <div className="p-6 bg-zinc-900 text-white rounded-t-[2rem]">
                      <div className="flex items-center gap-2 mb-3">
                        <Wand2 className="text-primary-container" size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tailor for Job</span>
                      </div>
                      <p className="text-xs text-zinc-300 mb-4 leading-relaxed">Instantly adjust your resume keywords for a specific job description.</p>
                      <button 
                        onClick={handleTailorClick}
                        className="w-full py-2.5 bg-primary-container text-on-primary-container text-sm font-bold rounded-xl active:scale-95 transition-all"
                      >
                        Start Tailoring
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </aside>
          
        </main>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center font-body">
      <h1 className="text-xl font-bold text-zinc-900 mb-2 font-headline">Builder works best on desktop</h1>
      <p className="text-sm text-zinc-500 mb-6">
        The resume builder requires a larger screen. Use a laptop or desktop to edit your resume.
      </p>
      <div className="flex flex-col gap-3">
        <Link href={`/dashboard/resumes/${resumeId}`} className="text-sm font-semibold text-primary hover:underline">
          View Resume
        </Link>
        <Link href="/dashboard/ats-checker" className="text-sm font-semibold text-primary hover:underline">
          Run ATS Check
        </Link>
        <Link href="/dashboard/templates" className="text-sm font-semibold text-primary hover:underline">
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
  const [isMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false) // Updated breakpoint to handle 3 columns comfortably
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
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
