import { DEFAULT_UNIVERSAL_CONFIG, DEFAULT_VISIBILITY } from '@/types'
import type { ResumeData, TailorAnalysis, TailorIntensity, UniversalConfig } from '@/types'

export type CVSourceMode = 'saved' | 'upload'

export interface GeneratedCVPayload {
  analysis: TailorAnalysis
  generatedResumeData: ResumeData
  sourceMode: CVSourceMode
  sourceTitle: string
  changed: boolean
  scoreDelta: number
  touchedSections: string[]
}

export const CV_TEMPLATE_CONFIG: UniversalConfig = {
  ...DEFAULT_UNIVERSAL_CONFIG,
  accentColor: '#008f44',
  density: 'compressed',
}

export const CV_SECTION_ORDER = DEFAULT_VISIBILITY.sectionOrder
export const CV_SIDEBAR_SECTION_ORDER = DEFAULT_VISIBILITY.sidebarSectionOrder ?? []

export function normalizeResumeData(data: Partial<ResumeData> | null | undefined): ResumeData {
  return {
    name: data?.name ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    location: data?.location ?? '',
    linkedin: data?.linkedin ?? '',
    website: data?.website ?? '',
    summary: data?.summary ?? '',
    currentRole: data?.currentRole ?? '',
    experience: data?.experience ?? [],
    education: data?.education ?? [],
    skills: data?.skills ?? [],
    certifications: data?.certifications ?? [],
    projects: data?.projects ?? [],
    languages: data?.languages ?? [],
    volunteer: data?.volunteer ?? [],
    interests: data?.interests ?? [],
    awards: data?.awards ?? [],
    publications: data?.publications ?? [],
    references: data?.references ?? [],
    customSections: data?.customSections ?? [],
  }
}

export function resumeHasMeaningfulContent(data: ResumeData) {
  return Boolean(
    data.summary.trim() ||
      data.currentRole.trim() ||
      data.experience.length > 0 ||
      data.skills.length > 0 ||
      data.projects.length > 0
  )
}

export function sanitizeDocumentTitle(value: string) {
  return value
    .trim()
    .replace(/\.(pdf|docx)$/i, '')
    .replace(/[^a-z0-9-_\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeTailorAnalysis(
  raw: Partial<TailorAnalysis> | null | undefined,
  intensity: TailorIntensity,
): TailorAnalysis {
  return {
    intensity,
    matchScore: Math.max(0, Math.min(100, Number(raw?.matchScore ?? 0))),
    matchTier: raw?.matchTier ?? 'MODERATE_FIT',
    shortlistingProbability: raw?.shortlistingProbability ?? 'MODERATE',
    overallStrategy: raw?.overallStrategy?.trim() ?? '',
    honestAssessment: raw?.honestAssessment?.trim() ?? '',
    tailoredHeadline: raw?.tailoredHeadline?.trim() ?? '',
    tailoredSummary: raw?.tailoredSummary?.trim() ?? '',
    matchedKeywords: (raw?.matchedKeywords ?? []).filter(item => item?.keyword && item?.evidence),
    missingKeywords: (raw?.missingKeywords ?? []).filter(item => item?.keyword),
    skillsPlan: {
      recommendedOrder: (raw?.skillsPlan?.recommendedOrder ?? []).filter(Boolean),
      add: (raw?.skillsPlan?.add ?? []).filter(Boolean),
      deprioritize: (raw?.skillsPlan?.deprioritize ?? []).filter(Boolean),
      rationale: raw?.skillsPlan?.rationale?.trim() ?? '',
    },
    sectionFocus: (raw?.sectionFocus ?? []).filter(item => item?.sectionId && item?.priority && item?.title),
    bulletRewrites: (raw?.bulletRewrites ?? []).filter(item => item?.sectionId && item?.original && item?.tailored),
    bulletOrderPlans: (raw?.bulletOrderPlans ?? []).filter(
      item => item?.sectionId && Array.isArray(item?.orderedOriginalBullets)
    ),
  }
}

export function resumeDataToGeneratorContext(data: ResumeData) {
  return JSON.stringify(
    {
      identity: {
        name: data.name,
        currentRole: data.currentRole,
      },
      contact: {
        email: data.email,
        phone: data.phone,
        location: data.location,
        linkedin: data.linkedin,
        website: data.website,
      },
      summary: data.summary,
      skills: data.skills,
      experience: data.experience.map(item => ({
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: item.bullets,
      })),
      education: data.education,
      projects: data.projects,
      certifications: data.certifications,
      volunteer: data.volunteer.map(item => ({
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: item.bullets,
      })),
      languages: data.languages,
      interests: data.interests,
      awards: data.awards,
      publications: data.publications,
      references: data.references,
      customSections: data.customSections ?? [],
    },
    null,
    2,
  )
}
