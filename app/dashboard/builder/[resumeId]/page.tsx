'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { FONT_OPTIONS } from '@/lib/templateOptions'
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
  Undo2,
  Redo,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProGate } from '@/lib/hooks/useProGate'
import { PlanProvider } from '@/lib/context/PlanContext'
import ProGateModal from '@/components/shared/ProGateModal'
import TemplateCustomizerModal from '@/components/builder/TemplateCustomizerModal'
import TailorPanel from '@/components/builder/TailorPanel'
import AIInsightsPanel from '@/components/builder/AIInsightsPanel'
import SectionList from '@/components/builder/SectionList'
import { getVisibleResumeData, getOrderedSections, getOrderedSidebarSections } from '@/lib/visibilityUtils'
import type { BuilderVisibility, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY, DEFAULT_UNIVERSAL_CONFIG, EMPTY_RESUME_DATA, getPresetConfig } from '@/types'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { generateDOCX } from '@/lib/docxGenerator'
import { useUndoHistory } from '@/lib/undoHistory'
import type { ResumeData, BuilderMode, TailorAnalysis, Profile } from '@/types'


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
  const [templateConfig, setTemplateConfig] = useState<UniversalConfig>(DEFAULT_UNIVERSAL_CONFIG)
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
  const [zoomDelta, setZoomDelta] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [visibility, setVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedVisibility, setSavedVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedTemplateConfig, setSavedTemplateConfig] = useState<UniversalConfig | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const resumeRef = useRef<HTMLDivElement>(null)
  const hasShownPageLimitAlertRef = useRef(false)
  const userId = profile.id
  const history = useUndoHistory()

  // Sync visibility density with template config density
  useEffect(() => {
    setVisibility(prev => ({ ...prev, density: templateConfig.density }))
  }, [templateConfig.density])

  const [resumeHeight, setResumeHeight] = useState(0)
  const [pageBreakY, setPageBreakY] = useState(0) // actual safe break point measured from DOM

  const recomputeResumeHeight = useCallback(() => {
    const el = resumeRef.current
    if (!el) return
    const measured = Math.max(el.scrollHeight, el.getBoundingClientRect().height)
    if (Number.isFinite(measured) && measured > 0) {
      setResumeHeight(measured)
    }
  }, [])

  // Measure resume height after render
  useEffect(() => {
    const el = resumeRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement
        setResumeHeight(Math.max(entry.contentRect.height, target.scrollHeight))
      }
    })
    observer.observe(el)
    recomputeResumeHeight()
    return () => observer.disconnect()
  }, [resumeRef, recomputeResumeHeight])

  // Fallback: force re-measure when content/layout inputs change
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      recomputeResumeHeight()
    })
    return () => window.cancelAnimationFrame(id)
  }, [recomputeResumeHeight, resumeData, visibility, templateConfig])

  // Compute safe page-break point: find the last content element whose bottom
  // fits fully within CONTENT_H so no line is ever clipped mid-glyph.
  useEffect(() => {
    const container = resumeRef.current
    if (!container || resumeHeight === 0) return

    const CONTENT_LIMIT = 1123 - 50 // PAGE_H - PAGE_BOTTOM_PADDING

    const containerTop = container.getBoundingClientRect().top
    const elements = container.querySelectorAll('li, p, h1, h2, h3, h4')

    let safe = 0
    for (const el of Array.from(elements)) {
      const rect = el.getBoundingClientRect()
      const bottom = rect.bottom - containerTop
      if (bottom <= CONTENT_LIMIT && bottom > safe) {
        safe = bottom
      }
    }

    setPageBreakY(safe > 0 ? safe : CONTENT_LIMIT)
  }, [resumeHeight, resumeData, visibility, templateConfig])

  const ZOOM_STEP = 0.05
  const effectiveScale = Math.min(1.5, Math.max(0.3, 1.0 + zoomDelta))

  const PAGE_H = 1123 // A4 at 96 DPI
  const PAGE_GAP = 48 // Gap between pages
  const PAGE_BOTTOM_PADDING = 50 // Safe zone at bottom of each page
  const CONTENT_H = PAGE_H - PAGE_BOTTOM_PADDING // 1073px — max usable content height per page
  const MAX_PAGES = 2
  const pageCount = Math.max(1, Math.ceil(resumeHeight / CONTENT_H))
  const renderedPageCount = Math.min(pageCount, MAX_PAGES)
  const isOverPageLimit = pageCount > MAX_PAGES

  useEffect(() => {
    if (isOverPageLimit && !hasShownPageLimitAlertRef.current) {
      hasShownPageLimitAlertRef.current = true
      window.alert('Your resume is over 2 pages. Keep it to 1-2 pages for best results. Please trim content before continuing.')
    }
    if (!isOverPageLimit) {
      hasShownPageLimitAlertRef.current = false
    }
  }, [isOverPageLimit])

  // ── Load resume on mount ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (resumeId === 'new') {
        router.replace('/dashboard/builder/draft')
        return
      }

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

      // Load saved template config from DB
      const savedTemplateConfig = (resume as Record<string, unknown>).template_config as UniversalConfig | null

      // Build final config: start with saved or default, then apply URL overrides
      let config: UniversalConfig = savedTemplateConfig
        ? { ...savedTemplateConfig }
        : { ...DEFAULT_UNIVERSAL_CONFIG }

      // Apply URL param overrides
      const templateParam = searchParams.get('template')
      if (templateParam) {
        config = { ...config, ...getPresetConfig(templateParam as any) }
      }
      const accentParam = searchParams.get('accent')
      if (accentParam) config.accentColor = accentParam
      const fontParam = searchParams.get('font')
      if (fontParam) {
        const font = FONT_OPTIONS.find((f) => f.id === fontParam)
        if (font) config.fontFamily = font.value
      }
      const layoutParam = searchParams.get('layout') as 'single-column' | 'sidebar' | undefined
      if (layoutParam) config.layout = layoutParam
      const headerParam = searchParams.get('header') as 'banner' | 'sidebar-integrated' | 'minimal' | undefined
      if (headerParam) config.headerStyle = headerParam
      const bulletParam = searchParams.get('bullet') as 'plain' | 'timeline' | undefined
      if (bulletParam) config.bulletStyle = bulletParam
      const densityParam = searchParams.get('density') as 'compressed' | 'relaxed' | undefined
      if (densityParam) config.density = densityParam

      setTemplateConfig(config)
      setSavedTemplateConfig(config)

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
          sidebarSectionOrder: savedVis.sidebarSectionOrder ?? DEFAULT_VISIBILITY.sidebarSectionOrder,
          density: savedVis.density ?? 'relaxed',
        }
        setVisibility(merged)
        setSavedVisibility(merged)
      } else {
        // If no saved visibility, use default
        setVisibility(DEFAULT_VISIBILITY)
        setSavedVisibility(DEFAULT_VISIBILITY)
      }
      setIsLoading(false)
    }
    load()
  }, [resumeId, userId, supabase, router])

  // previewScale kept for potential future use; default zoom is always 100%

  const hasUnsavedChanges =
    !!resumeData && (
      JSON.stringify(resumeData) !== JSON.stringify(savedData) ||
      JSON.stringify(visibility) !== JSON.stringify(savedVisibility) ||
      JSON.stringify(templateConfig) !== JSON.stringify(savedTemplateConfig)
    )

  async function forceSave() {
    if (!resumeData || !hasUnsavedChanges || isSaving) return
    if (isOverPageLimit) {
      window.alert('Saving is blocked because your resume exceeds 2 pages. Please shorten content to continue.')
      return
    }

    // Define what constitutes a truly 'empty' resume to avoid ghost records on new drafts.
    // If it's a new draft, we only save if the user has actually done something.
    if (resumeId === 'draft') {
      const isDataEmpty = 
        !resumeData.name?.trim() && 
        !resumeData.email?.trim() &&
        !resumeData.phone?.trim() &&
        !resumeData.summary?.trim() &&
        !resumeData.location?.trim() &&
        !resumeData.linkedin?.trim() &&
        !resumeData.website?.trim() &&
        resumeData.experience.length === 0 &&
        resumeData.education.length === 0 &&
        resumeData.skills.length === 0 &&
        resumeData.projects.length === 0 &&
        resumeData.certifications.length === 0 &&
        resumeData.languages.length === 0 &&
        resumeData.volunteer.length === 0 &&
        resumeData.awards.length === 0 &&
        resumeData.publications.length === 0 &&
        (!resumeData.customSections || resumeData.customSections.length === 0)

      const isTemplateDefault = 
        JSON.stringify(templateConfig) === JSON.stringify(DEFAULT_UNIVERSAL_CONFIG) &&
        JSON.stringify(visibility) === JSON.stringify(DEFAULT_VISIBILITY)

      // If everything is untouched, don't create a database record yet
      if (isDataEmpty && isTemplateDefault) return
    }

    setIsSaving(true)
    clearTimeout(saveTimerRef.current)

    try {
      if (resumeId === 'draft') {
        const { data, error } = await supabase
          .from('resumes')
          .insert({
            user_id: userId,
            title: resumeTitle || 'Untitled Resume',
            parsed_data: resumeData,
            builder_visibility: visibility,
            template_config: templateConfig,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (error) throw error

        if (data) {
          setSavedData(resumeData)
          setSavedVisibility(visibility)
          setSavedTemplateConfig(templateConfig)
          router.replace(`/dashboard/builder/${data.id}`)
        }
      } else {
        const { error } = await supabase
          .from('resumes')
          .update({
            title: resumeTitle || 'Untitled Resume',
            parsed_data: resumeData,
            builder_visibility: visibility,
            template_config: templateConfig,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resumeId)
          .eq('user_id', userId)

        if (error) throw error

        setSavedData(resumeData)
        setSavedVisibility(visibility)
        setSavedTemplateConfig(templateConfig)
      }
    } catch (err: any) {
      console.error('Persistence Error Details:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        fullError: err
      })
    } finally {
      setIsSaving(false)
    }
  }

  // ── Resizable Panels ────────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(420)
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
  }, [resumeData, visibility, templateConfig])

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
    if (resumeData) history.pushHistory(resumeData, visibility)
    setResumeData(updated)
  }

  function handleVisibilityChange(updated: BuilderVisibility) {
    if (resumeData) history.pushHistory(resumeData, visibility)
    setVisibility(updated)
  }

  function handleUndo() {
    if (!resumeData) return
    const entry = history.undo()
    if (!entry) return
    setResumeData(entry.data)
    setVisibility(entry.visibility)
  }

  function handleRedo() {
    if (!resumeData) return
    const entry = history.redo()
    if (!entry) return
    setResumeData(entry.data)
    setVisibility(entry.visibility)
  }

  // Keyboard shortcuts: Ctrl+Z / Cmd+Z for undo, Ctrl+Shift+Z / Cmd+Shift+Z for redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if (mod && e.key === 'Z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      } else if (mod && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

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

  async function handleApplyAIInsightFix(suggestion: {
    beforeText: string
    afterText: string
    sectionHint: string
  }) {
    setIsApplyingFix(true)
    try {
      const resumeText = buildResumeTextForFix(resumeData!)
      const res = await fetch('/api/ats/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeText: suggestion.beforeText,
          afterText: suggestion.afterText,
          sectionHint: suggestion.sectionHint,
          resumeContext: resumeText,
        }),
      })

      if (!res.ok) {
        console.error('Apply fix failed:', res.status)
        return
      }

      const json = await res.json()
      if (json.success && json.data?.newText) {
        // Apply the fix to the corresponding section in resumeData
        applyFixToResumeData(resumeData!, suggestion.sectionHint, suggestion.beforeText, json.data.newText)
      }
    } finally {
      setIsApplyingFix(false)
    }
  }

  function buildResumeTextForFix(data: ResumeData): string {
    const parts: string[] = []
    if (data.name) parts.push(data.name)
    if (data.summary) parts.push(`Summary: ${data.summary}`)
    for (const exp of data.experience) {
      parts.push(`${exp.title} at ${exp.company}: ${exp.bullets.join(' | ')}`)
    }
    for (const edu of data.education) {
      parts.push(`${edu.degree} in ${edu.field} at ${edu.institution}`)
    }
    if (data.skills.length) parts.push(`Skills: ${data.skills.join(', ')}`)
    for (const proj of data.projects) {
      parts.push(`${proj.name}: ${proj.description}`)
    }
    return parts.join('\n')
  }

  function applyFixToResumeData(
    data: ResumeData,
    sectionHint: string,
    oldText: string,
    newText: string
  ) {
    const updated = structuredClone(data)

    if (sectionHint === 'experience') {
      for (let i = 0; i < updated.experience.length; i++) {
        const exp = updated.experience[i]
        const bullets = [...exp.bullets]
        const idx = bullets.findIndex(b => b.includes(oldText.substring(0, 30)) || oldText.includes(b.substring(0, 30)))
        if (idx !== -1) {
          bullets[idx] = newText
          updated.experience[i] = { ...updated.experience[i], bullets }
          handleDataChange(updated)
          return
        }
      }
    }

    if (sectionHint === 'summary') {
      updated.summary = newText
      handleDataChange(updated)
      return
    }

    if (sectionHint === 'skills') {
      updated.skills = newText.split(',').map(s => s.trim()).filter(Boolean)
      handleDataChange(updated)
      return
    }

    // Fallback: just replace in summary or first empty field
    updated.summary = newText
    handleDataChange(updated)
  }

  const visibleData = useMemo(
    () => resumeData ? getVisibleResumeData(resumeData, visibility) : null,
    [resumeData, visibility]
  )

  function accentToSidebarFill(hex?: string | null): string {
    if (typeof hex !== 'string') return '#6366f115'
    const normalized = hex.trim().replace('#', '')
    if (!normalized) return '#6366f115'
    const six = normalized.length === 3
      ? normalized.split('').map(ch => ch + ch).join('')
      : normalized
    if (!/^[0-9a-fA-F]{6}$/.test(six)) return '#6366f115'
    return `#${six}15`
  }

  async function handleDownloadPDF() {
    if (isOverPageLimit) {
      window.alert('Download is blocked because your resume exceeds 2 pages. Please shorten content to continue.')
      return
    }
    const printEl = document.getElementById('builder-print-wrapper')
    if (!printEl) return

    // Temporarily expose element for html2canvas (normally opacity-0, off-screen)
    const prevStyle = { opacity: printEl.style.opacity, left: printEl.style.left, position: printEl.style.position }
    printEl.style.opacity = '1'
    printEl.style.left = '-9999px'
    printEl.style.position = 'fixed'

    try {
      const { default: html2canvas } = await import('html2canvas')
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default

      const canvas = await html2canvas(printEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 794,
        height: printEl.scrollHeight,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // html2canvas 1.x can't parse modern CSS color functions (lab, oklch, color-mix).
          // Patch every <style> tag in the clone to replace them with safe fallbacks.
          const unsupportedColor = /\b(?:lab|oklch|lch|oklab|color-mix|color)\([^)]*\)/g
          for (const el of Array.from(clonedDoc.querySelectorAll('style'))) {
            if (el.textContent) {
              el.textContent = el.textContent.replace(unsupportedColor, 'transparent')
            }
          }
          // Ensure the root background is white so no bleed-through
          clonedDoc.documentElement.style.backgroundColor = '#ffffff'
          clonedDoc.body.style.backgroundColor = '#ffffff'
        },
      })

      const PDF_W = 595.28  // A4 width in pt
      // Map canvas pixel width → PDF pt width
      const pxToPt = PDF_W / canvas.width

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

      const totalPx = canvas.height
      // Safe break in canvas pixel space (pageBreakY is in CSS px, canvas is 2× scale)
      const breakPx = pageBreakY > 0 ? Math.round(pageBreakY * 2) : totalPx

      function addCanvasSlice(srcY: number, srcH: number) {
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = srcH
        slice.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
        const imgH = srcH * pxToPt
        pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, PDF_W, imgH)
      }

      // Page 1
      addCanvasSlice(0, Math.min(breakPx, totalPx))

      // Page 2 (only if content overflows)
      if (totalPx > breakPx) {
        pdf.addPage()
        addCanvasSlice(breakPx, totalPx - breakPx)
      }

      pdf.save(`${resumeTitle || 'resume'}.pdf`)
    } finally {
      printEl.style.opacity = prevStyle.opacity
      printEl.style.left = prevStyle.left
      printEl.style.position = prevStyle.position
    }
    setIsDownloadOpen(false)
  }

  async function handleDownloadDOCX() {
    if (!requirePro('docx_download') || !resumeData || !visibleData) return
    if (isOverPageLimit) {
      window.alert('Download is blocked because your resume exceeds 2 pages. Please shorten content to continue.')
      return
    }
    await generateDOCX(
      visibleData,
      `${resumeTitle || 'resume'}.docx`,
      templateConfig,
      getOrderedSections(visibility),
      getOrderedSidebarSections(visibility),
    )
    setIsDownloadOpen(false)
  }

  const TemplateComponent = UniversalTemplate

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
            position: absolute;
            top: 0; left: 0;
            width: 794px;
            height: auto !important;
            overflow: visible !important;
            transform: none !important;
            background: white;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          #builder-print-wrapper > div {
            page-break-inside: auto;
          }
          #builder-print-wrapper section,
          #builder-print-wrapper .section-break {
            page-break-inside: avoid;
          }
        }
        
        .glass-nav {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
        }
        .resume-canvas {
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
        }
      `}</style>
      
      {/* ── Optic Curator Layout Root ── */}
      <div className="bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
        
        {/* ── TopNavBar ── */}
        <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant/10 flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-emerald-900 tracking-tight font-headline">Rezoomed</span>
            <Link href="/dashboard/resumes" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors text-sm font-medium">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div className="w-px h-4 bg-zinc-200" />
            <input
              type="text"
              value={resumeTitle}
              onChange={e => setResumeTitle(e.target.value)}
              onBlur={async () => {
                if (resumeId === 'draft') return
                await supabase
                  .from('resumes')
                  .update({ title: resumeTitle || 'Untitled Resume' })
                  .eq('id', resumeId)
                  .eq('user_id', userId)
              }}
              placeholder="Untitled Resume"
              className="text-sm font-semibold text-zinc-700 bg-transparent border-none outline-none focus:bg-white focus:px-2 focus:border focus:border-zinc-200 focus:rounded-md focus:shadow-sm transition-all w-48 truncate placeholder:text-zinc-400 placeholder:font-normal"
            />
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
            {/* Style button — prominent green glass */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="relative w-28 py-2 text-sm font-bold text-white rounded-xl overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.25)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.25)'
              }}
            >
              {/* shimmer sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <span className="relative z-10 flex items-center gap-1.5">
                <Sparkles size={14} />
                Style
              </span>
            </button>

            {/* Zoom controls */}
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setZoomDelta(d => Math.max(d - ZOOM_STEP, 0.3 - 1.0))}
                disabled={effectiveScale <= 0.3}
                className="px-2.5 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border-r border-zinc-200"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="px-2.5 text-[11px] font-bold text-zinc-500 tabular-nums select-none">
                {Math.round(effectiveScale * 100)}%
              </span>
              <button
                onClick={() => setZoomDelta(d => Math.min(d + ZOOM_STEP, 1.5 - 1.0))}
                disabled={effectiveScale >= 1.5}
                className="px-2.5 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border-l border-zinc-200"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="w-28 py-2 text-sm font-bold bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <span>Download</span>
                <ChevronDown size={14} />
              </button>
              {isDownloadOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg border border-gray-100 shadow-lg py-1 w-36 z-[100]">
                  <button
                    onClick={handleDownloadPDF}
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
          <aside style={{ width: leftWidth }} className="bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto flex flex-col shrink-0 relative">
             <SectionList
               resumeData={resumeData}
               visibility={visibility}
               layout={templateConfig.layout}
               expandedSection={expandedSection}
               sectionHints={sectionHints}
               onDataChange={handleDataChange}
               onVisibilityChange={handleVisibilityChange}
               onExpandSection={(id) => setExpandedSection(id)}
               isDisabled={isApplyingFix}
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
            <div className="mx-auto flex justify-between items-center mb-6" style={{ width: 794 * effectiveScale }}>
              <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1.5 rounded-full shadow-sm">
                <button
                  onClick={() => setTemplateConfig({ ...templateConfig, density: 'compressed' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                    templateConfig.density === 'compressed' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Compressed
                </button>
                <div className="w-px h-4 bg-zinc-200"></div>
                <button
                  onClick={() => setTemplateConfig({ ...templateConfig, density: 'relaxed' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                    templateConfig.density === 'relaxed' || !templateConfig.density ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Relaxed
                </button>
              </div>
              
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

            {/* Hidden full-flow content: measurement + print source */}
            <div
              ref={resumeRef}
              id="builder-print-wrapper"
              className="absolute -left-[99999px] top-0 w-[794px] opacity-0 pointer-events-none"
              aria-hidden
            >
              <TemplateComponent
                data={visibleData ?? resumeData}
                isEditing={false}
                onFieldChange={() => {}}
                sectionOrder={getOrderedSections(visibility)}
                sidebarSectionOrder={getOrderedSidebarSections(visibility)}
                config={templateConfig}
              />
            </div>

            {/* Word-like paged preview + undo/redo to the right */}
            <div className="flex items-start gap-3">
            <div
              className="print:hidden relative"
              style={{
                width: 794 * effectiveScale,
                height: ((renderedPageCount * PAGE_H) + (Math.max(0, renderedPageCount - 1) * PAGE_GAP)) * effectiveScale,
              }}
            >
              <div
                style={{
                  width: '794px',
                  height: `${(renderedPageCount * PAGE_H) + (Math.max(0, renderedPageCount - 1) * PAGE_GAP)}px`,
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {Array.from({ length: renderedPageCount }, (_, pageIndex) => (
                  <div
                    key={`page-${pageIndex}`}
                    className="absolute left-0 bg-white"
                    style={{
                      top: pageIndex * (PAGE_H + PAGE_GAP),
                      width: '794px',
                      height: `${PAGE_H}px`,
                      boxShadow: isOverPageLimit && pageIndex === MAX_PAGES - 1
                        ? '0 0 0 2px #fca5a5, 0 4px 24px rgba(0,0,0,0.18)'
                        : '0 4px 24px rgba(0,0,0,0.18)',
                    }}
                  >
                    {/* Full-page template shell so page styling continues to page bottom */}
                    {(templateConfig.layout === 'sidebar' || templateConfig.layout === 'sidebar-left' || templateConfig.layout === 'sidebar-right') && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                      >
                        <div
                          className="absolute top-0 bottom-0"
                          style={{
                            width: `${templateConfig.density === 'compressed' ? 192 : 256}px`,
                            backgroundColor: accentToSidebarFill(templateConfig.accentColor),
                            ...(templateConfig.layout === 'sidebar-right' ? { right: 0 } : { left: 0 }),
                          }}
                        />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 z-20 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200/80">
                      Page {pageIndex + 1}
                    </div>

                    <div
                      className="relative overflow-hidden w-full z-10"
                      style={(() => {
                        if (pageIndex === 0) {
                          // Page 1: clip at pageBreakY, leaving (PAGE_H - pageBreakY) as bottom padding
                          return { marginTop: 0, height: `${pageBreakY}px` }
                        }
                        // Page 2+: top padding mirrors page 1's bottom padding
                        const topPad = PAGE_H - pageBreakY
                        return { marginTop: topPad, height: `${PAGE_H - topPad - PAGE_BOTTOM_PADDING}px` }
                      })()}
                    >
                      <div
                        style={{
                          width: '794px',
                          transform: `translateY(-${pageIndex === 0 ? 0 : pageBreakY}px)`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <TemplateComponent
                          data={visibleData ?? resumeData}
                          isEditing={false}
                          onFieldChange={() => {}}
                          sectionOrder={getOrderedSections(visibility)}
                          sidebarSectionOrder={getOrderedSidebarSections(visibility)}
                          config={templateConfig}
                        />
                      </div>
                    </div>

                    {isOverPageLimit && pageIndex === MAX_PAGES - 1 && (
                      <div className="absolute bottom-0 left-0 right-0 z-30 bg-red-50 border-t border-red-200 text-red-700 text-[11px] font-bold px-4 py-2">
                        Resume content beyond 2 pages is hidden. Keep your resume to 1-2 pages max.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

              {/* Undo/Redo — sticky alongside the preview */}
              <div className="sticky top-8 flex flex-col gap-2">
                <button
                  onClick={handleUndo}
                  disabled={!history.canUndo}
                  className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-lg shadow-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!history.canRedo}
                  className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-lg shadow-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo size={16} />
                </button>
              </div>
            </div>

            {isOverPageLimit && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-xs font-semibold">
                Your resume is currently {pageCount} pages. Resumes over 2 pages are blocked. Trim content to continue.
              </div>
            )}
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
                  <AIInsightsPanel
                    resumeData={resumeData}
                    onApplyFix={handleApplyAIInsightFix}
                    isApplyingFix={isApplyingFix}
                    resumeId={resumeId}
                    isPro={isPro}
                  />
                )
              )}
            </div>
          </aside>
          
        </main>
      </div>

      <TemplateCustomizerModal
        isOpen={isTemplateModalOpen}
        config={templateConfig}
        onConfigChange={setTemplateConfig}
        onClose={() => setIsTemplateModalOpen(false)}
        resumeData={resumeData}
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
