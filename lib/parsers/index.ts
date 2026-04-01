import type { ResumeData } from '@/types'
import pdfjsParser from './pdfjs'
import claudeParser from './claude'

export async function parseResume(buffer: Buffer, fileType: string): Promise<ResumeData> {
  try {
    // LLM-based parser (semantic extraction via OpenRouter)
    return await claudeParser.parse(buffer, fileType)
  } catch (error) {
    console.error('Core LLM Parsing failed, using legacy spatial parser:', error)
    // Fallback to legacy parser (regex and spatial heuristics)
    return await pdfjsParser.parse(buffer, fileType)
  }
}
