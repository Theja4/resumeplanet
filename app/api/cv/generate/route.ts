import { NextRequest, NextResponse } from 'next/server'
import { buildAIRequestSignature, readAIRequestCache, writeAIRequestCache } from '@/lib/aiRequestCache'
import { requirePro } from '@/lib/planEnforcement'
import { parseResume } from '@/lib/parsers'
import { generateCoverLetterFromResumeData } from '@/lib/cv/generator'
import {
  normalizeResumeData,
  resumeHasMeaningfulContent,
  sanitizeDocumentTitle,
} from '@/lib/cv/shared'
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from '@/lib/uploadLimits'
import type { GeneratedCoverLetterPayload } from '@/lib/cv/shared'
import type { APIResponse, Resume, ResumeData, TailorIntensity } from '@/types'

const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES
const PDF_MIME_TYPE = 'application/pdf'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const COVER_LETTER_CACHE_VERSION = 1

interface CachedCoverLetterResult {
  coverLetter: GeneratedCoverLetterPayload['coverLetter']
  sender: GeneratedCoverLetterPayload['sender']
}

function inferFileType(file: File) {
  if (file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith('.pdf')) {
    return PDF_MIME_TYPE
  }

  if (file.type === DOCX_MIME_TYPE || file.name.toLowerCase().endsWith('.docx')) {
    return DOCX_MIME_TYPE
  }

  return ''
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requirePro()

  if (auth instanceof NextResponse) {
    return auth
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid form payload' },
      { status: 400 },
    )
  }

  const resumeId = String(formData.get('resumeId') ?? '').trim()
  const jobDescription = String(formData.get('jobDescription') ?? '').trim()
  const intensityValue = String(formData.get('intensity') ?? '').trim()
  const intensity: TailorIntensity =
    intensityValue === 'conservative' ||
    intensityValue === 'balanced' ||
    intensityValue === 'aggressive' ||
    intensityValue === 'overboard'
      ? intensityValue
      : 'aggressive'

  if (jobDescription.length < 80) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Job description too short' },
      { status: 400 },
    )
  }

  let sourceTitle = 'Generated Cover Letter'
  let sourceMode: 'saved' | 'upload' = 'saved'
  let sourceResumeData: ResumeData | null = null

  if (resumeId) {
    const { data: resume } = await auth.supabase
      .from('resumes')
      .select('id, title, parsed_data')
      .eq('id', resumeId)
      .eq('user_id', auth.userId)
      .maybeSingle()

    const selectedResume = resume as Pick<Resume, 'id' | 'title' | 'parsed_data'> | null

    if (!selectedResume) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'Selected resume not found' },
        { status: 404 },
      )
    }

    sourceResumeData = normalizeResumeData((selectedResume.parsed_data as ResumeData | null) ?? null)
    sourceTitle = sanitizeDocumentTitle(selectedResume.title) || 'saved-resume'
    sourceMode = 'saved'
  } else {
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'Choose a saved resume or upload a file' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: `Resume file must be under ${MAX_RESUME_UPLOAD_LABEL}` },
        { status: 400 },
      )
    }

    const fileType = inferFileType(file)

    if (!fileType) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'Only PDF and DOCX resumes are supported' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    sourceResumeData = normalizeResumeData(await parseResume(buffer, fileType))
    sourceTitle = sanitizeDocumentTitle(file.name) || 'uploaded-resume'
    sourceMode = 'upload'
  }

  if (!sourceResumeData || !resumeHasMeaningfulContent(sourceResumeData)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Resume content is too thin to generate a useful cover letter' },
      { status: 400 },
    )
  }

  const cacheSignature = buildAIRequestSignature({
    version: COVER_LETTER_CACHE_VERSION,
    feature: 'cover_letter',
    resumeData: sourceResumeData,
    jobDescription,
    intensity,
  })

  const cached = await readAIRequestCache<CachedCoverLetterResult>({
    supabase: auth.supabase,
    userId: auth.userId,
    feature: 'cover_letter',
    signature: cacheSignature,
    version: COVER_LETTER_CACHE_VERSION,
  })

  if (cached) {
    return NextResponse.json<APIResponse<GeneratedCoverLetterPayload>>({
      success: true,
      data: {
        coverLetter: cached.coverLetter,
        sender: cached.sender,
        sourceMode,
        sourceTitle,
      },
    })
  }

  try {
    const result = await generateCoverLetterFromResumeData({
      resumeData: sourceResumeData,
      jobDescription,
      intensity,
    })

    await writeAIRequestCache<CachedCoverLetterResult>({
      supabase: auth.supabase,
      userId: auth.userId,
      feature: 'cover_letter',
      signature: cacheSignature,
      version: COVER_LETTER_CACHE_VERSION,
      data: {
        coverLetter: result.coverLetter,
        sender: result.sender,
      },
    })

    return NextResponse.json<APIResponse<GeneratedCoverLetterPayload>>({
      success: true,
      data: {
        coverLetter: result.coverLetter,
        sender: result.sender,
        sourceMode,
        sourceTitle,
      },
    })
  } catch (error) {
    console.error('Cover letter generation failed:', error)
    const message = error instanceof Error ? error.message : 'Cover letter generation failed'

    if (message === 'CLAUDE_TIMEOUT') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'CLAUDE_TIMEOUT' },
        { status: 408 },
      )
    }

    if (message === 'CLAUDE_JSON_PARSE_FAILED') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'PARSE_FAILED' },
        { status: 422 },
      )
    }

    if (message === 'OPENROUTER_PRIVACY_POLICY_BLOCK') {
      return NextResponse.json<APIResponse<never>>(
        {
          success: false,
          error: 'OPENROUTER_PRIVACY_POLICY_BLOCK',
        },
        { status: 503 },
      )
    }

    return NextResponse.json<APIResponse<never>>(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
