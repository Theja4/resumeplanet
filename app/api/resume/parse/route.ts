import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import type { ResumeData, APIResponse, Resume } from '@/types'
import { buildRoundTripVisibility } from '@/lib/firstPartyResumeMarker'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'
import { syncResumeData } from '@/lib/resume-data'
import { parseResumeRobustly } from '@/lib/serverResumeParsing'
import { withAuth } from '@/lib/api-middleware'

const PDF_MIME_TYPE = 'application/pdf'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const ALLOWED_MIME_TYPES = new Set([PDF_MIME_TYPE, DOCX_MIME_TYPE])
const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES

function detectFileType(file: File): string | null {
  const lowerName = file.name.toLowerCase()
  if (file.type === PDF_MIME_TYPE || lowerName.endsWith('.pdf')) return PDF_MIME_TYPE
  if (file.type === DOCX_MIME_TYPE || lowerName.endsWith('.docx')) return DOCX_MIME_TYPE
  return null
}

export const POST = withAuth(async (request, { user, supabase }) => {
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

  // Validate file type: PDF or DOCX (the underlying parser supports both).
  const detectedType = detectFileType(file)
  if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType)) {
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
  const fileType = detectedType

  // Content-based duplicate detection
  const fileHash = createHash('sha256').update(buffer).digest('hex')

  let robustResult: Awaited<ReturnType<typeof parseResumeRobustly>>
  try {
    robustResult = await parseResumeRobustly({
      buffer,
      fileType,
      clientParsedData,
    })
  } catch (parseError) {
    const msg = parseError instanceof Error ? parseError.message : String(parseError)
    if (msg === 'SCANNED_PDF_NO_TEXT') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'SCANNED_PDF_NO_TEXT' },
        { status: 422 },
      )
    }
    if (msg === 'PASSWORD_PROTECTED_PDF') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'PASSWORD_PROTECTED_PDF' },
        { status: 422 },
      )
    }
    throw parseError
  }

  const {
    markerSnapshot,
    selectedCandidate,
    fastCandidate,
    clientCandidate,
    repairCandidate,
    repairAttempted,
    sourceTextLength,
  } = robustResult

  if (!selectedCandidate) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PARSE_FAILED' },
      { status: 422 }
    )
  }

  const parsedData = syncResumeData(selectedCandidate.data)

  if (
    !markerSnapshot &&
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
    repairScore: repairCandidate?.confidence.score ?? null,
    repairAttempted,
    sourceTextLength,
  })

  // ── Duplicate check (same user + title or user + hash in last 24h) ─────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .or(`title.eq.${originalFilename},file_hash.eq.${fileHash}`)
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
      parse_selected_source: selectedCandidate.source,
      parse_selected_score: selectedCandidate.confidence.score,
      parse_selected_issues: selectedCandidate.confidence.issues,
      parse_fast_score: fastCandidate?.confidence.score ?? null,
      parse_client_score: clientCandidate?.confidence.score ?? null,
      parse_repair_score: repairCandidate?.confidence.score ?? null,
      parse_repair_attempted: repairAttempted,
      parse_source_text_length: sourceTextLength || null,
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
})
