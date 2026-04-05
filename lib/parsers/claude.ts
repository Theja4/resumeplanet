import type { ResumeData } from '@/types'
import type { ResumeParser } from './types'
import { callClaudeJSON } from '@/lib/claude'
import { extractPDFText } from '@/lib/pdfExtractor'
import { normalizeText, chunkText, postProcessResume } from './utils'

const DEEPSEEK_RESUME_PARSER_MODEL = 'deepseek/deepseek-v3.2'
type ResumeArrayField =
  | 'experience'
  | 'education'
  | 'skills'
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

// Helper to merge partial ResumeData objects (simple shallow merge for arrays)
function mergeResumeData(base: ResumeData, part: Partial<ResumeData>): ResumeData {
  if (!part || typeof part !== 'object') return base
  
  const merged = { ...base } as ResumeData
  
  // Merge arrays by concatenation
  const arrayFields: ResumeArrayField[] = [
    'experience', 'education', 'skills', 'certifications', 'projects', 'customSections',
    'languages', 'volunteer', 'interests', 'awards', 'publications', 'references',
  ]
  
  for (const field of arrayFields) {
    const partArr = part[field]
    if (Array.isArray(partArr) && partArr.length > 0) {
      const currentArr = Array.isArray(merged[field]) ? merged[field] : []
      merged[field] = [...currentArr, ...partArr] as ResumeData[typeof field]
    }
  }
  
  // Overwrite scalar fields if present and not empty
  const scalarFields: ResumeScalarField[] = [
    'name', 'email', 'phone', 'location', 'linkedin', 'website', 'summary', 'currentRole',
  ]
  
  for (const field of scalarFields) {
    const val = part[field]
    if (val && typeof val === 'string' && val.trim().length > 0) {
      // For name/email etc, only overwrite if base is empty or the new one looks better
      if (!merged[field] || merged[field].length < val.length) {
        merged[field] = val.trim()
      }
    }
  }
  return merged
}

const SYSTEM_PROMPT = `You are a specialist resume parser. Extract structured data from resume text into a strict JSON format.

### SECTION MAPPING — Map ALL resume section headings to these standard names:
  "Work Experience", "Experience", "Employment", "Work History", "Professional Experience", "Career", "Positions" → experience (key: "experience")
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

2. **EDUCATION**: Each degree/program at each institution is ONE item.
   - Multiple degrees from the same university = separate items.

3. **PROJECTS**: Each named project is ONE item.
   - Extract the project name, description, and technologies as a string array.

4. **CERTIFICATIONS / AWARDS / PUBLICATIONS**: Each distinct entry is ONE item.

5. **SKILLS / LANGUAGES / INTERESTS / REFERENCES**: Each individual item is a string in the array.

### DATE FORMAT:
- Normalize all dates to "MM/YYYY" format (e.g., "03/2020").
- Month-only dates like "Jan 2020" → "01/2020".
- Year-only dates like "2020" → "01/2020".
- For ongoing/current positions use endDate or graduationDate: "Present".
- Leave dates as empty string if not found.

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
      "graduationDate": string,
      "gpa": string
    }
  ],
  "skills": [string],
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
}`;

const claudeParser: ResumeParser = {
  async parse(buffer: Buffer, fileType: string): Promise<ResumeData> {
    let rawText = ''
    try {
      if (fileType === 'application/pdf') {
        rawText = await extractPDFText(buffer)
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        rawText = result.value
      } else {
        rawText = buffer.toString('utf-8')
      }
    } catch (e) {
      console.error('Text extraction failed:', e)
      throw new Error('TEXT_EXTRACTION_FAILED')
    }

    if (!rawText.trim()) throw new Error('EMPTY_DOCUMENT')

    console.log(`[AI Parser] Raw text extracted (${rawText.length} chars)`)

    // 1️⃣ Normalize whitespace and bullet groups
    const normalized = normalizeText(rawText)

    // 2️⃣ Chunk text with overlap to preserve context
    const maxChunk = Number(process.env.OPENROUTER_MAX_TOKENS) || 12000
    const chunks = chunkText(normalized, maxChunk, 1000)
    
    console.log(`[AI Parser] Split into ${chunks.length} chunks (with overlap)`)

    let accumulated: ResumeData = {
      name: '', email: '', phone: '', location: '', linkedin: '', website: '',
      summary: '', currentRole: '', experience: [], education: [], skills: [], certifications: [],
      projects: [], languages: [], volunteer: [], interests: [], awards: [],
      publications: [], references: [], customSections: [],
    }

    const chunkPromises = chunks.map((chunk, i) =>
      callClaudeJSON<Partial<ResumeData>>({
        model: DEEPSEEK_RESUME_PARSER_MODEL,
        system: SYSTEM_PROMPT,
        prompt: `Extract resume data from this chunk (${i+1}/${chunks.length}):\n\n${chunk}`,
        timeoutMs: 180000,
      }).then((partial) => {
        console.log(`[AI Parser] Chunk ${i+1} merged successfully.`)
        return { partial, error: null as null }
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
    const finalData = postProcessResume(accumulated) as ResumeData
    
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
