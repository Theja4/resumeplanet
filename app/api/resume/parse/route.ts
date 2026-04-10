import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import type { ResumeData, APIResponse, Resume } from '@/types'
import pdfjsParser from '@/lib/parsers/pdfjs'
import claudeParser from '@/lib/parsers/claude'
import { extractPDFItems, pagesToLines } from '@/lib/pdfExtractor'
import { buildRoundTripVisibility, type FirstPartyResumeSnapshot } from '@/lib/firstPartyResumeMarker'
import { extractFirstPartyResumeSnapshotFromPdf } from '@/lib/firstPartyResumeMarker.server'
import {
  assessResumeParseConfidence,
  chooseBetterParseCandidate,
  shouldAttemptRepair,
  type ResumeParseCandidate,
} from '@/lib/parserConfidence'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'

const ALLOWED_MIME_TYPE = 'application/pdf'
const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES

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

function canUseDeepSeekRepairParser(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  // ── Auth check ─────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // ── Rate Limit ─────────────────────────────────────────────────────────────
  const rateLimit = await consumeRateLimit({
    request,
    userId: user.id,
    scope: 'resume_parse_authenticated',
    limit: 30,
    windowSeconds: 60 * 60,
  })

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit, 'TOO_MANY_PARSE_REQUESTS')
  }

  // ── Parse FormData ──────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'No file provided' },
      { status: 400 }
    )
  }

  // Validate file type (PDF only)
  if (file.type !== ALLOWED_MIME_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INVALID_FILE_TYPE' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'FILE_TOO_LARGE' },
      { status: 400 }
    )
  }

  // Parsed resume data from client (open-resume parser)
  const parsedDataStr = formData.get('parsedData')
  let clientParsedData: ResumeData | null = null
  if (typeof parsedDataStr === 'string' && parsedDataStr.trim()) {
    try {
      clientParsedData = JSON.parse(parsedDataStr) as ResumeData
    } catch {
      clientParsedData = null
    }
  }

  const originalFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileType = file.type || ALLOWED_MIME_TYPE

  // Content-based duplicate detection
  const fileHash = createHash('sha256').update(buffer).digest('hex')
  let sourceTextLength = 0

  try {
    const pages = await extractPDFItems(buffer)
    sourceTextLength = pagesToLines(pages).map(line => line.text).join('\n').trim().length
  } catch (sourceExtractError) {
    console.warn('Failed to extract source text length for confidence scoring:', sourceExtractError)
  }

  let markerSnapshot: FirstPartyResumeSnapshot | null = null
  if (fileType === ALLOWED_MIME_TYPE) {
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

  if (!markerCandidate && !parsedData && !clientParsedData) {
    console.error('Resume parsing failed:', serverParseError)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PARSE_FAILED' },
      { status: 422 }
    )
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
    } catch (repairError) {
      console.error('DeepSeek resume repair failed:', repairError)
    }
  }

  if (!selectedCandidate) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PARSE_FAILED' },
      { status: 422 }
    )
  }

  parsedData = selectedCandidate.data

  if (
    !markerCandidate &&
    selectedCandidate.confidence.issues.some(
      issue => issue === 'very low extraction coverage' || issue === 'parsed payload too short for source length',
    )
  ) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PARSE_LOW_CONFIDENCE' },
      { status: 422 },
    )
  }

  console.info('Resume parse selection:', {
    selectedSource: selectedCandidate.source,
    selectedScore: selectedCandidate.confidence.score,
    selectedIssues: selectedCandidate.confidence.issues,
    markerDetected: Boolean(markerSnapshot),
    fastScore: fastCandidate?.confidence.score ?? null,
    clientScore: clientCandidate?.confidence.score ?? null,
  })

  // ── Duplicate check (same user + title or user + hash in last 24h) ─────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .or(`title.eq."${originalFilename}",file_hash.eq."${fileHash}"`)
    .gte('created_at', since)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { success: false, error: 'DUPLICATE_FILE', resume_id: existing.id },
      { status: 409 }
    )
  }

  // ── Upload to Supabase storage ─────────────────────────────────────────────
  const storagePath = `${user.id}/${Date.now()}-${originalFilename}`
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'STORAGE_UPLOAD_FAILED' },
      { status: 500 }
    )
  }

  // ── Save to database (server-side parser is authoritative) ─────────────────
  const { data: resume, error: dbError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title: originalFilename,
      file_hash: fileHash,
      raw_text: '',
      parsed_data: parsedData,
      original_file_url: storagePath,
      template_config: markerSnapshot?.config ?? null,
      builder_visibility: markerSnapshot
        ? buildRoundTripVisibility(
            markerSnapshot.data,
            markerSnapshot.sectionOrder,
            markerSnapshot.sidebarSectionOrder,
            markerSnapshot.config?.density ?? 'relaxed',
          )
        : null,
    })
    .select()
    .single()

  if (dbError || !resume) {
    console.error('DB insert error:', dbError)
    await supabase.storage.from('resumes').remove([storagePath])
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'DB_SAVE_FAILED' },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<Resume>>(
    { success: true, data: resume as Resume },
    { status: 201 }
  )
}
