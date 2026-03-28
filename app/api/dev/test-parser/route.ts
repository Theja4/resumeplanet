// Dev-only endpoint for testing the resume parser without going through auth/upload.
// Usage:
//   POST { "text": "..." }            → tests parseResumeText (DOCX path)
//   POST FormData with field "file"   → tests parseResumeFromPages (PDF spatial path)

import { NextRequest, NextResponse } from 'next/server'
import { parseResumeText, parseResumeFromPages } from '@/lib/resumeParser'
import { extractPDFItems } from '@/lib/pdfExtractor'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    // PDF file path
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file field provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files supported for spatial parsing' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const pages = await extractPDFItems(buffer)
      const rawText = pages.flatMap(p => p.items).map(i => i.text).join(' ')

      if (rawText.trim().length < 100) {
        return NextResponse.json({ error: 'SCANNED_PDF — no extractable text' }, { status: 400 })
      }

      const parsed = await parseResumeFromPages(pages)

      return NextResponse.json({
        parser: 'spatial (pdfjs-dist)',
        pageCount: pages.length,
        itemCount: pages.reduce((s, p) => s + p.items.length, 0),
        rawTextLength: rawText.length,
        parsed,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: 'Parse failed', detail: msg }, { status: 500 })
    }
  }

  // JSON text path
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('text' in body) || typeof (body as { text: unknown }).text !== 'string') {
    return NextResponse.json({ error: 'Provide { "text": "..." } or FormData with "file"' }, { status: 400 })
  }

  const text = (body as { text: string }).text
  try {
    const parsed = await parseResumeText(text)
    return NextResponse.json({ parser: 'text (fallback)', parsed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Parse failed', detail: msg }, { status: 500 })
  }
}
