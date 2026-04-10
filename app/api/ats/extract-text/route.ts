import { NextRequest, NextResponse } from 'next/server'
import { extractPDFItems, pagesToLines } from '@/lib/pdfExtractor'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'
import pdfjsParser from '@/lib/parsers/pdfjs'
import claudeParser from '@/lib/parsers/claude'
import { extractFirstPartyResumeSnapshotFromPdf } from '@/lib/firstPartyResumeMarker.server'
import {
  assessResumeParseConfidence,
  chooseBetterParseCandidate,
  shouldAttemptRepair,
  type ResumeParseCandidate,
} from '@/lib/parserConfidence'
import type { ResumeData } from '@/types'
import type { FirstPartyResumeSnapshot } from '@/lib/firstPartyResumeMarker'

const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

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

function canUseDeepSeekRepairParser() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

function resumeDataToText(data: ResumeData | null): string {
  if (!data) return ''

  const parts: string[] = [
    data.name,
    data.currentRole,
    data.summary,
    data.email,
    data.phone,
    data.location,
    data.linkedin,
    data.website,
  ]

  for (const item of data.experience) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of data.education) {
    parts.push(item.institution, item.degree, item.field, item.graduationDate, item.gpa)
  }

  parts.push(...data.skills)

  for (const item of data.projects) {
    parts.push(item.name, item.description, ...(item.technologies ?? []))
  }

  for (const item of data.certifications) {
    parts.push(item.name, item.issuer, item.date)
  }

  for (const item of data.volunteer) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of data.awards) parts.push(item.title, item.issuer, item.date)
  for (const item of data.publications) parts.push(item.title, item.publisher, item.date)
  parts.push(...data.languages, ...data.interests, ...data.references)

  for (const section of data.customSections ?? []) {
    parts.push(section.title)
    if (section.type === 'text') parts.push(section.text ?? '')
    if (section.type === 'tags') parts.push(...(section.tags ?? []))
    if (section.type === 'complex') {
      for (const item of section.items ?? []) {
        parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
        parts.push(...(item.bullets ?? []))
      }
    }
  }

  return parts.map(part => part?.trim()).filter(Boolean).join('\n')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const extractRateLimit = await consumeRateLimit({
    request,
    userId: user?.id ?? null,
    scope: user ? 'ats_extract_authenticated' : 'ats_extract_anonymous',
    limit: user ? 60 : 10,
    windowSeconds: 60 * 60,
  })

  if (!extractRateLimit.allowed) {
    return createRateLimitResponse(extractRateLimit, 'TOO_MANY_EXTRACTION_REQUESTS')
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'INVALID_FILE_TYPE' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'FILE_TOO_LARGE' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileType = file.type

  let extractedText: string
  let pageCount = 1
  try {
    if (fileType === 'application/pdf') {
      const pages = await extractPDFItems(buffer)
      pageCount = pages.length || 1
      extractedText = pagesToLines(pages).map(line => line.text).join('\n')
    } else {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }
  } catch (err) {
    console.error('Text extraction error:', err)
    return NextResponse.json({ success: false, error: 'EXTRACTION_FAILED' }, { status: 500 })
  }

  let markerSnapshot: FirstPartyResumeSnapshot | null = null
  if (fileType === 'application/pdf') {
    markerSnapshot = await extractFirstPartyResumeSnapshotFromPdf(buffer)
  }

  const markerCandidate = buildMarkerCandidate(markerSnapshot)

  let parsedData: ResumeData | null = null
  let serverParseError: unknown = null

  if (!markerCandidate) {
    try {
      parsedData = await pdfjsParser.parse(buffer, fileType)
    } catch (error) {
      serverParseError = error
      parsedData = null
    }
  }

  const sourceTextLength = extractedText.trim().length

  let selectedCandidate = chooseBetterParseCandidate(
    markerCandidate,
    buildParseCandidate(parsedData, 'fast', sourceTextLength),
  )

  if (!markerCandidate && canUseDeepSeekRepairParser() && shouldAttemptRepair(selectedCandidate)) {
    try {
      const repairedData = await claudeParser.parse(buffer, fileType)
      selectedCandidate = chooseBetterParseCandidate(
        selectedCandidate,
        buildParseCandidate(repairedData, 'repair', sourceTextLength),
      )
    } catch (repairError) {
      console.error('ATS extract repair parse failed:', repairError)
    }
  }

  const text = extractedText.trim().length >= 50
    ? extractedText
    : resumeDataToText(selectedCandidate?.data ?? null)

  if (text.trim().length < 50) {
    return NextResponse.json({ success: false, error: 'SCANNED_OR_EMPTY' }, { status: 422 })
  }

  if (!selectedCandidate && serverParseError) {
    console.warn('ATS extract structured parse unavailable:', serverParseError)
  }

  return NextResponse.json({
    success: true,
    text,
    pageCount,
    parsedData: selectedCandidate?.data ?? null,
  })
}
