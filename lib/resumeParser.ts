import type { ResumeData, ExperienceItem } from '@/types'
import { pagesToLines, type ExtractedPage } from './pdfExtractor'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionName =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'awards'
  | 'publications'
  | 'references'

type StructuredLine = {
  text: string
  isBold: boolean
  fontSize: number
  x: number
  y: number
  pageNumber: number
}

// ─── Text normalisation ───────────────────────────────────────────────────────

function normalise(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .trim()
}

// ─── Section detection ────────────────────────────────────────────────────────

const SECTION_PATTERNS: Array<{ pattern: RegExp; name: SectionName }> = [
  { pattern: /^(work\s+)?experience|employment(\s+history)?|work\s+history$/i, name: 'experience' },
  { pattern: /^education(al\s+background)?|academic(\s+background)?$/i, name: 'education' },
  { pattern: /^(technical\s+)?skills?(\s+&\s+expertise)?|competencies|technologies$/i, name: 'skills' },
  { pattern: /^(professional\s+)?(summary|profile|objective|about(\s+me)?)$/i, name: 'summary' },
  { pattern: /^certifications?|certificates?|licenses?$/i, name: 'certifications' },
  { pattern: /^(personal\s+|academic\s+|side\s+)?projects?$/i, name: 'projects' },
  { pattern: /^languages?$/i, name: 'languages' },
  { pattern: /^volunteer(\s+work|\s+experience)?|community(\s+service)?$/i, name: 'volunteer' },
  { pattern: /^interests?|hobbies|activities|extracurricular$/i, name: 'interests' },
  { pattern: /^awards?(\s+and\s+honors?)?|honors?|achievements?|accomplishments?$/i, name: 'awards' },
  { pattern: /^publications?|research|papers?$/i, name: 'publications' },
  { pattern: /^references?$/i, name: 'references' },
]

function detectSection(line: string): SectionName | null {
  const stripped = line.replace(/[:#\-*•]+/g, '').trim()
  for (const { pattern, name } of SECTION_PATTERNS) {
    if (pattern.test(stripped)) return name
  }
  return null
}

// ─── Regex field extractors ───────────────────────────────────────────────────

const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[\w.]+/
const PHONE_RE = /(\+?\d[\d\s()\-.]{7,}\d)/
const LINKEDIN_RE = /linkedin\.com\/in\/([\w\-]+)/i
const WEBSITE_EXCLUDE = /gmail|outlook|yahoo|apple\.com|google\.com|microsoft|linkedin/i
const URL_RE = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi
const DATE_MONTH_RE = /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\s,]+\d{4}/i
const DATE_YEAR_RANGE_RE = /\d{4}\s*[-–—]\s*(\d{4}|Present|Current|Now)/i
const YEAR_RE = /\b(19|20)\d{2}\b/
const LOCATION_RE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/

function extractEmail(text: string): string {
  return EMAIL_RE.exec(text)?.[0] ?? ''
}

function extractPhone(text: string): string {
  const m = PHONE_RE.exec(text)
  return m ? m[1].trim() : ''
}

function extractLinkedIn(text: string): string {
  const m = LINKEDIN_RE.exec(text)
  return m ? `https://linkedin.com/in/${m[1]}` : ''
}

function extractWebsite(text: string): string {
  const matches = text.match(URL_RE) ?? []
  return matches.find(u => !WEBSITE_EXCLUDE.test(u) && !LINKEDIN_RE.test(u)) ?? ''
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function extractDateRange(text: string): { start: string; end: string } {
  const rangeMatch = DATE_YEAR_RANGE_RE.exec(text)
  if (rangeMatch) {
    const parts = rangeMatch[0].split(/[-–—]/).map(s => s.trim())
    return { start: parts[0] ?? '', end: parts[1] ?? '' }
  }
  const monthMatches = [...text.matchAll(new RegExp(DATE_MONTH_RE.source, 'gi'))]
  if (monthMatches.length >= 2) {
    return { start: monthMatches[0][0], end: monthMatches[1][0] }
  }
  if (monthMatches.length === 1) {
    return { start: monthMatches[0][0], end: '' }
  }
  const yearMatch = YEAR_RE.exec(text)
  return { start: yearMatch?.[0] ?? '', end: '' }
}

const isBulletLine = (l: string) => /^\s*[•\-*›▸▹]/.test(l) || /^\s{4,}/.test(l)

// ─── Experience parser (two-pass) ─────────────────────────────────────────────
// The old single-pass parser dropped title/company because they appear BEFORE
// the date line and current=null at that point. The two-pass approach finds
// each date line first, then looks backward for header info and forward for bullets.

function parseJobLines(lines: string[]): ExperienceItem[] {
  const jobs: ExperienceItem[] = []

  // Pass 1: find all date line indices
  const dateIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t && (DATE_MONTH_RE.test(t) || DATE_YEAR_RANGE_RE.test(t))) {
      dateIndices.push(i)
    }
  }

  if (dateIndices.length === 0) {
    // No dates: try to extract at least a single entry from non-bullet lines
    const nonBullets = lines.filter(l => l.trim() && !isBulletLine(l))
    const bullets = lines
      .filter(l => l.trim() && isBulletLine(l))
      .map(l => l.trim().replace(/^[•\-*›▸▹\s]+/, '').trim())
    if (nonBullets.length > 0 || bullets.length > 0) {
      jobs.push({
        title: nonBullets[0]?.trim() ?? '',
        company: nonBullets[1]?.trim() ?? '',
        location: '',
        startDate: '',
        endDate: '',
        bullets,
      })
    }
    return jobs
  }

  // Pass 2: for each date line, extract job block
  for (let di = 0; di < dateIndices.length; di++) {
    const dateIdx = dateIndices[di]
    const nextDateIdx = dateIndices[di + 1] ?? lines.length

    const dateLine = lines[dateIdx].trim()
    const dates = extractDateRange(dateLine)
    const locInDate = LOCATION_RE.exec(dateLine)?.[0] ?? ''
    // Strip date and location from date line to get any inline title fragment
    const inlineFrag = dateLine
      .replace(DATE_YEAR_RANGE_RE, '')
      .replace(DATE_MONTH_RE, '')
      .replace(locInDate, '')
      .replace(/[-–—|,]+/g, ' ')
      .trim()

    // Look backward from the date line to find title/company header lines.
    // Stop at: the previous date line, a bullet line, or the section start.
    const prevDateIdx = dateIndices[di - 1] ?? -1
    const headerLines: string[] = []
    let scanBack = dateIdx - 1
    while (scanBack > prevDateIdx) {
      const backLine = lines[scanBack]
      const backTrimmed = backLine?.trim() ?? ''
      if (!backTrimmed) { scanBack--; continue }
      if (isBulletLine(backLine)) break  // hit previous job's bullets
      headerLines.unshift(backTrimmed)
      scanBack--
    }

    // title: first header line, or inline fragment from the date line
    const title = headerLines[0] ?? inlineFrag

    // company: second header line (if it's not a location)
    let company = ''
    if (headerLines.length > 1) {
      company = headerLines[1]
    }

    // location: from the date line, or scan header lines
    let location = locInDate
    if (!location) {
      for (const h of headerLines) {
        const m = LOCATION_RE.exec(h)
        if (m) { location = m[0]; break }
      }
    }

    // Collect lines after the date up to the next job's header
    const bullets: string[] = []
    const afterDateNonBullets: string[] = []
    for (let i = dateIdx + 1; i < nextDateIdx; i++) {
      const raw = lines[i]
      const t = raw?.trim() ?? ''
      if (!t) continue
      if (isBulletLine(raw)) {
        bullets.push(t.replace(/^[•\-*›▸▹\s]+/, '').trim())
      } else {
        afterDateNonBullets.push(t)
      }
    }

    // If we got no company from header, a non-bullet line after the date (before bullets) may be the company
    if (!company && afterDateNonBullets.length > 0 && bullets.length === 0) {
      company = afterDateNonBullets[0]
    }

    if (title || bullets.length > 0) {
      jobs.push({ title, company, location, startDate: dates.start, endDate: dates.end, bullets })
    }
  }

  return jobs
}

// ─── Section parsers ──────────────────────────────────────────────────────────

function parseSummary(lines: string[], preamble: string[]): string {
  if (lines.length > 0) {
    return lines.map(l => l.trim()).filter(Boolean).join(' ').trim()
  }
  const para = preamble.map(l => l.trim()).filter(Boolean).join(' ')
  return para.split(/\s+/).filter(Boolean).length >= 15 ? para : ''
}

function parseSkills(lines: string[]): string[] {
  const raw = lines.join('\n')
  const parts = raw
    .split(/[,|•\-*\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 50)
  const seen = new Set<string>()
  const result: string[] = []
  for (const p of parts) {
    const key = p.toLowerCase()
    if (!seen.has(key)) { seen.add(key); result.push(p) }
  }
  return result
}

function parseExperience(lines: string[]): ResumeData['experience'] {
  return parseJobLines(lines)
}

function parseVolunteer(lines: string[]): ResumeData['volunteer'] {
  return parseJobLines(lines)
}

function parseEducation(lines: string[]): ResumeData['education'] {
  const entries: ResumeData['education'] = []
  let current: ResumeData['education'][0] | null = null
  const DEGREE_RE = /Bachelor|Master|PhD|Doctorate|MBA|B\.?S\.?|M\.?S\.?|B\.?E\.?|B\.?Tech|M\.?Tech|Associate/i
  const INSTITUTION_RE = /University|College|Institute|School|Academy/i

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (DEGREE_RE.test(t) || INSTITUTION_RE.test(t)) {
      if (current) entries.push(current)
      const yearMatch = YEAR_RE.exec(t)
      const gpaMatch = /(?:GPA|CGPA)[:\s]+(\d+\.?\d*)/i.exec(t)
      current = {
        institution: INSTITUTION_RE.test(t) ? t : '',
        degree: DEGREE_RE.test(t) ? t.replace(/,.*$/, '').trim() : '',
        field: '',
        graduationDate: yearMatch?.[0] ?? '',
        gpa: gpaMatch?.[1] ?? '',
      }
    } else if (current) {
      if (!current.institution && INSTITUTION_RE.test(t)) {
        current.institution = t
      } else if (!current.degree && DEGREE_RE.test(t)) {
        current.degree = t.replace(/,.*$/, '').trim()
      } else if (!current.graduationDate) {
        const y = YEAR_RE.exec(t)
        if (y) current.graduationDate = y[0]
      }
    }
  }

  if (current) entries.push(current)
  return entries
}

function parseCertifications(lines: string[]): ResumeData['certifications'] {
  return lines
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const yearMatch = YEAR_RE.exec(l)
      const issuerMatch = /(?:by|from|–|-)\s+(.+?)(?:\s*[,(]|$)/i.exec(l)
      return {
        name: l.replace(/\s*[-,·].*$/, '').trim(),
        issuer: issuerMatch?.[1]?.trim() ?? '',
        date: yearMatch?.[0] ?? '',
      }
    })
}

function parseProjects(lines: string[]): ResumeData['projects'] {
  const projects: ResumeData['projects'] = []
  let current: ResumeData['projects'][0] | null = null

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    const isBullet = /^[•\-*›]/.test(t)
    const techMatch = /(?:Technologies?|Tech\s+Stack|Stack|Tools?|Built\s+with)[:\s]+(.+)/i.exec(t)
    const techInParens = /\(([^)]+)\)\s*$/.exec(t)
    const hasDate = DATE_MONTH_RE.test(t) || DATE_YEAR_RANGE_RE.test(t)

    // A new project starts on a non-bullet, non-date line ≤ 100 chars with no tech keyword
    if (!isBullet && !techMatch && !hasDate && t.length <= 100) {
      if (current) projects.push(current)
      current = { name: t, description: '', technologies: [] }
    } else if (current && techMatch) {
      const techs = techMatch[1].split(/[,|]/).map(s => s.trim()).filter(Boolean)
      current.technologies.push(...techs)
    } else if (current && techInParens && !techMatch) {
      const techs = techInParens[1].split(/[,|]/).map(s => s.trim()).filter(Boolean)
      // Only treat as tech tags if they look like technology names (short words)
      if (techs.every(t => t.length <= 30)) {
        current.technologies.push(...techs)
      }
      const cleanLine = t.replace(techInParens[0], '').replace(/^[•\-*›\s]+/, '').trim()
      if (cleanLine) current.description += (current.description ? ' ' : '') + cleanLine
    } else if (current) {
      // Bullet or long description line
      const cleanLine = t.replace(/^[•\-*›\s]+/, '')
      current.description += (current.description ? ' ' : '') + cleanLine
    }
  }

  if (current) projects.push(current)
  return projects
}

function parseLanguages(lines: string[]): string[] {
  return lines
    .join('\n')
    .split(/[,\n|•\-*]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 30)
}

function parseInterests(lines: string[]): string[] {
  return lines
    .join('\n')
    .split(/[,\n|•\-*]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 60)
}

function parseAwards(lines: string[]): ResumeData['awards'] {
  return lines
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const yearMatch = YEAR_RE.exec(l)
      const issuerMatch = /(?:by|from|–|-|,)\s+(.+?)(?:\s*[,(]|$)/i.exec(l)
      return {
        title: l.replace(/\s*[-,·–].*$/, '').trim(),
        issuer: issuerMatch?.[1]?.trim() ?? '',
        date: yearMatch?.[0] ?? '',
      }
    })
}

function parsePublications(lines: string[]): ResumeData['publications'] {
  return lines
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const yearMatch = YEAR_RE.exec(l)
      const publisherMatch = /(?:published\s+in|in|–|-)\s+(.+?)(?:\s*[,(]|$)/i.exec(l)
      return {
        title: l.replace(/\s*[-,·–].*$/, '').trim(),
        publisher: publisherMatch?.[1]?.trim() ?? '',
        date: yearMatch?.[0] ?? '',
      }
    })
}

function parseReferences(lines: string[]): string[] {
  return lines
    .map(l => l.trim())
    .filter(s => s.length > 0 && s.length <= 120)
}

// ─── Spatial section splitter ─────────────────────────────────────────────────

function splitStructuredLines(
  lines: StructuredLine[],
  _medianFontSize: number,
  _largeFontThreshold: number
): Record<string, string[]> {
  const sections: Record<string, string[]> = { preamble: [] }
  let current = 'preamble'

  for (const line of lines) {
    const t = line.text.trim()
    if (!t) continue

    const knownSection = detectSection(t)
    if (knownSection) {
      current = knownSection
      sections[current] = sections[current] ?? []
    } else {
      sections[current] = sections[current] ?? []
      sections[current].push(t)
    }
  }

  return sections
}

// ─── Spatial name extraction ──────────────────────────────────────────────────

function extractNameFromLines(
  lines: StructuredLine[],
  email: string,
  phone: string,
  medianFontSize: number
): string {
  const firstFive = lines.slice(0, 5)

  for (const line of firstFive) {
    const t = line.text.trim()
    if (!t) continue
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || URL_RE.test(t)) continue
    if (t === email || t === phone) continue
    if (t.length < 2 || t.length > 50) continue

    const isLargeOrBold = line.isBold || line.fontSize > medianFontSize * 1.2 || line.y < 100
    const words = t.split(/\s+/)
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 5 &&
      words.every(w => /^[A-Za-z'-]+$/.test(w))

    if (looksLikeName && isLargeOrBold) return t
  }

  // Fallback: first line that looks like a name regardless of font
  for (const line of firstFive) {
    const t = line.text.trim()
    if (!t || EMAIL_RE.test(t) || PHONE_RE.test(t)) continue
    if (t.length < 2 || t.length > 50) continue
    const words = t.split(/\s+/)
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 5 &&
      words.every(w => /^[A-Za-z'-]+$/.test(w))
    if (looksLikeName) return t
  }

  return ''
}

// ─── Shared result builder ────────────────────────────────────────────────────

function buildResumeData(
  sections: Record<string, string[]>,
  name: string,
  email: string,
  phone: string,
  location: string,
  linkedin: string,
  website: string
): ResumeData {
  return {
    name,
    email,
    phone,
    location,
    linkedin,
    website,
    summary: parseSummary(sections['summary'] ?? [], sections['preamble'] ?? []),
    experience: parseExperience(sections['experience'] ?? []),
    education: parseEducation(sections['education'] ?? []),
    skills: parseSkills(sections['skills'] ?? []),
    certifications: parseCertifications(sections['certifications'] ?? []),
    projects: parseProjects(sections['projects'] ?? []),
    languages: parseLanguages(sections['languages'] ?? []),
    volunteer: parseVolunteer(sections['volunteer'] ?? []),
    interests: parseInterests(sections['interests'] ?? []),
    awards: parseAwards(sections['awards'] ?? []),
    publications: parsePublications(sections['publications'] ?? []),
    references: parseReferences(sections['references'] ?? []),
  }
}

// ─── Primary export: spatial parser ──────────────────────────────────────────

export async function parseResumeFromPages(pages: ExtractedPage[]): Promise<ResumeData> {
  const lines = pagesToLines(pages)

  if (lines.length === 0) return emptyResume()

  const fontSizes = lines.map(l => l.fontSize).filter(s => s > 0)
  const sorted = [...fontSizes].sort((a, b) => a - b)
  const medianFontSize = sorted[Math.floor(sorted.length / 2)] ?? 11
  const largeFontThreshold = medianFontSize * 1.3

  const fullText = lines.map(l => l.text).join('\n')
  const email = extractEmail(fullText)
  const phone = extractPhone(fullText)
  const linkedin = extractLinkedIn(fullText)
  const website = extractWebsite(fullText)
  const name = extractNameFromLines(lines, email, phone, medianFontSize)

  const location = (() => {
    for (const l of lines.slice(0, 10)) {
      const m = LOCATION_RE.exec(l.text)
      if (m) return m[0]
    }
    return ''
  })()

  const sections = splitStructuredLines(lines, medianFontSize, largeFontThreshold)
  const result = buildResumeData(sections, name, email, phone, location, linkedin, website)

  const populated = [result.name, result.email, result.experience.length > 0, result.education.length > 0, result.skills.length > 0].filter(Boolean).length
  if (populated < 2) console.warn('Low confidence parse:', populated, 'fields populated')

  return result
}

// ─── Fallback export: text parser (for DOCX) ─────────────────────────────────

export async function parseResumeText(rawText: string): Promise<ResumeData> {
  const text = normalise(rawText)
  const lines = text.split('\n')

  const sections: Record<string, string[]> = { preamble: [] }
  let current = 'preamble'
  for (const line of lines) {
    const section = detectSection(line.trim())
    if (section) {
      current = section
      sections[current] = sections[current] ?? []
    } else {
      sections[current] = sections[current] ?? []
      sections[current].push(line)
    }
  }

  const preamble = sections['preamble'] ?? []
  const email = extractEmail(text)
  const phone = extractPhone(text)
  const linkedin = extractLinkedIn(text)
  const website = extractWebsite(text)

  const name = (() => {
    for (const line of lines.slice(0, 8)) {
      const t = line.trim()
      if (!t || t === email || PHONE_RE.test(t) || URL_RE.test(t)) continue
      if (t.length < 2 || t.length > 50 || !t.includes(' ') || EMAIL_RE.test(t)) continue
      const words = t.split(/\s+/)
      if (words.length >= 2 && words.length <= 5 && words.every(w => /^[A-Za-z'-]+$/.test(w))) return t
    }
    return ''
  })()

  const location = (() => {
    for (const l of preamble) {
      const m = LOCATION_RE.exec(l)
      if (m) return m[0]
    }
    return ''
  })()

  return buildResumeData(sections, name, email, phone, location, linkedin, website)
}

function emptyResume(): ResumeData {
  return {
    name: '', email: '', phone: '', location: '', linkedin: '', website: '',
    summary: '', experience: [], education: [], skills: [],
    certifications: [], projects: [], languages: [],
    volunteer: [], interests: [], awards: [], publications: [], references: [],
  }
}

// ─── Template adapter ─────────────────────────────────────────────────────────

export function adaptResumeForTemplate(data: ResumeData, templateId: string): ResumeData {
  const adapted: ResumeData = JSON.parse(JSON.stringify(data))

  // Trim bullets to 120 chars max
  adapted.experience = adapted.experience.map(exp => ({
    ...exp,
    bullets: exp.bullets.map(b => (b.length > 120 ? b.slice(0, 117) + '...' : b)),
  }))
  adapted.volunteer = adapted.volunteer.map(v => ({
    ...v,
    bullets: v.bullets.map(b => (b.length > 120 ? b.slice(0, 117) + '...' : b)),
  }))

  // Trim summary to 3 sentences
  if (adapted.summary) {
    const sentences = adapted.summary.split(/(?<=[.!?])\s+/).filter(Boolean)
    adapted.summary = sentences.slice(0, 3).join(' ')
  }

  // Technical Pro: group skills by category
  if (templateId === 'technical-pro') {
    const categories: Record<string, string[]> = {
      Languages: ['Python','JavaScript','TypeScript','Java','C++','C#','Go','Rust','Ruby','PHP','Swift','Kotlin','R','Scala','Dart'],
      Frameworks: ['React','Next.js','Vue','Angular','Express','FastAPI','Django','Flask','Spring','Rails','Laravel','NestJS','Svelte'],
      Databases: ['PostgreSQL','MySQL','MongoDB','Redis','SQLite','DynamoDB','Supabase','Firebase'],
      'Cloud & DevOps': ['AWS','GCP','Azure','Docker','Kubernetes','Terraform','GitHub Actions','Vercel'],
      Tools: ['Git','Linux','Figma','Postman','Jira'],
    }
    const grouped: string[] = []
    const used = new Set<string>()

    for (const [cat, keywords] of Object.entries(categories)) {
      const matches = adapted.skills.filter(
        skill => keywords.some(k => skill.toLowerCase().includes(k.toLowerCase())) && !used.has(skill)
      )
      if (matches.length > 0) {
        matches.forEach(s => used.add(s))
        grouped.push(`${cat}: ${matches.join(', ')}`)
      }
    }

    const uncategorised = adapted.skills.filter(s => !used.has(s))
    if (uncategorised.length > 0) grouped.push(`Other: ${uncategorised.join(', ')}`)
    adapted.skills = grouped.length > 0 ? grouped : adapted.skills
  }

  return adapted
}
