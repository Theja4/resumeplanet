import type {
  AwardItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  PublicationItem,
  ResumeData,
} from '@/types'

/**
 * Maps a JobPosted "tailored resume" (its leaner `ResumeContent` shape, handed off via
 * the shared Supabase project) into Rezoomed's `ResumeData` so the builder can open it
 * pre-filled. Kept dependency-free — the JobPosted types are inlined so this file never
 * has to import across the two apps.
 */

interface JPLink {
  label?: string
  url?: string
}
interface JPExperience {
  company?: string
  title?: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  bullets?: string[]
}
interface JPEducation {
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  gpa?: string
}
interface JPProject {
  name?: string
  description?: string
  bullets?: string[]
  technologies?: string[]
  url?: string
}
interface JPCertification {
  name?: string
  issuer?: string
  date?: string
  url?: string
}
interface JPAward {
  title?: string
  issuer?: string
  date?: string
  url?: string
}
interface JPPublication {
  title?: string
  publisher?: string
  date?: string
  url?: string
}
interface JobPostedResume {
  name?: string
  headline?: string
  summary?: string
  email?: string
  phone?: string
  location?: string
  links?: JPLink[]
  experience?: JPExperience[]
  education?: JPEducation[]
  skills?: string[]
  projects?: JPProject[]
  certifications?: JPCertification[]
  languages?: string[]
  awards?: JPAward[]
  publications?: JPPublication[]
  interests?: string[]
  references?: string[]
}

function cleanStrings(values: string[] | undefined): string[] {
  return Array.isArray(values) ? values.filter((value) => typeof value === 'string' && value.trim().length > 0) : []
}

function findLinkedIn(links: JPLink[] | undefined): string {
  if (!Array.isArray(links)) return ''
  const hit = links.find((link) => `${link.label ?? ''} ${link.url ?? ''}`.toLowerCase().includes('linkedin'))
  return hit?.url ?? ''
}

function findWebsite(links: JPLink[] | undefined): string {
  if (!Array.isArray(links)) return ''
  const hit = links.find((link) => {
    if (!link.url) return false
    return !`${link.label ?? ''} ${link.url}`.toLowerCase().includes('linkedin')
  })
  return hit?.url ?? ''
}

export function mapJobPostedResume(input: unknown): ResumeData {
  const resume = (input && typeof input === 'object' ? input : {}) as JobPostedResume

  const experience: ExperienceItem[] = (resume.experience ?? []).map((item) => ({
    company: item.company ?? '',
    title: item.title ?? '',
    location: item.location ?? '',
    startDate: item.startDate ?? '',
    endDate: item.current ? 'Present' : item.endDate ?? '',
    bullets: cleanStrings(item.bullets),
  }))

  const education: EducationItem[] = (resume.education ?? []).map((item) => ({
    institution: item.school ?? '',
    degree: item.degree ?? '',
    field: item.field ?? '',
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
    gpa: item.gpa ?? '',
  }))

  const projects: ProjectItem[] = (resume.projects ?? []).map((item) => ({
    name: item.name ?? '',
    description: item.description ?? '',
    bullets: cleanStrings(item.bullets),
    technologies: cleanStrings(item.technologies),
    url: item.url ?? '',
  }))

  const certifications: CertificationItem[] = (resume.certifications ?? []).map((item) => ({
    name: item.name ?? '',
    issuer: item.issuer ?? '',
    date: item.date ?? '',
    url: item.url,
  }))

  const awards: AwardItem[] = (resume.awards ?? []).map((item) => ({
    title: item.title ?? '',
    issuer: item.issuer ?? '',
    date: item.date ?? '',
    url: item.url,
  }))

  const publications: PublicationItem[] = (resume.publications ?? []).map((item) => ({
    title: item.title ?? '',
    publisher: item.publisher ?? '',
    date: item.date ?? '',
    url: item.url,
  }))

  return {
    name: resume.name ?? '',
    email: resume.email ?? '',
    phone: resume.phone ?? '',
    location: resume.location ?? '',
    linkedin: findLinkedIn(resume.links),
    website: findWebsite(resume.links),
    summary: resume.summary ?? '',
    currentRole: resume.headline ?? '',
    experience,
    education,
    skills: cleanStrings(resume.skills),
    certifications,
    projects,
    languages: cleanStrings(resume.languages),
    volunteer: [],
    interests: cleanStrings(resume.interests),
    awards,
    publications,
    references: cleanStrings(resume.references),
  }
}
