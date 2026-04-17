// lib/parsers/utils.ts

/**
 * Normalize raw text extracted from a PDF/DOCX.
 * - Collapse multiple newlines into a single newline.
 * - Trim leading/trailing whitespace.
 * - Preserve bullet groups by joining consecutive bullet lines.
 */
export function normalizeText(raw: string): string {
  // Collapse multiple blank lines
  let text = raw.replace(/\n{2,}/g, '\n')
  // Trim each line
  text = text
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
  return text.trim()
}

/** Detect bullet lines based on common prefixes */
export function isBulletLine(line: string): boolean {
  return /^[•\-\*▸▹›\s]+/.test(line)
}

/** Detect heading lines (common patterns for section titles) */
export function isHeadingLine(line: string): boolean {
  // Heuristic: line is all caps or ends with a colon, or matches known headings
  const trimmed = line.trim()
  if (!trimmed) return false
  const allCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 2
  const endsColon = trimmed.endsWith(':')
  const known = /^(experience|education|skills|projects|certifications|languages|volunteer|interests|awards|publications|references|summary|profile|objective)$/i.test(trimmed)
  return allCaps || endsColon || known
}

/**
 * Split text into sections based on heading detection.
 * Returns an array of section texts, each starting with its heading line.
 */
export function splitIntoSections(text: string): string[] {
  const lines = text.split('\n')
  const sections: string[] = []
  let current = ''
  for (const line of lines) {
    if (isHeadingLine(line) && current) {
      sections.push(current.trim())
      current = line
    } else {
      current += '\n' + line
    }
  }
  if (current) sections.push(current.trim())
  return sections
}

/**
 * Chunk large resumes into smaller pieces to stay within token limits.
 * Simple heuristic: split on detected sections (using splitIntoSections).
 * If a section is still too large, further split by length.
 */
/**
 * Chunk large resumes into smaller pieces to stay within token limits.
 * Simple heuristic: split on detected sections.
 * ADDED: Overlap ensures context is preserved for roles/projects that span chunks.
 */
export function chunkText(
  text: string,
  maxChunkLength: number = 8000,
  overlap: number = 1000
): string[] {
  const sections = splitIntoSections(text)
  const chunks: string[] = []
  let current = ''

  for (const sec of sections) {
    // If adding this section exceeds max length, push current and start new with overlap
    if ((current + '\n' + sec).length > maxChunkLength) {
      if (current) {
        chunks.push(current.trim())
        // Start next chunk with the end of the previous one for context
        current = current.slice(-overlap) + '\n' + sec
      } else {
        // Single section too long: split it
        for (let i = 0; i < sec.length; i += maxChunkLength - overlap) {
          const start = Math.max(0, i - overlap)
          chunks.push(sec.slice(start, i + maxChunkLength).trim())
        }
        current = ''
      }
    } else {
      current += (current ? '\n' : '') + sec
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/**
 * Ensure an item's bullets field is actually an array.
 * Some parsers or LLM responses may return a single string instead of string[].
 */
type LooseRecord = Record<string, unknown>

function normalizeBulletsArray(item: LooseRecord): LooseRecord {
  const bullets = item.bullets
  if (Array.isArray(bullets)) return item
  if (typeof bullets === 'string' && bullets.length > 0) {
    item.bullets = bullets.split('\n').map((s: string) => s.replace(/^[•\-\*▸▹›\s]+ /, '').trim()).filter(Boolean)
  } else {
    item.bullets = []
  }
  return item
}

/**
 * Post‑process parsed ResumeData to fix common issues:
 * - Merge split sentences where a bullet ends without punctuation and the next starts lowercase.
 * - Ensure required top‑level fields exist.
 * - Normalize bullets fields that might be strings instead of string[].
 */
export function postProcessResume(data: object): LooseRecord {
  const mutableData = data as LooseRecord
  // Normalize and merge split bullet sentences for experience items
  const experience = Array.isArray(mutableData.experience) ? mutableData.experience as LooseRecord[] : []
  experience.forEach((exp) => {
    normalizeBulletsArray(exp)
    const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter((bullet): bullet is string => typeof bullet === 'string') : []
    const merged: string[] = []
    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i]
      if (i < bullets.length - 1) {
        const next = bullets[i + 1]
        if (!/[.!?]$/.test(bullet) && /^[a-z]/.test(next)) {
          merged.push(bullet + ' ' + next)
          i++
          continue
        }
      }
      merged.push(bullet)
    }
    exp.bullets = merged
  })

  // Same for volunteer items
  const volunteer = Array.isArray(mutableData.volunteer) ? mutableData.volunteer as LooseRecord[] : []
  volunteer.forEach((v) => {
    normalizeBulletsArray(v)
    const bullets = Array.isArray(v.bullets) ? v.bullets.filter((bullet): bullet is string => typeof bullet === 'string') : []
    const merged: string[] = []
    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i]
      if (i < bullets.length - 1) {
        const next = bullets[i + 1]
        if (!/[.!?]$/.test(bullet) && /^[a-z]/.test(next)) {
          merged.push(bullet + ' ' + next)
          i++
          continue
        }
      }
      merged.push(bullet)
    }
    v.bullets = merged
  })

  // Custom sections with complex items that may have bullets
  const customSections = Array.isArray(mutableData.customSections) ? mutableData.customSections as LooseRecord[] : []
  customSections.forEach((section) => {
    if (Array.isArray(section.items)) {
      section.items.forEach((item) => {
        if (!item || typeof item !== 'object') return
        normalizeBulletsArray(item as LooseRecord)
      })
    }
  })

  // Ensure required fields exist; if missing, set empty defaults
  const requiredTop = ['name', 'email', 'phone', 'location', 'summary']
  requiredTop.forEach((k) => {
    if (!mutableData[k]) mutableData[k] = ''
  })

  if (Array.isArray(mutableData.skills)) {
    mutableData.skills = mutableData.skills
      .map((skill: unknown) => (typeof skill === 'string' ? skill.trim() : ''))
      .filter(Boolean)
  } else {
    mutableData.skills = []
  }

  if (Array.isArray(mutableData.skillSections)) {
    mutableData.skillSections = mutableData.skillSections
      .map((section) => {
        const safeSection = section && typeof section === 'object' ? section as LooseRecord : {}
        return {
          title: typeof safeSection.title === 'string' ? safeSection.title.trim() : '',
          tag: typeof safeSection.tag === 'string' ? safeSection.tag.trim() : '',
          skills: Array.isArray(safeSection.skills)
            ? safeSection.skills
              .map((skill: unknown) => (typeof skill === 'string' ? skill.trim() : ''))
              .filter(Boolean)
            : [],
        }
      })
      .filter((section) => section.title || section.tag || section.skills.length > 0)
  } else {
    mutableData.skillSections = []
  }

  if (
    Array.isArray(mutableData.skills) &&
    mutableData.skills.length > 0 &&
    Array.isArray(mutableData.skillSections) &&
    mutableData.skillSections.length === 0
  ) {
    mutableData.skillSections = [{ title: '', tag: '', skills: [...mutableData.skills] as string[] }]
  }

  return mutableData
}
