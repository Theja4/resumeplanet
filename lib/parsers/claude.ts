import type { ResumeData } from '@/types'
import type { ResumeParser } from './types'
import { callClaudeJSON, CLAUDE_STANDARD } from '@/lib/claude'
import { extractPDFText } from '@/lib/pdfExtractor'
import { normalizeText, chunkText, postProcessResume } from './utils'

// Helper to merge partial ResumeData objects (simple shallow merge for arrays)
function mergeResumeData(base: ResumeData, part: Partial<ResumeData>): ResumeData {
  if (!part || typeof part !== 'object') return base
  
  const merged = { ...base } as ResumeData
  
  // Merge arrays by concatenation
  const arrayFields: (keyof ResumeData)[] = [
    'experience', 'education', 'skills', 'certifications', 'projects',
    'languages', 'volunteer', 'interests', 'awards', 'publications', 'references',
  ]
  
  for (const field of arrayFields) {
    const partArr = (part as any)[field]
    if (Array.isArray(partArr) && partArr.length > 0) {
      const currentArr = (merged as any)[field] || []
      ;(merged as any)[field] = [...currentArr, ...partArr]
    }
  }
  
  // Overwrite scalar fields if present and not empty
  const scalarFields: (keyof ResumeData)[] = [
    'name', 'email', 'phone', 'location', 'linkedin', 'website', 'summary',
  ]
  
  for (const field of scalarFields) {
    const val = (part as any)[field]
    if (val && typeof val === 'string' && val.trim().length > 0) {
      // For name/email etc, only overwrite if base is empty or the new one looks better
      if (!(merged as any)[field] || (merged as any)[field].length < val.length) {
         ;(merged as any)[field] = val.trim()
      }
    }
  }
  return merged
}

const SYSTEM_PROMPT = `You are a specialist resume parser. Your goal is to extract structured data from resume text into a specific JSON format.

### RULES:
1. **WORK EXPERIENCE SEGMENTATION**: 
   - A new role starts when you see a new company name AND/OR a new date range.
   - DO NOT merge company names into the title field. Example: "Acme Corp - Senior Engineer" should be: company: "Acme Corp", title: "Senior Engineer".
   - If multiple roles exist at the same company, list them as separate items in the experience array.
2. **PROJECTS**:
   - Extract personal projects, open source contributions, or case studies.
   - Include the project name, description, and technology stack (mapped to "bullets" or inferred summary).
3. **TECH STACK**:
   - Always extract programming languages, frameworks, and tools from the context of experience or projects.
4. **DATES**:
   - Normalize dates to "MM/YYYY" or "YYYY". If current, use "Present".
5. **JSON SCHEMA**:
   Return ONLY a JSON object matching this interface:
   interface ResumeData {
     name: string; email: string; phone: string; location: string; linkedin: string; website: string;
     summary: string;
     experience: Array<{ title: string; company: string; location: string; startDate: string; endDate: string; bullets: string[] }>;
     education: Array<{ degree: string; school: string; location: string; date: string; gpa: string }>;
     projects: Array<{ name: string; description: string; date: string; link: string; bullets: string[] }>;
     skills: string[];
     languages: string[];
     certifications: string[];
   }

### NEGATIVE CONSTRAINTS:
- NEVER include any text other than the JSON object.
- NO markdown blocks (no \`\`\`json).
- DO NOT invent data. If a field is missing, use empty string or empty array.
- DO NOT truncate summary or bullets. Use the full text provided.
`;

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
      summary: '', experience: [], education: [], skills: [], certifications: [],
      projects: [], languages: [], volunteer: [], interests: [], awards: [],
      publications: [], references: [],
    }

    let succeededCount = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const userPrompt = `Extract resume data from this chunk (${i+1}/${chunks.length}):\n\n${chunk}`
      
      try {
        console.log(`[AI Parser] Calling LLM for chunk ${i+1}...`)
        const partial = await callClaudeJSON<Partial<ResumeData>>({
          model: CLAUDE_STANDARD,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
        })
        
        if (partial) {
          accumulated = mergeResumeData(accumulated, partial)
          succeededCount++
          console.log(`[AI Parser] Chunk ${i+1} merged successfully.`)
        }
      } catch (e) {
        console.error(`[AI Parser] Chunk ${i+1} failed:`, e)
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
