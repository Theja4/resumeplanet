import type { EducationItem, ExperienceItem, ProjectItem, ResumeData, SkillSection } from '@/types'

function dedupe(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }

  return result
}

export function splitSkillInput(value: string) {
  return value
    .split(/[,\n|]+/)
    .map(part => part.trim())
    .filter(Boolean)
}

export function flattenSkillSections(skillSections: SkillSection[] | undefined | null) {
  if (!skillSections?.length) return []
  return dedupe(skillSections.flatMap(section => section.skills ?? []))
}

export function normalizeSkillSections(
  skillSections: SkillSection[] | undefined | null,
  fallbackSkills: string[] = []
) {
  const normalized = (skillSections ?? [])
    .map(section => ({
      title: (section.title ?? '').trim(),
      skills: dedupe((section.skills ?? []).flatMap(splitSkillInput)),
    }))
    .filter(section => section.title || section.skills.length > 0)

  if (normalized.length > 0) return normalized
  if (fallbackSkills.length === 0) return []

  return [
    {
      title: 'Core Skills',
      skills: dedupe(fallbackSkills.flatMap(splitSkillInput)),
    },
  ]
}

export function getResumeSkills(data: Pick<ResumeData, 'skills' | 'skillSections'>) {
  const fromSections = flattenSkillSections(data.skillSections)
  return fromSections.length > 0 ? fromSections : dedupe(data.skills ?? [])
}

export function getProjectBullets(project: Pick<ProjectItem, 'bullets' | 'description'>) {
  const bullets = dedupe(project.bullets ?? [])
  if (bullets.length > 0) return bullets
  return project.description.trim() ? [project.description.trim()] : []
}

export function getProjectDescription(project: Pick<ProjectItem, 'bullets' | 'description'>) {
  if (project.description?.trim()) return project.description.trim()
  return getProjectBullets(project).join(' ')
}

export function getEducationDateLabel(education: Pick<EducationItem, 'startDate' | 'endDate' | 'graduationDate'>) {
  const startDate = education.startDate?.trim() ?? ''
  const endDate = education.endDate?.trim() ?? ''
  const graduationDate = education.graduationDate?.trim() ?? ''

  if (startDate && endDate) return `${startDate} - ${endDate}`
  if (startDate && graduationDate) return `${startDate} - ${graduationDate}`
  if (startDate) return startDate
  if (endDate) return endDate
  return graduationDate
}

const LOCATION_LIKE_RE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/
const ROLE_FRAGMENT_RE = /(analyst|engineer|developer|manager|consultant|intern|designer|specialist|associate|lead|architect|administrator|product|business|full stack)/i

function normalizeExperienceLikeItem<T extends ExperienceItem>(item: T): T {
  const title = item.title?.trim() ?? ''
  const company = item.company?.trim().replace(/[|,]+$/g, '').trim() ?? ''
  let location = item.location?.trim().replace(/^[|,]+/g, '').replace(/[|,]+$/g, '').trim() ?? ''
  let nextTitle = title

  const locationLooksLikeRoleFragment =
    Boolean(location) &&
    ROLE_FRAGMENT_RE.test(location) &&
    (
      !LOCATION_LIKE_RE.test(location) ||
      nextTitle.startsWith('&') ||
      /analyst|product|business|engineer|developer|manager|consultant|intern|designer|specialist|associate|lead|architect|administrator|full stack/i.test(location)
    )

  if (locationLooksLikeRoleFragment) {
    nextTitle = nextTitle
      ? nextTitle.startsWith('&')
        ? `${location} ${nextTitle}`
        : `${nextTitle} ${location}`
      : location
    nextTitle = nextTitle.replace(/\s+/g, ' ').trim()
    location = ''
  }

  if (nextTitle.startsWith('& ') && ROLE_FRAGMENT_RE.test(company)) {
    nextTitle = `${company} ${nextTitle}`.replace(/\s+/g, ' ').trim()
  }

  return {
    ...item,
    title: nextTitle,
    company,
    location,
    bullets: (item.bullets ?? []).map(bullet => bullet.trim()).filter(Boolean),
  }
}

export function syncResumeData(data: Partial<ResumeData>): ResumeData {
  const skillSections = normalizeSkillSections(data.skillSections, data.skills ?? [])
  const skills = getResumeSkills({ skills: data.skills ?? [], skillSections })
  const experience = (data.experience ?? []).map(item => normalizeExperienceLikeItem(item))
  const volunteer = (data.volunteer ?? []).map(item => normalizeExperienceLikeItem(item))
  const currentRole = (data.currentRole ?? '').trim()
  const normalizedCurrentRole =
    currentRole.startsWith('&') && experience[0]?.title
      ? experience[0].title
      : currentRole

  return {
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    location: data.location ?? '',
    linkedin: data.linkedin ?? '',
    website: data.website ?? '',
    summary: data.summary ?? '',
    currentRole: normalizedCurrentRole,
    experience,
    education: (data.education ?? []).map(item => ({
      ...item,
      startDate: item.startDate?.trim() ?? '',
      endDate: item.endDate?.trim() ?? '',
      graduationDate: item.graduationDate?.trim() || item.endDate?.trim() || '',
    })),
    skills,
    skillSections,
    certifications: data.certifications ?? [],
    projects: (data.projects ?? []).map(item => {
      const bullets = getProjectBullets(item)
      return {
        ...item,
        bullets,
        description: getProjectDescription({ description: item.description, bullets }),
      }
    }),
    languages: data.languages ?? [],
    volunteer,
    interests: data.interests ?? [],
    awards: data.awards ?? [],
    publications: data.publications ?? [],
    references: data.references ?? [],
    customSections: (data.customSections ?? []).map(section =>
      section.type === 'complex'
        ? { ...section, items: (section.items ?? []).map(item => normalizeExperienceLikeItem(item)) }
        : section,
    ),
  }
}

export function resumeDataToPlainText(data: ResumeData | null | undefined): string {
  if (!data) return ''

  const safe = syncResumeData(data)
  const parts: string[] = [
    safe.name,
    safe.currentRole,
    safe.summary,
    safe.email,
    safe.phone,
    safe.location,
    safe.linkedin,
    safe.website,
  ]

  for (const item of safe.experience) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of safe.education) {
    parts.push(item.institution, item.degree, item.field, item.startDate ?? '', item.endDate ?? '', item.graduationDate, item.gpa)
  }

  for (const section of safe.skillSections ?? []) {
    parts.push(section.title, ...section.skills)
  }
  parts.push(...safe.skills)

  for (const item of safe.projects) {
    parts.push(item.name, item.description, ...(item.bullets ?? []), ...(item.technologies ?? []))
  }

  for (const item of safe.certifications) parts.push(item.name, item.issuer, item.date)
  for (const item of safe.volunteer) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }
  for (const item of safe.awards) parts.push(item.title, item.issuer, item.date)
  for (const item of safe.publications) parts.push(item.title, item.publisher, item.date)
  parts.push(...safe.languages, ...safe.interests, ...safe.references)

  for (const section of safe.customSections ?? []) {
    parts.push(section.title)
    if (section.type === 'text') parts.push(section.text ?? '')
    if (section.type === 'tags') parts.push(...(section.tags ?? []))
    if (section.type === 'complex') {
      for (const item of section.items ?? []) {
        parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
        parts.push(...(item.bullets ?? []))
      }
    }
  }

  return parts.map(part => part?.trim()).filter(Boolean).join('\n')
}
