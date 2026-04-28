import { NextRequest, NextResponse } from 'next/server'
import { extractPDFItems, pagesToLines } from '@/lib/pdfExtractor'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'
import { resumeDataToPlainText } from '@/lib/resume-data'
import { parseResumeRobustly } from '@/lib/serverResumeParsing'

const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const resumeDataToText = resumeDataToPlainText

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

  const { selectedCandidate } = await parseResumeRobustly({
    buffer,
    fileType,
  })

  const text = extractedText.trim().length >= 50
    ? extractedText
    : resumeDataToText(selectedCandidate?.data ?? null)

  if (text.trim().length < 50) {
    return NextResponse.json({ success: false, error: 'SCANNED_OR_EMPTY' }, { status: 422 })
  }

  return NextResponse.json({
    success: true,
    text,
    pageCount,
    parsedData: selectedCandidate?.data ?? null,
  })
}
