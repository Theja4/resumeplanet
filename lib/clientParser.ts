import { parseResumeFromPdf } from '@/lib/open-resume-parser'
import { mapToResumeData } from '@/lib/resumeMapper'
import type { ResumeData } from '@/types'

/**
 * Client-side PDF parser using open-resume.
 * Takes a File object (from <input type="file">), creates a blob URL,
 * runs the open-resume parser, then maps the result to our ResumeData type.
 */
export async function parsePdfClient(file: File): Promise<ResumeData> {
  const url = URL.createObjectURL(file)
  try {
    const result = await parseResumeFromPdf(url)
    return mapToResumeData(result)
  } finally {
    URL.revokeObjectURL(url)
  }
}
