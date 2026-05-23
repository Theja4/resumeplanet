import { NextRequest, NextResponse } from 'next/server'
import { extractPDFItems, pagesToLines } from '@/lib/pdfExtractor'
import { extractDocxText } from '@/lib/docxTextExtractor'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'
import { resumeDataToPlainText } from '@/lib/resume-data'
import { parseResumeRobustly } from '@/lib/serverResumeParsing'

const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES
const PDF_MIME_TYPE = 'application/pdf'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DOC_MIME_TYPE = 'application/msword'
const TXT_MIME_TYPE = 'text/plain'
const ALLOWED_TYPES = [PDF_MIME_TYPE, DOCX_MIME_TYPE, DOC_MIME_TYPE, TXT_MIME_TYPE]

const resumeDataToText = resumeDataToPlainText

function detectFileType(file: File): string | null {
  const lowerName = file.name.toLowerCase()
  if (file.type === PDF_MIME_TYPE || lowerName.endsWith('.pdf')) return PDF_MIME_TYPE
  if (file.type === DOCX_MIME_TYPE || lowerName.endsWith('.docx')) return DOCX_MIME_TYPE
  if (file.type === DOC_MIME_TYPE || lowerName.endsWith('.doc')) return DOC_MIME_TYPE
  if (file.type === TXT_MIME_TYPE || lowerName.endsWith('.txt')) return TXT_MIME_TYPE
  return null
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

  const detectedType = detectFileType(file)
  if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
    return NextResponse.json({ success: false, error: 'INVALID_FILE_TYPE' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'FILE_TOO_LARGE' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileType = detectedType

  let extractedText: string
  let pageCount = 1
  try {
    if (fileType === PDF_MIME_TYPE) {
      const pages = await extractPDFItems(buffer)
      pageCount = pages.length || 1
      extractedText = pagesToLines(pages).map(line => line.text).join('\n')
    } else if (fileType === DOCX_MIME_TYPE) {
      extractedText = await extractDocxText(buffer)
    } else if (fileType === TXT_MIME_TYPE) {
      extractedText = buffer.toString('utf8')
    } else {
      // Legacy .doc — mammoth doesn't parse it. Best-effort raw extraction
      // (strips control characters); fall through to robust parser if it's
      // too sparse.
      extractedText = buffer.toString('utf8').replace(/[\x00-\x08\x0E-\x1F]/g, ' ')
    }
  } catch (err) {
    console.error('Text extraction error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'SCANNED_PDF_NO_TEXT') {
      return NextResponse.json({ success: false, error: 'SCANNED_PDF_NO_TEXT' }, { status: 422 })
    }
    if (msg === 'PASSWORD_PROTECTED_PDF') {
      return NextResponse.json({ success: false, error: 'PASSWORD_PROTECTED_PDF' }, { status: 422 })
    }
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
