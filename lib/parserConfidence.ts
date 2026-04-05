import type { ResumeData } from '@/types'

type ParseSource = 'marker' | 'fast' | 'client' | 'repair'

export interface ResumeParseConfidence {
  score: number
  level: 'high' | 'medium' | 'low'
  issues: string[]
}

export interface ResumeParseCandidate {
  data: ResumeData
  source: ParseSource
  confidence: ResumeParseConfidence
}

const SECTION_HEADING_TERMS = [
  'experience',
  'work experience',
  'professional experience',
  'employment history',
  'work history',
  'education',
  'educational background',
  'academic background',
  'academia',
  'academics',
  'qualification',
  'qualifications',
  'academic qualifications',
  'skills',
  'technical skills',
  'core skills',
  'competencies',
  'projects',
  'certifications',
  'languages',
  'volunteer',
  'interests',
  'awards',
  'publications',
  'references',
]

const SUMMARY_LEAK_RE = new RegExp(`\\b(?:${SECTION_HEADING_TERMS.map(escapeForRegex).join('|')})\\b`, 'i')
const DATE_CLUSTER_RE = /\b(?:\d{1,2}\/\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now))\b/gi

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function uniqueIssueList(issues: string[]): string[] {
  return Array.from(new Set(issues))
}

function sourceWeight(source: ParseSource): number {
  if (source === 'marker') return 4
  if (source === 'repair') return 3
  if (source === 'fast') return 2
  return 1
}

function assessSummary(summary: string, issues: string[]): number {
  const trimmed = summary.trim()
  if (!trimmed) {
    issues.push('missing summary')
    return 0
  }

  let score = 10
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  const headingHits = trimmed.match(SUMMARY_LEAK_RE) ?? []
  const dateHits = trimmed.match(DATE_CLUSTER_RE) ?? []

  if (wordCount < 12) {
    score -= 3
    issues.push('summary too short')
  } else if (wordCount > 120) {
    score -= 5
    issues.push('summary too long')
  }

  if (headingHits.length >= 2) {
    score -= 6
    issues.push('summary contains downstream section content')
  }

  if (dateHits.length >= 2) {
    score -= 4
    issues.push('summary contains multiple date fragments')
  }

  return Math.max(0, score)
}

function assessExperience(data: ResumeData, issues: string[]): number {
  if (data.experience.length === 0) {
    issues.push('missing experience section')
    return 0
  }

  let score = 16
  const completeEntries = data.experience.filter(item => item.title && item.company)
  const bulletEntries = data.experience.filter(item => item.bullets.length > 0)
  const datedEntries = data.experience.filter(item => item.startDate || item.endDate)

  if (completeEntries.length === 0) {
    score -= 8
    issues.push('experience entries missing title or company')
  } else if (completeEntries.length < data.experience.length) {
    score -= 4
    issues.push('some experience entries incomplete')
  }

  if (bulletEntries.length === 0) {
    score -= 6
    issues.push('experience bullets missing')
  } else if (bulletEntries.length < data.experience.length) {
    score -= 3
    issues.push('some experience bullets missing')
  }

  if (datedEntries.length === 0) {
    score -= 4
    issues.push('experience dates missing')
  }

  return Math.max(0, score)
}

function assessEducation(data: ResumeData, issues: string[]): number {
  if (data.education.length === 0) {
    issues.push('missing education section')
    return 0
  }

  let score = 12
  const completeEntries = data.education.filter(item => item.institution || item.degree)
  if (completeEntries.length < data.education.length) {
    score -= 4
    issues.push('some education entries incomplete')
  }
  if (!data.education.some(item => item.graduationDate)) {
    score -= 2
  }

  return Math.max(0, score)
}

function assessSkills(data: ResumeData, issues: string[]): number {
  if (data.skills.length === 0) {
    issues.push('missing skills section')
    return 0
  }

  if (data.skills.length >= 6) return 10
  if (data.skills.length >= 3) return 7

  issues.push('skills section sparse')
  return 4
}

export function assessResumeParseConfidence(data: ResumeData | null | undefined): ResumeParseConfidence {
  if (!data) {
    return {
      score: 0,
      level: 'low',
      issues: ['parse returned empty result'],
    }
  }

  const issues: string[] = []
  let score = 0

  score += data.name ? 8 : (issues.push('missing name'), 0)
  score += data.email ? 8 : (issues.push('missing email'), 0)
  score += data.phone ? 5 : 0
  score += data.location ? 3 : 0
  score += data.linkedin || data.website ? 3 : 0
  score += data.currentRole ? 5 : 0
  score += assessSummary(data.summary, issues)
  score += assessExperience(data, issues)
  score += assessEducation(data, issues)
  score += assessSkills(data, issues)

  const populatedSections = [
    data.experience.length > 0,
    data.education.length > 0,
    data.skills.length > 0,
    data.projects.length > 0,
    data.certifications.length > 0,
    data.languages.length > 0,
    data.volunteer.length > 0,
    data.awards.length > 0,
    data.publications.length > 0,
    data.references.length > 0,
    (data.customSections?.length ?? 0) > 0,
  ].filter(Boolean).length

  if (populatedSections >= 4) {
    score += 12
  } else if (populatedSections >= 3) {
    score += 8
  } else if (populatedSections >= 2) {
    score += 4
    issues.push('few sections populated')
  } else {
    issues.push('very few sections populated')
  }

  const uniqueIssues = uniqueIssueList(issues)
  const normalizedScore = Math.max(0, Math.min(100, score))

  return {
    score: normalizedScore,
    level: normalizedScore >= 80 ? 'high' : normalizedScore >= 62 ? 'medium' : 'low',
    issues: uniqueIssues,
  }
}

export function shouldAttemptRepair(candidate: ResumeParseCandidate | null): boolean {
  if (!candidate) return true
  if (candidate.confidence.level === 'low') return true

  return candidate.confidence.issues.some(issue =>
    issue === 'summary contains downstream section content' ||
    issue === 'experience entries missing title or company' ||
    issue === 'missing experience section' ||
    issue === 'very few sections populated'
  )
}

export function chooseBetterParseCandidate(
  current: ResumeParseCandidate | null,
  next: ResumeParseCandidate | null,
): ResumeParseCandidate | null {
  if (!next) return current
  if (!current) return next

  if (next.confidence.score !== current.confidence.score) {
    return next.confidence.score > current.confidence.score ? next : current
  }

  return sourceWeight(next.source) > sourceWeight(current.source) ? next : current
}
