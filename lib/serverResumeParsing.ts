import type { ResumeData } from '@/types'
import { extractFirstPartyResumeSnapshotFromPdf } from '@/lib/firstPartyResumeMarker.server'
import type { FirstPartyResumeSnapshot } from '@/lib/firstPartyResumeMarker'
import {
  assessResumeParseConfidence,
  chooseBetterParseCandidate,
  shouldAttemptRepair,
  type ResumeParseCandidate,
} from '@/lib/parserConfidence'
import pdfjsParser from '@/lib/parsers/pdfjs'
import claudeParser from '@/lib/parsers/claude'
import { extractPDFItems, pagesToLines } from '@/lib/pdfExtractor'

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PDF_MIME_TYPE = 'application/pdf'

function canUseDeepSeekRepairParser() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

function buildParseCandidate(
  data: ResumeData | null,
  source: ResumeParseCandidate['source'],
  sourceTextLength: number,
): ResumeParseCandidate | null {
  if (!data) return null

  return {
    data,
    source,
    confidence: assessResumeParseConfidence(data, { sourceTextLength }),
  }
}

function buildMarkerCandidate(snapshot: FirstPartyResumeSnapshot | null): ResumeParseCandidate | null {
  if (!snapshot) return null

  return {
    data: snapshot.data,
    source: 'marker',
    confidence: {
      score: 100,
      level: 'high',
      issues: [],
    },
  }
}

async function extractSourceTextLength(buffer: Buffer, fileType: string) {
  try {
    if (fileType === PDF_MIME_TYPE) {
      const pages = await extractPDFItems(buffer)
      return pagesToLines(pages).map(line => line.text).join('\n').trim().length
    }

    if (fileType === DOCX_MIME_TYPE) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value.trim().length
    }
  } catch (error) {
    console.warn('Failed to extract source text length for resume parsing:', error)
  }

  return 0
}

export interface RobustResumeParseResult {
  markerSnapshot: FirstPartyResumeSnapshot | null
  selectedCandidate: ResumeParseCandidate | null
  sourceTextLength: number
  fastCandidate: ResumeParseCandidate | null
  clientCandidate: ResumeParseCandidate | null
}

export async function parseResumeRobustly(params: {
  buffer: Buffer
  fileType: string
  clientParsedData?: ResumeData | null
}) : Promise<RobustResumeParseResult> {
  const { buffer, fileType, clientParsedData = null } = params
  const sourceTextLength = await extractSourceTextLength(buffer, fileType)

  let markerSnapshot: FirstPartyResumeSnapshot | null = null
  if (fileType === PDF_MIME_TYPE) {
    markerSnapshot = await extractFirstPartyResumeSnapshotFromPdf(buffer)
  }

  const markerCandidate = buildMarkerCandidate(markerSnapshot)

  let parsedData: ResumeData | null = null
  if (!markerCandidate) {
    try {
      parsedData = await pdfjsParser.parse(buffer, fileType)
    } catch (error) {
      console.error('Fast resume parser failed:', error)
      parsedData = null
    }
  }

  const fastCandidate = buildParseCandidate(parsedData, 'fast', sourceTextLength)
  const clientCandidate = buildParseCandidate(clientParsedData, 'client', sourceTextLength)

  let selectedCandidate = chooseBetterParseCandidate(
    markerCandidate,
    chooseBetterParseCandidate(fastCandidate, clientCandidate),
  )

  if (!markerCandidate && canUseDeepSeekRepairParser() && shouldAttemptRepair(selectedCandidate)) {
    try {
      const repairedData = await claudeParser.parse(buffer, fileType)
      const repairCandidate = buildParseCandidate(repairedData, 'repair', sourceTextLength)
      selectedCandidate = chooseBetterParseCandidate(selectedCandidate, repairCandidate)
    } catch (error) {
      console.error('Repair resume parser failed:', error)
    }
  }

  return {
    markerSnapshot,
    selectedCandidate,
    sourceTextLength,
    fastCandidate,
    clientCandidate,
  }
}
