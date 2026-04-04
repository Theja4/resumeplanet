import { NextRequest, NextResponse } from 'next/server'
import { extractPDFItems, pagesToLines } from '@/lib/pdfExtractor'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(request: NextRequest) {
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

  let text: string
  let pageCount = 1
  try {
    if (file.type === 'application/pdf') {
      const pages = await extractPDFItems(buffer)
      pageCount = pages.length || 1
      text = pagesToLines(pages).map(line => line.text).join('\n')
    } else {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    }
  } catch (err) {
    console.error('Text extraction error:', err)
    return NextResponse.json({ success: false, error: 'EXTRACTION_FAILED' }, { status: 500 })
  }

  if (text.trim().length < 50) {
    return NextResponse.json({ success: false, error: 'SCANNED_OR_EMPTY' }, { status: 422 })
  }

  return NextResponse.json({ success: true, text, pageCount })
}
