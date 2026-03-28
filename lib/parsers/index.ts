import type { ResumeData } from '@/types'
import pdfjsParser from './pdfjs'

// To swap the parse engine: change the import above. Nothing else needs to change.
export async function parseResume(buffer: Buffer, fileType: string): Promise<ResumeData> {
  return pdfjsParser.parse(buffer, fileType)
}
