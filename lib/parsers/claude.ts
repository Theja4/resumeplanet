import type { ResumeData } from '@/types'
import type { ResumeParser } from './types'
import { callClaudeJSON } from '@/lib/claude'
import { extractPDFText } from '@/lib/pdfExtractor'
import { extractDocxText } from '@/lib/docxTextExtractor'
import { syncResumeData } from '@/lib/resume-data'
import { normalizeText, chunkText, postProcessResume } from './utils'

const DEEPSEEK_RESUME_PARSER_MODEL = 'deepseek/deepseek-v4-flash'
type ResumeArrayField =
  | 'experience'
  | 'education'
  | 'skills'
  | 'skillSections'
  | 'certifications'
  | 'projects'
  | 'customSections'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'awards'
  | 'publications'
  | 'references'

type ResumeScalarField =
  | 'name'
  | 'email'
  | 'phone'
  | 'location'
  | 'linkedin'
  | 'website'
  | 'summary'
  | 'currentRole'

// Dedup helpers for chunk-overlap merging
const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06',
  jul: '07', july: '07', aug: '08', august: '08', sep: '09', sept: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
}

/** Normalize a date string for dedup comparison (handles "01/2021", "January 2021", "2021") */
function normDate(v: unknown): string {
  if (typeof v !== 'string') return ''
  const t = v.trim().toLowerCase()
  if (!t) return ''
  // Already MM/YYYY
  if (/^\d{1,2}\/\d{4}$/.test(t)) return t.replace(/^(\d)\//, '0$1/')
  // "Month YYYY" or "Mon YYYY"
  const monthYear = t.match(/^([a-z]+)\s+(\d{4})$/)
  if (monthYear && MONTH_MAP[monthYear[1]]) return `${MONTH_MAP[monthYear[1]]}/${monthYear[2]}`
  // Year only
  if (/^\d{4}$/.test(t)) return t
  return t
}

function isSameExperience(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return (
    norm(a.company) === norm(b.company) &&
    norm(a.title) === norm(b.title) &&
    normDate(a.startDate) === normDate(b.startDate)
  )
}

function isSameEducation(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return (
    norm(a.institution) === norm(b.institution) &&
    norm(a.degree) === norm(b.degree)
  )
}

function isSameProject(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return norm(a.name) === norm(b.name)
}

function isSameCertification(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return norm(a.name) === norm(b.name) && norm(a.issuer) === norm(b.issuer)
}

function isSameAward(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return norm(a.title) === norm(b.title)
}

function isSamePublication(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return norm(a.title) === norm(b.title)
}

function isSameCustomSection(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return norm(a.id) === norm(b.id) || norm(a.title) === norm(b.title)
}

function isSameSkillSection(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '')
  return norm(a.title) === norm(b.title)
}

function deduplicateArray<T extends Record<string, unknown>>(
  existing: T[],
  incoming: T[],
  isSame: (a: Record<string, unknown>, b: Record<string, unknown>) => boolean,
): T[] {
  const result = [...existing]
  for (const item of incoming) {
    if (!result.some(e => isSame(e, item))) {
      result.push(item)
    }
  }
  return result
}

// Helper to merge partial ResumeData objects with deduplication for chunk overlaps
function mergeResumeData(base: ResumeData, part: Partial<ResumeData>): ResumeData {
  if (!part || typeof part !== 'object') return base

  const merged = { ...base } as ResumeData
  const mergedArrays = merged as unknown as Record<ResumeArrayField, unknown[]>

  // Deduplicated structured arrays
  const dedupeMap: Partial<Record<ResumeArrayField, (a: Record<string, unknown>, b: Record<string, unknown>) => boolean>> = {
    experience: isSameExperience,
    education: isSameEducation,
    volunteer: isSameExperience,
    projects: isSameProject,
    certifications: isSameCertification,
    awards: isSameAward,
    publications: isSamePublication,
    customSections: isSameCustomSection,
    skillSections: isSameSkillSection,
  }

  // Merge arrays — deduplicate structured ones, concatenate + unique for simple ones
  const arrayFields: ResumeArrayField[] = [
    'experience', 'education', 'skills', 'skillSections', 'certifications', 'projects', 'customSections',
    'languages', 'volunteer', 'interests', 'awards', 'publications', 'references',
  ]

  for (const field of arrayFields) {
    const partArr = part[field]
    if (Array.isArray(partArr) && partArr.length > 0) {
      const currentArr = Array.isArray(mergedArrays[field]) ? mergedArrays[field] : []
      const matcher = dedupeMap[field]
      if (matcher) {
        mergedArrays[field] = deduplicateArray(
          currentArr as unknown as Record<string, unknown>[],
          partArr as unknown as Record<string, unknown>[],
          matcher,
        )
      } else if (['skills', 'languages', 'interests', 'references'].includes(field)) {
        // Simple string arrays — deduplicate by lowercase value
        const seen = new Set((currentArr as string[]).map(s => s.toLowerCase().trim()))
        const result = [...currentArr]
        for (const item of partArr as string[]) {
          const key = (item as string).toLowerCase().trim()
          if (!seen.has(key)) {
            seen.add(key)
            result.push(item)
          }
        }
        mergedArrays[field] = result
      } else {
        mergedArrays[field] = [...currentArr, ...partArr]
      }
    }
  }
  
  // Overwrite scalar fields if present and not empty
  const scalarFields: ResumeScalarField[] = [
    'name', 'email', 'phone', 'location', 'linkedin', 'website', 'summary', 'currentRole',
  ]
  
  // Contact fields: keep first non-empty value (chunk 1 has the header)
  // Content fields: keep longest value (later chunks may have the full text from overlap)
  const contentFields: ResumeScalarField[] = ['summary', 'currentRole']
  for (const field of scalarFields) {
    const val = part[field]
    if (val && typeof val === 'string' && val.trim().length > 0) {
      if (contentFields.includes(field)) {
        // For summary/currentRole, prefer the longest (most complete) value
        if (!merged[field] || merged[field].trim().length < val.trim().length) {
          merged[field] = val.trim()
        }
      } else {
        // For contact fields, keep the first non-empty value
        if (!merged[field] || merged[field].trim().length === 0) {
          merged[field] = val.trim()
        }
      }
    }
  }
  return merged
}

const SYSTEM_PROMPT = `You are a specialist resume parser. Extract structured data from resume text into a strict JSON format.

### SECTION MAPPING — Map ALL resume section headings to these standard names:
  "Work Experience", "Experience", "Employment", "Work History", "Professional Experience", "Career", "Positions" → experience (key: "experience", display label: "Work Experience")
  "Education", "Educational Background", "Academic Background", "Academics", "Academic Qualifications", "Degrees" → education (key: "education")
  "Skills", "Technical Skills", "Competencies", "Technologies", "Core Skills", "Key Skills", "Expertise" → skills (key: "skills")
  "Summary", "Professional Summary", "Profile", "Objective", "About Me", "Career Summary" → summary (key: "summary" as a single string)
  "Projects", "Personal Projects", "Academic Projects", "Side Projects", "Key Projects" → projects (key: "projects")
  "Certifications", "Certificates", "Licenses", "Credentials", "Professional Certifications" → certifications (key: "certifications")
  "Languages", "Language Proficiency", "Spoken Languages" → languages (key: "languages")
  "Volunteer", "Volunteer Experience", "Volunteer Work", "Community Service", "Community Involvement" → volunteer (key: "volunteer")
  "Interests", "Hobbies", "Activities", "Extracurricular", "Personal Interests" → interests (key: "interests")
  "Awards", "Honors", "Achievements", "Accomplishments", "Awards & Honors" → awards (key: "awards")
  "Publications", "Research", "Papers", "Research Publications" → publications (key: "publications")
  "References" → references (key: "references")

### CUSTOM SECTIONS — For ANY section NOT listed above:
If the resume contains a section that does NOT map to any of the 12 standard sections above, extract it as a "customSection" item:
  - Determine the "type":
    - "text" → the section is a single paragraph or prose block (like a Summary). Set "text": the full content as one string.
    - "tags" → the section is a list of short comma-separated items (like Skills). Set "tags": ["item1", "item2"].
    - "complex" → the section contains structured items with titles, organizations, dates, or bullet points (like Experience). Set "items": array of ExperienceItem-like objects.
  - Preserve the original section heading as "title".
  - Generate a unique "id" in the format "custom_kebab-case-title" (e.g., "custom_publications", "custom_affiliations").

### ITEM SEGMENTATION RULES (CRITICAL):
1. **EXPERIENCE / VOLUNTEER**: Each distinct role at a distinct organization is ONE item.
   - A new item starts when you see a NEW position title + company name or NEW date range.
   - If the same person held multiple roles at the same company, each role = a separate item.
   - DO NOT merge company names into the title field. "Acme Corp — Senior Engineer" → company:"Acme Corp", title:"Senior Engineer".
   - Bullets belong to the role they appear under. DO NOT carry bullets from one role into the next.
   - Use endDate:"Present" or endDate:"Current" for currently held positions.
   - **Freelance / Contract / Self-employed**: If the person lists freelance, consulting, or self-employed work:
     - Use company:"Freelance" or company:"Self-employed" (or the business name if given).
     - If they list multiple clients as sub-entries, each client = a separate experience item with company set to the client name and title reflecting the freelance role (e.g., title:"Freelance Software Engineer").
     - If they list a single freelance block with mixed bullets, keep it as one item.

2. **EDUCATION**: Each degree/program at each institution is ONE item.
   - Multiple degrees from the same university = separate items.

3. **PROJECTS**: Each named project is ONE item.
   - Extract the project name, a short description, bullet points, and technologies as a string array.

4. **CERTIFICATIONS / AWARDS / PUBLICATIONS**: Each distinct entry is ONE item.

5. **SKILLS / LANGUAGES / INTERESTS / REFERENCES**:
   - Always return a flat "skills" array containing every individual skill found.
   - Always return "skillSections" alongside the flat array:
     - If skills are grouped under labels like "Product:", "Tools:", "Collaboration:", "Programming Languages:", return each label as a separate "skillSections" item with the label as "title" and its skills in the "skills" array.
     - If the skills section is a single flat list with no labeled subsections, return exactly one "skillSections" item with "title": "" and all parsed skills in its "skills" array.
   - Every skill in "skillSections" must also appear in the flat "skills" array.

### DATE FORMAT:
- Normalize all dates to "MM/YYYY" format (e.g., "03/2020").
- Month-only dates like "Jan 2020" → "01/2020".
- Year-only dates like "2020" → keep as "2020" (do NOT invent a month).
- Season/quarter dates: "Summer 2023" → "06/2023", "Fall 2022" → "09/2022", "Spring 2021" → "03/2021", "Winter 2020" → "12/2020", "Q1 2023" → "01/2023", "Q2 2023" → "04/2023", "Q3 2023" → "07/2023", "Q4 2023" → "10/2023".
- Short ranges within a year like "Sept-Nov 2022": startDate → "09/2022", endDate → "11/2022".
- For ongoing/current positions or education use endDate or graduationDate: "Present".
- Leave dates as empty string "" if not found anywhere in the text. Do NOT guess.

### NEGATIVE CONSTRAINTS:
- NEVER fabricate data not present in the source text.
- Use empty string "" or empty array [] for missing fields, DO NOT omit keys.
- DO NOT mix items across sections.
- DO NOT include any explanatory text outside the JSON.

### STRICT JSON SCHEMA — Return ONLY a JSON object matching exactly:
{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "linkedin": string,
  "website": string,
  "summary": string,
  "currentRole": string,
  "experience": [
    {
      "company": string,
      "title": string,
      "location": string,
      "startDate": string,
      "endDate": string,
      "bullets": [string]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "field": string,
      "startDate": string,
      "endDate": string,
      "graduationDate": string,
      "gpa": string
    }
  ],
  "skills": [string],
  "skillSections": [
    {
      "title": string, // use "" when there is no subsection heading
      "tag": string,
      "skills": [string]
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "date": string
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string,
      "bullets": [string],
      "technologies": [string]
    }
  ],
  "languages": [string],
  "volunteer": [
    {
      "company": string,
      "title": string,
      "location": string,
      "startDate": string,
      "endDate": string,
      "bullets": [string]
    }
  ],
  "interests": [string],
  "awards": [
    {
      "title": string,
      "issuer": string,
      "date": string
    }
  ],
  "publications": [
    {
      "title": string,
      "publisher": string,
      "date": string
    }
  ],
  "references": [string],
  "customSections": [
    {
      "id": string,
      "title": string,
      "type": "text" | "tags" | "complex",
      "text": string (if type is "text"),
      "tags": [string] (if type is "tags"),
      "items": [{"company": string, "title": string, "location": string, "startDate": string, "endDate": string, "bullets": [string]}] (if type is "complex")
    }
  ]
}

### EXAMPLE
Input:
Jane Doe
jane@email.com | (555) 123-4567 | San Francisco, CA
linkedin.com/in/janedoe

PROFESSIONAL SUMMARY
Experienced product manager with 8+ years driving growth at SaaS companies.

WORK EXPERIENCE
Acme Inc — Senior Product Manager
Jan 2021 – Present | Remote
• Led cross-functional team of 12 to launch checkout redesign, increasing conversion by 18%
• Defined quarterly OKRs and roadmap for payments platform serving 2M+ users

StartupXYZ — Product Manager
Mar 2018 – Dec 2020 | San Francisco, CA
• Shipped MVP in 4 months, acquiring 10K users in first quarter

SKILLS
Product Strategy, SQL, Figma, Jira, A/B Testing

EDUCATION
Stanford University — MBA, Business Administration, 2018

Output:
{"name":"Jane Doe","email":"jane@email.com","phone":"(555) 123-4567","location":"San Francisco, CA","linkedin":"linkedin.com/in/janedoe","website":"","summary":"Experienced product manager with 8+ years driving growth at SaaS companies.","currentRole":"Senior Product Manager","experience":[{"company":"Acme Inc","title":"Senior Product Manager","location":"Remote","startDate":"01/2021","endDate":"Present","bullets":["Led cross-functional team of 12 to launch checkout redesign, increasing conversion by 18%","Defined quarterly OKRs and roadmap for payments platform serving 2M+ users"]},{"company":"StartupXYZ","title":"Product Manager","location":"San Francisco, CA","startDate":"03/2018","endDate":"12/2020","bullets":["Shipped MVP in 4 months, acquiring 10K users in first quarter"]}],"education":[{"institution":"Stanford University","degree":"MBA","field":"Business Administration","startDate":"","endDate":"","graduationDate":"2018","gpa":""}],"skills":["Product Strategy","SQL","Figma","Jira","A/B Testing"],"skillSections":[{"title":"","tag":"","skills":["Product Strategy","SQL","Figma","Jira","A/B Testing"]}],"certifications":[],"projects":[],"languages":[],"volunteer":[],"interests":[],"awards":[],"publications":[],"references":[],"customSections":[]}`;

const claudeParser: ResumeParser = {
  async parse(buffer: Buffer, fileType: string): Promise<ResumeData> {
    let rawText = ''
    try {
      if (fileType === 'application/pdf') {
        rawText = await extractPDFText(buffer)
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        rawText = await extractDocxText(buffer)
      } else {
        rawText = buffer.toString('utf-8')
      }
    } catch (e) {
      console.error('Text extraction failed:', e)
      throw new Error('TEXT_EXTRACTION_FAILED')
    }

    if (!rawText.trim()) throw new Error('EMPTY_DOCUMENT')

    // Detect scanned/image-only PDFs: very little extractable text relative to file size
    if (fileType === 'application/pdf' && rawText.trim().length < 100) {
      console.warn(`[AI Parser] Likely scanned PDF: only ${rawText.trim().length} chars extracted`)
      throw new Error('SCANNED_PDF_DETECTED')
    }

    console.log(`[AI Parser] Raw text extracted (${rawText.length} chars)`)

    // 1️⃣ Normalize whitespace and bullet groups
    const normalized = normalizeText(rawText)

    // 2️⃣ Chunk text with overlap to preserve context
    const maxChunk = Number(process.env.OPENROUTER_MAX_TOKENS) || 12000
    const chunks = chunkText(normalized, maxChunk, 1000)
    
    console.log(`[AI Parser] Split into ${chunks.length} chunks (with overlap)`)

    let accumulated: ResumeData = {
      name: '', email: '', phone: '', location: '', linkedin: '', website: '',
      summary: '', currentRole: '', experience: [], education: [], skills: [], skillSections: [], certifications: [],
      projects: [], languages: [], volunteer: [], interests: [], awards: [],
      publications: [], references: [], customSections: [],
    }

    const chunkPromises = chunks.map((chunk, i) =>
      callClaudeJSON<Partial<ResumeData>>({
        model: DEEPSEEK_RESUME_PARSER_MODEL,
        system: SYSTEM_PROMPT,
        prompt: `Extract resume data from this chunk (${i+1}/${chunks.length}):\n\n${chunk}`,
        timeoutMs: 180000,
        temperature: 0,
        jsonMode: true,
      }).then((partial) => {
        console.log(`[AI Parser] Chunk ${i+1} merged successfully.`)
        return { partial: partial ? syncResumeData(partial as ResumeData) : partial, error: null as null }
      }).catch((e) => {
        console.error(`[AI Parser] Chunk ${i+1} failed:`, e)
        return { partial: null, error: e }
      })
    )

    const results = await Promise.all(chunkPromises)
    let succeededCount = 0
    for (const r of results) {
      if (r.partial) {
        accumulated = mergeResumeData(accumulated, r.partial)
        succeededCount++
      }
    }

    if (succeededCount === 0) {
      console.error('[AI Parser] No chunks succeeded. Falling back.')
      throw new Error('LLM_PARSING_TOTALLY_FAILED')
    }

    // 3️⃣ Post-processing
    const finalData = postProcessResume(accumulated) as unknown as ResumeData
    
    console.log(`[AI Parser] Final extraction: Name="${finalData.name}", ExpCount=${finalData.experience.length}, SkillCount=${finalData.skills.length}`)

    // Sanity check: If we have no name AND no experience AND no skills, it's a failure.
    // Also, if the result is significantly 'emptier' than expected for a resume, fallback.
    const hasBasicInfo = finalData.name || finalData.email || finalData.phone
    const hasContent = finalData.experience.length > 0 || finalData.skills.length > 0 || finalData.projects.length > 0
    
    if (!hasBasicInfo && !hasContent) {
      console.warn('[AI Parser] Result looks too empty. Falling back to legacy parser.')
      throw new Error('LLM_PARSING_RETURNED_EMPTY_DATA')
    }

    return finalData
  },
}

export default claudeParser
