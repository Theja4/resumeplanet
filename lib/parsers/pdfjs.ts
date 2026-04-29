import type { ResumeData } from '@/types'
import type { ResumeParser } from './types'
import { ParseError } from './types'
import { extractPDFItems } from '@/lib/pdfExtractor'
import { extractDocxText } from '@/lib/docxTextExtractor'
import { parseResumeFromPages, parseResumeText } from '@/lib/resumeParser'

const pdfjsParser: ResumeParser = {
  async parse(buffer: Buffer, fileType: string): Promise<ResumeData> {
    if (fileType === 'application/pdf') {
      const pages = await extractPDFItems(buffer)
      // Scanned PDF detection
      const rawText = pages.flatMap((p: { items: { text: string }[] }) => p.items).map((i: { text: string }) => i.text).join(' ')
      if (rawText.trim().length < 100) {
        throw new ParseError('SCANNED_PDF')
      }
      return parseResumeFromPages(pages)
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const text = await extractDocxText(buffer)
      return parseResumeText(text)
    }

    // Plain text fallback
    return parseResumeText(buffer.toString('utf-8'))
  },
}

export default pdfjsParser
