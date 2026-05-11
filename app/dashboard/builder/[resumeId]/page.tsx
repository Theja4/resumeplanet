'use client'

import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { flushSync } from 'react-dom'
import { FONT_OPTIONS, sanitizeUniversalConfig } from '@/lib/templateOptions'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
  X,
  Loader2,
  ArrowLeft,
  CloudUpload,
  Cloud,
  CloudOff,
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
import { countWords } from '@/lib/text'
import ProGateModal from '@/components/shared/ProGateModal'
import TemplateCustomizerModal from '@/components/builder/TemplateCustomizerModal'
import TailorPanel from '@/components/builder/TailorPanel'
import AIInsightsPanel from '@/components/builder/AIInsightsPanel'
import SectionList from '@/components/builder/SectionList'
import { getVisibleResumeData, getOrderedSections, getOrderedSidebarSections } from '@/lib/visibilityUtils'
import type { BuilderVisibility, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY, DEFAULT_UNIVERSAL_CONFIG, EMPTY_RESUME_DATA } from '@/types'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { generateDOCX } from '@/lib/docxGenerator'
import { useUndoHistory } from '@/lib/undoHistory'
import { applyInsightSuggestionToResumeData, type InsightSuggestionLike } from '@/lib/ai-insights'
import { applyTailorAnalysisToResumeData, canApplyTailorSection } from '@/lib/tailorResume'
import { readTailorJobTransfer } from '@/lib/tailorJobTransfer'
import { scoreResume } from '@/lib/ats-scorer'
import { getResumeSkills, syncResumeData } from '@/lib/resume-data'
import type { ResumeData, BuilderMode, TailorAnalysis, TailorIntensity, Profile } from '@/types'
import { useBuilderAnalytics } from '@/hooks/useBuilderAnalytics'
import type { BuilderSource } from '@/lib/analytics'
import { getBlogResumeExampleById } from '@/lib/blog/resume-examples'

interface StoredBlogResumeExampleRecord {
  id: string
  title: string
  resume_data: ResumeData | null
  template_config: Partial<UniversalConfig> | null
  builder_visibility: Partial<BuilderVisibility> | null
}

const PAGE_H = 1123 // A4 at 96 DPI
const PAGE_GAP = 24
const PAGE_BOTTOM_PADDING = 48 // ~12.7mm (0.5in) bottom margin
const CONTINUATION_PAGE_TOP_PADDING = 48 // ~12.7mm (0.5in) top margin on pages 2+
const FIRST_PAGE_CONTENT_H = PAGE_H - PAGE_BOTTOM_PADDING
const CONTINUATION_PAGE_CONTENT_H =
  PAGE_H - PAGE_BOTTOM_PADDING - CONTINUATION_PAGE_TOP_PADDING
const MIN_PREVIEW_SLICE_HEIGHT = 120
const PAGE_BREAK_LOOKBACK = 96

function normalizeResumeTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.replace(/\.pdf\s*$/i, '').trim()
}

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void) => unknown
}

function runPreviewViewTransition(update: () => void) {
  if (typeof document === 'undefined') {
    update()
    return
  }

  const transitionDocument = document as ViewTransitionCapableDocument

  if (typeof transitionDocument.startViewTransition === 'function') {
    transitionDocument.startViewTransition(() => {
      flushSync(() => {
        update()
      })
    })
    return
  }

  update()
}

function getBuilderAnalyticsSource(searchParams: ReturnType<typeof useSearchParams>): BuilderSource {
  const source = searchParams.get('source')

  if (source === 'ats') return 'ats_result'
  if (source === 'upload') return 'upload'
  return 'scratch'
}

function shouldIgnoreTemplateQueryOverrides(source: string | null) {
  return source === 'ats' || source === 'match'
}

function getRenderableSectionIds(visibility: BuilderVisibility) {
  return [...(visibility.sectionOrder ?? []), ...(visibility.sidebarSectionOrder ?? [])].filter(
    (sectionId, index, allSectionIds) =>
      sectionId !== 'contact' &&
      visibility.sections[sectionId] !== false &&
      allSectionIds.indexOf(sectionId) === index
  )
}

function appendMissingDefaultSectionIds(
  savedPrimary: string[] | undefined,
  savedSidebar: string[] | undefined
) {
  const primary: string[] = []
  const sidebar: string[] = []
  const seen = new Set<string>()

  const appendUnique = (target: string[], sectionIds: string[]) => {
    for (const sectionId of sectionIds) {
      if (sectionId === 'contact' || seen.has(sectionId)) continue
      target.push(sectionId)
      seen.add(sectionId)
    }
  }

  appendUnique(primary, savedPrimary ?? DEFAULT_VISIBILITY.sectionOrder)
  appendUnique(sidebar, savedSidebar ?? DEFAULT_VISIBILITY.sidebarSectionOrder ?? [])

  for (const sectionId of DEFAULT_VISIBILITY.sectionOrder) {
    if (seen.has(sectionId)) continue
    primary.push(sectionId)
    seen.add(sectionId)
  }

  for (const sectionId of DEFAULT_VISIBILITY.sidebarSectionOrder ?? []) {
    if (seen.has(sectionId)) continue
    sidebar.push(sectionId)
    seen.add(sectionId)
  }

  return { primary, sidebar }
}

function mergeBuilderVisibilityWithDefaults(
  savedVis: Partial<BuilderVisibility> | null | undefined
): BuilderVisibility {
  if (!savedVis || Object.keys(savedVis).length === 0) {
    return structuredClone(DEFAULT_VISIBILITY)
  }

  const { primary, sidebar } = appendMissingDefaultSectionIds(
    savedVis.sectionOrder,
    savedVis.sidebarSectionOrder
  )

  return {
    ...DEFAULT_VISIBILITY,
    ...savedVis,
    sections: { ...DEFAULT_VISIBILITY.sections, ...(savedVis.sections ?? {}) },
    items: {
      ...DEFAULT_VISIBILITY.items,
      ...(savedVis.items ?? {}),
    },
    sectionOrder: primary,
    sidebarSectionOrder: sidebar,
    density: savedVis.density ?? DEFAULT_VISIBILITY.density,
  }
}

function getExperienceLikeItems(data: ResumeData, sectionId: string) {
  if (sectionId === 'experience') return data.experience
  if (sectionId === 'volunteer') return data.volunteer

  if (!sectionId.startsWith('custom_')) return null

  const customSection = data.customSections?.find(section => section.id === sectionId)
  if (!customSection || customSection.type !== 'complex') return null

  return customSection.items ?? []
}

function getSectionItemCount(data: ResumeData, sectionId: string) {
  switch (sectionId) {
    case 'experience':
      return data.experience.length
    case 'education':
      return data.education.length
    case 'projects':
      return data.projects.length
    case 'certifications':
      return data.certifications.length
    case 'volunteer':
      return data.volunteer.length
    default: {
      if (!sectionId.startsWith('custom_')) return 0
      const customSection = data.customSections?.find(section => section.id === sectionId)
      return customSection?.type === 'complex' ? (customSection.items?.length ?? 0) : 0
    }
  }
}

function createEmptySectionItem(sectionId: 'experience' | 'education' | 'projects') {
  if (sectionId === 'experience') {
    return {
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: [],
      bulletVisibility: [],
    }
  }

  if (sectionId === 'education') {
    return {
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    }
  }

  return {
    name: '',
    description: '',
    bullets: [],
    technologies: [],
  }
}

function hasMeaningfulText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasMeaningfulExperienceItem(item: ResumeData['experience'][number]) {
  return (
    hasMeaningfulText(item.company) ||
    hasMeaningfulText(item.title) ||
    hasMeaningfulText(item.location) ||
    hasMeaningfulText(item.startDate) ||
    hasMeaningfulText(item.endDate) ||
    hasMeaningfulText(item.summary) ||
    item.bullets.some(hasMeaningfulText)
  )
}

function hasMeaningfulEducationItem(item: ResumeData['education'][number]) {
  return (
    hasMeaningfulText(item.institution) ||
    hasMeaningfulText(item.degree) ||
    hasMeaningfulText(item.field) ||
    hasMeaningfulText(item.startDate) ||
    hasMeaningfulText(item.endDate) ||
    hasMeaningfulText(item.gpa)
  )
}

function hasMeaningfulProjectItem(item: ResumeData['projects'][number]) {
  return (
    hasMeaningfulText(item.name) ||
    hasMeaningfulText(item.description) ||
    item.bullets?.some(hasMeaningfulText) === true ||
    item.technologies.some(hasMeaningfulText)
  )
}

function hasMeaningfulCertificationItem(item: ResumeData['certifications'][number]) {
  return hasMeaningfulText(item.name) || hasMeaningfulText(item.issuer) || hasMeaningfulText(item.date)
}

function hasMeaningfulCustomSection(section: NonNullable<ResumeData['customSections']>[number]) {
  if (section.type === 'text') return hasMeaningfulText(section.text)
  if (section.type === 'tags') return section.tags?.some(hasMeaningfulText) === true
  if (section.type === 'complex') return section.items?.some(hasMeaningfulExperienceItem) === true
  return false
}

function isResumeDataMeaningfullyEmpty(resumeData: ResumeData) {
  return (
    !hasMeaningfulText(resumeData.name) &&
    !hasMeaningfulText(resumeData.currentRole) &&
    !hasMeaningfulText(resumeData.email) &&
    !hasMeaningfulText(resumeData.phone) &&
    !hasMeaningfulText(resumeData.summary) &&
    !hasMeaningfulText(resumeData.location) &&
    !hasMeaningfulText(resumeData.linkedin) &&
    !hasMeaningfulText(resumeData.website) &&
    !resumeData.experience.some(hasMeaningfulExperienceItem) &&
    !resumeData.education.some(hasMeaningfulEducationItem) &&
    getResumeSkills(resumeData).length === 0 &&
    !resumeData.projects.some(hasMeaningfulProjectItem) &&
    !resumeData.certifications.some(hasMeaningfulCertificationItem) &&
    !resumeData.languages.some(hasMeaningfulText) &&
    !resumeData.volunteer.some(hasMeaningfulExperienceItem) &&
    !resumeData.interests.some(hasMeaningfulText) &&
    !resumeData.awards.some((award) => hasMeaningfulText(award.title) || hasMeaningfulText(award.issuer) || hasMeaningfulText(award.date)) &&
    !resumeData.publications.some((publication) => hasMeaningfulText(publication.title) || hasMeaningfulText(publication.publisher) || hasMeaningfulText(publication.date)) &&
    !resumeData.references.some(hasMeaningfulText) &&
    !(resumeData.customSections?.some(hasMeaningfulCustomSection))
  )
}

function trimLastVisibleBullet(data: ResumeData, visibility: BuilderVisibility, sectionId: string) {
  const items = getExperienceLikeItems(data, sectionId)
  if (!items?.length) return false

  const itemVisibility = visibility.items[sectionId] ?? []

  for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
    if (itemVisibility[itemIndex] === false) continue

    const item = items[itemIndex]
    if (!item?.bullets?.length) continue

    const nextBulletVisibility =
      item.bulletVisibility?.length === item.bullets.length
        ? [...item.bulletVisibility]
        : item.bullets.map(() => true)

    for (let bulletIndex = item.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      if (nextBulletVisibility[bulletIndex] === false) continue

      nextBulletVisibility[bulletIndex] = false
      item.bulletVisibility = nextBulletVisibility
      return true
    }
  }

  return false
}

function hideLastVisibleSectionItem(data: ResumeData, visibility: BuilderVisibility, sectionId: string) {
  const itemCount = getSectionItemCount(data, sectionId)
  if (itemCount === 0) return false

  const currentItemVisibility = visibility.items[sectionId] ?? []
  const nextItemVisibility = Array.from({ length: itemCount }, (_, index) => currentItemVisibility[index] !== false)

  for (let itemIndex = itemCount - 1; itemIndex >= 0; itemIndex -= 1) {
    if (!nextItemVisibility[itemIndex]) continue

    nextItemVisibility[itemIndex] = false
    visibility.items = {
      ...visibility.items,
      [sectionId]: nextItemVisibility,
    }
    return true
  }

  return false
}

function hideVisibleSection(visibility: BuilderVisibility, sectionId: string) {
  if (visibility.sections[sectionId] === false) return false

  visibility.sections = {
    ...visibility.sections,
    [sectionId]: false,
  }

  return true
}

function applyOverflowTrimStep(resumeData: ResumeData, visibility: BuilderVisibility) {
  const nextResumeData = structuredClone(resumeData)
  const nextVisibility = structuredClone(visibility)

  for (const sectionId of [...getRenderableSectionIds(nextVisibility)].reverse()) {
    if (trimLastVisibleBullet(nextResumeData, nextVisibility, sectionId)) {
      return { nextResumeData, nextVisibility }
    }

    if (hideLastVisibleSectionItem(nextResumeData, nextVisibility, sectionId)) {
      return { nextResumeData, nextVisibility }
    }

    if (hideVisibleSection(nextVisibility, sectionId)) {
      return { nextResumeData, nextVisibility }
    }
  }

  return null
}


// ─── Inner builder (needs PlanContext) ────────────────────────────────────────

interface BuilderInnerProps {
  resumeId: string
  isPro: boolean
  profile: Profile
}

type ActiveDownloadFormat = 'pdf' | 'docx' | null
type PreviewPageSlice = {
  startY: number
  height: number
}
type PreviewBreakCandidate = {
  top: number
  bottom: number
}

function BuilderInner({ resumeId, isPro, profile }: BuilderInnerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const requestedMode = searchParams.get('mode')
  const sourceParam = searchParams.get('source')
  const accentParam = searchParams.get('accent')
  const fontParam = searchParams.get('font')
  const layoutParam = searchParams.get('layout')
  const headerParam = searchParams.get('header')
  const bulletParam = searchParams.get('bullet')
  const densityParam = searchParams.get('density')
  const downloadParam = searchParams.get('download')
  const autoOptimizeParam = searchParams.get('autoOptimize') === '1'
  const tailorJobKeyParam = searchParams.get('tailorJobKey')
  const autoTailorParam = searchParams.get('autoTailor') === '1'
  const ignoreTemplateQueryOverrides = shouldIgnoreTemplateQueryOverrides(sourceParam)

  const { requirePro, blockedFeature, clearBlockedFeature } = useProGate()

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [savedData, setSavedData] = useState<ResumeData | null>(null)
  const [resumeTitle, setResumeTitle] = useState('')
  const [templateConfig, setTemplateConfig] = useState<UniversalConfig>(DEFAULT_UNIVERSAL_CONFIG)
  const [activeMode, setActiveMode] = useState<BuilderMode>('builder')
  const [expandedSection, setExpandedSection] = useState<string | null>('contact')
  const [focusedFieldPath, setFocusedFieldPath] = useState<string | null>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const [isTitleFocused, setIsTitleFocused] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [activeDownloadFormat, setActiveDownloadFormat] = useState<ActiveDownloadFormat>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [tailorAnalysis, setTailorAnalysis] = useState<TailorAnalysis | null>(null)
  const [tailorIntensity, setTailorIntensity] = useState<TailorIntensity>('balanced')
  const [isTailoring, setIsTailoring] = useState(false)
  const [tailorError, setTailorError] = useState<string | null>(null)
  const [sectionHints, setSectionHints] = useState<Set<string>>(new Set())
  const [zoomDelta, setZoomDelta] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPageWarningDismissed, setIsPageWarningDismissed] = useState(false)
  const [visibility, setVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedVisibility, setSavedVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedTemplateConfig, setSavedTemplateConfig] = useState<UniversalConfig | null>(null)
  const resumeRef = useRef<HTMLDivElement>(null)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const hasTriggeredAutoPdfDownloadRef = useRef(false)
  const consumedTailorJobKeyRef = useRef<string | null>(null)
  const hasTriggeredAutoTailorRef = useRef(false)
  const userId = profile.id
  const history = useUndoHistory()
  const analyticsTemplateId = useMemo(
    () =>
      [
        'universal',
        templateConfig.layout,
        templateConfig.headerStyle,
        templateConfig.density,
        templateConfig.bulletStyle,
        templateConfig.sectionHeadingStyle,
        templateConfig.skillsStyle,
        templateConfig.dateLayout,
      ].join(':'),
    [
      templateConfig.bulletStyle,
      templateConfig.dateLayout,
      templateConfig.density,
      templateConfig.headerStyle,
      templateConfig.layout,
      templateConfig.sectionHeadingStyle,
      templateConfig.skillsStyle,
    ]
  )
  const builderAnalytics = useBuilderAnalytics({
    templateId: analyticsTemplateId,
    source: getBuilderAnalyticsSource(searchParams),
    activeSection: expandedSection,
  })
  const previewHighlightedSectionId = isEditorFocused ? expandedSection : null
  const [previewFocusFrame, setPreviewFocusFrame] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const previousTemplateIdRef = useRef<string | null>(null)

  const applyUrlTemplateOverrides = useCallback((baseConfig: Partial<UniversalConfig> | null | undefined) => {
    const config: UniversalConfig = sanitizeUniversalConfig(baseConfig)

    if (ignoreTemplateQueryOverrides) {
      return config
    }

    if (accentParam) config.accentColor = accentParam
    if (fontParam) {
      const font = FONT_OPTIONS.find((f) => f.id === fontParam)
      if (font) config.fontFamily = font.value
    }
    if (layoutParam) config.layout = layoutParam as UniversalConfig['layout']
    if (headerParam) config.headerStyle = headerParam as UniversalConfig['headerStyle']
    if (bulletParam) config.bulletStyle = bulletParam as UniversalConfig['bulletStyle']
    if (densityParam) config.density = densityParam as UniversalConfig['density']

    return sanitizeUniversalConfig(config)
  }, [accentParam, bulletParam, densityParam, fontParam, headerParam, ignoreTemplateQueryOverrides, layoutParam])

  // Sync visibility density with template config density
  useEffect(() => {
    setVisibility(prev => ({ ...prev, density: templateConfig.density }))
  }, [templateConfig.density])

  useEffect(() => {
    if (requestedMode !== 'tailor') {
      setActiveMode('builder')
      return
    }

    if (!requirePro('tailor')) {
      setActiveMode('builder')
      return
    }

    setActiveMode('tailor')
  }, [requestedMode, requirePro])

  useEffect(() => {
    if (requestedMode !== 'tailor' || !tailorJobKeyParam) return
    if (consumedTailorJobKeyRef.current === tailorJobKeyParam) return

    consumedTailorJobKeyRef.current = tailorJobKeyParam
    const transfer = readTailorJobTransfer(tailorJobKeyParam)
    if (!transfer) return

    setJobDescription(transfer.jobDescription)
    setTailorIntensity(transfer.intensity)
    setTailorAnalysis(null)
    setTailorError(null)
    hasTriggeredAutoTailorRef.current = false
  }, [requestedMode, tailorJobKeyParam])

  useEffect(() => {
    if (!isDownloadOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (downloadMenuRef.current?.contains(target)) return
      setIsDownloadOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDownloadOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDownloadOpen])

  useEffect(() => {
    if (!downloadError) return

    const id = window.setTimeout(() => {
      setDownloadError(null)
    }, 7000)

    return () => window.clearTimeout(id)
  }, [downloadError])

  const [resumeHeight, setResumeHeight] = useState(0)
  const [pageSlices, setPageSlices] = useState<PreviewPageSlice[]>([
    { startY: 0, height: FIRST_PAGE_CONTENT_H },
  ])
  const [isPaginationSettling, setIsPaginationSettling] = useState(false)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [needsOverflowTrim, setNeedsOverflowTrim] = useState(searchParams.get('trimOverflow') === '1')

  const recomputeResumeHeight = useCallback(() => {
    const el = resumeRef.current
    if (!el) return
    const measured = Math.max(el.scrollHeight, el.getBoundingClientRect().height)
    if (Number.isFinite(measured) && measured > 0) {
      setResumeHeight(measured)
    }
  }, [])

  const recomputePageBreak = useCallback(() => {
    const container = resumeRef.current
    if (!container) return

    const containerTop = container.getBoundingClientRect().top
    const elements = container.querySelectorAll(
      '[data-resume-path], [data-resume-page-break], li, p, h1, h2, h3, h4, div[class*="text-"], div[class*="mb-"]'
    )
    const lineCandidateElements = container.querySelectorAll<HTMLElement>(
      'span[data-resume-path], a[data-resume-path], em[data-resume-path], strong[data-resume-path]'
    )
    const blockCandidateElements = container.querySelectorAll<HTMLElement>(
      '[data-resume-page-break], [data-resume-section-heading], h2'
    )

    let contentBottom = 0
    for (const el of Array.from(elements)) {
      const rect = el.getBoundingClientRect()
      const bottom = rect.bottom - containerTop
      if (bottom > contentBottom) {
        contentBottom = bottom
      }
    }

    const resolvedContentBottom = contentBottom > 0 ? contentBottom : container.scrollHeight
    const lineBreakCandidates = Array.from(lineCandidateElements)
      .flatMap((el) => {
        return Array.from(el.getClientRects()).map((rect) => ({
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }))
      })
      .filter(candidate => candidate.bottom - candidate.top > 2)
      .sort((a, b) => a.top - b.top)

    const blockBreakCandidates = Array.from(blockCandidateElements)
      .filter(el => !el.dataset.resumeSectionFrame)
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }
      })
      .filter(candidate => candidate.bottom - candidate.top > 2)
      .sort((a, b) => a.top - b.top)

    const nextPageSlices: PreviewPageSlice[] = []
    let pageStartY = 0

    while (pageStartY < resolvedContentBottom - 1 && nextPageSlices.length < 20) {
      const isFirstPage = nextPageSlices.length === 0
      const pageCapacity = isFirstPage ? FIRST_PAGE_CONTENT_H : CONTINUATION_PAGE_CONTENT_H
      const pageLimitY = pageStartY + pageCapacity

      if (resolvedContentBottom <= pageLimitY + 1) {
        nextPageSlices.push({
          startY: pageStartY,
          height: Math.max(1, resolvedContentBottom - pageStartY),
        })
        break
      }

      const crossingLineCandidate = lineBreakCandidates.find(candidate =>
        candidate.bottom > pageLimitY &&
        candidate.top > pageStartY + MIN_PREVIEW_SLICE_HEIGHT &&
        candidate.top < pageLimitY
      )
      const crossingBlockCandidate = blockBreakCandidates.find(candidate =>
        candidate.bottom > pageLimitY &&
        candidate.top > Math.max(pageStartY + MIN_PREVIEW_SLICE_HEIGHT, pageLimitY - PAGE_BREAK_LOOKBACK) &&
        candidate.top < pageLimitY
      )
      const crossingCandidate: PreviewBreakCandidate | undefined =
        crossingLineCandidate ?? crossingBlockCandidate
      const safeBreakY = crossingCandidate
        ? Math.max(pageStartY + 1, Math.floor(crossingCandidate.top) - 1)
        : pageLimitY
      const nextBreakY =
        safeBreakY - pageStartY >= MIN_PREVIEW_SLICE_HEIGHT
          ? safeBreakY
          : pageLimitY

      nextPageSlices.push({
        startY: pageStartY,
        height: Math.max(1, nextBreakY - pageStartY),
      })
      pageStartY = nextBreakY
    }

    setPageSlices(nextPageSlices.length > 0 ? nextPageSlices : [{ startY: 0, height: FIRST_PAGE_CONTENT_H }])
  }, [])

  const recomputePreviewFocusFrame = useCallback(() => {
    const container = resumeRef.current

    if (!container || !previewHighlightedSectionId) {
      setPreviewFocusFrame(null)
      return
    }

    const frame = Array.from(
      container.querySelectorAll<HTMLElement>('[data-resume-section-frame]')
    ).find(element => element.dataset.resumeSectionFrame === previewHighlightedSectionId)

    if (!frame) {
      setPreviewFocusFrame(null)
      return
    }

    const containerRect = container.getBoundingClientRect()
    const frameRect = frame.getBoundingClientRect()

    setPreviewFocusFrame({
      top: frameRect.top - containerRect.top,
      left: frameRect.left - containerRect.left,
      width: frameRect.width,
      height: frameRect.height,
    })
  }, [previewHighlightedSectionId])

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

  // Run a layout-synced pagination pass after density/layout/content changes.
  // Two RAFs gives the browser a chance to settle wrapping before measuring.
  useLayoutEffect(() => {
    let frame1 = 0
    let frame2 = 0

    frame1 = window.requestAnimationFrame(() => {
      recomputeResumeHeight()
      frame2 = window.requestAnimationFrame(() => {
        recomputeResumeHeight()
        recomputePageBreak()
        recomputePreviewFocusFrame()
      })
    })

    return () => {
      window.cancelAnimationFrame(frame1)
      window.cancelAnimationFrame(frame2)
    }
  }, [recomputeResumeHeight, recomputePageBreak, recomputePreviewFocusFrame, resumeData, visibility, templateConfig])

  useEffect(() => {
    if (resumeHeight === 0) return
    const id = window.requestAnimationFrame(() => {
      recomputePageBreak()
      recomputePreviewFocusFrame()
    })
    return () => window.cancelAnimationFrame(id)
  }, [resumeHeight, recomputePageBreak, recomputePreviewFocusFrame])

  const ZOOM_STEP = 0.05
  const effectiveScale = Math.min(1.5, Math.max(0.3, 1.0 + zoomDelta))

  // When layout density/visibility changes, optimistically collapse to one page
  // until the hidden print wrapper finishes remeasuring.
  useEffect(() => {
    setIsPaginationSettling(true)
    setPageSlices([{ startY: 0, height: FIRST_PAGE_CONTENT_H }])
    setPreviewVersion(version => version + 1)

    const id = window.setTimeout(() => {
      setIsPaginationSettling(false)
    }, 180)

    return () => window.clearTimeout(id)
  }, [visibility, templateConfig])

  const MAX_PAGES = 5
  const RECOMMENDED_PAGES = 2
  const pageCount = isPaginationSettling ? 1 : pageSlices.length
  const renderedPageSlices = isPaginationSettling
    ? [{ startY: 0, height: FIRST_PAGE_CONTENT_H }]
    : pageSlices.slice(0, MAX_PAGES)
  const renderedPageCount = renderedPageSlices.length
  const isOverPageLimit = pageCount > MAX_PAGES
  const isOverRecommendedPages = pageCount > RECOMMENDED_PAGES

  // ── Load resume on mount ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (resumeId === 'new') {
        const query = searchParams.toString()
        router.replace(`/dashboard/builder/draft${query ? `?${query}` : ''}`)
        return
      }

      if (resumeId === 'draft') {
        const exampleId = searchParams.get('example')
        const staticExample = getBlogResumeExampleById(exampleId)
        let storedExample: StoredBlogResumeExampleRecord | null = null

        if (exampleId) {
          const { data, error } = await supabase
            .from('blog_resume_examples')
            .select('id, title, resume_data, template_config, builder_visibility')
            .eq('id', exampleId)
            .eq('is_active', true)
            .maybeSingle()

          if (error) {
            console.error('Failed to load blog resume example from table.', error)
          } else if (data) {
            storedExample = data as StoredBlogResumeExampleRecord
          }
        }

        const initialData = syncResumeData(
          storedExample?.resume_data ?? staticExample?.resumeData ?? EMPTY_RESUME_DATA
        )
        const initialVisibility = mergeBuilderVisibilityWithDefaults(
          storedExample?.builder_visibility ?? staticExample?.visibility ?? DEFAULT_VISIBILITY
        )
        const initialTemplateConfig = applyUrlTemplateOverrides(
          storedExample?.template_config ?? staticExample?.templateConfig ?? DEFAULT_UNIVERSAL_CONFIG
        )

        setResumeData(initialData)
        setSavedData(initialData)
        setResumeTitle(storedExample?.title ?? staticExample?.title ?? 'Untitled Resume')
        setVisibility(initialVisibility)
        setSavedVisibility(initialVisibility)
        setTemplateConfig(initialTemplateConfig)
        setSavedTemplateConfig(initialTemplateConfig)
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

      const data = syncResumeData((resume.parsed_data as ResumeData | null) ?? {})
      setResumeData(data)
      setSavedData(data)
      setResumeTitle(normalizeResumeTitle(resume.title ?? ''))

      // Load saved template config from DB
      const savedTemplateConfig = (resume as Record<string, unknown>).template_config as UniversalConfig | null

      const safeConfig = applyUrlTemplateOverrides(savedTemplateConfig ?? DEFAULT_UNIVERSAL_CONFIG)
      setTemplateConfig(safeConfig)
      setSavedTemplateConfig(safeConfig)

      // Load saved visibility, merging with defaults to handle new fields
      const savedVis = (resume as Record<string, unknown>).builder_visibility as Partial<BuilderVisibility> | null
      const mergedVisibility = mergeBuilderVisibilityWithDefaults(savedVis)
      setVisibility(mergedVisibility)
      setSavedVisibility(mergedVisibility)
      setIsLoading(false)
    }
    load()
  }, [applyUrlTemplateOverrides, resumeId, router, searchParams, supabase, userId])

  const setBuilderMode = useCallback((mode: BuilderMode) => {
    const params = new URLSearchParams(searchParams.toString())

    if (mode === 'tailor') {
      params.set('mode', 'tailor')
    } else {
      params.delete('mode')
    }

    const nextQuery = params.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

    setActiveMode(mode)
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchParams])

  const clearAutoOptimizeParam = useCallback(() => {
    if (!autoOptimizeParam) return

    const params = new URLSearchParams(searchParams.toString())
    params.delete('autoOptimize')

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [autoOptimizeParam, pathname, router, searchParams])

  const clearAutoTailorParams = useCallback(() => {
    if (!autoTailorParam && !tailorJobKeyParam) return

    const params = new URLSearchParams(searchParams.toString())
    params.delete('autoTailor')
    params.delete('tailorJobKey')

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [autoTailorParam, pathname, router, searchParams, tailorJobKeyParam])

  const saveLockRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hasUnsavedChanges =
    !!resumeData && (
      JSON.stringify(resumeData) !== JSON.stringify(savedData) ||
      JSON.stringify(visibility) !== JSON.stringify(savedVisibility) ||
      JSON.stringify(templateConfig) !== JSON.stringify(savedTemplateConfig)
    )

  async function forceSave() {
    if (!resumeData || !hasUnsavedChanges || isSaving || saveLockRef.current) return

    // Define what constitutes a truly 'empty' resume to avoid ghost records on new drafts.
    // If it's a new draft, we only save if the user has actually done something.
    if (resumeId === 'draft') {
      const isDataEmpty = isResumeDataMeaningfullyEmpty(resumeData)

      const isTemplateDefault = 
        JSON.stringify(templateConfig) === JSON.stringify(DEFAULT_UNIVERSAL_CONFIG) &&
        JSON.stringify(visibility) === JSON.stringify(DEFAULT_VISIBILITY)

      // If everything is untouched, don't create a database record yet
      if (isDataEmpty && isTemplateDefault) return
    }

    saveLockRef.current = true
    setIsSaving(true)
    setSaveFailed(false)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = undefined
    }
    const visibleResumeData = getVisibleResumeData(resumeData, visibility)
    const atsScore = scoreResume(visibleResumeData).score

    try {
      if (resumeId === 'draft') {
        const { data, error } = await supabase
          .from('resumes')
          .insert({
            user_id: userId,
            title: resumeTitle || 'Untitled Resume',
            parsed_data: resumeData,
            ats_score: atsScore,
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
            ats_score: atsScore,
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
    } catch (err: unknown) {
      setSaveFailed(true)
      const errorDetails =
        err && typeof err === 'object'
          ? (err as { message?: string; details?: string; hint?: string; code?: string })
          : {}
      console.error('Persistence Error Details:', {
        message: errorDetails.message,
        details: errorDetails.details,
        hint: errorDetails.hint,
        code: errorDetails.code,
        fullError: err
      })
    } finally {
      setIsSaving(false)
      saveLockRef.current = false
    }
  }

  // ── Resizable Panels ────────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(420)
  const [rightWidth, setRightWidth] = useState(380)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const builderPanelWidthsRef = useRef({ left: 420, right: 380 })

  useEffect(() => {
    if (isOverRecommendedPages && !isPageWarningDismissed) {
      const timer = setTimeout(() => {
        setIsPageWarningDismissed(true)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [isOverRecommendedPages, isPageWarningDismissed])

  useEffect(() => {
    if (activeMode !== 'tailor') {
      builderPanelWidthsRef.current = { left: leftWidth, right: rightWidth }
    }
  }, [activeMode, leftWidth, rightWidth])

  useEffect(() => {
    if (activeMode === 'tailor') {
      const { left, right } = builderPanelWidthsRef.current
      setIsRightCollapsed(false)
      setExpandedSection(null)
      setIsEditorFocused(false)
      setLeftWidth(Math.min(left, 320))
      setRightWidth(Math.max(right, 480))
      return
    }

    const { left, right } = builderPanelWidthsRef.current
    setLeftWidth(left)
    setRightWidth(right)
  }, [activeMode])

  useEffect(() => {
    if (!expandedSection) {
      setIsEditorFocused(false)
    }
  }, [expandedSection])

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(240, Math.min(800, e.clientX)))
      } else if (isDraggingRight) {
        setRightWidth(Math.max(320, Math.min(800, window.innerWidth - e.clientX)))
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

  useEffect(() => {
    if (!previousTemplateIdRef.current) {
      previousTemplateIdRef.current = analyticsTemplateId
      return
    }

    if (previousTemplateIdRef.current === analyticsTemplateId) return

    builderAnalytics.trackTemplateChange(previousTemplateIdRef.current, analyticsTemplateId)
    previousTemplateIdRef.current = analyticsTemplateId
  }, [analyticsTemplateId, builderAnalytics])

  // ── Auto-save (debounced 500ms) ─────────────────────────────────────────────
  useEffect(() => {
    if (!resumeData || !hasUnsavedChanges || needsOverflowTrim) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      forceSave()
    }, 1500)
    return () => clearTimeout(saveTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, visibility, templateConfig, needsOverflowTrim])

  // ── Instant auto-save on clicking out of section ─────────────────────────────
  useEffect(() => {
    if (hasUnsavedChanges && !needsOverflowTrim) {
      forceSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSection, needsOverflowTrim])

  useEffect(() => {
    if (!needsOverflowTrim || !resumeData || isLoading || isPaginationSettling) return

    if (!isOverPageLimit) {
      setNeedsOverflowTrim(false)
      return
    }

    const trimmedStep = applyOverflowTrimStep(resumeData, visibility)
    if (!trimmedStep) {
      setNeedsOverflowTrim(false)
      return
    }

    setResumeData(trimmedStep.nextResumeData)
    setVisibility(trimmedStep.nextVisibility)
  }, [needsOverflowTrim, resumeData, visibility, isLoading, isPaginationSettling, isOverPageLimit])

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
    builderAnalytics.trackSectionEdit(expandedSection ?? 'contact', 'edit')
    setResumeData(updated)
  }

  function handleVisibilityChange(updated: BuilderVisibility) {
    if (resumeData) history.pushHistory(resumeData, visibility)

    const toggledSection = Object.keys(updated.sections).find(
      sectionId => updated.sections[sectionId] !== visibility.sections[sectionId]
    )

    if (toggledSection) {
      const visible = updated.sections[toggledSection] !== false
      builderAnalytics.trackVisibilityToggle(toggledSection, visible)
      builderAnalytics.trackSectionEdit(toggledSection, 'toggle_visibility')
    }

    const previousOrder = [
      ...(visibility.sectionOrder ?? []),
      ...(visibility.sidebarSectionOrder ?? []),
    ]
    const nextOrder = [
      ...(updated.sectionOrder ?? []),
      ...(updated.sidebarSectionOrder ?? []),
    ]

    const didReorder = JSON.stringify(previousOrder) !== JSON.stringify(nextOrder)

    if (didReorder) {
      const movedSection =
        nextOrder.find(sectionId => previousOrder.indexOf(sectionId) !== nextOrder.indexOf(sectionId)) ??
        expandedSection ??
        'section_order'
      const fromIndex = previousOrder.indexOf(movedSection)
      const toIndex = nextOrder.indexOf(movedSection)

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        builderAnalytics.trackDragReorder(movedSection, fromIndex, toIndex)
        builderAnalytics.trackSectionEdit(movedSection, 'reorder')
      }
    }

    if (didReorder) {
      runPreviewViewTransition(() => {
        setVisibility(updated)
      })
      return
    }

    setVisibility(updated)
  }

  const handleUndo = useCallback(() => {
    if (!resumeData) return
    const entry = history.undo(resumeData, visibility)
    if (!entry) return
    setResumeData(entry.data)
    setVisibility(entry.visibility)
    builderAnalytics.trackUndoRedo('undo')
  }, [builderAnalytics, history, resumeData, visibility])

  const handleRedo = useCallback(() => {
    if (!resumeData) return
    const entry = history.redo(resumeData, visibility)
    if (!entry) return
    setResumeData(entry.data)
    setVisibility(entry.visibility)
    builderAnalytics.trackUndoRedo('redo')
  }, [builderAnalytics, history, resumeData, visibility])

  function getSectionIdForFieldPath(path: string): string | null {
    if (!path) return null
    if (['name', 'currentRole', 'email', 'phone', 'location', 'linkedin', 'website'].includes(path)) return 'contact'
    const root = path.split('.')[0]
    if (root === 'summary') return 'summary'
    if (root === 'skills') return 'skills'
    if (root === 'skillSections') return 'skills'
    if (root === 'languages') return 'languages'
    if (root === 'interests') return 'interests'
    if (root === 'experience') return 'experience'
    if (root === 'education') return 'education'
    if (root === 'projects') return 'projects'
    if (root === 'certifications') return 'certifications'
    if (root === 'volunteer') return 'volunteer'
    if (root === 'awards') return 'awards'
    if (root === 'publications') return 'publications'
    if (root === 'references') return 'references'
    if (root.startsWith('custom_')) return root
    return null
  }

  function handleNavigateToField(path: string) {
    const sectionId = getSectionIdForFieldPath(path)
    if (!sectionId) return

    const indexedFieldMatch = path.match(/^(experience|education|projects)\.(\d+)\./)
    const customIndexedMatch = path.match(/^(custom_[a-z0-9]+)\.items\.(\d+)\./)

    if (indexedFieldMatch) {
      const indexedSectionId = indexedFieldMatch[1] as 'experience' | 'education' | 'projects'
      const requestedIndex = Number(indexedFieldMatch[2])

      setResumeData(previous => {
        if (!previous) return previous

        const currentItems = previous[indexedSectionId]
        if (currentItems.length > requestedIndex) return previous

        const nextItems = [...currentItems]
        while (nextItems.length <= requestedIndex) {
          nextItems.push(createEmptySectionItem(indexedSectionId))
        }

        return {
          ...previous,
          [indexedSectionId]: nextItems,
        }
      })
    } else if (customIndexedMatch) {
      const indexedSectionId = customIndexedMatch[1]
      const requestedIndex = Number(customIndexedMatch[2])

      setResumeData(previous => {
        if (!previous) return previous

        const customSections = [...(previous.customSections || [])]
        const idx = customSections.findIndex(c => c.id === indexedSectionId)
        if (idx === -1 || customSections[idx].type !== 'complex') return previous

        const currentItems = customSections[idx].items || []
        if (currentItems.length > requestedIndex) return previous

        const nextItems = [...currentItems]
        while (nextItems.length <= requestedIndex) {
          nextItems.push({ company: '', title: '', location: '', startDate: '', endDate: '', bullets: [], bulletVisibility: [] })
        }

        customSections[idx] = { ...customSections[idx], items: nextItems }
        return { ...previous, customSections }
      })
    }

    setExpandedSection(sectionId)
    setIsLeftCollapsed(false)
    setFocusedFieldPath(path)
  }

  // Keyboard shortcuts: Ctrl+Z / Cmd+Z for undo, Ctrl+Shift+Z / Cmd+Shift+Z for redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

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
    setBuilderMode('tailor')
  }

  async function handleAnalyse() {
    if (!visibleData) return
    if (countWords(jobDescription) < 20) {
      setTailorError('Job description must contain at least 20 words.')
      return
    }
    setTailorError(null)
    setIsTailoring(true)
    try {
      const res = await fetch('/api/ats/tailor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: visibleData,
          jobDescription,
          intensity: tailorIntensity,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setTailorError(json.error ?? 'Tailor analysis failed.')
        return
      }
      if (json.success) {
        setTailorAnalysis(json.data)
      } else {
        setTailorError(json.error ?? 'Tailor analysis failed.')
      }
    } finally {
      setIsTailoring(false)
    }
  }

  function scrollToSection(sectionId: string) {
    // We wait a tick for React to expand the section before scrolling
    window.requestAnimationFrame(() => {
      const element = document.getElementById(`section-row-${sectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  function handleApplyTailorSection(sectionId: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'volunteer') {
    if (!resumeData || !tailorAnalysis) return

    setExpandedSection(sectionId)
    scrollToSection(sectionId)

    if (!canApplyTailorSection(tailorAnalysis, sectionId)) return

    const result = applyTailorAnalysisToResumeData(resumeData, tailorAnalysis, sectionId)

    if (!result.changed) return

    history.pushHistory(resumeData, visibility)
    builderAnalytics.trackSectionEdit(sectionId, 'edit')
    setResumeData(result.data)
    setSectionHints(prev => new Set(prev).add(sectionId))
  }

  function handleApplyTailorAll() {
    if (!resumeData || !tailorAnalysis) return

    const result = applyTailorAnalysisToResumeData(resumeData, tailorAnalysis)
    if (!result.changed) return

    history.pushHistory(resumeData, visibility)
    result.touchedSections.forEach(sectionId => {
      builderAnalytics.trackSectionEdit(sectionId, 'edit')
    })
    setResumeData(result.data)
    setSectionHints(prev => {
      const next = new Set(prev)
      result.touchedSections.forEach(sectionId => next.add(sectionId))
      return next
    })

    // If summary was touched, expand it as it's the most visible change
    if (result.touchedSections.includes('summary')) {
      setExpandedSection('summary')
      scrollToSection('summary')
    } else if (result.touchedSections.length > 0) {
      setExpandedSection(result.touchedSections[0])
      scrollToSection(result.touchedSections[0])
    }
  }

  function handleApplyAIInsightFix(suggestion: InsightSuggestionLike) {
    setResumeData(previous => {
      if (!previous) return previous
      const updated = applyInsightSuggestionToResumeData(previous, suggestion)
      if (updated === previous) return previous
      history.pushHistory(previous, visibility)
      builderAnalytics.trackSectionEdit(suggestion.sectionHint, 'edit')
      
      // Expand and scroll to the section being fixed
      setExpandedSection(suggestion.sectionHint)
      scrollToSection(suggestion.sectionHint)

      return updated
    })
  }

  const visibleData = useMemo(
    () => resumeData ? getVisibleResumeData(resumeData, visibility) : null,
    [resumeData, visibility]
  )

  useEffect(() => {
    if (!autoTailorParam || hasTriggeredAutoTailorRef.current) return
    if (activeMode !== 'tailor' || isLoading || isTailoring || !visibleData) return
    if (countWords(jobDescription) < 20) return

    hasTriggeredAutoTailorRef.current = true
    void handleAnalyse()
    clearAutoTailorParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTailorParam, activeMode, isLoading, isTailoring, visibleData, jobDescription])

  const orderedSections = useMemo(() => getOrderedSections(visibility), [visibility])
  const orderedSidebarSections = useMemo(() => getOrderedSidebarSections(visibility), [visibility])

  const tailorPreview = useMemo(
    () => (visibleData && tailorAnalysis ? applyTailorAnalysisToResumeData(visibleData, tailorAnalysis) : null),
    [visibleData, tailorAnalysis]
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

  async function getPdfResponseErrorMessage(response: Response) {
    const errorPayload = await response.json().catch(() => null)

    if (response.status === 401) {
      return 'Your session expired. Refresh the page and sign in again.'
    }

    if (response.status >= 500) {
      return 'The PDF export service failed. Please try again in a moment.'
    }

    return errorPayload?.error ?? 'PDF export failed. Please try again.'
  }

  function getPdfDownloadErrorMessage(error: unknown) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'Network connection lost. Reconnect and try again.'
    }

    if (error instanceof TypeError) {
      return 'Network error during PDF export. Check your connection and try again.'
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message
    }

    return 'PDF export failed. Please try again.'
  }

  async function handleDownloadPDF() {
    if (activeDownloadFormat) return

    setIsDownloadOpen(false)
    setDownloadError(null)
    builderAnalytics.trackDownload('clicked', 'pdf')

    if (!visibleData) {
      setDownloadError('Resume is still loading. Try again in a moment.')
      return
    }

    const filename = `${normalizeResumeTitle(resumeTitle) || 'resume'}.pdf`

    try {
      setActiveDownloadFormat('pdf')
      const response = await fetch('/api/resume/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: visibleData,
          config: templateConfig,
          sectionOrder: orderedSections,
          sidebarSectionOrder: orderedSidebarSections,
          filename,
        }),
      })

      if (!response.ok) {
        throw new Error(await getPdfResponseErrorMessage(response))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

      builderAnalytics.trackDownload('completed', 'pdf')
    } catch (error) {
      console.error('PDF export failed.', error)
      const message = getPdfDownloadErrorMessage(error)
      builderAnalytics.trackDownload(
        'failed',
        'pdf',
        message
      )
      setDownloadError(message)
    } finally {
      setActiveDownloadFormat(null)
    }
  }

  useEffect(() => {
    if (downloadParam !== 'pdf') return
    if (hasTriggeredAutoPdfDownloadRef.current) return
    if (isLoading || !resumeData || !visibleData || isPaginationSettling || needsOverflowTrim) return

    hasTriggeredAutoPdfDownloadRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.delete('download')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })

    window.setTimeout(() => {
      void handleDownloadPDF()
    }, 350)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadParam, isLoading, resumeData, visibleData, isPaginationSettling, needsOverflowTrim])

  async function handleDownloadDOCX() {
    if (activeDownloadFormat) return

    setIsDownloadOpen(false)
    setDownloadError(null)
    builderAnalytics.trackDownload('clicked', 'docx')
    if (!requirePro('docx_download') || !resumeData || !visibleData) return
    try {
      setActiveDownloadFormat('docx')
      await generateDOCX(
        visibleData,
        `${normalizeResumeTitle(resumeTitle) || 'resume'}.docx`,
        templateConfig,
        orderedSections,
        orderedSidebarSections,
      )
      builderAnalytics.trackDownload('completed', 'docx')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DOCX export failed. Please try again.'
      builderAnalytics.trackDownload(
        'failed',
        'docx',
        message
      )
      setDownloadError(message)
    } finally {
      setActiveDownloadFormat(null)
    }
  }

  function focusResumeTitle(selectAll: boolean = false) {
    const input = titleInputRef.current
    if (!input) return

    input.focus()

    if (selectAll) {
      input.select()
      return
    }

    const cursorPosition = input.value.length
    input.setSelectionRange(cursorPosition, cursorPosition)
  }

  const TemplateComponent = UniversalTemplate
  const isDownloadBusy = activeDownloadFormat !== null
  const downloadButtonLabel =
    activeDownloadFormat === 'pdf'
      ? 'Preparing'
      : activeDownloadFormat === 'docx'
        ? 'Exporting'
        : 'Download'

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
            <Link href="/dashboard/resumes" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors text-sm font-medium">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Image src="/auth-login-logo.png" alt="Rezoomed logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-emerald-900 tracking-tight font-headline">Rezoomed</span>
            </div>
            <div className="w-px h-4 bg-zinc-200" />
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all ${
                isTitleFocused
                  ? 'border-emerald-300 bg-white shadow-[0_12px_30px_rgba(16,185,129,0.14)] ring-2 ring-emerald-100'
                  : 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80 shadow-[0_8px_24px_rgba(16,185,129,0.08)]'
              }`}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => focusResumeTitle(true)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isTitleFocused
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
                aria-label="Edit resume title"
              >
                <Pencil size={14} />
              </button>
              <input
                ref={titleInputRef}
                type="text"
                value={resumeTitle}
                onChange={e => setResumeTitle(normalizeResumeTitle(e.target.value))}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={async () => {
                  setIsTitleFocused(false)
                  const normalizedTitle = normalizeResumeTitle(resumeTitle)
                  setResumeTitle(normalizedTitle)
                  if (resumeId === 'draft') return
                  await supabase
                    .from('resumes')
                    .update({ title: normalizedTitle || 'Untitled Resume' })
                    .eq('id', resumeId)
                    .eq('user_id', userId)
                }}
                placeholder="Untitled Resume"
                className={`w-56 rounded-lg border-none px-2 py-1.5 text-sm font-semibold text-emerald-950 outline-none transition-all placeholder:font-normal placeholder:text-emerald-400 ${
                  isTitleFocused ? 'bg-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]' : 'bg-transparent'
                }`}
              />
            </div>
            
            {/* Save Status Indicator */}
            <div className="flex items-center gap-2 px-1">
              {isSaving ? (
                <div className="flex items-center gap-1.5 text-zinc-400 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Saving...</span>
                </div>
              ) : saveFailed ? (
                <button 
                  onClick={() => forceSave()}
                  className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <CloudOff size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Save Failed</span>
                </button>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Unsaved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-500/60">
                  <Check size={12} strokeWidth={3} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Saved</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Builder / Tailor Toggle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex bg-surface-container-low p-1 rounded-full">
            <button
              onClick={() => setBuilderMode('builder')}
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

            <div ref={downloadMenuRef} className="relative">
              <button
                onClick={() => {
                  if (isDownloadBusy) return
                  setDownloadError(null)
                  setIsDownloadOpen(!isDownloadOpen)
                }}
                disabled={isDownloadBusy}
                aria-busy={isDownloadBusy}
                className="w-28 py-2 text-sm font-bold bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:cursor-wait disabled:opacity-85"
              >
                {isDownloadBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>{downloadButtonLabel}</span>
                {!isDownloadBusy ? <ChevronDown size={14} /> : null}
              </button>
              {isDownloadOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg border border-gray-100 shadow-lg py-1 w-36 z-[100]">
                  <button
                    onClick={() => void handleDownloadPDF()}
                    disabled={isDownloadBusy}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download as PDF
                  </button>
                  <button
                    onClick={() => void handleDownloadDOCX()}
                    disabled={isDownloadBusy}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    DOCX
                    {!isPro && <span className="text-[10px] text-amber-500 font-bold">PRO</span>}
                  </button>
                </div>
              )}
              {downloadError && !isDownloadOpen && (
                <div
                  role="status"
                  className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-medium leading-snug text-red-600 shadow-lg z-[100]"
                >
                  {downloadError}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page-count warning banner */}
        {isOverRecommendedPages && !isPageWarningDismissed && (
          <div className="fixed top-[57px] left-0 right-0 z-40 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
            <span>Your resume is {pageCount} pages. For best results, keep it to 1-2 pages.</span>
            <button onClick={() => setIsPageWarningDismissed(true)} className="p-0.5 hover:bg-amber-200/50 rounded-full transition-colors" aria-label="Dismiss warning">
              <X size={14} className="opacity-70 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* ── Main Workspace ── */}
        <main className={`flex h-screen ${(isOverRecommendedPages && !isPageWarningDismissed) ? 'pt-[88px]' : 'pt-16'}`}>
          
          {/* Left Sidebar: EDITOR SECTIONS */}
          <aside style={{ width: isLeftCollapsed ? 48 : leftWidth }} className="bg-surface-container-low border-r border-outline-variant/10 flex flex-col shrink-0 relative transition-[width] duration-300">
            <button
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              className={`absolute top-4 ${isLeftCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-[-24px]'} z-50 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-all hover:text-primary hover:shadow-md active:scale-95`}
              title={isLeftCollapsed ? 'Expand Editor' : 'Hide Editor'}
            >
              {isLeftCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="flex-1 flex flex-col overflow-hidden">
              {isLeftCollapsed ? (
                <button
                  type="button"
                  onClick={() => setIsLeftCollapsed(false)}
                  className="flex-1 flex flex-col items-center pt-16 gap-5 transition-colors hover:bg-zinc-50"
                  title="Expand Editor"
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Resume Editor
                  </span>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <Pencil size={16} />
                  </div>
                </button>
              ) : (
                <div
                  className="flex-1 overflow-y-auto"
                  onFocusCapture={() => setIsEditorFocused(true)}
                  onBlurCapture={(event) => {
                    const nextTarget = event.relatedTarget
                    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
                      return
                    }
                    setIsEditorFocused(false)
                  }}
                >
                  <SectionList
                    resumeData={resumeData}
                    visibility={visibility}
                    layout={templateConfig.layout}
                    expandedSection={expandedSection}
                    sectionHints={sectionHints}
                    onDataChange={handleDataChange}
                    onVisibilityChange={handleVisibilityChange}
                    onExpandSection={(id) => setExpandedSection(id)}
                    focusedFieldPath={focusedFieldPath}
                    onFocusedFieldHandled={() => setFocusedFieldPath(null)}
                    onSectionAction={(sectionType, action) => builderAnalytics.trackSectionEdit(sectionType, action)}
                    onSubSectionEditorOpened={(sectionType, subSectionId) =>
                      builderAnalytics.trackSubSectionEditorOpened(sectionType, subSectionId)
                    }
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Left Handle */}
          {!isLeftCollapsed && (
            <div 
              className="w-1 bg-transparent hover:bg-emerald-500/30 cursor-col-resize z-10 shrink-0 select-none scale-x-150 transition-colors"
              onMouseDown={() => setIsDraggingLeft(true)}
            />
          )}

          {/* Center Canvas */}
          <section className="flex-1 overflow-auto bg-surface-container flex flex-col items-center py-8 px-8 min-w-[500px]">
            {/* Canvas Tools */}
            <div className="mx-auto flex justify-between items-center mb-6 min-w-max" style={{ width: 794 * effectiveScale }}>
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
              id="builder-measure-wrapper"
              className="absolute -left-[99999px] top-0 w-[794px] opacity-0 pointer-events-none"
              aria-hidden
            >
              <TemplateComponent
              key={`print-${previewVersion}`}
              data={visibleData ?? resumeData}
              isEditing={false}
              showEmptyStateGuidance
              highlightedSectionId={null}
              onFieldChange={() => {}}
              sectionOrder={orderedSections}
              sidebarSectionOrder={orderedSidebarSections}
              config={templateConfig}
              onNavigateToField={handleNavigateToField}
              showEditingBadge={false}
            />
            </div>

            {/* Word-like paged preview + undo/redo to the right */}
            <div className="flex items-start gap-3 min-w-max">
            <div
              className="print:hidden relative"
              style={{
                width: 794 * effectiveScale,
                height: ((renderedPageCount * PAGE_H) + (Math.max(0, renderedPageCount - 1) * PAGE_GAP)) * effectiveScale,
              }}
            >
              <div
                className="builder-preview-transition"
                style={{
                  width: '794px',
                  height: `${(renderedPageCount * PAGE_H) + (Math.max(0, renderedPageCount - 1) * PAGE_GAP)}px`,
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {renderedPageSlices.map((pageSlice, pageIndex) => {
                  const pageTopPadding = pageIndex === 0 ? 0 : CONTINUATION_PAGE_TOP_PADDING
                  const pageContentHeight = pageSlice.height
                  const pageContentStartY = pageSlice.startY
                  const pageContentEndY = pageContentStartY + pageContentHeight
                  const hasFocusFrame =
                    Boolean(previewFocusFrame) &&
                    previewFocusFrame!.top + previewFocusFrame!.height > pageContentStartY &&
                    previewFocusFrame!.top < pageContentEndY
                  const focusInsetX = 16
                  const focusInsetY = 12
                  const focusLeft = previewFocusFrame
                    ? Math.max(12, previewFocusFrame.left - focusInsetX)
                    : 0
                  const focusWidth = previewFocusFrame
                    ? Math.min(794 - focusLeft - 12, previewFocusFrame.width + focusInsetX * 2)
                    : 0
                  const focusRawTop = previewFocusFrame
                    ? pageTopPadding + previewFocusFrame.top - pageContentStartY - focusInsetY
                    : 0
                  const focusRawBottom = previewFocusFrame
                    ? pageTopPadding + previewFocusFrame.top + previewFocusFrame.height - pageContentStartY + focusInsetY
                    : 0
                  const focusTop = Math.max(pageTopPadding + 6, focusRawTop)
                  const focusBottom = Math.min(PAGE_H - PAGE_BOTTOM_PADDING + 2, focusRawBottom)
                  const focusHeight = Math.max(34, focusBottom - focusTop)

                  return (
                    <div
                      key={`page-${pageIndex}`}
                      data-resume-preview-page="true"
                      className="absolute left-0 bg-white"
                      style={{
                        top: pageIndex * (PAGE_H + PAGE_GAP),
                        width: '794px',
                        height: `${PAGE_H}px`,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
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

                      <div data-pdf-ignore="true" className="absolute top-2 right-2 z-20 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200/80">
                        Page {pageIndex + 1}
                      </div>

                      <div
                        className="relative overflow-hidden w-full z-10"
                        style={{
                          height: `${pageContentHeight}px`,
                          marginTop: `${pageTopPadding}px`,
                        }}
                      >
                        <div
                          style={{
                            width: '794px',
                            transform: `translateY(-${pageContentStartY}px)`,
                            transformOrigin: 'top left',
                          }}
                        >
                          <TemplateComponent
                            key={`preview-${previewVersion}-${pageIndex}`}
                            data={visibleData ?? resumeData}
                            isEditing={false}
                            showEmptyStateGuidance
                            highlightedSectionId={null}
                            onFieldChange={() => {}}
                            sectionOrder={orderedSections}
                            sidebarSectionOrder={orderedSidebarSections}
                            config={templateConfig}
                            onNavigateToField={handleNavigateToField}
                            showEditingBadge={false}
                          />
                        </div>
                      </div>

                      {hasFocusFrame && (
                        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
                          <div
                            className="absolute rounded-[22px] border border-emerald-300/80 bg-emerald-50/60 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_16px_36px_rgba(16,185,129,0.12)]"
                            style={{
                              left: `${focusLeft}px`,
                              top: `${focusTop}px`,
                              width: `${focusWidth}px`,
                              height: `${focusHeight}px`,
                            }}
                          >
                            <span className="absolute right-3 top-2 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                              Editing
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
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
              className={`absolute top-4 ${isRightCollapsed ? 'left-1/2 -translate-x-1/2' : 'left-[-24px]'} z-50 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm active:scale-95 transition-all ${
                isRightCollapsed && !isPro && activeMode === 'builder'
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.32)] hover:brightness-110'
                  : 'border-zinc-200 bg-white text-zinc-400 hover:text-primary hover:shadow-md'
              }`}
              title={isRightCollapsed ? (activeMode === 'builder' && !isPro ? 'Open AI Insights Pro panel' : "Expand Sidebar") : "Hide Sidebar"}
            >
              {isRightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            <div className="flex-1 flex flex-col overflow-hidden">
              {isRightCollapsed ? (
                <button
                  type="button"
                  onClick={() => setIsRightCollapsed(false)}
                  className={`flex-1 flex flex-col items-center pt-16 gap-5 transition-colors ${
                    !isPro && activeMode === 'builder'
                      ? 'bg-gradient-to-b from-emerald-50 via-white to-emerald-50/70 hover:from-emerald-100 hover:via-white hover:to-emerald-100/80'
                      : 'hover:bg-zinc-50'
                  }`}
                  title={activeMode === 'builder' && !isPro ? 'Open AI Insights panel' : 'Expand Sidebar'}
                >
                  <span className={`[writing-mode:vertical-lr] rotate-180 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest ${
                    !isPro && activeMode === 'builder'
                      ? 'text-emerald-700'
                      : 'text-zinc-400'
                  }`}>
                    {activeMode === 'tailor' ? 'Tailor Mode' : 'AI Insights'}
                  </span>
                  {!isPro && activeMode === 'builder' ? (
                    <div className="flex h-20 w-9 items-center justify-center rounded-[20px] bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.28)]">
                      <Sparkles size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                      <Star size={16} />
                    </div>
                  )}
                </button>
              ) : (
                activeMode === 'tailor' ? (
                  <TailorPanel
                    analysis={tailorAnalysis}
                    isTailoring={isTailoring}
                    tailorError={tailorError}
                    jobDescription={jobDescription}
                    intensity={tailorIntensity}
                    previewScoreDelta={tailorPreview?.scoreDelta ?? null}
                    previewScore={tailorPreview?.afterScore ?? null}
                    currentScore={tailorPreview?.beforeScore ?? null}
                    onJobDescriptionChange={setJobDescription}
                    onIntensityChange={setTailorIntensity}
                    onAnalyse={handleAnalyse}
                    onApplyAll={handleApplyTailorAll}
                    onApplySection={handleApplyTailorSection}
                  />
                ) : (
                  <AIInsightsPanel
                    resumeData={visibleData}
                    onApplyFix={handleApplyAIInsightFix}
                    onUndoFix={handleUndo}
                    onStartTailoring={handleTailorClick}
                    resumeId={resumeId}
                    isPro={isPro}
                    autoStartOptimize={autoOptimizeParam && activeMode === 'builder' && !needsOverflowTrim}
                    onAutoStartOptimizeConsumed={clearAutoOptimizeParam}
                  />
                )
              )}
            </div>
          </aside>
          
        </main>
      </div>

      <TemplateCustomizerModal
        key={isTemplateModalOpen ? JSON.stringify(templateConfig) : 'template-modal-closed'}
        isOpen={isTemplateModalOpen}
        config={templateConfig}
        onConfigChange={setTemplateConfig}
        onClose={() => setIsTemplateModalOpen(false)}
        resumeData={visibleData ?? resumeData}
      />
      <ProGateModal feature={blockedFeature} onClose={clearBlockedFeature} />
    </>
  )
}

// ─── Mobile fallback ──────────────────────────────────────────────────────────

function MobileFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center font-body">
      <h1 className="text-xl font-bold text-zinc-900 mb-2 font-headline">Builder works best on desktop</h1>
      <p className="text-sm text-zinc-500 mb-6">
        The resume builder requires a larger screen. Use a laptop or desktop to edit your resume.
      </p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
        Go back to Home
      </Link>
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
    return <MobileFallback />
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
