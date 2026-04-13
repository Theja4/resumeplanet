import { getResumeSkills, syncResumeData } from '@/lib/resume-data'
import type { ResumeData, TailorIntensity } from '@/types'

export type GenerationSourceMode = 'saved' | 'upload'

export interface CoverLetterSender {
  name: string
  currentRole: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
}

export interface CoverLetterDraft {
  intensity: TailorIntensity
  roleTitle: string
  companyName: string
  suggestedSubject: string
  greeting: string
  openingParagraph: string
  bodyParagraphs: string[]
  closingParagraph: string
  signOff: string
  strategySummary: string
  fitHighlights: string[]
}

export interface GeneratedCoverLetterPayload {
  coverLetter: CoverLetterDraft
  sender: CoverLetterSender
  sourceMode: GenerationSourceMode
  sourceTitle: string
}

export function normalizeResumeData(data: Partial<ResumeData> | null | undefined): ResumeData {
  return syncResumeData({
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
    skillSections: data?.skillSections ?? [],
    certifications: data?.certifications ?? [],
    projects: data?.projects ?? [],
    languages: data?.languages ?? [],
    volunteer: data?.volunteer ?? [],
    interests: data?.interests ?? [],
    awards: data?.awards ?? [],
    publications: data?.publications ?? [],
    references: data?.references ?? [],
    customSections: data?.customSections ?? [],
  })
}

export function resumeHasMeaningfulContent(data: ResumeData) {
  return Boolean(
    data.summary.trim() ||
      data.currentRole.trim() ||
      data.experience.length > 0 ||
      getResumeSkills(data).length > 0 ||
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

export function formatCoverLetterDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatCoverLetterContact(sender: CoverLetterSender) {
  return [sender.email, sender.phone, sender.location, sender.linkedin, sender.website]
    .map(value => value.trim())
    .filter(Boolean)
    .join(' · ')
}

export function buildCoverLetterDownloadName(sourceTitle: string) {
  return `${sanitizeDocumentTitle(sourceTitle) || 'generated-cover-letter'}-cover-letter`
}

export function coverLetterSenderFromResumeData(data: ResumeData): CoverLetterSender {
  return {
    name: data.name.trim(),
    currentRole: data.currentRole.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    location: data.location.trim(),
    linkedin: data.linkedin.trim(),
    website: data.website.trim(),
  }
}

export function normalizeCoverLetterDraft(
  raw: Partial<CoverLetterDraft> | null | undefined,
  sender: CoverLetterSender,
  intensity: TailorIntensity,
) {
  const roleTitle = raw?.roleTitle?.trim() ?? ''
  const companyName = raw?.companyName?.trim() ?? ''
  const greeting = raw?.greeting?.trim() || 'Dear Hiring Team,'
  const openingParagraph =
    raw?.openingParagraph?.trim() ||
    `I am writing to express my interest in ${roleTitle ? `the ${roleTitle} role` : 'this opportunity'}${companyName ? ` at ${companyName}` : ''}. My background${sender.currentRole ? ` as a ${sender.currentRole}` : ''} has prepared me to contribute with strong execution, collaboration, and role-relevant experience.`
  const bodyParagraphs = (raw?.bodyParagraphs ?? [])
    .map(paragraph => paragraph?.trim())
    .filter((paragraph): paragraph is string => Boolean(paragraph))
  const closingParagraph =
    raw?.closingParagraph?.trim() ||
    `I would welcome the opportunity to discuss how my background can support your team${companyName ? ` at ${companyName}` : ''}. Thank you for your time and consideration.`

  return {
    intensity,
    roleTitle,
    companyName,
    suggestedSubject:
      raw?.suggestedSubject?.trim() ||
      `Application for ${roleTitle || 'the role'}${companyName ? ` - ${companyName}` : ''}`,
    greeting,
    openingParagraph,
    bodyParagraphs,
    closingParagraph,
    signOff: raw?.signOff?.trim() || 'Sincerely,',
    strategySummary:
      raw?.strategySummary?.trim() ||
      'This cover letter keeps the tone direct, truthful, and focused on the most relevant evidence from the resume.',
    fitHighlights: (raw?.fitHighlights ?? [])
      .map(item => item?.trim())
      .filter((item): item is string => Boolean(item))
      .slice(0, 5),
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
      skills: getResumeSkills(data),
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
