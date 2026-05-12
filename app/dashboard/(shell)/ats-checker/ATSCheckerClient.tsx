'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { isPro, getRemainingFreeScans } from '@/lib/planUtils'
import { createClient } from '@/lib/supabase/client'
import { Analytics } from '@/lib/analytics'
import { ADS_ENABLED } from '@/lib/ads'
import { countWords } from '@/lib/text'
import { getAtsCheckerDraftKey, readSessionDraft, writeSessionDraft } from '@/lib/sessionDrafts'
import { writeTailorJobTransfer } from '@/lib/tailorJobTransfer'
import { MAX_RESUME_UPLOAD_LABEL_SPACED } from '@/lib/uploadLimits'
import { buildResumeTitleLabelMap, getResumeTitleLabel } from '@/lib/resumeTitleLabels'
import { getResumeSkills, resumeDataToPlainText } from '@/lib/resume-data'
import { scoreResume } from '@/lib/ats-scorer'
import AdBanner from '@/components/shared/AdBanner'
import OneClickOptimizeModal, { type ModalPromoDisplay } from '@/components/shared/OneClickOptimizeModal'
import RoadToNinetyPanel from '@/components/ats/RoadToNinetyPanel'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { DEFAULT_UNIVERSAL_CONFIG, DEFAULT_VISIBILITY, type ATSResult, type ATSScanTier, type Profile, type ResumeData, type TailorIntensity, type UniversalConfig } from '@/types'
import {
  FileText,
  Briefcase,
  Upload,
  ArrowRight,
  Lightbulb,
  Sparkles,
  ChevronRight,
  X,
  FileUp,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeOption {
  id: string
  title: string
  raw_text: string | null
  parsed_data: ResumeData | null
}

interface ScanResponse extends ATSResult {
  scanTier: ATSScanTier
  scansRemaining: number | null
  scoreId: string
  resumeData: ResumeData
}

interface OptimiseResponse {
  optimisedText: string
  keywordsAdded: string[]
  improvementsCount: number
  changesSummary: string
  optimisedScore: number
  scoreGain: number
  resumeData: ResumeData
}

interface ChangeComparison {
  id: string
  kind:
    | 'summary'
    | 'skills'
    | 'experience-summary'
    | 'experience-bullet'
    | 'project-description'
    | 'project-bullet'
    | 'volunteer-summary'
    | 'volunteer-bullet'
  section: string
  title: string
  beforeValue: string
  afterValue: string
  before: string
  after: string
  itemIndex?: number
  bulletIndex?: number
  afterSkills?: string[]
  afterSkillSections?: ResumeData['skillSections']
}

interface UploadedResumeFile {
  name: string
  text: string
  parsedData: ResumeData | null
}

type PublicAuthPromptReason = 'rescan' | 'another_resume'

const PUBLIC_ATS_SCAN_STORAGE_KEY = 'rezoomed:public-ats-scan-used:v1'

function readPublicAtsScanUsage() {
  if (typeof window === 'undefined') return false

  try {
    return window.sessionStorage.getItem(PUBLIC_ATS_SCAN_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writePublicAtsScanUsage() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(PUBLIC_ATS_SCAN_STORAGE_KEY, 'true')
  } catch {
    // Ignore storage failures and keep the rest of the flow working.
  }
}

interface ATSCheckerSessionDraft {
  inputMode: 'resume' | 'upload'
  selectedResumeId: string
  uploadedFile: UploadedResumeFile | null
  jobDescription: string
  scanError: string | null
  scanResult: ScanResponse | null
  scannedResumeId: string | null
  customizeError: string | null
  optimiseError: string | null
  optimiseResult: OptimiseResponse | null
  optimisedResumeId: string | null
  openOptimisedError: string | null
  activeTab: 'results' | 'optimised'
  appliedOptimisedChangeIds?: string[]
  hasTouchedOptimisedChangeSelection?: boolean
}

type AnalysisMode = 'ats' | 'match'

const MATCH_TAILOR_CHOICE_SECONDS = 10
const MATCH_TAILOR_INTENSITIES: Array<{
  value: TailorIntensity
  label: string
  description: string
}> = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Light cleanup with minimal rewriting.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Best default: sharper fit without drifting from the source.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Stronger rewrite for clearer role alignment.',
  },
  {
    value: 'overboard',
    label: 'Overboard',
    description: 'Maximum truthful JD alignment and reprioritization.',
  },
]

interface ATSCheckerClientProps {
  resumes: ResumeOption[]
  profile: Profile | null
  publicMode?: boolean
  mode?: AnalysisMode
  showIntro?: boolean
  promoDisplay?: ModalPromoDisplay | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColour(score: number): string {
  if (score >= 80) return '#026d32'
  if (score >= 60) return '#ca8a04'
  return '#ef4444'
}

function severityBadge(severity: 'high' | 'medium' | 'low') {
  const map = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-surface-container-high text-on-surface-variant',
  }
  return map[severity]
}

const resumeDataToText = resumeDataToPlainText

const ERROR_MESSAGES: Record<string, string> = {
  RESUME_TOO_SHORT: 'Resume text is too short (minimum 100 characters).',
  JOB_DESCRIPTION_TOO_SHORT: 'Add a fuller job description with at least 20 words.',
  FREE_LIMIT_REACHED: 'Free scan limit reached. Upgrade to Pro for advanced analysis and optimisation.',
  CLAUDE_TIMEOUT: 'Analysis timed out. Please try again.',
  PARSE_FAILED: 'Failed to parse AI response. Please try again.',
  PRO_REQUIRED: 'Resume optimisation is a Pro feature. Upgrade to unlock it.',
  ATS_RESULT_REQUIRED: 'Please run an ATS scan first before optimising.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}

const ATS_PREVIEW_CONFIG: UniversalConfig = {
  ...DEFAULT_UNIVERSAL_CONFIG,
  layout: 'single-column',
  headerStyle: 'classic',
  sectionHeadingStyle: 'rule',
  accentColor: '#0B7A3D',
  density: 'compressed',
  skillsStyle: 'inline',
  bulletStyle: 'plain',
  contactStyle: 'inline',
  dateLayout: 'right',
  nameSize: 'large',
}

const ATS_PREVIEW_SECTION_ORDER = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'certifications',
  'languages',
  'volunteer',
  'awards',
  'publications',
  'interests',
  'references',
]

const ATS_PREVIEW_PAGE_WIDTH = 794
const ATS_PREVIEW_PAGE_HEIGHT = 1123
const SCAN_RESULTS_REVEAL_DELAY_MS = 5000
const SCAN_FINISHING_ANIMATION_MS = 2000

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

async function waitForScanReveal(startedAt: number) {
  const elapsed = performance.now() - startedAt
  // Ensure at least SCAN_FINISHING_ANIMATION_MS after API returns AND the normal minimum from start
  const remaining = Math.max(SCAN_RESULTS_REVEAL_DELAY_MS - elapsed, SCAN_FINISHING_ANIMATION_MS)
  if (remaining > 0) {
    await wait(remaining)
  }
}

function normalizeResumeTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.replace(/\.(pdf|docx)\s*$/i, '').trim() || 'Uploaded Resume'
}

function buildAtsBuilderHref(
  resumeId: string,
  mode: AnalysisMode,
  options: { autoOptimize?: boolean; tailorJobKey?: string | null; autoTailor?: boolean } = {}
) {
  const params = new URLSearchParams({
    trimOverflow: '1',
    source: mode === 'match' ? 'match' : 'ats',
  })

  if (mode === 'match') {
    params.set('mode', 'tailor')
  }

  if (options.autoOptimize && mode === 'ats') {
    params.set('autoOptimize', '1')
  }

  if (options.tailorJobKey && mode === 'match') {
    params.set('tailorJobKey', options.tailorJobKey)
  }

  if (options.autoTailor && mode === 'match') {
    params.set('autoTailor', '1')
  }

  return `/dashboard/builder/${resumeId}?${params.toString()}`
}

function getScoreState(score: number) {
  if (score >= 85) {
    return {
      label: 'Excellent',
      toneClassName: 'bg-emerald-100 text-emerald-700',
    }
  }

  if (score >= 70) {
    return {
      label: 'Strong',
      toneClassName: 'bg-primary-container/45 text-on-primary-container',
    }
  }

  if (score >= 55) {
    return {
      label: 'Fair',
      toneClassName: 'bg-amber-100 text-amber-700',
    }
  }

  return {
    label: 'Needs work',
    toneClassName: 'bg-red-100 text-red-700',
  }
}

function getReviewSections(result: ScanResponse) {
  const counts = {
    summary: 0,
    skills: 0,
    experience: 0,
    education: 0,
    formatting: 0,
  }

  for (const suggestion of result.suggestions) {
    if (suggestion.category === 'summary') counts.summary += 1
    if (suggestion.category === 'skills' || suggestion.category === 'keywords') counts.skills += 1
    if (suggestion.category === 'experience') counts.experience += 1
    if (suggestion.category === 'education') counts.education += 1
    if (suggestion.category === 'formatting') counts.formatting += 1
  }

  counts.formatting += result.formattingIssues?.length ?? 0

  return [
    { key: 'summary', label: 'Professional Summary', count: counts.summary },
    { key: 'skills', label: 'Skills & Keywords', count: counts.skills },
    { key: 'experience', label: 'Work History', count: counts.experience },
    { key: 'education', label: 'Education', count: counts.education },
    { key: 'formatting', label: 'Formatting', count: counts.formatting },
  ]
}

function compactChangeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function truncateChangeText(value: string, maxLength = 420) {
  const compact = compactChangeText(value)
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength - 3).trim()}...`
}

function hasTextChange(before: string | null | undefined, after: string | null | undefined) {
  const beforeText = compactChangeText(before)
  const afterText = compactChangeText(after)
  return afterText.length > 0 && beforeText !== afterText
}

function formatScoreGain(gain: number) {
  if (gain > 0) return `+${gain}`
  return String(gain)
}

function scoreGainToneClass(gain: number) {
  if (gain > 0) return 'bg-emerald-100 text-emerald-700'
  if (gain < 0) return 'bg-red-100 text-red-700'
  return 'bg-surface-container-high text-on-surface-variant'
}

function labelExperienceItem(
  item: ResumeData['experience'][number] | ResumeData['projects'][number] | undefined,
  fallback: string
) {
  if (!item) return fallback
  if ('company' in item) {
    const title = compactChangeText(item.title)
    const company = compactChangeText(item.company)
    if (title && company) return `${title} at ${company}`
    return title || company || fallback
  }

  return compactChangeText(item.name) || fallback
}

function pushChangeComparison(
  changes: ChangeComparison[],
  comparison: Omit<ChangeComparison, 'before' | 'after' | 'beforeValue' | 'afterValue'> & { before?: string | null; after?: string | null }
) {
  if (!hasTextChange(comparison.before, comparison.after)) return

  const beforeValue = compactChangeText(comparison.before)
  const afterValue = compactChangeText(comparison.after)

  changes.push({
    ...comparison,
    beforeValue,
    afterValue,
    before: truncateChangeText(beforeValue || 'Not present in the original resume.'),
    after: truncateChangeText(afterValue),
  })
}

function collectExperienceChanges(
  changes: ChangeComparison[],
  sectionKey: 'experience' | 'volunteer',
  sectionLabel: string,
  beforeItems: ResumeData['experience'],
  afterItems: ResumeData['experience']
) {
  const itemCount = Math.max(beforeItems.length, afterItems.length)

  for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
    const beforeItem = beforeItems[itemIndex]
    const afterItem = afterItems[itemIndex]
    const title = labelExperienceItem(afterItem ?? beforeItem, `${sectionLabel} ${itemIndex + 1}`)

    pushChangeComparison(
      changes,
      {
        id: `${sectionKey}-summary-${itemIndex}`,
        kind: sectionKey === 'experience' ? 'experience-summary' : 'volunteer-summary',
        section: sectionLabel,
        title: `${title} summary`,
        itemIndex,
        before: beforeItem?.summary,
        after: afterItem?.summary,
      }
    )

    const beforeBullets = beforeItem?.bullets ?? []
    const afterBullets = afterItem?.bullets ?? []
    const bulletCount = Math.max(beforeBullets.length, afterBullets.length)

    for (let bulletIndex = 0; bulletIndex < bulletCount; bulletIndex += 1) {
      pushChangeComparison(
        changes,
        {
          id: `${sectionKey}-bullet-${itemIndex}-${bulletIndex}`,
          kind: sectionKey === 'experience' ? 'experience-bullet' : 'volunteer-bullet',
          section: sectionLabel,
          title,
          itemIndex,
          bulletIndex,
          before: beforeBullets[bulletIndex],
          after: afterBullets[bulletIndex],
        }
      )
    }
  }
}

function collectProjectChanges(
  changes: ChangeComparison[],
  beforeProjects: ResumeData['projects'],
  afterProjects: ResumeData['projects']
) {
  const projectCount = Math.max(beforeProjects.length, afterProjects.length)

  for (let projectIndex = 0; projectIndex < projectCount; projectIndex += 1) {
    const beforeProject = beforeProjects[projectIndex]
    const afterProject = afterProjects[projectIndex]
    const title = labelExperienceItem(afterProject ?? beforeProject, `Project ${projectIndex + 1}`)

    pushChangeComparison(
      changes,
      {
        id: `project-description-${projectIndex}`,
        kind: 'project-description',
        section: 'Projects',
        title,
        itemIndex: projectIndex,
        before: beforeProject?.description,
        after: afterProject?.description,
      }
    )

    const beforeBullets = beforeProject?.bullets ?? []
    const afterBullets = afterProject?.bullets ?? []
    const bulletCount = Math.max(beforeBullets.length, afterBullets.length)

    for (let bulletIndex = 0; bulletIndex < bulletCount; bulletIndex += 1) {
      pushChangeComparison(
        changes,
        {
          id: `project-bullet-${projectIndex}-${bulletIndex}`,
          kind: 'project-bullet',
          section: 'Projects',
          title,
          itemIndex: projectIndex,
          bulletIndex,
          before: beforeBullets[bulletIndex],
          after: afterBullets[bulletIndex],
        }
      )
    }
  }
}

function buildChangeComparisons(beforeData: ResumeData, afterData: ResumeData) {
  const changes: ChangeComparison[] = []

  pushChangeComparison(
    changes,
    {
      id: 'summary',
      kind: 'summary',
      section: 'Summary',
      title: 'Professional summary',
      before: beforeData.summary,
      after: afterData.summary,
    }
  )

  const beforeSkills = getResumeSkills(beforeData).join(', ')
  const afterSkills = getResumeSkills(afterData).join(', ')
  pushChangeComparison(
    changes,
    {
      id: 'skills',
      kind: 'skills',
      section: 'Skills',
      title: 'Skills and keywords',
      before: beforeSkills || 'No skills listed.',
      after: afterSkills,
      afterSkills: afterData.skills,
      afterSkillSections: afterData.skillSections,
    }
  )

  collectExperienceChanges(changes, 'experience', 'Experience', beforeData.experience, afterData.experience)
  collectProjectChanges(changes, beforeData.projects, afterData.projects)
  collectExperienceChanges(changes, 'volunteer', 'Volunteer', beforeData.volunteer, afterData.volunteer)

  return changes
}

function cloneResumeDataForSelection(data: ResumeData): ResumeData {
  return structuredClone(data)
}

function applySelectedChangeComparisons(
  beforeData: ResumeData,
  changes: ChangeComparison[],
  appliedChangeIds: Set<string>
) {
  const nextData = cloneResumeDataForSelection(beforeData)

  for (const change of changes) {
    if (!appliedChangeIds.has(change.id)) continue

    switch (change.kind) {
      case 'summary':
        nextData.summary = change.afterValue
        break
      case 'skills':
        nextData.skills = [...(change.afterSkills ?? [])]
        nextData.skillSections = change.afterSkillSections ? structuredClone(change.afterSkillSections) : []
        break
      case 'experience-summary':
      case 'volunteer-summary': {
        const items = change.kind === 'experience-summary' ? nextData.experience : nextData.volunteer
        if (typeof change.itemIndex === 'number' && items[change.itemIndex]) {
          items[change.itemIndex].summary = change.afterValue
        }
        break
      }
      case 'experience-bullet':
      case 'volunteer-bullet': {
        const items = change.kind === 'experience-bullet' ? nextData.experience : nextData.volunteer
        if (typeof change.itemIndex === 'number' && typeof change.bulletIndex === 'number' && items[change.itemIndex]) {
          const bullets = [...(items[change.itemIndex].bullets ?? [])]
          bullets[change.bulletIndex] = change.afterValue
          items[change.itemIndex].bullets = bullets
        }
        break
      }
      case 'project-description':
        if (typeof change.itemIndex === 'number' && nextData.projects[change.itemIndex]) {
          nextData.projects[change.itemIndex].description = change.afterValue
        }
        break
      case 'project-bullet':
        if (typeof change.itemIndex === 'number' && typeof change.bulletIndex === 'number' && nextData.projects[change.itemIndex]) {
          const bullets = [...(nextData.projects[change.itemIndex].bullets ?? [])]
          bullets[change.bulletIndex] = change.afterValue
          nextData.projects[change.itemIndex].bullets = bullets.filter(Boolean)
        }
        break
    }
  }

  return nextData
}

const RADAR_BLIPS = [
  { cx: 63, cy: 27 },
  { cx: 78, cy: 54 },
  { cx: 62, cy: 76 },
  { cx: 33, cy: 65 },
  { cx: 26, cy: 38 },
]

function ScanningAnimation({ isMatchMode, isFinishing }: { isMatchMode: boolean; isFinishing?: boolean }) {
  const steps = isMatchMode
    ? [
        'Reading your resume...',
        'Identifying JD keywords...',
        'Measuring requirement coverage...',
        'Evaluating evidence strength...',
        'Scoring domain alignment...',
      ]
    : [
        'Reading your resume...',
        'Checking keyword density...',
        'Evaluating formatting...',
        'Assessing completeness...',
        'Calculating your score...',
      ]

  const NORMAL_STEP_MS = 12000
  const FINISHING_STEP_MS = 350

  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (isFinishing) {
      // Fast-forward remaining steps over ~2s
      const interval = setInterval(() => {
        setStepIndex(i => Math.min(i + 1, steps.length - 1))
      }, FINISHING_STEP_MS)
      return () => clearInterval(interval)
    } else {
      const interval = setInterval(() => {
        setStepIndex(i => (i + 1) % steps.length)
      }, NORMAL_STEP_MS)
      return () => clearInterval(interval)
    }
  }, [isFinishing, steps.length])

  return (
    <div className="overflow-hidden rounded-[1.6rem] bg-[#070d09] shadow-[0_28px_70px_rgba(0,0,0,0.45)] ring-1 ring-emerald-500/12">
      <div className="flex flex-col items-center gap-8 p-10">

        {/* ── Radar display ─────────────────────────────────────── */}
        <div className="relative h-52 w-52">
          {/* Concentric rings */}
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-emerald-500/18"
              style={{ inset: `${i * 12.5}%` }}
            />
          ))}

          {/* Crosshairs */}
          <div className="absolute inset-0 flex items-center">
            <div className="h-px w-full bg-emerald-500/12" />
          </div>
          <div className="absolute inset-0 flex justify-center">
            <div className="h-full w-px bg-emerald-500/12" />
          </div>

          {/* Sweep trail (conic-gradient) */}
          <div
            className="absolute inset-0 rounded-full animate-spin [animation-duration:3s] [animation-timing-function:linear]"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0%, transparent 68%, rgba(52,211,153,0.04) 74%, rgba(52,211,153,0.22) 90%, rgba(52,211,153,0.32) 100%)',
            }}
          />

          {/* Sweep arm */}
          <div className="absolute inset-0 animate-spin [animation-duration:3s] [animation-timing-function:linear]">
            <div
              className="absolute top-0 h-1/2 w-px bg-gradient-to-b from-emerald-400 to-transparent"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Blips — appear as steps complete */}
          {RADAR_BLIPS.map((blip, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${blip.cx}%`, top: `${blip.cy}%` }}
            >
              {i <= stepIndex && (
                <>
                  <div className="absolute -inset-2 animate-ping rounded-full bg-emerald-400/25 [animation-duration:2s]" />
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_3px_rgba(52,211,153,0.55)]" />
                </>
              )}
              {i > stepIndex && (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-900/60" />
              )}
            </div>
          ))}

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_5px_rgba(52,211,153,0.5)]" />
          </div>
        </div>

        {/* ── Title & current step ──────────────────────────────── */}
        <div className="space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
              {isMatchMode ? 'Deep analysis active' : 'Resume scan active'}
            </h3>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:0.5s]" />
          </div>
          <p
            key={stepIndex}
            className="text-xl font-black tracking-tight text-white transition-all duration-500"
          >
            {steps[stepIndex]}
          </p>
        </div>

        {/* ── Step checklist ────────────────────────────────────── */}
        <div className="w-full max-w-sm space-y-1.5">
          {steps.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-[0.9rem] px-4 py-2.5 transition-all duration-700 ${
                i < stepIndex
                  ? 'bg-emerald-500/14'
                  : i === stepIndex
                  ? 'bg-white/7 ring-1 ring-emerald-500/28'
                  : 'opacity-20'
              }`}
            >
              {i < stepIndex ? (
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              ) : i === stepIndex ? (
                <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
              )}
              <span
                className={`text-sm ${
                  i < stepIndex
                    ? 'font-medium text-emerald-300'
                    : i === stepIndex
                    ? 'font-semibold text-white'
                    : 'text-white/35'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom scan line accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
    </div>
  )
}

function AutoRescanBanner({
  isAutoRescanning,
  autoRescanResult,
  autoRescanError,
  originalMatchScore,
}: {
  isAutoRescanning: boolean
  autoRescanResult: ScanResponse | null
  autoRescanError: string | null
  originalMatchScore: number
}) {
  if (!isAutoRescanning && !autoRescanResult && !autoRescanError) return null

  if (isAutoRescanning) {
    return (
      <div className="flex items-center gap-3 rounded-[1.25rem] border border-primary/20 bg-primary-container/20 px-5 py-4">
        <svg className="h-5 w-5 shrink-0 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-on-background">Re-calculating match score...</p>
          <p className="text-xs text-on-surface-variant">Running your tailored resume against the same job description.</p>
        </div>
      </div>
    )
  }

  if (autoRescanError) {
    return (
      <div className="rounded-[1.25rem] bg-amber-50 px-5 py-3 text-sm text-amber-800">
        Could not auto-recalculate match score. Run Match Score again manually to see the updated result.
      </div>
    )
  }

  if (autoRescanResult) {
    const gain = autoRescanResult.score - originalMatchScore
    return (
      <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Updated match score</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/70">Before</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-on-background">{originalMatchScore}</p>
            </div>
            <ArrowRight size={20} className="text-emerald-700" strokeWidth={2} />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/70">After</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-emerald-700">{autoRescanResult.score}</p>
            </div>
          </div>
          {gain !== 0 && (
            <span
              className={`rounded-full px-3 py-1.5 text-sm font-black ${
                gain > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {gain > 0 ? `+${gain}` : String(gain)}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">{autoRescanResult.summary}</p>
      </div>
    )
  }

  return null
}

function RoadToNinetyUpsell({
  publicMode,
}: {
  publicMode: boolean
}) {
  const href = publicMode ? '/auth/register' : '/dashboard/pricing'
  const ctaLabel = publicMode ? 'Create an account to unlock Pro' : 'Upgrade to Pro'

  return (
    <DashboardSurface
      variant="default"
      className="group overflow-hidden border border-emerald-400/20 bg-[linear-gradient(155deg,#026d32_0%,#0b7a3d_42%,#0d3d25_100%)] p-5 text-white shadow-[0_28px_64px_rgba(2,109,50,0.22)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300/35 hover:shadow-[0_38px_82px_rgba(2,109,50,0.3)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 right-[-16%] w-1/2 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-x-3" />
        <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-emerald-300/12 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-emerald-300/20" />
        <div className="absolute inset-y-0 left-0 w-24 -translate-x-[140%] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-xl transition-all duration-700 group-hover:translate-x-[520%] group-hover:opacity-100" />
      </div>

      <div className="relative space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/78">Road to 90</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">
            Unlock the exact fixes that will raise the score.
          </h3>
          <p className="mt-2 text-sm leading-6 text-emerald-100/84">
            Pro shows the ranked actions, expected score gains, and the honest ceiling for this resume so users know what to fix next.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/12 bg-black/10 p-4 backdrop-blur-xl">
          <div>
            <p className="text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5">
              Upgrade to Pro to see suggestions on how to increase score.
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-100/84">
              See what is fixable right now, what still needs stronger evidence, and how close the resume can get to 90 honestly.
            </p>
            <a
              href={href}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-semibold text-[#026d32] shadow-[0_18px_34px_rgba(8,15,10,0.18)] transition-all duration-300 hover:bg-emerald-50 group-hover:border-white/25"
            >
              {ctaLabel} <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </DashboardSurface>
  )
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label = 'ATS Score' }: { score: number; label?: string }) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = scoreColour(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#becabc" strokeWidth="8" />
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x="64" y="64"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 28, fill: color, fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }}
        >
          {score}
        </text>
      </svg>
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5">
      <span className="text-sm font-medium text-on-surface-variant">{label}</span>
      <span className="text-right text-xs font-bold text-on-surface">{value}</span>
      <div className="col-span-2 bg-surface-container-high rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────

interface UploadZoneProps {
  uploadedFile: UploadedResumeFile | null
  isExtracting: boolean
  extractError: string | null
  wordCount: number
  onFile: (file: File) => void
  onClear: () => void
  publicMode?: boolean
  compact?: boolean
  showClearButton?: boolean
}

function UploadZone({
  uploadedFile,
  isExtracting,
  extractError,
  wordCount,
  onFile,
  onClear,
  publicMode = false,
  compact = false,
  showClearButton = true,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  if (uploadedFile) {
    return (
      <div className={`flex ${compact ? 'min-h-[280px]' : publicMode ? 'min-h-[200px]' : 'min-h-[280px]'} flex-1 flex-col justify-between gap-4`}>
        <div className={`flex items-center justify-between rounded-xl bg-primary-container/20 ${compact ? 'p-4' : 'p-4'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`${compact ? 'h-10 w-10 rounded-lg' : 'h-10 w-10 rounded-lg'} flex shrink-0 items-center justify-center bg-primary-container/50`}>
              <FileUp size={18} className="text-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">{uploadedFile.name}</p>
              <p className="text-[10px] text-on-surface-variant">{wordCount} words extracted</p>
            </div>
          </div>
          {showClearButton ? (
            <button
              onClick={onClear}
              className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
              aria-label="Remove file"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-1 text-left text-xs font-semibold text-primary hover:underline"
        >
          Upload a different file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
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
        className={`flex-1 ${compact ? 'min-h-[360px] gap-5 py-10' : publicMode ? 'min-h-[180px] py-8' : 'min-h-[280px]'} flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${isDragging
            ? 'border-primary bg-primary-container/15 scale-[1.01]'
            : 'border-outline-variant hover:border-primary/50 hover:bg-primary-container/5'
          } ${isExtracting ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
      >
        {isExtracting ? (
          <>
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm font-semibold text-on-surface-variant">Extracting text…</p>
          </>
        ) : (
          <>
            <div className={`${compact ? 'h-16 w-16 rounded-[1.35rem]' : 'h-14 w-14 rounded-2xl'} flex items-center justify-center bg-primary-container/30`}>
              <Upload size={compact ? 30 : 26} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className={`text-center ${compact ? 'space-y-1' : 'space-y-1'}`}>
              <p className={`${compact ? 'text-lg' : 'text-sm'} font-bold text-on-surface`}>
                {compact ? 'Upload resume' : 'Drop your resume here'}
              </p>
              {!compact && (
                <p className="text-xs text-on-surface-variant">or click to browse</p>
              )}
              {compact && <p className="text-sm text-on-surface-variant">Drop a PDF or DOCX, or click to browse</p>}
              <p className={`${compact ? 'mt-3 text-xs' : 'mt-2 text-[10px]'} font-semibold uppercase tracking-widest text-on-surface-variant/60`}>
                PDF · DOCX · Max {MAX_RESUME_UPLOAD_LABEL_SPACED}
              </p>
            </div>
          </>
        )}
      </button>
      {extractError && (
        <p className="mt-3 text-xs text-red-600 text-center">{extractError}</p>
      )}
    </div>
  )
}



// ─── Main Component ───────────────────────────────────────────────────────────

export default function ATSCheckerClient({
  resumes,
  profile,
  publicMode = false,
  mode = 'ats',
  showIntro = true,
  promoDisplay,
}: ATSCheckerClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const pro = isPro(profile)
  const initialScansLeft = publicMode ? null : getRemainingFreeScans(profile)
  const searchParams = useSearchParams()
  const isMatchMode = mode === 'match'
  const isAnonymousAtsMode = publicMode && !isMatchMode
  const draftKey = getAtsCheckerDraftKey(publicMode ? 'public' : 'dashboard', mode)
  const requiresJobDescription = isMatchMode
  const resultsTitle = isMatchMode ? 'Your Match Score' : 'Your ATS Score'
  const scoreRingLabel = isMatchMode ? 'Match Score' : 'ATS Score'
  const scoreBadgeLabel = isMatchMode ? 'Role Match' : 'ATS Readiness'
  const scanButtonLabel = isMatchMode ? 'Run Match Score' : 'Run ATS Scan'
  const optimiseButtonLabel = isMatchMode ? 'AI Tailor Resume' : 'One-click optimize'
  const optimiseButtonLoadingLabel = 'Opening builder…'
  const keywordSectionTitle = isMatchMode ? 'Coverage against the target role.' : 'Skill evidence across your resume.'
  const keywordSectionDescription = isMatchMode
    ? 'The strongest signals and gaps against the pasted job description.'
    : 'Skills listed on the resume and whether the work experience backs them up.'
  const missingKeywordLabel = isMatchMode ? 'Missing keywords' : 'Listed skills needing evidence'
  const presentKeywordLabel = isMatchMode ? 'Present keywords' : 'Skills backed by bullets'
  const mustHaveLabel = isMatchMode ? 'Must-have' : 'Priority gaps'
  const reviewHeading = isMatchMode ? 'Review what is hurting fit.' : 'Review what to fix.'
  const reviewDescription = isMatchMode
    ? 'Start with the areas where the resume is missing direct evidence for the role.'
    : 'Start with the highest-count areas to move the score fastest.'
  const breakdownLabels = isMatchMode
    ? {
      keywordMatch: 'Requirement Fit',
      formatting: 'Evidence Strength',
      relevance: 'Domain Alignment',
      completeness: 'Seniority Fit',
      keywordDensity: 'Keyword Coverage',
    }
    : {
      keywordMatch: 'Keyword Coverage',
      formatting: 'Formatting',
      relevance: 'Relevance',
      completeness: 'Completeness',
      keywordDensity: 'Keyword Density',
    }
  const notesHeading = isMatchMode ? 'Fit risks' : 'Formatting issues'
  const insightHeading = isMatchMode ? 'Fit insight' : 'Industry insight'
  const compactPublicUploadCard = publicMode && !showIntro && !isMatchMode
  const resumeTitleLabels = useMemo(() => buildResumeTitleLabelMap(resumes), [resumes])

  const [inputMode, setInputMode] = useState<'resume' | 'upload'>(resumes.length > 0 ? 'resume' : 'upload')
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? '')
  const [uploadedFile, setUploadedFile] = useState<UploadedResumeFile | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')

  const [isScanning, setIsScanning] = useState(false)
  const [isScanFinishing, setIsScanFinishing] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [scansLeft, setScansLeft] = useState(initialScansLeft)
  const [scannedResumeId, setScannedResumeId] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState(0.72)
  const [isPreparingBuilder, setIsPreparingBuilder] = useState(false)
  const [customizeError, setCustomizeError] = useState<string | null>(null)
  const [optimisedResumeId, setOptimisedResumeId] = useState<string | null>(null)
  const [isOpeningOptimisedEditor, setIsOpeningOptimisedEditor] = useState(false)
  const [openOptimisedError, setOpenOptimisedError] = useState<string | null>(null)

  const [optimiseError, setOptimiseError] = useState<string | null>(null)
  const [optimiseResult, setOptimiseResult] = useState<OptimiseResponse | null>(null)
  const [appliedOptimisedChangeIds, setAppliedOptimisedChangeIds] = useState<string[]>([])
  const [hasTouchedOptimisedChangeSelection, setHasTouchedOptimisedChangeSelection] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'optimised'>('results')
  const [previewViewportNode, setPreviewViewportNode] = useState<HTMLDivElement | null>(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [hasUsedPublicAtsScan, setHasUsedPublicAtsScan] = useState(false)
  const [publicAuthPromptReason, setPublicAuthPromptReason] = useState<PublicAuthPromptReason | null>(null)
  const [isAutoRescanning] = useState(false)
  const [autoRescanResult] = useState<ScanResponse | null>(null)
  const [autoRescanError] = useState<string | null>(null)
  const [isMatchTailorChooserOpen, setIsMatchTailorChooserOpen] = useState(false)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [matchTailorCountdown, setMatchTailorCountdown] = useState(MATCH_TAILOR_CHOICE_SECONDS)
  const isOptimiseCtaBusy = isPreparingBuilder

  const resultsRef = useRef<HTMLDivElement>(null)
  const scanningAnimationRef = useRef<HTMLDivElement>(null)
  const lastTrackedUpgradePromptScoreRef = useRef<number | null>(null)
  const shouldAutoScrollResultsRef = useRef(false)
  const shouldAutoScrollOptimisedRef = useRef(false)
  const hasTriggeredAutoRunRef = useRef(false)
  const matchTailorCountdownIntervalRef = useRef<number | null>(null)
  const matchTailorAutoContinueRef = useRef<number | null>(null)
  const handleScanRef = useRef<null | (() => Promise<void>)>(null)
  const previewViewportRef = useCallback((node: HTMLDivElement | null) => {
    setPreviewViewportNode(node)
  }, [])

  useEffect(() => {
    return () => {
      if (matchTailorCountdownIntervalRef.current) {
        window.clearInterval(matchTailorCountdownIntervalRef.current)
      }
      if (matchTailorAutoContinueRef.current) {
        window.clearTimeout(matchTailorAutoContinueRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!(previewViewportNode instanceof HTMLDivElement)) return
    const observedNode = previewViewportNode

    function updatePreviewScale() {
      const availableWidth = observedNode.getBoundingClientRect().width
      if (!availableWidth) return

      const nextScale = Math.max(0.46, Math.min(0.92, (availableWidth - 24) / ATS_PREVIEW_PAGE_WIDTH))
      setPreviewScale(nextScale)
    }

    updatePreviewScale()
    const observer = new ResizeObserver(updatePreviewScale)
    observer.observe(observedNode)
    window.addEventListener('resize', updatePreviewScale)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePreviewScale)
    }
  }, [previewViewportNode])

  useEffect(() => {
    const draft = readSessionDraft<ATSCheckerSessionDraft>(draftKey)

    if (draft) {
      setInputMode(draft.inputMode)
      setSelectedResumeId(draft.selectedResumeId)
      setUploadedFile(
        draft.uploadedFile
          ? {
            name: draft.uploadedFile.name,
            text: draft.uploadedFile.text,
            parsedData: draft.uploadedFile.parsedData ?? null,
          }
          : null
      )
      setJobDescription(draft.jobDescription)
      setScanError(draft.scanError)
      setScanResult(draft.scanResult)
      setScannedResumeId(draft.scannedResumeId)
      setCustomizeError(draft.customizeError)
      setOptimiseError(draft.optimiseError)
      setOptimiseResult(draft.optimiseResult)
      setAppliedOptimisedChangeIds(
        Array.isArray(draft.appliedOptimisedChangeIds)
          ? draft.appliedOptimisedChangeIds
          : draft.scanResult && draft.optimiseResult
            ? buildChangeComparisons(draft.scanResult.resumeData, draft.optimiseResult.resumeData).map(change => change.id)
            : []
      )
      setHasTouchedOptimisedChangeSelection(Boolean(draft.hasTouchedOptimisedChangeSelection))
      setOptimisedResumeId(draft.optimisedResumeId)
      setOpenOptimisedError(draft.openOptimisedError)
      setActiveTab(draft.activeTab)
    }

    setHasRestoredDraft(true)
  }, [draftKey])

  useEffect(() => {
    if (!isAnonymousAtsMode) {
      setHasUsedPublicAtsScan(false)
      setPublicAuthPromptReason(null)
      return
    }

    setHasUsedPublicAtsScan(readPublicAtsScanUsage())
  }, [isAnonymousAtsMode])

  useEffect(() => {
    if (!isAnonymousAtsMode || !scanResult) {
      return
    }

    writePublicAtsScanUsage()
    setHasUsedPublicAtsScan(true)
  }, [isAnonymousAtsMode, scanResult])

  useEffect(() => {
    if (inputMode !== 'resume') {
      return
    }

    if (!selectedResumeId && resumes[0]?.id) {
      setSelectedResumeId(resumes[0].id)
      return
    }

    if (selectedResumeId && !resumes.some(resume => resume.id === selectedResumeId)) {
      setSelectedResumeId(resumes[0]?.id ?? '')
    }
  }, [inputMode, resumes, selectedResumeId])

  useEffect(() => {
    const requestedResumeId = searchParams.get('resumeId')
    if (!requestedResumeId) return
    const matchedResume = resumes.find(r => r.id === requestedResumeId)
    if (!matchedResume) return

    if (scanResult && scannedResumeId !== requestedResumeId) {
      setScanError(null)
      setScanResult(null)
      setScannedResumeId(null)
      setCustomizeError(null)
      setOptimiseError(null)
      setOptimiseResult(null)
      setAppliedOptimisedChangeIds([])
      setHasTouchedOptimisedChangeSelection(false)
      setOptimisedResumeId(null)
      setOpenOptimisedError(null)
      setActiveTab('results')
    }

    setUploadedFile(null)
    setExtractError(null)
    setSelectedResumeId(requestedResumeId)
    setInputMode('resume')
  }, [resumes, scanResult, scannedResumeId, searchParams])

  useEffect(() => {
    if (!scanResult) return
    if (pro && !publicMode) return
    if (lastTrackedUpgradePromptScoreRef.current === scanResult.score) return

    lastTrackedUpgradePromptScoreRef.current = scanResult.score
    Analytics.atsScoreUpgradePromptShown({
      currentScore: scanResult.score,
      location: publicMode ? 'public_ats_results' : 'dashboard_ats_results',
    })
  }, [pro, publicMode, scanResult])

  useEffect(() => {
    if (!scanResult || !shouldAutoScrollResultsRef.current) {
      return
    }

    shouldAutoScrollResultsRef.current = false

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: publicMode ? 'start' : 'nearest',
        })
      })

      return () => window.cancelAnimationFrame(secondFrame)
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
    }
  }, [publicMode, scanResult])

  useEffect(() => {
    if (!isScanning) return
    const frame = window.requestAnimationFrame(() => {
      scanningAnimationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isScanning])

  useEffect(() => {
    if (!optimiseResult || !shouldAutoScrollOptimisedRef.current) {
      return
    }

    shouldAutoScrollOptimisedRef.current = false

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })

      return () => window.cancelAnimationFrame(secondFrame)
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
    }
  }, [optimiseResult])

  useEffect(() => {
    if (!hasRestoredDraft) {
      return
    }

    writeSessionDraft(draftKey, {
      inputMode,
      selectedResumeId,
      uploadedFile,
      jobDescription,
      scanError,
      scanResult,
      scannedResumeId,
      customizeError,
      optimiseError,
      optimiseResult,
      appliedOptimisedChangeIds,
      hasTouchedOptimisedChangeSelection,
      optimisedResumeId,
      openOptimisedError,
      activeTab,
    } satisfies ATSCheckerSessionDraft)
  }, [
    activeTab,
    appliedOptimisedChangeIds,
    customizeError,
    draftKey,
    hasTouchedOptimisedChangeSelection,
    hasRestoredDraft,
    inputMode,
    jobDescription,
    openOptimisedError,
    optimiseError,
    optimiseResult,
    optimisedResumeId,
    scanError,
    scanResult,
    scannedResumeId,
    selectedResumeId,
    uploadedFile,
  ])

  const getResumeText = (): string => {
    if (inputMode === 'upload') return uploadedFile?.text?.trim() || resumeDataToText(uploadedFile?.parsedData ?? null)
    const found = resumes.find(r => r.id === selectedResumeId)
    return found?.raw_text?.trim() || resumeDataToText(found?.parsed_data ?? null)
  }

  const wordCount = inputMode === 'upload'
    ? (uploadedFile?.text.trim().split(/\s+/).filter(Boolean).length ?? 0)
    : (getResumeText().trim().split(/\s+/).filter(Boolean).length ?? 0)

  const jobWordCount = countWords(jobDescription)

  const canScan = !isScanning && !isExtracting && (
    inputMode === 'upload' ? (uploadedFile?.text.trim().length ?? 0) >= 100 : !!selectedResumeId
  ) && (!requiresJobDescription || jobWordCount >= 20) && (publicMode || pro || scansLeft === null || scansLeft > 0)

  async function handleFileChange(file: File | null) {
    if (!file) return
    if (isAnonymousAtsMode && hasUsedPublicAtsScan) {
      setPublicAuthPromptReason('another_resume')
      return
    }

    setPublicAuthPromptReason(null)
    setExtractError(null)
    setUploadedFile(null)
    setIsExtracting(true)
    const extractionStartedAt = performance.now()
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/ats/extract-text', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json.success) {
        const msgs: Record<string, string> = {
          INVALID_FILE_TYPE: 'Only PDF and DOCX files are supported.',
          FILE_TOO_LARGE: `File is too large (max ${MAX_RESUME_UPLOAD_LABEL_SPACED}).`,
          SCANNED_OR_EMPTY: 'Could not extract text — the file may be a scanned image or empty.',
          EXTRACTION_FAILED: 'Failed to read the file. Please try another.',
        }
        Analytics.resumeParseFailed({
          error: json.error ?? 'EXTRACTION_FAILED',
        })
        setExtractError(msgs[json.error] ?? 'Failed to read file.')
        return
      }
      Analytics.resumeUploaded({
        fileSize: file.size,
        pageCount: Number(json.pageCount) || 1,
        fileType: file.type || 'application/octet-stream',
      })
      Analytics.resumeParseCompleted({
        sectionCount: Math.max(1, String(json.text ?? '').split(/\n{2,}/).filter(Boolean).length),
        durationMs: Math.round(performance.now() - extractionStartedAt),
      })
      setUploadedFile({
        name: file.name,
        text: String(json.text ?? ''),
        parsedData: (json.parsedData as ResumeData | null | undefined) ?? null,
      })
    } catch {
      Analytics.resumeParseFailed({
        error: 'EXTRACTION_FAILED',
      })
      setExtractError('Failed to read file. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleScan() {
    if (isScanning) return

    if (isAnonymousAtsMode && hasUsedPublicAtsScan) {
      setPublicAuthPromptReason('rescan')
      setScanError(null)
      return
    }

    setPublicAuthPromptReason(null)
    setScanError(null)
    setCustomizeError(null)
    setOpenOptimisedError(null)
    setScanResult(null)
    setOptimiseResult(null)
    setAppliedOptimisedChangeIds([])
    setHasTouchedOptimisedChangeSelection(false)
    setOptimisedResumeId(null)
    setIsScanFinishing(false)
    setIsScanning(true)

    const scanStartedAt = performance.now()
    const resumeText = getResumeText()
    const resumeId = inputMode === 'resume' ? selectedResumeId : undefined

    Analytics.atsScoreRequested({
      tier: pro ? 'advanced' : 'basic',
    })

    try {
      const res = await fetch('/api/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          resumeId,
          parsedResumeData: inputMode === 'upload' ? uploadedFile?.parsedData ?? undefined : undefined,
          analysisMode: mode,
          jobDescription: requiresJobDescription ? jobDescription || undefined : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setIsScanFinishing(true)
        await waitForScanReveal(scanStartedAt)
        setScanError(ERROR_MESSAGES[json.error ?? 'INTERNAL_ERROR'] ?? json.error)
        return
      }
      setIsScanFinishing(true)
      await waitForScanReveal(scanStartedAt)
      setScanResult(json.data)
      shouldAutoScrollResultsRef.current = true
      Analytics.atsScoreViewed({
        tier: json.data.scanTier === 'advanced' ? 'advanced' : 'basic',
        score: json.data.score,
      })
      setScannedResumeId(resumeId ?? null)
      if (!pro && !publicMode) setScansLeft(json.data.scansRemaining)
      setActiveTab('results')
      if (!publicMode) {
        // The scan updates shared dashboard data, so refresh router state and warm fresh payloads.
        router.refresh()
        void router.prefetch('/dashboard')
        void router.prefetch('/dashboard/resumes')
      }
    } catch {
      setIsScanFinishing(true)
      await waitForScanReveal(scanStartedAt)
      setScanError(ERROR_MESSAGES['INTERNAL_ERROR'])
    } finally {
      setIsScanning(false)
      setIsScanFinishing(false)
    }
  }
  handleScanRef.current = handleScan

  useEffect(() => {
    const shouldAutoRun = searchParams.get('autoRun') === '1'

    if (!shouldAutoRun) {
      hasTriggeredAutoRunRef.current = false
      return
    }

    if (hasTriggeredAutoRunRef.current) return
    if (!hasRestoredDraft) return
    if (inputMode !== 'resume' || !selectedResumeId) return
    if (isScanning || !!scanResult) return

    hasTriggeredAutoRunRef.current = true
    void handleScanRef.current?.()
  }, [hasRestoredDraft, inputMode, isScanning, scanResult, searchParams, selectedResumeId])

  function getSourceResumeTitle() {
    if (inputMode === 'resume') {
      return resumes.find(resume => resume.id === selectedResumeId)?.title ?? 'Optimised Resume'
    }

    return uploadedFile?.name ?? 'Optimised Resume'
  }

  function clearMatchTailorChoiceTimers() {
    if (matchTailorCountdownIntervalRef.current) {
      window.clearInterval(matchTailorCountdownIntervalRef.current)
      matchTailorCountdownIntervalRef.current = null
    }
    if (matchTailorAutoContinueRef.current) {
      window.clearTimeout(matchTailorAutoContinueRef.current)
      matchTailorAutoContinueRef.current = null
    }
  }

  function proceedToTailorBuilder(intensity: TailorIntensity) {
    if (isPreparingBuilder) return

    clearMatchTailorChoiceTimers()
    setIsMatchTailorChooserOpen(false)
    setOptimiseError(null)
    const tailorJobKey = writeTailorJobTransfer(jobDescription, intensity)
    void handleTemplateCustomize({
      tailorJobKey,
      autoTailor: Boolean(tailorJobKey),
    })
  }

  function closeMatchTailorChooser() {
    clearMatchTailorChoiceTimers()
    setIsMatchTailorChooserOpen(false)
  }

  function openMatchTailorChooser() {
    clearMatchTailorChoiceTimers()
    setMatchTailorCountdown(MATCH_TAILOR_CHOICE_SECONDS)
    setIsMatchTailorChooserOpen(true)

    matchTailorCountdownIntervalRef.current = window.setInterval(() => {
      setMatchTailorCountdown(previous => Math.max(0, previous - 1))
    }, 1000)

    matchTailorAutoContinueRef.current = window.setTimeout(() => {
      proceedToTailorBuilder('balanced')
    }, MATCH_TAILOR_CHOICE_SECONDS * 1000)
  }

  function handleOptimiseCTA() {
    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }
    if (pro) {
      setOptimiseError(null)
      if (isMatchMode) {
        openMatchTailorChooser()
        return
      }
      void handleTemplateCustomize({ autoOptimize: true })
      return
    }
    if (scanResult) {
      Analytics.atsScoreUpgradePromptClicked({
        currentScore: scanResult.score,
      })
    }
    setShowOptimizeModal(true)
  }

  async function handleTemplateCustomize(
    options: { autoOptimize?: boolean; tailorJobKey?: string | null; autoTailor?: boolean } = {}
  ) {
    setCustomizeError(null)

    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }

    if (scannedResumeId) {
      router.push(buildAtsBuilderHref(scannedResumeId, mode, options))
      return
    }

    if (!scanResult || !profile?.id) {
      setCustomizeError('Run a scan first before opening the builder.')
      return
    }

    setIsPreparingBuilder(true)

    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: profile.id,
          title: normalizeResumeTitle(uploadedFile?.name ?? 'Uploaded Resume'),
          raw_text: getResumeText(),
          parsed_data: scanResult.resumeData,
          ats_score: isMatchMode ? null : scanResult.score,
          builder_visibility: {
            ...DEFAULT_VISIBILITY,
            density: ATS_PREVIEW_CONFIG.density,
          },
          template_config: ATS_PREVIEW_CONFIG,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error || !data?.id) {
        throw error ?? new Error('Failed to prepare resume builder')
      }

      setScannedResumeId(data.id)
      router.push(buildAtsBuilderHref(data.id, mode, options))
    } catch (error) {
      console.error('Failed to create ATS builder draft:', error)
      setCustomizeError('Could not open the builder for this upload. Please try again.')
    } finally {
      setIsPreparingBuilder(false)
    }
  }

  async function saveOptimisedResumeForEditor() {
    if (!optimiseResult || !profile?.id || !selectedOptimisedResumeData) {
      throw new Error('Optimise the resume first before opening it in the editor.')
    }

    const selectedText = resumeDataToText(selectedOptimisedResumeData)
    const selectedScore = scoreResume(selectedOptimisedResumeData).score
    const payload = {
      raw_text: selectedText,
      parsed_data: selectedOptimisedResumeData,
      ats_score: isMatchMode ? null : selectedScore,
      builder_visibility: {
        ...DEFAULT_VISIBILITY,
        density: ATS_PREVIEW_CONFIG.density,
      },
      template_config: ATS_PREVIEW_CONFIG,
      updated_at: new Date().toISOString(),
    }

    if (optimisedResumeId) {
      const { error } = await supabase
        .from('resumes')
        .update(payload)
        .eq('id', optimisedResumeId)
        .eq('user_id', profile.id)

      if (error) throw error
      return optimisedResumeId
    }

    const baseTitle = normalizeResumeTitle(getSourceResumeTitle())
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: profile.id,
        title: `${baseTitle} Optimised`,
        ...payload,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      throw error ?? new Error('Failed to prepare optimised resume')
    }

    setOptimisedResumeId(data.id)
    return data.id
  }

  async function handleOpenOptimisedEditor() {
    setOpenOptimisedError(null)

    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }

    if (!optimiseResult || !profile?.id || !selectedOptimisedResumeData) {
      setOpenOptimisedError('Optimise the resume first before opening it in the editor.')
      return
    }

    setIsOpeningOptimisedEditor(true)

    try {
      const resumeId = await saveOptimisedResumeForEditor()
      router.push(buildAtsBuilderHref(resumeId, mode))
    } catch (error) {
      console.error('Failed to open optimised resume in editor:', error)
      setOpenOptimisedError('Could not open the optimised resume in the editor. Please try again.')
    } finally {
      setIsOpeningOptimisedEditor(false)
    }
  }

  async function handleDownloadOptimisedResume() {
    setOpenOptimisedError(null)

    if (publicMode) {
      if (scanResult) {
        Analytics.atsScoreUpgradePromptClicked({
          currentScore: scanResult.score,
        })
      }
      router.push('/auth/register')
      return
    }

    if (!optimiseResult || !profile?.id || !selectedOptimisedResumeData) {
      setOpenOptimisedError('Optimise the resume first before downloading.')
      return
    }

    setIsOpeningOptimisedEditor(true)

    try {
      const resumeId = await saveOptimisedResumeForEditor()
      const href = buildAtsBuilderHref(resumeId, mode)
      const separator = href.includes('?') ? '&' : '?'
      router.push(`${href}${separator}download=pdf`)
    } catch (error) {
      console.error('Failed to prepare optimised resume download:', error)
      setOpenOptimisedError('Could not prepare the optimised resume download. Please try again.')
    } finally {
      setIsOpeningOptimisedEditor(false)
    }
  }

  const previewFrameHeight = Math.round(ATS_PREVIEW_PAGE_HEIGHT * previewScale) + 28
  const previewFrameWidth = Math.round(ATS_PREVIEW_PAGE_WIDTH * previewScale)
  const optimisedChangeComparisons = useMemo(() => {
    if (!scanResult || !optimiseResult) return []
    return buildChangeComparisons(scanResult.resumeData, optimiseResult.resumeData)
  }, [scanResult, optimiseResult])
  const appliedOptimisedChangeIdSet = useMemo(
    () => new Set(appliedOptimisedChangeIds),
    [appliedOptimisedChangeIds]
  )
  const selectedOptimisedResumeData = useMemo(() => {
    if (!scanResult || !optimiseResult) return null
    return applySelectedChangeComparisons(
      scanResult.resumeData,
      optimisedChangeComparisons,
      appliedOptimisedChangeIdSet
    )
  }, [appliedOptimisedChangeIdSet, optimisedChangeComparisons, optimiseResult, scanResult])
  const optimisedAtsScore = scanResult && selectedOptimisedResumeData
    ? scoreResume(selectedOptimisedResumeData).score
    : null
  // In match mode, the original scanResult.score is a match score (LLM-evaluated)
  // while the optimised score is an ATS quality score (deterministic). Comparing
  // them is misleading. Use the original ATS score as baseline for a fair comparison.
  const originalAtsScore = scanResult
    ? scoreResume(scanResult.resumeData).score
    : null
  const optimisedScore = isMatchMode
    ? optimisedAtsScore
    : optimisedAtsScore
  const optimisedScoreGain = scanResult && optimisedScore !== null
    ? isMatchMode
      ? (originalAtsScore !== null ? optimisedScore - originalAtsScore : 0)
      : optimisedScore - scanResult.score
    : 0

  useEffect(() => {
    if (!optimiseResult) return
    if (hasTouchedOptimisedChangeSelection) return
    if (optimisedChangeComparisons.length === 0) return
    if (appliedOptimisedChangeIds.length > 0) return

    setAppliedOptimisedChangeIds(optimisedChangeComparisons.map(change => change.id))
  }, [
    appliedOptimisedChangeIds.length,
    hasTouchedOptimisedChangeSelection,
    optimiseResult,
    optimisedChangeComparisons,
  ])

  function toggleOptimisedChange(changeId: string) {
    setHasTouchedOptimisedChangeSelection(true)
    setAppliedOptimisedChangeIds(prev => (
      prev.includes(changeId)
        ? prev.filter(id => id !== changeId)
        : [...prev, changeId]
    ))
  }

  function applyAllOptimisedChanges() {
    setHasTouchedOptimisedChangeSelection(true)
    setAppliedOptimisedChangeIds(optimisedChangeComparisons.map(change => change.id))
  }

  function revertAllOptimisedChanges() {
    setHasTouchedOptimisedChangeSelection(true)
    setAppliedOptimisedChangeIds([])
  }

  const scanActionBlock = (
    <>
      {!pro && !publicMode && scansLeft !== null && scansLeft === 0 && (
        <div className="rounded-xl bg-amber-50 px-5 py-3 text-sm text-amber-800 text-center">
          You have used all free scans today. Scans reset every 24 hours.{' '}
          <Link href="/dashboard/pricing" className="font-semibold underline">Upgrade to Pro</Link> for advanced analysis.
        </div>
      )}

      {isAnonymousAtsMode && publicAuthPromptReason && (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950 shadow-[0_18px_42px_rgba(2,109,50,0.08)]">
          <p className="font-semibold">
            {publicAuthPromptReason === 'another_resume'
              ? 'Your free pre-signup ATS scan is already used. Log in or create a free account to check another resume.'
              : 'Your free pre-signup ATS scan is already used. Log in or create a free account to run another scan.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Create free account
            </Link>
          </div>
        </div>
      )}

      {scanError && (
        <div className="rounded-xl bg-red-50 px-5 py-3 text-sm text-red-700 text-center">
          {scanError}
        </div>
      )}

      <div className={`flex justify-center ${compactPublicUploadCard ? 'pt-0' : publicMode ? 'pt-0' : 'pt-2'}`}>
        <button
          onClick={handleScan}
          disabled={!canScan && !isScanning}
          aria-busy={isScanning}
          className={`group relative flex items-center justify-center gap-3 overflow-hidden bg-zinc-950 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none ${compactPublicUploadCard ? 'w-full rounded-2xl px-8 py-5 text-lg' : 'rounded-full px-12 py-4 text-base'} ${isScanning ? 'animate-pulse cursor-wait shadow-[0_0_0_6px_rgba(16,185,129,0.14),0_24px_52px_rgba(2,109,50,0.28)] ring-2 ring-emerald-300/35 hover:translate-y-0 hover:bg-zinc-950' : publicMode ? 'shadow-[0_20px_40px_rgba(2,109,50,0.12)] hover:shadow-[0_24px_48px_rgba(2,109,50,0.2)]' : 'hover:shadow-[0_24px_42px_rgba(24,24,27,0.18)]'}`}
        >
          {isScanning ? (
            <>
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.18)_35%,transparent_70%)] animate-ping opacity-60" />
              <svg className="relative h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="relative inline-flex items-center gap-1">
                Analysing
                <span className="flex items-center gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.2s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.1s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-white" />
                </span>
              </span>
            </>
          ) : (
            <>
              <Sparkles size={18} strokeWidth={1.75} />
              {compactPublicUploadCard ? 'Run ATS scan' : scanButtonLabel}
              <ArrowRight size={18} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {!pro && !publicMode && (
        <p className="text-center text-xs text-on-surface-variant">
          {isMatchMode
            ? 'Match Score is a Pro feature. '
            : 'Free plan: unlimited ATS scans with basic analysis. '}
          <Link href="/dashboard/pricing" className="text-primary font-semibold hover:underline">
            Upgrade for advanced AI analysis + resume optimisation.
          </Link>
        </p>
      )}

      {publicMode && !compactPublicUploadCard && (
        <p className="text-center text-xs text-on-surface-variant">
          {isMatchMode
            ? 'Free match scoring is open here. Create an account when you want AI tailoring and builder editing.'
            : 'One ATS scan is available before signup. Create an account to rescan, upload another resume, and unlock AI improve + builder editing.'}
        </p>
      )}
    </>
  )

  return (
    <div className={publicMode ? "space-y-6" : "max-w-7xl mx-auto space-y-8"}>
      {showOptimizeModal && (
        <OneClickOptimizeModal
          onClose={() => setShowOptimizeModal(false)}
          promoDisplay={promoDisplay}
          currentScore={scanResult?.score ?? null}
        />
      )}
      {showIntro && (
        <DashboardPageIntro
          kicker={
            publicMode
              ? (isMatchMode ? 'Free Match Score' : 'Free ATS Checker')
              : (isMatchMode ? 'Resume-to-role fit' : 'ATS Diagnostics')
          }
          title={
            publicMode
              ? (isMatchMode ? 'Check your resume against a real job.' : 'Scan your resume before you create an account.')
              : (isMatchMode ? 'Measure resume-to-role fit.' : 'Refine your ATS fundamentals.')
          }
          description={
            publicMode
              ? (
                isMatchMode
                  ? 'Upload your resume, paste a full job description, and get a free match score before creating an account. Sign up only when you want AI tailoring and builder editing.'
                  : 'Upload your resume and get a free ATS score before creating an account. Sign up only when you want AI optimisation and builder editing.'
              )
              : (
                isMatchMode
                  ? 'Compare your resume against a target role and surface the biggest keyword, relevance, and evidence gaps in one calmer workspace.'
                  : 'Run a resume-only ATS check to catch structural, keyword, and recruiter-readability issues before you tailor for a specific job.'
              )
          }
          aside={
            publicMode ? (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Free Access</p>
                <p className="text-lg font-black leading-tight text-on-background">
                  {isMatchMode ? 'Match scoring is open before signup.' : 'ATS scoring is open before signup.'}
                </p>
                <p className="text-sm leading-6 text-on-surface-variant">
                  {isMatchMode
                    ? 'Paste the full JD now. AI tailoring and builder editing unlock after signup.'
                    : 'AI improve and template editing unlock after you create your account.'}
                </p>
              </div>
            ) : pro ? (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Pro Access</p>
                <p className="text-lg font-black leading-tight text-on-background">
                  {isMatchMode ? 'Unlimited match scoring and AI tailoring are active.' : 'Unlimited ATS scans and AI improvement are active.'}
                </p>
                <p className="text-sm leading-6 text-on-surface-variant">
                  {isMatchMode
                    ? 'Compare against every role without daily limits and push strong fits straight into the optimization flow.'
                    : 'Stress-test resume fundamentals without daily limits, then push the strongest draft into the builder.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Free Plan</p>
                <p className="text-lg font-black leading-tight text-on-background">
                  {isMatchMode
                    ? 'Match scoring unlocks on Pro.'
                    : scansLeft === null
                      ? 'Unlimited basic ATS scans are active.'
                      : `${scansLeft} scans remaining today.`}
                </p>
                <Link href="/dashboard/pricing" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Upgrade for unlimited <ChevronRight size={12} />
                </Link>
              </div>
            )
          }
        />
      )}

      {isMatchMode && showIntro && (
        <div className="flex items-start gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-4">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-600" strokeWidth={1.75} />
          <p className="text-sm text-amber-900">
            <span className="font-bold">Best results with ATS score 75+.</span>{' '}
            Run an ATS scan first and fix key issues before using Match Score — higher-quality resumes get more accurate fit results.
          </p>
        </div>
      )}

      {/* Ad banner — free users only */}
      {ADS_ENABLED && !pro && !publicMode ? <AdBanner size="leaderboard" className="mx-auto" /> : null}

      {/* ── Scanning Workspace ────────────────────────────────────────────────── */}
      <div className={
        isMatchMode
          ? 'grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start'
          : 'w-full'
      }>

        {/* Your Resume */}
        <div className="w-full space-y-4">
          {!compactPublicUploadCard && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-primary" strokeWidth={1.75} />
                <h3 className="text-base font-bold tracking-tight text-on-surface">Your Resume</h3>
              </div>
              <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">
                Required
              </span>
            </div>
          )}
          <DashboardSurface variant="default" className={`${isMatchMode ? (publicMode ? 'min-h-[400px]' : 'min-h-[480px]') : compactPublicUploadCard ? 'min-h-[520px]' : publicMode ? 'h-full' : 'min-h-[360px]'} ${compactPublicUploadCard ? 'p-7' : 'p-6'} flex flex-col ${compactPublicUploadCard ? 'gap-6' : 'gap-4'} shadow-[0_12px_44px_rgba(18,24,21,0.06)] border-white/60 backdrop-blur-sm`}>
            {/* Mode toggle */}
            {resumes.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInputMode('resume')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${inputMode === 'resume'
                      ? 'bg-primary-container/30 border-2 border-primary/30'
                      : 'bg-surface-container-low border-2 border-transparent hover:border-primary/20'
                    }`}
                >
                  <FileText
                    size={24}
                    className={`mb-1.5 ${inputMode === 'resume' ? 'text-primary' : 'text-on-surface-variant'}`}
                    strokeWidth={1.5}
                  />
                  <span className={`text-sm font-semibold ${inputMode === 'resume' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    Saved Resume
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">{resumes.length} available</span>
                </button>
                <button
                  onClick={() => {
                    setInputMode('upload')
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${inputMode === 'upload'
                      ? 'bg-primary-container/30 border-2 border-primary/30'
                      : 'border-2 border-dashed border-outline-variant hover:border-primary/40 hover:bg-primary-container/10'
                    }`}
                >
                  <Upload
                    size={24}
                    className={`mb-1.5 ${inputMode === 'upload' ? 'text-primary' : 'text-on-surface-variant'}`}
                    strokeWidth={1.5}
                  />
                  <span className={`text-sm font-semibold ${inputMode === 'upload' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                    Upload File
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">PDF, DOCX</span>
                </button>
              </div>
            )}

            {/* Input area */}
            <div className={`relative flex ${compactPublicUploadCard ? 'min-h-[380px]' : publicMode ? 'h-auto' : 'min-h-[280px]'} flex-1 flex-col`}>
              {inputMode === 'resume' && resumes.length > 0 ? (
                <div className="flex min-h-[280px] flex-1 flex-col rounded-xl border border-black/6 bg-[linear-gradient(180deg,rgba(244,248,245,0.72),rgba(255,255,255,0.92))] p-4">
                  <select
                    value={selectedResumeId}
                    onChange={e => {
                      setSelectedResumeId(e.target.value)
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{getResumeTitleLabel(r, resumeTitleLabels)}</option>
                    ))}
                  </select>

                  <div className="mt-auto space-y-2 px-1 pt-6">
                    <p className="text-xs font-semibold text-on-surface-variant">
                      Using a saved resume from your library.
                    </p>
                    {wordCount > 0 && (
                      <span className="block text-[10px] font-bold text-on-surface-variant">
                        Word count: {wordCount}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <UploadZone
                  uploadedFile={uploadedFile}
                  isExtracting={isExtracting}
                  extractError={extractError}
                  wordCount={wordCount}
                  onFile={handleFileChange}
                  onClear={() => { setUploadedFile(null); setExtractError(null) }}
                  publicMode={publicMode}
                  compact={compactPublicUploadCard}
                  showClearButton={!isMatchMode}
                />
              )}
            </div>
          </DashboardSurface>

          {!isMatchMode && (
            <div className="space-y-3">
              {scanActionBlock}
            </div>
          )}
        </div>

        {isMatchMode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <Briefcase size={18} className="text-primary" strokeWidth={1.75} />
                <div className="flex items-baseline gap-2">
                  <h3 className="text-base font-bold tracking-tight text-on-surface">Job Description</h3>
                  <span className="text-xs font-medium text-on-surface-variant">(required)</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">
                Target Role
              </span>
            </div>

            <DashboardSurface variant="default" className="min-h-[480px] p-6 flex flex-col gap-5">
              <div className="flex items-start gap-3 p-3 bg-secondary-container/40 rounded-xl">
                <Lightbulb size={16} className="text-on-secondary-container mt-0.5 shrink-0" strokeWidth={1.75} />
                <p className="text-xs text-on-secondary-container leading-snug">
                  Pro tip: Paste at least 20 words from the full requirements list so the score can judge real fit instead of just the title.
                </p>
              </div>

              <div className="flex-1 relative">
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job title and full description here…"
                  className="w-full h-full min-h-[320px] p-4 bg-surface-container-low border-none rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-on-surface-variant/50 leading-relaxed"
                />
                <div className="absolute bottom-3 right-3">
                  {jobWordCount > 0 && (
                    <span className="text-[10px] font-bold text-on-surface-variant bg-white/80 backdrop-blur px-2 py-1 rounded-md">
                      {jobWordCount} words
                    </span>
                  )}
                </div>
              </div>

              {jobWordCount > 0 && jobWordCount < 20 ? (
                <p className="text-sm text-red-600">
                  Add at least {20 - jobWordCount} more words to run Match Score.
                </p>
              ) : null}
            </DashboardSurface>
          </div>
        )}
      </div>

      {/* ── Action Bar ───────────────────────────────────────────────────────── */}
      {isMatchMode && (
        <div className="space-y-3">
          {scanActionBlock}
        </div>
      )}

      {/* ── Scanning Animation ───────────────────────────────────────────── */}
      {isScanning && (
        <div ref={scanningAnimationRef}>
          <ScanningAnimation isMatchMode={isMatchMode} isFinishing={isScanFinishing} />
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {scanResult && (
        <div ref={resultsRef} className="scroll-mt-24 space-y-5">
          {optimiseResult && (
            <DashboardSurface variant="default" className="p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {(['results', 'optimised'] as const).map(tab => {
                  const selected = activeTab === tab
                  // In match mode, the results tab shows the match score (LLM-evaluated)
                  // while the optimised tab shows ATS quality (deterministic scorer).
                  // To avoid comparing apples to oranges, both tabs use their own label.
                  const score = tab === 'results'
                    ? scanResult.score
                    : isMatchMode && autoRescanResult
                    ? autoRescanResult.score
                    : isMatchMode && isAutoRescanning
                    ? null
                    : (optimisedScore ?? scanResult.score)
                  const scoreState = score !== null ? getScoreState(score) : null
                  const tabScoreLabel = tab === 'optimised' && isMatchMode
                    ? (autoRescanResult ? 'Match Score' : isAutoRescanning ? 'Calculating...' : 'ATS Quality')
                    : scoreRingLabel

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`group rounded-[1.2rem] border px-4 py-3 text-left transition-all ${selected
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_18px_38px_rgba(17,24,39,0.18)]'
                          : 'border-black/8 bg-white/80 text-on-surface hover:-translate-y-0.5 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selected ? 'bg-white/12 text-white' : 'bg-primary-container/35 text-primary'}`}>
                            {tab === 'results' ? <FileText size={18} strokeWidth={1.8} /> : <Sparkles size={18} strokeWidth={1.8} />}
                          </span>
                          <div>
                            <p className="text-sm font-black tracking-tight">
                              {tab === 'results' ? 'Analysis Results' : 'AI Optimized'}
                            </p>
                            <p className={`mt-0.5 text-xs ${selected ? 'text-white/68' : 'text-on-surface-variant'}`}>
                              {tab === 'results' ? 'Original resume scan' : 'Optimized resume scan'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {score !== null && (
                            <p className="text-2xl font-black tracking-tight">{score}</p>
                          )}
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${selected ? 'bg-white/12 text-white' : (scoreState?.toneClassName ?? 'bg-zinc-100 text-zinc-600')}`}>
                            {tabScoreLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </DashboardSurface>
          )}

          {activeTab === 'results' && (
            <div className={publicMode ? 'grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]' : 'grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]'}>
              <div className="space-y-5">
                <DashboardSurface variant="default" className="border-white !bg-white !bg-none p-5 shadow-[0_24px_60px_rgba(25,28,29,0.08)] sm:p-6">
                  <div className="space-y-6">
                    <div className="space-y-5">
                      <h2 className="text-[1.75rem] font-black tracking-tight text-on-background">{resultsTitle}</h2>
                    <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row gap-5 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0">
                          <ScoreRing score={scanResult.score} label={scoreRingLabel} />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <p className="text-3xl sm:text-4xl font-black tracking-tight text-on-background break-words leading-tight">{getScoreState(scanResult.score).label}</p>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getScoreState(scanResult.score).toneClassName}`}>
                            {scoreBadgeLabel}
                          </span>
                        </div>
                      </div>

                      {isMatchMode && (
                        <div className="flex-1 space-y-3.5 rounded-2xl border border-black/5 bg-zinc-50/50 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 size={13} className="text-primary" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Alignment Heatmap</p>
                          </div>
                          
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-zinc-500">Keyword Match</span>
                                <span className="text-primary">{scanResult.score}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${scanResult.score}%` }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-zinc-500">Technical Depth</span>
                                <span className="text-amber-600">68%</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: '68%' }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-zinc-500">Structure</span>
                                <span className="text-emerald-600">94%</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '94%' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                      <div className="space-y-3">
                        <p className="text-sm leading-6 text-on-surface-variant">{scanResult.summary}</p>
                        {!pro && scanResult.scansRemaining !== null && (
                          <p className="text-xs text-on-surface-variant">{scanResult.scansRemaining} free scans remaining today.</p>
                        )}
                        {!isMatchMode && !pro && scanResult.score < 70 && (
                          <div className="group relative overflow-hidden rounded-[1.25rem] border border-[#8f3144]/40 bg-[linear-gradient(155deg,#5b1625_0%,#7b2034_42%,#2b0f17_100%)] px-4 py-4 text-white shadow-[0_24px_48px_rgba(91,22,37,0.22)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#bf5a70]/60 hover:shadow-[0_34px_72px_rgba(91,22,37,0.34)]">
                            <div className="pointer-events-none absolute inset-0">
                              <div className="absolute inset-y-0 right-[-18%] w-1/2 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-x-3" />
                              <div className="absolute left-6 top-5 h-16 w-16 rounded-full bg-[#f7b0bf]/10 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-[#f7b0bf]/20" />
                              <div className="absolute inset-y-0 left-0 w-20 -translate-x-[140%] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-xl transition-all duration-700 group-hover:translate-x-[520%] group-hover:opacity-100" />
                            </div>
                            <div className="relative">
                              <p className="text-sm font-bold tracking-tight text-white transition-transform duration-300 group-hover:translate-x-0.5">
                                Industry-leading ATS systems would score this resume low.
                              </p>
                              <p className="mt-2 text-sm leading-6 text-rose-100/88">
                                Use AI insights to find the highest-impact fixes before you apply.
                              </p>
                              <a
                                href={publicMode ? '/auth/register' : '/dashboard/pricing'}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(19,8,12,0.22)] transition-all duration-300 hover:bg-white hover:text-[#5b1625] group-hover:border-white/25"
                              >
                                Upgrade to Pro
                                <ChevronRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-black/6 pt-5">
                      <p className="text-lg font-bold tracking-tight text-on-background">{reviewHeading}</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        {reviewDescription}
                      </p>
                      <div className="mt-4 space-y-2.5">
                        {getReviewSections(scanResult).map(section => (
                          <div
                            key={section.key}
                            className={`flex items-center justify-between rounded-[1.1rem] px-4 py-3 ${section.count > 0
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {section.count > 0 ? (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-700">
                                  !
                                </span>
                              ) : (
                                <CheckCircle2 size={18} className="text-emerald-600" />
                              )}
                              <span className="text-sm font-semibold">{section.label}</span>
                            </div>
                            {section.count > 0 ? (
                              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white">
                                {section.count}
                              </span>
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-[0.16em]">Good</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DashboardSurface>

                {!isMatchMode && (
                  pro && scanResult.roadmap
                    ? <RoadToNinetyPanel roadmap={scanResult.roadmap} />
                    : <RoadToNinetyUpsell publicMode={publicMode} />
                )}

                {scanResult.scoreBreakdown && (
                  <DashboardSurface variant="subtle" className="p-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Score breakdown</p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">Where the score comes from.</h3>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label={breakdownLabels.keywordMatch} value={scanResult.scoreBreakdown.keywordMatch} />
                        <BreakdownBar label={breakdownLabels.formatting} value={scanResult.scoreBreakdown.formatting} />
                        <BreakdownBar label={breakdownLabels.relevance} value={scanResult.scoreBreakdown.relevance} />
                        <BreakdownBar label={breakdownLabels.completeness} value={scanResult.scoreBreakdown.completeness} />
                        <BreakdownBar label={breakdownLabels.keywordDensity} value={scanResult.scoreBreakdown.keywordDensity} />
                      </div>
                    </div>
                  </DashboardSurface>
                )}

                <DashboardSurface variant="subtle" className="p-5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Keyword insights</p>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">{keywordSectionTitle}</h3>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{keywordSectionDescription}</p>
                    </div>

                    {scanResult.missingKeywords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">{missingKeywordLabel}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.missingKeywords.map(keyword => (
                            <span key={keyword} className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.presentKeywords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{presentKeywordLabel}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.presentKeywords.map(keyword => (
                            <span key={keyword} className="rounded-md bg-primary-container/45 px-2.5 py-1 text-xs font-medium text-on-primary-container">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.keywordAnalysis?.mustHave?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">{mustHaveLabel}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.keywordAnalysis.mustHave.map(keyword => (
                            <span key={keyword} className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                  </div>
                </DashboardSurface>
              </div>

              <div className="space-y-5">
                <DashboardSurface variant="default" className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-on-background">Universal template preview</p>
                      <p className="text-xs text-on-surface-variant">Banner header selected with Rezoomed green accent. Only the first page is shown here.</p>
                    </div>
                    <span className="rounded-full bg-primary-container/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-primary-container">
                      Page 1 · Banner · Green
                    </span>
                  </div>

                  <div
                    ref={previewViewportRef}
                    className="overflow-hidden bg-[linear-gradient(180deg,#eef4ef_0%,#f7f8f5_100%)] px-2 py-3 sm:px-3 sm:py-4"
                    style={{ height: previewFrameHeight }}
                  >
                    <div className="mx-auto overflow-hidden rounded-[1.6rem] border border-black/8 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.12)]" style={{ width: previewFrameWidth, height: Math.round(ATS_PREVIEW_PAGE_HEIGHT * previewScale) }}>
                      <div
                        className="origin-top-left"
                        style={{
                          width: `${ATS_PREVIEW_PAGE_WIDTH}px`,
                          transform: `scale(${previewScale})`,
                          pointerEvents: 'none',
                        }}
                      >
                        <UniversalTemplate
                          data={scanResult.resumeData}
                          isEditing={false}
                          config={ATS_PREVIEW_CONFIG}
                          sectionOrder={ATS_PREVIEW_SECTION_ORDER}
                          sidebarSectionOrder={[]}
                        />
                      </div>
                    </div>
                  </div>
                </DashboardSurface>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleOptimiseCTA}
                    disabled={isPreparingBuilder}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isOptimiseCtaBusy ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {optimiseButtonLoadingLabel}
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} strokeWidth={2} />
                        {optimiseButtonLabel}
                        <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => { void handleTemplateCustomize() }}
                    disabled={isPreparingBuilder}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-6 py-3.5 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isPreparingBuilder ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Opening builder…
                      </>
                    ) : (
                      <>
                        Customize this template
                        <ArrowRight size={16} strokeWidth={2} />
                      </>
                    )}
                  </button>
                </div>

                {(optimiseError || customizeError) && (
                  <div className="rounded-[1.2rem] bg-red-50 px-5 py-3 text-sm text-red-700">
                    {optimiseError ?? customizeError}
                  </div>
                )}

                {scanResult.suggestions.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Suggestions</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                        {isMatchMode ? 'What to strengthen next.' : 'What to fix next.'}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {scanResult.suggestions.map((suggestion, index) => (
                        <DashboardSurface key={index} variant="subtle" className="p-5">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${severityBadge(suggestion.severity)}`}>
                                {suggestion.severity}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                {suggestion.category}
                              </span>
                            </div>
                            <p className="text-lg font-bold tracking-tight text-on-background">{suggestion.issue}</p>
                            <p className="text-sm leading-7 text-on-surface-variant">
                              <span className="font-semibold text-primary">Fix: </span>{suggestion.fix}
                            </p>
                            {suggestion.example && (
                              <div className="rounded-[1rem] bg-white px-4 py-3 text-sm italic leading-6 text-on-surface-variant shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
                                {suggestion.example}
                              </div>
                            )}
                          </div>
                        </DashboardSurface>
                      ))}
                    </div>
                  </div>
                )}

                {(scanResult.formattingIssues?.length || scanResult.industryInsight) && (
                  <DashboardSurface variant="subtle" className="p-5">
                    <div className="space-y-4">
                      {scanResult.formattingIssues && scanResult.formattingIssues.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{notesHeading}</p>
                          <ul className="space-y-2">
                            {scanResult.formattingIssues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-2.5 text-sm leading-6 text-on-surface-variant">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scanResult.industryInsight && (
                        <div className="rounded-[1.2rem] bg-primary-container/25 px-4 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-primary-container">{insightHeading}</p>
                          <p className="mt-2 text-sm leading-7 text-on-surface">{scanResult.industryInsight}</p>
                        </div>
                      )}
                    </div>
                  </DashboardSurface>
                )}
              </div>
            </div>
          )}

          {activeTab === 'optimised' && optimiseResult && (
            <div className="space-y-5">
              <AutoRescanBanner
                isAutoRescanning={isAutoRescanning}
                autoRescanResult={autoRescanResult}
                autoRescanError={autoRescanError}
                originalMatchScore={scanResult.score}
              />
              <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <DashboardSurface variant="default" className="border-white !bg-white !bg-none p-5 shadow-[0_24px_60px_rgba(25,28,29,0.08)] sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Optimisation summary</p>
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                          {isMatchMode ? 'Optimized ATS quality.' : 'Optimized ATS score.'}
                        </h3>
                      </div>

                      {!isMatchMode ? (
                        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 p-4">
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800/70">Before</p>
                              <p className="mt-1 text-4xl font-black tracking-tight text-on-background">{scanResult.score}</p>
                            </div>
                            <ArrowRight size={20} className="text-emerald-700" strokeWidth={2} />
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800/70">After</p>
                              <p className="mt-1 text-4xl font-black tracking-tight text-emerald-700">{optimisedScore ?? scanResult.score}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between rounded-full bg-white/72 px-3 py-2">
                            <span className="text-xs font-semibold text-on-surface-variant">ATS score change</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${scoreGainToneClass(optimisedScoreGain)}`}>
                              {formatScoreGain(optimisedScoreGain)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 p-4">
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800/70">Before</p>
                              <p className="mt-1 text-4xl font-black tracking-tight text-on-background">{originalAtsScore ?? '—'}</p>
                            </div>
                            <ArrowRight size={20} className="text-emerald-700" strokeWidth={2} />
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800/70">After</p>
                              <p className="mt-1 text-4xl font-black tracking-tight text-emerald-700">{optimisedScore ?? scanResult.score}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between rounded-full bg-white/72 px-3 py-2">
                            <span className="text-xs font-semibold text-on-surface-variant">ATS quality change</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${scoreGainToneClass(optimisedScoreGain)}`}>
                              {formatScoreGain(optimisedScoreGain)}
                            </span>
                          </div>
                        </div>
                      )}

                      {!isMatchMode ? (
                        <div className="space-y-2.5">
                          {getReviewSections(scanResult).map(section => (
                            <div
                              key={`optimised-section-${section.key}`}
                              className="flex items-center justify-between rounded-[1.1rem] bg-emerald-50 px-4 py-3 text-emerald-700"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                                <span className="truncate text-sm font-semibold">{section.label}</span>
                              </div>
                              <span className="shrink-0 text-xs font-bold uppercase tracking-[0.16em]">Good</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[1.2rem] bg-primary-container/30 p-4 text-center">
                          <p className="text-3xl font-black tracking-tight text-on-primary-container">{optimiseResult.improvementsCount}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Improvements made</p>
                        </div>
                        <div className="rounded-[1.2rem] bg-surface-container-low p-4 text-center">
                          <p className="text-3xl font-black tracking-tight text-primary">{optimiseResult.keywordsAdded.length}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Keywords added</p>
                        </div>
                      </div>
                    </div>
                  </DashboardSurface>

                  {optimiseResult.keywordsAdded.length > 0 && (
                    <DashboardSurface variant="subtle" className="p-5">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Keywords added</p>
                          <h3 className="mt-2 text-xl font-black tracking-tight text-on-background">Included where the resume supported them.</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {optimiseResult.keywordsAdded.map(kw => (
                            <span key={kw} className="rounded-md bg-primary-container/50 px-2.5 py-1 text-xs font-medium text-on-primary-container">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </DashboardSurface>
                  )}
                </div>

                <div className="space-y-5">
                  <DashboardSurface variant="subtle" className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-on-background">Optimised resume preview</p>
                        <p className="text-xs text-on-surface-variant">Rendered in the same universal template with banner header and Rezoomed green accent.</p>
                      </div>
                      <span className="rounded-full bg-primary-container/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-primary-container">
                        Page 1 · Banner · Green
                      </span>
                    </div>

                    <div
                      ref={previewViewportRef}
                      className="overflow-hidden bg-[linear-gradient(180deg,#eef4ef_0%,#f7f8f5_100%)] px-2 py-3 sm:px-3 sm:py-4"
                      style={{ height: previewFrameHeight }}
                    >
                      <div className="mx-auto overflow-hidden rounded-[1.6rem] border border-black/8 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.12)]" style={{ width: previewFrameWidth, height: Math.round(ATS_PREVIEW_PAGE_HEIGHT * previewScale) }}>
                        <div
                          className="origin-top-left"
                          style={{
                            width: `${ATS_PREVIEW_PAGE_WIDTH}px`,
                            transform: `scale(${previewScale})`,
                            pointerEvents: 'none',
                          }}
                        >
                          <UniversalTemplate
                            data={selectedOptimisedResumeData ?? optimiseResult.resumeData}
                            isEditing={false}
                            config={ATS_PREVIEW_CONFIG}
                            sectionOrder={ATS_PREVIEW_SECTION_ORDER}
                            sidebarSectionOrder={[]}
                          />
                        </div>
                      </div>
                    </div>
                  </DashboardSurface>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { void handleOpenOptimisedEditor() }}
                      disabled={isOpeningOptimisedEditor}
                      className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold hover:brightness-95 transition-all disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isOpeningOptimisedEditor ? 'Opening editor…' : 'Open in editor'}
                    </button>
                    {!isMatchMode ? (
                      <button
                        onClick={() => { void handleDownloadOptimisedResume() }}
                        disabled={isOpeningOptimisedEditor}
                        className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-sm font-bold hover:bg-zinc-900 transition-colors disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        Download
                      </button>
                    ) : null}
                  </div>

                  {openOptimisedError && (
                    <div className="rounded-[1.2rem] bg-red-50 px-5 py-3 text-sm text-red-700">
                      {openOptimisedError}
                    </div>
                  )}
                </div>
              </div>

              {optimisedChangeComparisons.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Changes made</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-on-background">Old vs new.</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={applyAllOptimisedChanges}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        Apply all
                      </button>
                      <button
                        type="button"
                        onClick={revertAllOptimisedChanges}
                        className="rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold text-on-surface-variant transition hover:bg-surface-container-low"
                      >
                        Revert all
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {optimisedChangeComparisons.map(change => {
                      const isApplied = appliedOptimisedChangeIdSet.has(change.id)

                      return (
                        <DashboardSurface key={change.id} variant="subtle" className={`p-5 transition-opacity ${isApplied ? '' : 'opacity-72'}`}>
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-md bg-primary-container/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-on-primary-container">
                                  {change.section}
                                </span>
                                <p className="text-sm font-bold tracking-tight text-on-background">{change.title}</p>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isApplied ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                  {isApplied ? 'Applied' : 'Unapplied'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleOptimisedChange(change.id)}
                                className={`rounded-full px-4 py-2 text-xs font-bold transition ${isApplied
                                    ? 'border border-black/8 bg-white text-on-surface-variant hover:bg-surface-container-low'
                                    : 'bg-zinc-950 text-white hover:bg-zinc-900'
                                  }`}
                              >
                                {isApplied ? 'Revert' : 'Apply change'}
                              </button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-[1rem] border border-black/6 bg-white px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Old</p>
                                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{change.before}</p>
                              </div>
                              <div className={`rounded-[1rem] border px-4 py-3 ${isApplied ? 'border-emerald-200 bg-emerald-50/72' : 'border-black/6 bg-white'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${isApplied ? 'text-emerald-800' : 'text-on-surface-variant'}`}>New</p>
                                <p className="mt-2 text-sm leading-6 text-on-surface">{change.after}</p>
                              </div>
                            </div>
                          </div>
                        </DashboardSurface>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isMatchTailorChooserOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-tailor-intensity-title"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-[1.8rem] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.24)]">
            <div className="border-b border-black/6 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    <Sparkles size={12} />
                    Tailor Resume
                  </p>
                  <h3 id="match-tailor-intensity-title" className="mt-3 text-2xl font-black tracking-tight text-zinc-950">
                    Choose rewrite intensity.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Pick how strongly Rezoomed should rewrite this resume for the job description.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeMatchTailorChooser}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white text-zinc-500 transition hover:text-zinc-950"
                  aria-label="Close rewrite intensity selector"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-[1.1rem] border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm font-semibold text-emerald-800">
                Auto-selecting Balanced in {matchTailorCountdown}s
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {MATCH_TAILOR_INTENSITIES.map(option => {
                  const isDefault = option.value === 'balanced'

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => proceedToTailorBuilder(option.value)}
                      disabled={isPreparingBuilder}
                      className={`group rounded-[1.25rem] border px-4 py-4 text-left transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isDefault
                          ? 'border-emerald-200 bg-emerald-50 shadow-[0_14px_34px_rgba(5,150,105,0.08)]'
                          : 'border-black/8 bg-white hover:border-emerald-200 hover:bg-emerald-50/45'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-zinc-950">{option.label}</span>
                        {isDefault && (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-zinc-500">{option.description}</span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => proceedToTailorBuilder('balanced')}
                disabled={isPreparingBuilder}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPreparingBuilder ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Opening builder…
                  </>
                ) : (
                  <>
                    Continue with Balanced
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient background accents */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-10 left-80 w-48 h-48 bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
    </div>
  )
}
