import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/planUtils'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'
import type { Profile } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (!isPro(profile)) {
    return NextResponse.json({ success: false, error: 'PRO_REQUIRED' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file')
  const fixesRaw = formData.get('fixes') as string | null

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No PDF file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'INVALID_FILE_TYPE' }, { status: 400 })
  }

  if (file.size > MAX_RESUME_UPLOAD_BYTES) {
    return NextResponse.json({ success: false, error: 'FILE_TOO_LARGE' }, { status: 400 })
  }

  let fixes: Record<string, string> = {}
  try {
    fixes = fixesRaw ? JSON.parse(fixesRaw) : {}
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid fixes JSON' }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

    if (fixes.title !== undefined) pdfDoc.setTitle(fixes.title)
    if (fixes.author !== undefined) pdfDoc.setAuthor(fixes.author)
    if (fixes.subject !== undefined) pdfDoc.setSubject(fixes.subject)
    if (fixes.keywords !== undefined) pdfDoc.setKeywords([fixes.keywords])
    if (fixes.creator !== undefined) pdfDoc.setCreator(fixes.creator)
    if (fixes.language !== undefined) pdfDoc.setLanguage(fixes.language)

    const patchedBytes = await pdfDoc.save()
    const buffer = Buffer.from(patchedBytes)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume-optimized.pdf"',
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (err) {
    console.error('PDF patch error:', err)
    return NextResponse.json({ success: false, error: 'PATCH_FAILED' }, { status: 500 })
  }
}
