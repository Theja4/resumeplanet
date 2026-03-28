import type { ResumeData } from '@/types'

export interface ResumeParser {
  parse(buffer: Buffer, fileType: string): Promise<ResumeData>
}
