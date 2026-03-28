import type { ResumeData } from '@/types'
import type { ResumeParser } from './types'
import { extractPDFItems } from '@/lib/pdfExtractor'
import { parseResumeFromPages, parseResumeText } from '@/lib/resumeParser'

const pdfjsParser: ResumeParser = {
  async parse(buffer: Buffer, fileType: string): Promise<ResumeData> {
    if (fileType === 'application/pdf') {
      const pages = await extractPDFItems(buffer)
      return parseResumeFromPages(pages)
    }
    // Plain text fallback
    const text = buffer.toString('utf-8')
    return parseResumeText(text)
  },
}

export default pdfjsParser
