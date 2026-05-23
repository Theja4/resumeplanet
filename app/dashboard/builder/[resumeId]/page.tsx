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
import type { BuilderVisibility, GhostResumeSectionId, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY, DEFAULT_UNIVERSAL_CONFIG, EMPTY_RESUME_DATA } from '@/types'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { generateDOCX } from '@/lib/docxGenerator'
import { useUndoHistory } from '@/lib/undoHistory'
import { applyInsightSuggestionToResumeData, type InsightSuggestionLike } from '@/lib/ai-insights'
import { applyTailorAnalysisToResumeData, canApplyTailorSection } from '@/lib/tailorResume'
import { readTailorJobTransfer } from '@/lib/tailorJobTransfer'
import { scoreResume, SCORER_VERSION } from '@/lib/ats-scorer'
import { getResumeSkills, syncResumeData } from '@/lib/resume-data'
import {
  RESUME_FIRST_PAGE_CONTENT_HEIGHT_PX as FIRST_PAGE_CONTENT_H,
  RESUME_PAGE_HEIGHT_PX as PAGE_H,
  computeResumePageSlices,
  type ResumePageSlice as PreviewPageSlice,
} from '@/lib/resumePagination'
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

const DEFAULT_LEFT_PANEL_WIDTH = 480
const DEFAULT_RIGHT_PANEL_WIDTH = 380
const COLLAPSED_PANEL_WIDTH = 48
const BUILDER_PREVIEW_WIDTH = 794
const BUILDER_LAYOUT_GUTTER = 160
const LEGACY_DEFAULT_SECTION_ORDER = ['summary', 'experience', 'education', 'projects', 'volunteer']
const LEGACY_DEFAULT_SIDEBAR_SECTION_ORDER = [
  'skills',
  'certifications',
  'languages',
  'interests',
  'awards',
  'publications',
  'references',
]
const GHOST_RESUME_SECTION_IDS = ['summary', 'experience', 'education', 'skills'] as const satisfies readonly GhostResumeSectionId[]
const GHOST_DISMISSAL_STORAGE_PREFIX = 'rezoomed:builder:ghost-dismissed'

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
  const savedPrimaryWithoutContact = (savedPrimary ?? []).filter(id => id !== 'contact')
  const savedSidebarWithoutContact = (savedSidebar ?? []).filter(id => id !== 'contact')
  const hasLegacyVolunteerOrder =
    savedPrimaryWithoutContact.length === LEGACY_DEFAULT_SECTION_ORDER.length &&
    savedPrimaryWithoutContact.every((sectionId, index) => sectionId === LEGACY_DEFAULT_SECTION_ORDER[index]) &&
    savedSidebarWithoutContact.length === LEGACY_DEFAULT_SIDEBAR_SECTION_ORDER.length &&
    savedSidebarWithoutContact.every((sectionId, index) => sectionId === LEGACY_DEFAULT_SIDEBAR_SECTION_ORDER[index])

  if (hasLegacyVolunteerOrder) {
    return {
      primary: [...DEFAULT_VISIBILITY.sectionOrder],
      sidebar: [...(DEFAULT_VISIBILITY.sidebarSectionOrder ?? [])],
    }
  }

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

function hasMeaningfulSkillData(data: ResumeData) {
  return (
    getResumeSkills(data).length > 0 ||
    (data.skillSections ?? []).some(section =>
      hasMeaningfulText(section.title) ||
      hasMeaningfulText(section.tag) ||
      (section.skills ?? []).some(hasMeaningfulText)
    )
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

function isGhostResumeSectionId(sectionId: string): sectionId is GhostResumeSectionId {
  return (GHOST_RESUME_SECTION_IDS as readonly string[]).includes(sectionId)
}

function getChangedGhostResumeSections(previous: ResumeData, updated: ResumeData) {
  const changedSections: GhostResumeSectionId[] = []

  if (previous.summary !== updated.summary) changedSections.push('summary')
  if (JSON.stringify(previous.experience) !== JSON.stringify(updated.experience)) changedSections.push('experience')
  if (JSON.stringify(previous.education) !== JSON.stringify(updated.education)) changedSections.push('education')
  if (
    JSON.stringify(previous.skills) !== JSON.stringify(updated.skills) ||
    JSON.stringify(previous.skillSections ?? []) !== JSON.stringify(updated.skillSections ?? [])
  ) {
    changedSections.push('skills')
  }

  return changedSections
}

function shouldPersistGhostDismissals(resumeId: string) {
  return resumeId !== 'draft' && resumeId !== 'new'
}

// ─── Draft recovery (mobile suspension / browser crash safety net) ──────────
//
// `forceSave` is async. On mobile Safari the OS can suspend the tab before
// our Supabase RPC completes — meaning the user's last few edits are gone
// without warning. As a defensive layer, we snapshot the in-memory resume to
// sessionStorage on every `visibilitychange:hidden` event when there are
// unsaved changes. Next page load (still same tab) checks for that snapshot
// and offers to restore it.
//
// sessionStorage is per-tab, so this doesn't leak across users / browser
// profiles. It clears automatically when the tab is finally closed.

interface DraftRecoverySnapshot {
  resumeData: ResumeData
  visibility: BuilderVisibility
  templateConfig: UniversalConfig
  title: string
  savedAt: number
}

const DRAFT_RECOVERY_PREFIX = 'rezoomed:builder:recovery'
const DRAFT_RECOVERY_MAX_AGE_MS = 1000 * 60 * 60 * 24 // 24h

function getDraftRecoveryKey(resumeId: string) {
  return `${DRAFT_RECOVERY_PREFIX}:${resumeId}`
}

// When a /draft INSERT succeeds we stash the new resume id here before
// replacing the visible URL. If the user navigates back to /draft, we redirect
// them to the row they already created — preventing duplicate INSERTs of the
// same draft from one tab.
const DRAFT_PROMOTED_ID_KEY = 'rezoomed:builder:draft-promoted-id'

function readDraftPromotedId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(DRAFT_PROMOTED_ID_KEY)
  } catch {
    return null
  }
}

function writeDraftPromotedId(id: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DRAFT_PROMOTED_ID_KEY, id)
  } catch {
    // sessionStorage may be full or disabled; the duplicate-INSERT guard
    // simply degrades to current behaviour.
  }
}

function clearDraftPromotedId() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(DRAFT_PROMOTED_ID_KEY)
  } catch {
    // ignore
  }
}

function writeDraftRecovery(resumeId: string, snapshot: DraftRecoverySnapshot) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(getDraftRecoveryKey(resumeId), JSON.stringify(snapshot))
  } catch {
    // sessionStorage may be full or disabled; best-effort only.
  }
}

function readDraftRecovery(resumeId: string): DraftRecoverySnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(getDraftRecoveryKey(resumeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftRecoverySnapshot
    if (!parsed || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > DRAFT_RECOVERY_MAX_AGE_MS) {
      window.sessionStorage.removeItem(getDraftRecoveryKey(resumeId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function clearDraftRecovery(resumeId: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(getDraftRecoveryKey(resumeId))
  } catch {
    // ignore
  }
}

function getGhostDismissalStorageKey(resumeId: string) {
  return `${GHOST_DISMISSAL_STORAGE_PREFIX}:${resumeId}`
}

function readGhostDismissalsFromStorage(resumeId: string) {
  if (typeof window === 'undefined' || !shouldPersistGhostDismissals(resumeId)) {
    return new Set<GhostResumeSectionId>()
  }

  try {
    const raw = window.localStorage.getItem(getGhostDismissalStorageKey(resumeId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return new Set<GhostResumeSectionId>()

    return new Set(parsed.filter((sectionId): sectionId is GhostResumeSectionId =>
      typeof sectionId === 'string' && isGhostResumeSectionId(sectionId)
    ))
  } catch {
    return new Set<GhostResumeSectionId>()
  }
}

function writeGhostDismissalsToStorage(resumeId: string, dismissedSections: Set<GhostResumeSectionId>) {
  if (typeof window === 'undefined' || !shouldPersistGhostDismissals(resumeId)) return

  try {
    const key = getGhostDismissalStorageKey(resumeId)
    const values = Array.from(dismissedSections)

    if (values.length === 0) {
      window.localStorage.removeItem(key)
      return
    }

    window.localStorage.setItem(key, JSON.stringify(values))
  } catch {
    // Local storage is best-effort; the in-memory dismissal still protects the current edit session.
  }
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
    !hasMeaningfulSkillData(resumeData) &&
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

  // Conservative trim: only hide trailing bullets. We deliberately do NOT
  // hide entire items or whole sections automatically — silently removing a
  // user's Education or Volunteer block was a major trust-breaker. If a
  // resume is still over the page limit after every trailing bullet is
  // hidden, we return null and the caller surfaces a warning toast instead.
  for (const sectionId of [...getRenderableSectionIds(nextVisibility)].reverse()) {
    if (trimLastVisibleBullet(nextResumeData, nextVisibility, sectionId)) {
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

  // Side-effecting URL params (auto-download, auto-optimize, auto-tailor)
  // burn the user's AI/PDF quota on page load. To prevent a phishing vector
  // where a malicious link triggers these without user intent, we ONLY honor
  // them when the navigation originated from the same origin (or was typed
  // directly into the address bar, which gives an empty referrer).
  const isSameOriginNavigation = (() => {
    if (typeof window === 'undefined') return true
    const referrer = document.referrer
    if (!referrer) return true // typed URL or bookmark — trusted
    try {
      return new URL(referrer).origin === window.location.origin
    } catch {
      return false
    }
  })()

  const downloadParam = isSameOriginNavigation ? searchParams.get('download') : null
  const autoOptimizeParam = isSameOriginNavigation && searchParams.get('autoOptimize') === '1'
  const tailorJobKeyParam = isSameOriginNavigation ? searchParams.get('tailorJobKey') : null
  const autoTailorParam = isSameOriginNavigation && searchParams.get('autoTailor') === '1'
  const ignoreTemplateQueryOverrides = shouldIgnoreTemplateQueryOverrides(sourceParam)

  const { requirePro, blockedFeature, clearBlockedFeature } = useProGate()

  const [persistedResumeId, setPersistedResumeId] = useState(resumeId)
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
  const [dismissedGhostSections, setDismissedGhostSections] = useState<Set<GhostResumeSectionId>>(
    () => readGhostDismissalsFromStorage(resumeId)
  )
  const [zoomDelta, setZoomDelta] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPageWarningDismissed, setIsPageWarningDismissed] = useState(false)
  const [scoreShift, setScoreShift] = useState<{ from: number; to: number } | null>(null)
  // Optimistic concurrency token — the updated_at value from the most recent
  // successful load or save. Every UPDATE includes it in the WHERE clause; if
  // it no longer matches, another tab/device wrote first and we surface a
  // "conflict — refresh" toast instead of clobbering their changes.
  const lastSavedAtRef = useRef<string | null>(null)
  const [conflictDetected, setConflictDetected] = useState(false)
  // True when the conservative auto-trim couldn't get the resume back under
  // the page limit. We show a banner so the user knows their resume is too
  // long instead of silently hiding sections like we used to.
  const [overflowTrimUnresolved, setOverflowTrimUnresolved] = useState(false)
  // Recovery snapshot offer — only set if sessionStorage has a snapshot that's
  // strictly newer than what we just loaded from Supabase.
  const [recoveryOffer, setRecoveryOffer] = useState<DraftRecoverySnapshot | null>(null)
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth
  )
  const [visibility, setVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedVisibility, setSavedVisibility] = useState<BuilderVisibility>(DEFAULT_VISIBILITY)
  const [savedTemplateConfig, setSavedTemplateConfig] = useState<UniversalConfig | null>(null)
  const resumeRef = useRef<HTMLDivElement>(null)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const dismissedGhostSectionsRef = useRef(dismissedGhostSections)
  const skipLoadForPromotedResumeIdRef = useRef<string | null>(null)
  const latestBuilderStateRef = useRef<DraftRecoverySnapshot | null>(null)

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

  const ghostSections = useMemo<Partial<Record<GhostResumeSectionId, boolean>>>(() => {
    if (!resumeData) return {}

    const isSectionAvailable = (sectionId: GhostResumeSectionId) =>
      visibility.sections[sectionId] !== false && !dismissedGhostSections.has(sectionId)

    return {
      summary: isSectionAvailable('summary') && !hasMeaningfulText(resumeData.summary),
      experience: isSectionAvailable('experience') && !resumeData.experience.some(hasMeaningfulExperienceItem),
      education: isSectionAvailable('education') && !resumeData.education.some(hasMeaningfulEducationItem),
      skills: isSectionAvailable('skills') && !hasMeaningfulSkillData(resumeData),
    }
  }, [dismissedGhostSections, resumeData, visibility.sections])

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
    function handleResize() {
      setViewportWidth(window.innerWidth)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const storedDismissals = readGhostDismissalsFromStorage(resumeId)
    dismissedGhostSectionsRef.current = storedDismissals
    setDismissedGhostSections(storedDismissals)
  }, [resumeId])

  useEffect(() => {
    dismissedGhostSectionsRef.current = dismissedGhostSections
  }, [dismissedGhostSections])

  useEffect(() => {
    setPersistedResumeId(resumeId)
  }, [resumeId])

  useEffect(() => {
    if (!resumeData) return

    latestBuilderStateRef.current = {
      resumeData,
      visibility,
      templateConfig,
      title: resumeTitle,
      savedAt: Date.now(),
    }
  }, [resumeData, resumeTitle, templateConfig, visibility])

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
    setPageSlices(computeResumePageSlices(container))
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
  }, [recomputeResumeHeight, resumeData, visibility, templateConfig, ghostSections])

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
  }, [recomputeResumeHeight, recomputePageBreak, recomputePreviewFocusFrame, resumeData, visibility, templateConfig, ghostSections])

  useEffect(() => {
    let cancelled = false
    let frame = 0

    async function recomputeAfterFonts() {
      try {
        if (document.fonts && typeof document.fonts.ready?.then === 'function') {
          await document.fonts.ready
        }
      } catch {
        // Ignore font readiness failures and use the current layout metrics.
      }

      if (cancelled) return
      frame = window.requestAnimationFrame(() => {
        recomputeResumeHeight()
        recomputePageBreak()
        recomputePreviewFocusFrame()
      })
    }

    void recomputeAfterFonts()

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [recomputeResumeHeight, recomputePageBreak, recomputePreviewFocusFrame, resumeData, visibility, templateConfig, ghostSections])

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

  // When layout density / visibility / ghost-section state changes, briefly
  // collapse to a single page so the hidden print wrapper can re-measure.
  //
  // We deliberately depend on *stable scalar keys* — not the full object
  // references — so a normal keystroke (which produces a new resumeData
  // reference, which produces a new ghostSections memo reference) does NOT
  // re-trigger the 180ms collapse. Only changes that actually affect the
  // layout (section order, density, ghost on/off, template choice) reset it.
  const ghostSectionsKey = useMemo(
    () =>
      Object.entries(ghostSections)
        .map(([id, on]) => `${id}:${on ? 1 : 0}`)
        .sort()
        .join('|'),
    [ghostSections]
  )
  const visibilityKey = useMemo(
    () =>
      JSON.stringify({
        sections: visibility.sections,
        sectionOrder: visibility.sectionOrder,
        sidebarSectionOrder: visibility.sidebarSectionOrder,
        density: visibility.density,
      }),
    [visibility.sections, visibility.sectionOrder, visibility.sidebarSectionOrder, visibility.density]
  )
  const templateConfigKey = useMemo(
    () =>
      [
        templateConfig.layout,
        templateConfig.headerStyle,
        templateConfig.density,
        templateConfig.bulletStyle,
        templateConfig.sectionHeadingStyle,
        templateConfig.skillsStyle,
        templateConfig.dateLayout,
        templateConfig.contactStyle,
        templateConfig.fontFamily,
        templateConfig.nameSize,
        templateConfig.accentColor,
        // Stable string of per-field link toggles so pagination resettles when
        // a contact-link toggle flips (an underlined hyperlink may wrap
        // differently from plain text in tight cases).
        typeof templateConfig.contactLinksClickable === 'object' && templateConfig.contactLinksClickable !== null
          ? JSON.stringify(templateConfig.contactLinksClickable)
          : String(templateConfig.contactLinksClickable ?? ''),
        templateConfig.lineSpacing ?? 'normal',
      ].join(':'),
    [templateConfig]
  )

  useEffect(() => {
    setIsPaginationSettling(true)
    setPageSlices([{ startY: 0, height: FIRST_PAGE_CONTENT_H }])
    setPreviewVersion(version => version + 1)

    const id = window.setTimeout(() => {
      setIsPaginationSettling(false)
    }, 180)

    return () => window.clearTimeout(id)
  }, [visibilityKey, templateConfigKey, ghostSectionsKey])

  const MAX_PAGES = 5
  const RECOMMENDED_PAGES = 2
  const pageCount = isPaginationSettling ? 1 : pageSlices.length
  const isOverPageLimit = pageCount > MAX_PAGES
  const isOverRecommendedPages = pageCount > RECOMMENDED_PAGES

  // ── Load resume on mount ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (resumeId === 'new') {
        // The user explicitly asked for a brand-new resume — clear any stale
        // draft-promotion marker so we don't redirect them back into the last
        // resume they created from this tab.
        clearDraftPromotedId()
        const query = searchParams.toString()
        router.replace(`/dashboard/builder/draft${query ? `?${query}` : ''}`)
        return
      }

      if (resumeId === 'draft' && persistedResumeId !== 'draft') {
        setIsLoading(false)
        return
      }

      // If this tab already promoted a /draft to a real resume during a
      // prior save, reuse that id instead of starting a fresh draft.
      // Prevents a second INSERT for the same conceptual draft.
      if (resumeId === 'draft') {
        const promoted = readDraftPromotedId()
        if (promoted) {
          router.replace(`/dashboard/builder/${promoted}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
          return
        }
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

      if (
        skipLoadForPromotedResumeIdRef.current === resumeId &&
        latestBuilderStateRef.current?.resumeData
      ) {
        // A /draft insert just succeeded in this tab. Keep the live editor
        // state mounted instead of reloading the newly inserted DB snapshot,
        // because the user may have typed more while the insert was in flight.
        skipLoadForPromotedResumeIdRef.current = null
        if (readDraftPromotedId() === resumeId) {
          clearDraftPromotedId()
        }
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
      lastSavedAtRef.current =
        typeof (resume as Record<string, unknown>).updated_at === 'string'
          ? (resume as { updated_at: string }).updated_at
          : null

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

      // Defensive draft recovery: if sessionStorage has a snapshot newer than
      // the row we just loaded, the previous tab's forceSave was likely
      // interrupted (mobile suspension, crash). Offer to restore.
      try {
        const snapshot = readDraftRecovery(resumeId)
        const dbUpdatedAtMs = typeof (resume as { updated_at?: string }).updated_at === 'string'
          ? new Date((resume as { updated_at: string }).updated_at).getTime()
          : 0
        const wasPromotedInThisTab = readDraftPromotedId() === resumeId
        if (snapshot && wasPromotedInThisTab && snapshot.savedAt > dbUpdatedAtMs) {
          setResumeData(snapshot.resumeData)
          setVisibility(snapshot.visibility)
          setTemplateConfig(snapshot.templateConfig)
          setResumeTitle(snapshot.title)
        } else if (snapshot && snapshot.savedAt > dbUpdatedAtMs + 1000) {
          setRecoveryOffer(snapshot)
        } else if (snapshot) {
          // Snapshot is older than the DB → already persisted. Clean up.
          clearDraftRecovery(resumeId)
        }
      } catch {
        // Recovery is best-effort; never block load.
      }

      // Detect scoring-formula shift: if the saved score is stale relative to
      // the new scorer version, surface a one-time banner so the user knows
      // why their number moved.
      try {
        const ackKey = `rezoomed:scorer-update-acknowledged:v${SCORER_VERSION}`
        const acknowledged = typeof window !== 'undefined' && window.localStorage.getItem(ackKey) === '1'
        const savedScore = typeof (resume as Record<string, unknown>).ats_score === 'number'
          ? (resume as { ats_score: number }).ats_score
          : null
        if (!acknowledged && savedScore !== null) {
          const liveScore = scoreResume(getVisibleResumeData(data, mergedVisibility)).score
          if (Math.abs(liveScore - savedScore) >= 3) {
            setScoreShift({ from: savedScore, to: liveScore })
          }
        }
      } catch {
        // Banner is best-effort; never block the load on it.
      }

      // We've successfully landed on a real resume id — the draft promotion
      // ran to completion, so clear the redirect marker. A genuinely new
      // /draft visit later (e.g., from "New Resume") will then get a fresh
      // INSERT instead of being redirected to this resume.
      if (readDraftPromotedId() === resumeId) {
        clearDraftPromotedId()
      }

      setIsLoading(false)
    }
    load()
  }, [applyUrlTemplateOverrides, persistedResumeId, resumeId, router, searchParams, supabase, userId])

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
  // Holds the pre-batch ResumeData snapshot during an Apply-All run so we
  // push exactly ONE undo entry for the whole batch instead of N. Cleared on
  // the final (non-silent) apply.
  const applyAllOriginRef = useRef<ResumeData | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hasSaveableDraftContent =
    persistedResumeId !== 'draft' || Boolean(resumeData && !isResumeDataMeaningfullyEmpty(resumeData))

  // Two-phase comparison:
  //   1. Reference equality (free) — after every successful save we point the
  //      saved* state at the very same object that lives in the live state,
  //      so the common "no unsaved changes" case short-circuits here.
  //   2. JSON.stringify deep diff — only runs when references differ AND the
  //      memo dependencies change, so we don't stringify ~50KB on every
  //      render of a senior resume.
  const hasUnsavedChanges = useMemo(() => {
    if (!resumeData || !hasSaveableDraftContent) return false
    if (
      resumeData === savedData &&
      visibility === savedVisibility &&
      templateConfig === savedTemplateConfig
    ) {
      return false
    }
    return (
      JSON.stringify(resumeData) !== JSON.stringify(savedData) ||
      JSON.stringify(visibility) !== JSON.stringify(savedVisibility) ||
      JSON.stringify(templateConfig) !== JSON.stringify(savedTemplateConfig)
    )
  }, [resumeData, savedData, visibility, savedVisibility, templateConfig, savedTemplateConfig, hasSaveableDraftContent])

  const dismissGhostSections = useCallback((sections: GhostResumeSectionId | GhostResumeSectionId[]) => {
    const sectionList = Array.isArray(sections) ? sections : [sections]
    if (sectionList.length === 0) return

    setDismissedGhostSections(previous => {
      const next = new Set(previous)
      let changed = false

      for (const sectionId of sectionList) {
        if (next.has(sectionId)) continue
        next.add(sectionId)
        changed = true
      }

      if (!changed) return previous

      dismissedGhostSectionsRef.current = next
      writeGhostDismissalsToStorage(resumeId, next)
      return next
    })
  }, [resumeId])

  async function forceSave() {
    if (!resumeData || !hasUnsavedChanges || isSaving || saveLockRef.current) return

    // Snapshot the state at the moment we begin saving. If the user keeps
    // typing during the round trip, hasUnsavedChanges will correctly remain
    // true because the snapshot — not the freshly-mutated state — is what
    // we mark as "saved" once the round trip completes.
    const dataSnapshot = resumeData
    const visibilitySnapshot = visibility
    const templateConfigSnapshot = templateConfig
    const titleSnapshot = resumeTitle

    // A new draft becomes a library resume only after the final resume content has text.
    // Empty section rows, ghost dismissals, visibility changes, and style tweaks are not enough.
    if (persistedResumeId === 'draft') {
      if (isResumeDataMeaningfullyEmpty(dataSnapshot)) return
    }

    saveLockRef.current = true
    setIsSaving(true)
    setSaveFailed(false)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = undefined
    }
    const visibleResumeData = getVisibleResumeData(dataSnapshot, visibilitySnapshot)
    const atsScore = scoreResume(visibleResumeData).score

    try {
      if (persistedResumeId === 'draft') {
        const insertedAt = new Date().toISOString()
        const { data, error } = await supabase
          .from('resumes')
          .insert({
            user_id: userId,
            title: titleSnapshot || 'Untitled Resume',
            parsed_data: dataSnapshot,
            ats_score: atsScore,
            builder_visibility: visibilitySnapshot,
            template_config: templateConfigSnapshot,
            updated_at: insertedAt,
          })
          .select('id, updated_at')
          .single()

        if (error) throw error

        if (data) {
          setSavedData(dataSnapshot)
          setSavedVisibility(visibilitySnapshot)
          setSavedTemplateConfig(templateConfigSnapshot)
          lastSavedAtRef.current =
            typeof (data as { updated_at?: string }).updated_at === 'string'
              ? (data as { updated_at: string }).updated_at
              : insertedAt
          writeGhostDismissalsToStorage(data.id, dismissedGhostSectionsRef.current)
          clearDraftRecovery(resumeId)
          const latestSnapshot = latestBuilderStateRef.current ?? {
            resumeData: dataSnapshot,
            visibility: visibilitySnapshot,
            templateConfig: templateConfigSnapshot,
            title: titleSnapshot,
            savedAt: Date.now(),
          }
          const hasNewerLocalDraftChanges =
            JSON.stringify(latestSnapshot.resumeData) !== JSON.stringify(dataSnapshot) ||
            JSON.stringify(latestSnapshot.visibility) !== JSON.stringify(visibilitySnapshot) ||
            JSON.stringify(latestSnapshot.templateConfig) !== JSON.stringify(templateConfigSnapshot) ||
            latestSnapshot.title !== titleSnapshot
          if (hasNewerLocalDraftChanges) {
            writeDraftRecovery(data.id, {
              ...latestSnapshot,
              savedAt: Date.now(),
            })
          }
          // Stash the new id before replacing the visible URL so a browser
          // back-navigation that returns to /draft can redirect here instead
          // of inserting again.
          writeDraftPromotedId(data.id)
          skipLoadForPromotedResumeIdRef.current = data.id
          setPersistedResumeId(data.id)
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/dashboard/builder/${data.id}`)
          }
        }
      } else {
        const nextUpdatedAt = new Date().toISOString()
        const expectedUpdatedAt = lastSavedAtRef.current

        let updateQuery = supabase
          .from('resumes')
          .update({
            title: titleSnapshot || 'Untitled Resume',
            parsed_data: dataSnapshot,
            ats_score: atsScore,
            builder_visibility: visibilitySnapshot,
            template_config: templateConfigSnapshot,
            updated_at: nextUpdatedAt,
          })
          .eq('id', persistedResumeId)
          .eq('user_id', userId)

        // Optimistic concurrency: only update if the row hasn't been written
        // by another tab/device since we last saw it. Empty results signal
        // a conflict.
        if (expectedUpdatedAt) {
          updateQuery = updateQuery.eq('updated_at', expectedUpdatedAt)
        }

        const { data: updatedRows, error } = await updateQuery.select('updated_at')

        if (error) throw error

        if (!updatedRows || updatedRows.length === 0) {
          // No row updated — either the row no longer exists OR someone else
          // wrote it. Surface a conflict so the user knows to refresh.
          setConflictDetected(true)
          throw new Error('CONCURRENT_EDIT_CONFLICT')
        }

        const written = updatedRows[0] as { updated_at?: string }
        lastSavedAtRef.current = written.updated_at ?? nextUpdatedAt
        setSavedData(dataSnapshot)
        setSavedVisibility(visibilitySnapshot)
        setSavedTemplateConfig(templateConfigSnapshot)
        clearDraftRecovery(persistedResumeId)
      }
    } catch (err: unknown) {
      const errorDetails =
        err && typeof err === 'object'
          ? (err as { message?: string; details?: string; hint?: string; code?: string })
          : {}

      // CONCURRENT_EDIT_CONFLICT isn't an error per se — another tab won.
      // We already set conflictDetected before throwing; don't show the
      // generic "Save Failed" indicator on top of the conflict banner.
      if (errorDetails.message === 'CONCURRENT_EDIT_CONFLICT') {
        console.warn('Save blocked by concurrent edit; conflict banner shown.')
      } else {
        setSaveFailed(true)
        console.error('Persistence Error Details:', {
          message: errorDetails.message,
          details: errorDetails.details,
          hint: errorDetails.hint,
          code: errorDetails.code,
          fullError: err
        })
      }
    } finally {
      setIsSaving(false)
      saveLockRef.current = false
    }
  }

  // ── Resizable Panels ────────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH)
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => isPro)
  const builderPanelWidthsRef = useRef({
    left: DEFAULT_LEFT_PANEL_WIDTH,
    right: DEFAULT_RIGHT_PANEL_WIDTH,
  })
  const expandedBuilderWidth =
    (isLeftCollapsed ? COLLAPSED_PANEL_WIDTH : leftWidth) +
    rightWidth +
    (BUILDER_PREVIEW_WIDTH * effectiveScale) +
    BUILDER_LAYOUT_GUTTER
  const shouldSuppressBuilderInsights =
    activeMode === 'builder' &&
    !isPro &&
    viewportWidth > 0 &&
    viewportWidth < expandedBuilderWidth

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
    // Do not promote a brand-new /draft just because the user switched
    // sections. Let the normal debounced save capture the current editing
    // burst; otherwise the route can promote from an older snapshot and
    // overwrite edits typed immediately after the section switch.
    if (persistedResumeId === 'draft') return

    if (hasUnsavedChanges && !needsOverflowTrim) {
      forceSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSection, needsOverflowTrim, persistedResumeId])

  useEffect(() => {
    if (!needsOverflowTrim || !resumeData || isLoading || isPaginationSettling) return

    if (!isOverPageLimit) {
      setNeedsOverflowTrim(false)
      setOverflowTrimUnresolved(false)
      return
    }

    const trimmedStep = applyOverflowTrimStep(resumeData, visibility)
    if (!trimmedStep) {
      // Trim conservatively only touches trailing bullets. If we're still over
      // the limit after every trailing bullet is hidden, we surface a warning
      // banner instead of silently hiding entire sections.
      setNeedsOverflowTrim(false)
      setOverflowTrimUnresolved(true)
      return
    }

    const hiddenGhostSections = GHOST_RESUME_SECTION_IDS.filter(
      sectionId => visibility.sections[sectionId] !== false && trimmedStep.nextVisibility.sections[sectionId] === false
    )
    if (hiddenGhostSections.length > 0) dismissGhostSections(hiddenGhostSections)

    setResumeData(trimmedStep.nextResumeData)
    setVisibility(trimmedStep.nextVisibility)
  }, [dismissGhostSections, needsOverflowTrim, resumeData, visibility, isLoading, isPaginationSettling, isOverPageLimit])

  // ── beforeunload + visibility-change guards ────────────────────────────────
  // beforeunload: when the tab is closing, prompt the user if there are unsaved
  // changes so the browser gives us a small grace period to persist the buffer.
  // visibilitychange: when the tab goes to background or is being put to sleep
  // (mobile / pwa lifecycle), fire forceSave eagerly — this is the modern
  // best-practice trigger that fires more reliably than beforeunload.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return
      // Best-effort: fire the save (async); browsers won't wait for the
      // promise but will let the queued microtasks run during unload.
      void forceSave()
      // Prompts the "Leave site?" dialog in most browsers; the actual text
      // is browser-controlled — `returnValue` only needs to be truthy.
      event.preventDefault()
      event.returnValue = ''
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges && resumeData) {
        // Defensive: stash a recovery snapshot to sessionStorage. If the OS
        // suspends the tab before the async forceSave RPC completes, the
        // next time the user opens this resume we can offer to restore.
        writeDraftRecovery(resumeId, {
          resumeData,
          visibility,
          templateConfig,
          title: resumeTitle,
          savedAt: Date.now(),
        })
        void forceSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges])

  function handleDataChange(updated: ResumeData) {
    if (resumeData) history.pushHistory(resumeData, visibility)
    if (resumeData) {
      const changedGhostSections = getChangedGhostResumeSections(resumeData, updated)
      if (changedGhostSections.length > 0) dismissGhostSections(changedGhostSections)
    }
    builderAnalytics.trackSectionEdit(expandedSection ?? 'contact', 'edit')
    setResumeData(updated)
  }

  function handleVisibilityChange(updated: BuilderVisibility) {
    if (resumeData) history.pushHistory(resumeData, visibility)

    const hiddenGhostSections = GHOST_RESUME_SECTION_IDS.filter(
      sectionId => visibility.sections[sectionId] !== false && updated.sections[sectionId] === false
    )
    if (hiddenGhostSections.length > 0) dismissGhostSections(hiddenGhostSections)

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
    if (isGhostResumeSectionId(sectionId)) {
      dismissGhostSections(sectionId)
    }

    const indexedFieldMatch = path.match(/^(experience|education|projects)\.(\d+)\./)
    const customIndexedMatch = path.match(/^(custom_[a-z0-9]+)\.items\.(\d+)\./)

    if (indexedFieldMatch) {
      const indexedSectionId = indexedFieldMatch[1] as 'experience' | 'education' | 'projects'
      const requestedIndex = Number(indexedFieldMatch[2])

      setResumeData(previous => {
        if (!previous) return previous

        const currentItems = previous[indexedSectionId]
        if (currentItems.length > requestedIndex) return previous

        // Only honour click-to-create for the NEXT slot (index === length).
        // Stale clicks on already-deleted items used to silently spawn
        // multiple empty entries — e.g. click "experience.5.title" with 0
        // items used to create 5 empty entries. Now we no-op those.
        if (requestedIndex !== currentItems.length) return previous

        const nextItems = [...currentItems, createEmptySectionItem(indexedSectionId)]
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
        // Same guard as above — only allow appending one entry at the tail.
        if (requestedIndex !== currentItems.length) return previous

        const nextItems = [...currentItems, { company: '', title: '', location: '', startDate: '', endDate: '', bullets: [], bulletVisibility: [] }]
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

    // sessionStorage cache: keyed by (resumeId, intensity, resume signature,
    // JD hash). Identical re-runs skip the network round trip and don't burn
    // AI tokens — common when the user goes back to the tailor panel after
    // applying suggestions to read them again.
    const cacheKey = (() => {
      try {
        const resumeSig = JSON.stringify(visibleData)
        const jdHash = jobDescription.trim().slice(0, 4000)
        return `rezoomed:tailor-cache:${resumeId}:${tailorIntensity}:${resumeSig.length}:${jdHash.length}:${jdHash.slice(0, 80)}`
      } catch {
        return null
      }
    })()

    if (cacheKey && typeof window !== 'undefined') {
      try {
        const cached = window.sessionStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached) as { savedAt: number; analysis: TailorAnalysis }
          if (Date.now() - parsed.savedAt < 1000 * 60 * 30) {
            setTailorError(null)
            setTailorAnalysis(parsed.analysis)
            return
          }
          window.sessionStorage.removeItem(cacheKey)
        }
      } catch {
        // Ignore cache read failures.
      }
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
        if (cacheKey && typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ savedAt: Date.now(), analysis: json.data })
            )
          } catch {
            // sessionStorage may be full; cache is best-effort.
          }
        }
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
    if (isGhostResumeSectionId(sectionId)) {
      dismissGhostSections(sectionId)
    }
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
    const touchedGhostSections = result.touchedSections.filter(isGhostResumeSectionId)
    if (touchedGhostSections.length > 0) {
      dismissGhostSections(touchedGhostSections)
    }
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

  function handleApplyAIInsightFix(
    suggestion: InsightSuggestionLike,
    options?: { silent?: boolean }
  ) {
    // Functional updater so Apply-All can chain suggestions correctly (each
    // build on the previous one's result, not the pre-loop snapshot).
    let didApply = false
    let appliedPrevious: ResumeData | null = null
    setResumeData(previous => {
      if (!previous) return previous
      const updated = applyInsightSuggestionToResumeData(previous, suggestion)
      if (updated === previous) return previous
      didApply = true
      appliedPrevious = previous
      return updated
    })

    if (!didApply) return

    // Push ONE undo entry per Apply-All run (only on the first silent apply or
    // a non-silent single apply). For the silent intermediates we skip the
    // push so "undo" cleanly reverts the entire Apply-All in one keystroke
    // instead of N keystrokes through each suggestion.
    const isSilent = options?.silent === true
    if (!isSilent && appliedPrevious) {
      history.pushHistory(appliedPrevious, visibility)
    } else if (isSilent && appliedPrevious && !applyAllOriginRef.current) {
      // First silent apply in the batch — record the pre-batch state so undo
      // restores it in one go.
      applyAllOriginRef.current = appliedPrevious
      history.pushHistory(appliedPrevious, visibility)
    }
    // After a non-silent apply (the last one in a batch, or a one-off), clear
    // the batch-origin ref so the next Apply-All starts fresh.
    if (!isSilent) {
      applyAllOriginRef.current = null
    }

    builderAnalytics.trackSectionEdit(suggestion.sectionHint, 'edit')
    if (isGhostResumeSectionId(suggestion.sectionHint)) {
      dismissGhostSections(suggestion.sectionHint)
    }

    if (!isSilent) {
      setExpandedSection(suggestion.sectionHint)
      scrollToSection(suggestion.sectionHint)
    }
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

        /* Cmd-P / browser native print would render the editor chrome, not the
           resume — and the output looks broken. Intercept print and show a
           single instruction page directing users to the Download PDF button. */
        @media print {
          body > *:not(#builder-print-notice) { display: none !important; }
          #builder-print-notice { display: flex !important; }
        }
      `}</style>

      {/* Hidden by default; shown only when the browser enters print mode. */}
      <div
        id="builder-print-notice"
        style={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          background: '#fff',
          color: '#0f172a',
          padding: '4rem',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Use the Download button</h1>
        <p style={{ fontSize: '14px', maxWidth: '480px', lineHeight: 1.5, color: '#475569' }}>
          Browser print would output the editor, not your resume. Cancel this dialog and click the
          <strong> Download </strong> button at the top right to export a clean ATS-friendly PDF.
        </p>
      </div>
      
      {/* ── Optic Curator Layout Root ── */}
      <div className="bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
        
        {/* ── TopNavBar ── */}
        <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant/10 flex items-center gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
            <Link href="/dashboard/resumes" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors text-sm font-medium">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div className="hidden items-center gap-2 min-[1180px]:flex">
              <Image src="/auth-login-logo.png" alt="Rezoomed logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-emerald-900 tracking-tight font-headline">Rezoomed</span>
            </div>
            <div className="hidden h-4 w-px bg-zinc-200 min-[1180px]:block" />
            <div
              className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-1.5 transition-all ${
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
                maxLength={120}
                onChange={e => setResumeTitle(normalizeResumeTitle(e.target.value))}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={async () => {
                  setIsTitleFocused(false)
                  const normalizedTitle = normalizeResumeTitle(resumeTitle)
                  setResumeTitle(normalizedTitle)
                  if (persistedResumeId === 'draft') return
                  // If an autosave is mid-flight we'd race against forceSave,
                  // so defer until the lock is clear. forceSave will also
                  // pick up the new title from titleSnapshot.
                  if (saveLockRef.current) return
                  await supabase
                    .from('resumes')
                    .update({ title: normalizedTitle || 'Untitled Resume' })
                    .eq('id', persistedResumeId)
                    .eq('user_id', userId)
                }}
                placeholder="Untitled Resume"
                className={`w-40 rounded-lg border-none px-2 py-1.5 text-sm font-semibold text-emerald-950 outline-none transition-all placeholder:font-normal placeholder:text-emerald-400 lg:w-48 2xl:w-56 ${
                  isTitleFocused ? 'bg-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]' : 'bg-transparent'
                }`}
              />
            </div>
            
            {/* Save Status Indicator */}
            <div className="hidden shrink-0 items-center gap-2 px-1 xl:flex">
              {isSaving ? (
                <div className="flex items-center gap-1.5 text-zinc-400 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="hidden text-[10px] font-bold uppercase tracking-wider min-[1500px]:inline">Saving...</span>
                </div>
              ) : saveFailed ? (
                <button 
                  onClick={() => forceSave()}
                  className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <CloudOff size={12} />
                  <span className="hidden text-[10px] font-bold uppercase tracking-wider min-[1500px]:inline">Save Failed</span>
                </button>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="hidden text-[10px] font-bold uppercase tracking-wider min-[1500px]:inline">Unsaved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-500/60">
                  <Check size={12} strokeWidth={3} />
                  <span className="hidden text-[10px] font-bold uppercase tracking-wider min-[1500px]:inline">Saved</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Builder / Tailor Toggle */}
          <div className="flex shrink-0 bg-surface-container-low p-1 rounded-full">
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
          
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:gap-3">
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

        {/* Banner priority (only one shown at a time so they don't stack on
            top of each other at the same fixed position):
              1. Conflict (must refresh)
              2. Recovery (restore unsaved edits)
              3. Overflow unresolved (resume too long after trim)
              4. Page-count warning (>2 pages)
              5. Score shift (scorer migration) */}

        {/* Page-count warning banner */}
        {!conflictDetected && !recoveryOffer && !overflowTrimUnresolved && isOverRecommendedPages && !isPageWarningDismissed && (
          <div className="fixed top-[57px] left-0 right-0 z-40 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
            <span>Your resume is {pageCount} pages. For best results, keep it to 1-2 pages.</span>
            <button onClick={() => setIsPageWarningDismissed(true)} className="p-0.5 hover:bg-amber-200/50 rounded-full transition-colors" aria-label="Dismiss warning">
              <X size={14} className="opacity-70 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* Overflow auto-trim couldn't bring the resume under the page limit.
            We no longer hide sections silently; we tell the user what's left
            to manually shorten. */}
        {!conflictDetected && !recoveryOffer && overflowTrimUnresolved && (
          <div className="fixed top-[57px] left-0 right-0 z-40 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-3">
            <span>
              Your resume is still over {MAX_PAGES} pages even after auto-trimming. Manually shorten experience bullets, hide a section, or split into multiple resumes.
            </span>
            <button
              onClick={() => setOverflowTrimUnresolved(false)}
              className="p-0.5 hover:bg-rose-200/50 rounded-full transition-colors"
              aria-label="Dismiss overflow warning"
            >
              <X size={14} className="opacity-70 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* Draft recovery offer — fires when sessionStorage holds a snapshot
            newer than the DB row (last edit session was interrupted before
            its autosave RPC completed). */}
        {recoveryOffer && !conflictDetected && (
          <div className="fixed top-[57px] left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs font-semibold px-4 py-2 flex items-center justify-center gap-3">
            <span>
              We found unsaved edits from {new Date(recoveryOffer.savedAt).toLocaleTimeString()}. Restore them?
            </span>
            <button
              onClick={() => {
                setResumeData(recoveryOffer.resumeData)
                setVisibility(recoveryOffer.visibility)
                setTemplateConfig(recoveryOffer.templateConfig)
                setResumeTitle(recoveryOffer.title)
                clearDraftRecovery(resumeId)
                setRecoveryOffer(null)
              }}
              className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition-colors"
            >
              Restore
            </button>
            <button
              onClick={() => {
                clearDraftRecovery(resumeId)
                setRecoveryOffer(null)
              }}
              className="rounded-full border border-blue-300 bg-white px-3 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Discard
            </button>
          </div>
        )}

        {/* Concurrent-edit conflict banner — fires when optimistic concurrency
            detects that another tab/device wrote this resume after we loaded it. */}
        {conflictDetected && (
          <div className="fixed top-[57px] left-0 right-0 z-50 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs font-semibold px-4 py-2 flex items-center justify-center gap-3">
            <span>
              This resume was edited from another tab or device. Refresh to see the latest version. (Your unsaved changes here will be lost.)
            </span>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setConflictDetected(false)}
              className="p-0.5 hover:bg-rose-200/50 rounded-full transition-colors"
              aria-label="Dismiss conflict banner"
            >
              <X size={14} className="opacity-70 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* Scorer-version migration banner — shown once after we update the
            scoring methodology so users understand why their number moved. */}
        {scoreShift && !isOverRecommendedPages && !conflictDetected && !recoveryOffer && !overflowTrimUnresolved && (
          <div className="fixed top-[57px] left-0 right-0 z-40 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-3">
            <span>
              ATS scoring updated — your score moved from <span className="font-bold">{scoreShift.from}</span> to <span className="font-bold">{scoreShift.to}</span>. The new model gives more credit for project & volunteer work and catches keyword stuffing.
            </span>
            <button
              onClick={() => {
                try {
                  window.localStorage.setItem(`rezoomed:scorer-update-acknowledged:v${SCORER_VERSION}`, '1')
                } catch {
                  // Ignore localStorage failures; banner just reappears next load.
                }
                setScoreShift(null)
              }}
              className="p-0.5 hover:bg-emerald-200/50 rounded-full transition-colors"
              aria-label="Dismiss scoring update banner"
            >
              <X size={14} className="opacity-70 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* ── Main Workspace ── */}
        {/* Any active top banner needs ~32px of extra padding so the editor
            chrome below isn't hidden under it. */}
        <main className={`flex h-screen ${
          conflictDetected ||
          recoveryOffer ||
          overflowTrimUnresolved ||
          (isOverRecommendedPages && !isPageWarningDismissed) ||
          scoreShift
            ? 'pt-[88px]'
            : 'pt-16'
        }`}>
          
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
                  className="flex-1 overflow-y-auto rezoomed-thin-scrollbar"
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
                    contactLinkToggles={
                      typeof templateConfig.contactLinksClickable === 'object' && templateConfig.contactLinksClickable !== null
                        ? templateConfig.contactLinksClickable
                        : undefined
                    }
                    onContactLinkTogglesChange={(toggles) =>
                      setTemplateConfig({ ...templateConfig, contactLinksClickable: toggles })
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
              /* Ghost sections deliberately omitted from the measurement
                 wrapper — they're editor-only guidance and don't appear in
                 the downloaded PDF, so measuring with them would produce a
                 preview page count that doesn't match the export. */
              onFieldChange={() => {}}
              sectionOrder={orderedSections}
              sidebarSectionOrder={orderedSidebarSections}
              config={templateConfig}
              showEditingBadge={false}
            />
            </div>

            {/* Word-like paged preview + undo/redo to the right.

               Architecture note: the resume is rendered ONCE as a single
               continuous DOM. Page boundaries are decorative overlays
               positioned at the Y values produced by computeResumePageSlices.
               We deliberately avoid the old approach (N clipped copies of the
               template), because duplicate DOM nodes broke text selection —
               selecting across a "page boundary" was actually selecting
               across two stacked copies of the entire resume, so copy/paste
               returned text from sections the user never touched. */}
            <div className="flex items-start gap-3 min-w-max">
            {(() => {
              const previewContentHeight = Math.max(resumeHeight || 0, PAGE_H)
              const visibleBreakYs = isPaginationSettling
                ? []
                : pageSlices
                    .slice(1, MAX_PAGES)
                    .map(slice => slice.startY)
                    .filter(y => y > 0 && y < previewContentHeight)
              const focusInsetX = 16
              const focusInsetY = 12
              const focusLeft = previewFocusFrame
                ? Math.max(12, previewFocusFrame.left - focusInsetX)
                : 0
              const focusWidth = previewFocusFrame
                ? Math.min(794 - focusLeft - 12, previewFocusFrame.width + focusInsetX * 2)
                : 0
              const focusTop = previewFocusFrame
                ? Math.max(6, previewFocusFrame.top - focusInsetY)
                : 0
              const focusHeight = previewFocusFrame
                ? Math.max(34, previewFocusFrame.height + focusInsetY * 2)
                : 0

              return (
                <div
                  className="print:hidden relative"
                  style={{
                    width: 794 * effectiveScale,
                    height: previewContentHeight * effectiveScale,
                  }}
                >
                  <div
                    className="builder-preview-transition relative bg-white"
                    data-resume-preview-content="true"
                    style={{
                      width: '794px',
                      height: `${previewContentHeight}px`,
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: 'top left',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                    }}
                  >
                    {/* Sidebar background — spans the full continuous card */}
                    {(templateConfig.layout === 'sidebar' || templateConfig.layout === 'sidebar-left' || templateConfig.layout === 'sidebar-right') && (
                      <div
                        className="absolute top-0 bottom-0 z-0 pointer-events-none"
                        style={{
                          width: `${templateConfig.density === 'compressed' ? 192 : 256}px`,
                          backgroundColor: accentToSidebarFill(templateConfig.accentColor),
                          ...(templateConfig.layout === 'sidebar-right' ? { right: 0 } : { left: 0 }),
                        }}
                      />
                    )}

                    {/* Single continuous resume DOM */}
                    <div className="relative z-10" style={{ width: '794px' }}>
                      <TemplateComponent
                        key={`preview-${previewVersion}`}
                        data={visibleData ?? resumeData}
                        isEditing={false}
                        showEmptyStateGuidance
                        highlightedSectionId={null}
                        /* No ghostSections in visible preview — WYSIWYG with
                           the downloaded PDF. The section list in the editor
                           sidebar already surfaces empty sections. */
                        onFieldChange={() => {}}
                        sectionOrder={orderedSections}
                        sidebarSectionOrder={orderedSidebarSections}
                        config={templateConfig}
                        onNavigateToField={handleNavigateToField}
                        showEditingBadge={false}
                      />
                    </div>

                    {/* Page 1 badge */}
                    <div
                      data-pdf-ignore="true"
                      className="absolute top-2 right-2 z-30 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200/80 pointer-events-none select-none"
                    >
                      Page 1
                    </div>

                    {/* Page break markers — dashed divider + Page N badge at each break Y */}
                    {visibleBreakYs.map((breakY, breakIdx) => (
                      <div
                        key={`page-break-${breakIdx}`}
                        data-pdf-ignore="true"
                        className="absolute left-0 right-0 z-20 pointer-events-none select-none"
                        style={{ top: `${breakY}px` }}
                      >
                        <div
                          className="border-t border-dashed border-emerald-400/60"
                          style={{ width: '100%' }}
                        />
                        <div className="absolute right-2 -top-3 text-[10px] font-bold uppercase tracking-widest bg-white/95 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-300/60 shadow-sm">
                          Page {breakIdx + 2}
                        </div>
                      </div>
                    ))}

                    {/* Focus frame — single overlay, no per-page clipping */}
                    {previewFocusFrame && (
                      <div
                        data-pdf-ignore="true"
                        className="pointer-events-none absolute z-30 rounded-[22px] border border-emerald-300/80 bg-emerald-50/60 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_16px_36px_rgba(16,185,129,0.12)]"
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
                    )}
                  </div>
                </div>
              )
            })()}

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
          {!shouldSuppressBuilderInsights && !isRightCollapsed && (
            <div 
              className="w-1 bg-transparent hover:bg-emerald-500/30 cursor-col-resize z-10 shrink-0 select-none scale-x-150 transition-colors"
              onMouseDown={() => setIsDraggingRight(true)}
            />
          )}

          {/* Right Sidebar: AI INSIGHTS / TAILOR */}
          {!shouldSuppressBuilderInsights ? (
            <aside
              style={{ width: isRightCollapsed ? COLLAPSED_PANEL_WIDTH : rightWidth }}
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
          ) : null}
          
        </main>
      </div>

      <TemplateCustomizerModal
        key={isTemplateModalOpen ? JSON.stringify(templateConfig) : 'template-modal-closed'}
        isOpen={isTemplateModalOpen}
        config={templateConfig}
        onConfigChange={setTemplateConfig}
        onClose={() => setIsTemplateModalOpen(false)}
        resumeData={visibleData ?? resumeData}
        sectionOrder={orderedSections}
        sidebarSectionOrder={orderedSidebarSections}
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
  // Track viewport reactively so rotation / window-resize doesn't strand the
  // user on the mobile dead-end after they widen their window.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
  }, [supabase, router])

  if (!authChecked || !profileState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  // BuilderInner stays mounted even when the viewport is too small — we just
  // overlay the MobileFallback on top via CSS. Rotating tablet/phone from
  // landscape→portrait and back used to unmount BuilderInner and discard the
  // user's undo history + unsaved buffer. Keeping it mounted preserves state.
  return (
    <PlanProvider isPro={profileState.plan === 'pro'} profile={profileState}>
      <div className={isMobile ? 'pointer-events-none invisible h-0 overflow-hidden' : ''}>
        <BuilderInner
          resumeId={resumeId}
          isPro={profileState.plan === 'pro'}
          profile={profileState}
        />
      </div>
      {isMobile && <MobileFallback />}
    </PlanProvider>
  )
}
