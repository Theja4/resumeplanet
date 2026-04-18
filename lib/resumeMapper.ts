import type { Resume, ResumeWorkExperience, ResumeEducation, ResumeProject } from './open-resume-parser/types'
import type { ResumeData, SkillSection } from '@/types'
import { splitSkillInput, syncResumeData } from '@/lib/resume-data'

/**
 * Maps open-resume's Resume type → our ResumeData type.
 * open-resume extracts: profile, educations, workExperiences, projects, skills, custom.
 * Our ResumeData has many more sections (languages, volunteer, interests, awards, etc.)
 * which open-resume does not extract — they are left as empty arrays.
 */
export function mapToResumeData(resume: Resume): ResumeData {
  const mappedSkillSections = extractSkillSections(resume.skills)
  const mappedSkills =
    mappedSkillSections.length > 0
      ? mappedSkillSections.flatMap(section => section.skills)
      : extractSkills(resume.skills)

  return syncResumeData({
    // Contact — from profile
    name: resume.profile.name || '',
    email: resume.profile.email || '',
    phone: resume.profile.phone || '',
    location: resume.profile.location || '',
    linkedin: extractLinkedinUrl(resume.profile.url),
    website: extractWebsiteUrl(resume.profile.url),
    summary: resume.profile.summary || '',
    currentRole: resume.workExperiences[0]?.jobTitle || '',

    // Experience
    experience: resume.workExperiences.map(mapWorkExperience),

    // Education — open-resume uses "school" + "degree" + "date"
    education: resume.educations.map(mapEducation),

    // Skills — flatten featuredSkills[].skill + descriptions[]
    skills: mappedSkills,
    skillSections: mappedSkillSections,

    // Projects
    projects: resume.projects.map(mapProject),

    // These are not extracted by open-resume — leave empty
    languages: [],
    volunteer: [],
    interests: [],
    awards: [],
    publications: [],
    references: [],
    certifications: [],
    customSections: [],
  })
}

function mapWorkExperience(exp: ResumeWorkExperience): ResumeData['experience'][0] {
  const { startDate, endDate } = parseDateRange(exp.date)
  return {
    company: exp.company || '',
    title: exp.jobTitle || '',
    location: '',
    startDate,
    endDate,
    bullets: exp.descriptions || [],
  }
}

function mapEducation(edu: ResumeEducation): ResumeData['education'][0] {
  // open-resume's "school" maps to our "institution"
  // open-resume's "degree" maps to our "degree" (may contain degree + field combined)
  // open-resume's "date" maps to "graduationDate"
  const { degree, field } = splitDegreeField(edu.degree)
  return {
    institution: edu.school || '',
    degree,
    field,
    startDate: '',
    endDate: edu.date || '',
    graduationDate: edu.date || '',
    gpa: normalizeEducationGpa(edu.gpa || edu.degree || ''),
  }
}

function mapProject(proj: ResumeProject): ResumeData['projects'][0] {
  return {
    name: proj.project || '',
    description: (proj.descriptions || []).join(' '),
    bullets: proj.descriptions || [],
    technologies: [],
  }
}

function extractSkills(resumeSkills: Resume['skills']): string[] {
  const skills: string[] = []
  // Featured skills with ratings
  for (const fs of resumeSkills.featuredSkills || []) {
    if (fs.skill?.trim()) skills.push(fs.skill.trim())
  }
  // Skill descriptions (comma-separated or individual items)
  for (const desc of resumeSkills.descriptions || []) {
    const trimmed = desc.trim()
    if (!trimmed) continue
    // If it contains commas, split
    if (trimmed.includes(',')) {
      for (const part of trimmed.split(',')) {
        const p = part.trim()
        if (p) skills.push(p)
      }
    } else {
      skills.push(trimmed)
    }
  }
  // Deduplicate preserving order
  return [...new Set(skills)]
}

function extractSkillSections(resumeSkills: Resume['skills']): SkillSection[] {
  const descriptionLines = (resumeSkills.descriptions || [])
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const sections: SkillSection[] = []
  let index = 0

  while (index < descriptionLines.length) {
    const line = descriptionLines[index]!
    const nextLine = descriptionLines[index + 1] ?? ''

    const inlineMatch = line.match(/^([A-Za-z][A-Za-z &/+()-]{1,40}?):\s+(.+)$/)
    if (inlineMatch) {
      const skills = splitSkillInput(inlineMatch[2]).map(skill => skill.trim()).filter(Boolean)
      if (skills.length > 0) {
        sections.push({
          title: inlineMatch[1].trim(),
          tag: '',
          skills,
        })
      }
      index += 1
      continue
    }

    const mergedLabel =
      isLikelySkillLabelFragment(line) && isLikelySkillLabelFragment(nextLine)
        ? `${line.replace(/:$/, '').trim()} ${nextLine.replace(/:$/, '').trim()}`.trim()
        : ''

    if (mergedLabel && descriptionLines[index + 2]) {
      const skills = splitSkillInput(descriptionLines[index + 2]!)
        .map(skill => skill.trim())
        .filter(Boolean)

      if (skills.length > 0) {
        sections.push({
          title: mergedLabel,
          tag: '',
          skills,
        })
        index += 3
        continue
      }
    }

    if (isLikelySkillLabelFragment(line) && nextLine) {
      const skills = splitSkillInput(nextLine).map(skill => skill.trim()).filter(Boolean)
      if (skills.length > 0) {
        sections.push({
          title: line.replace(/:$/, '').trim(),
          tag: '',
          skills,
        })
        index += 2
        continue
      }
    }

    index += 1
  }

  return dedupeSkillSections(sections)
}

function isLikelySkillLabelFragment(value: string) {
  const compact = value.trim()
  if (!compact) return false
  if (compact.includes(',')) return false
  if (compact.length > 40) return false
  if (/\d/.test(compact)) return false

  const normalized = compact.replace(/:$/, '').trim()
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 0 || words.length > 4) return false

  return /^[A-Za-z][A-Za-z &/+()-]*:?$/.test(compact)
}

function dedupeSkillSections(sections: SkillSection[]) {
  const seen = new Set<string>()

  return sections
    .map(section => ({
      title: section.title.trim(),
      tag: section.tag?.trim() ?? '',
      skills: section.skills
        .map(skill => skill.trim())
        .filter(Boolean)
        .filter((skill) => {
          const key = `${section.title.toLowerCase()}::${skill.toLowerCase()}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        }),
    }))
    .filter(section => section.title || section.tag || section.skills.length > 0)
}

function extractLinkedinUrl(url: string): string {
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com/') || lower.includes('linkedin.com/in/')) {
    return url
  }
  return ''
}

function extractWebsiteUrl(url: string): string {
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com/')) return ''
  return url
}

/**
 * Parse a date range string like "09/2019 – 12/2021" or "Jan 2020 – Present"
 * Returns { startDate, endDate } in MM/YYYY format.
 */
function parseDateRange(dateStr: string): { startDate: string; endDate: string } {
  if (!dateStr?.trim()) return { startDate: '', endDate: '' }

  // Try separator patterns: –, --, -, to
  const parts = dateStr.split(/\s*[–\-]+\s*|\bto\b/i).map(s => s.trim()).filter(Boolean)

  if (parts.length === 2) {
    return {
      startDate: normalizeDate(parts[0]),
      endDate: normalizeDate(parts[1]),
    }
  }

  // Single date (e.g., one role with one date)
  return {
    startDate: '',
    endDate: normalizeDate(dateStr),
  }
}

/**
 * Normalize a date string to MM/YYYY format.
 * Handles: "MM/YYYY", "YYYY", "Mon YYYY", "Month YYYY", "Present"
 */
function normalizeDate(dateStr: string): string {
  const trimmed = dateStr.trim()
  if (!trimmed) return ''
  if (/^(present|current)$/i.test(trimmed)) return 'Present'

  // Already MM/YYYY
  const matchYmd = trimmed.match(/^(\d{2})\/(\d{4})$/)
  if (matchYmd) return trimmed

  // YYYY only
  const matchYear = trimmed.match(/^(\d{4})$/)
  if (matchYear) return `01/${matchYear[1]}`

  // Mon YYYY (e.g., "Jan 2020", "February 2019")
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  }
  const matchMon = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (matchMon) {
    const month = months[matchMon[1].toLowerCase()]
    if (month) return `${month}/${matchMon[2]}`
  }

  // MM/YYYY/YYYY range (e.g., "09/2019 – 12/2021" already split by parseDateRange)
  // Fallback: return as-is
  return trimmed
}

/**
 * Split a degree string like "BS in Computer Science" into { degree: "BS", field: "Computer Science" }
 * or "Master of Science" into { degree: "Master of Science", field: "" }
 */
function splitDegreeField(degreeStr: string): { degree: string; field: string } {
  if (!degreeStr?.trim()) return { degree: '', field: '' }

  const cleaned = degreeStr
    .replace(/\s*(?:[|,;·•]\s*)?\b(?:CGPA|GPA)\b\s*[:\-]?\s*[0-9]+(?:\.\d+)?(?:\s*\/\s*[0-9]+(?:\.\d+)?)?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const inMatch = cleaned.match(/^(.*?)\bin\b\s+(.+)$/i)
  if (inMatch) return { degree: inMatch[1].trim(), field: inMatch[2].trim() }

  return { degree: cleaned, field: '' }
}

function normalizeEducationGpa(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const match =
    trimmed.match(/\b(?:CGPA|GPA)\b\s*[:\-]?\s*([0-9]+(?:\.\d+)?(?:\s*\/\s*[0-9]+(?:\.\d+)?)?)/i)
    ?? trimmed.match(/^([0-9]+(?:\.\d+)?(?:\s*\/\s*[0-9]+(?:\.\d+)?)?)$/)

  return match?.[1] ? match[1].replace(/\s*\/\s*/g, ' / ').trim() : ''
}
