import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseResume } from '@/lib/parsers'
import type { ResumeData, APIResponse, Resume } from '@/types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  // ── Auth check ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
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

  // ── Server-side validation ─────────────────────────────────────────────────
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
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

  const originalFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

  // ── Duplicate check (same user + title in last 24h) ────────────────────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', originalFilename)
    .gte('created_at', since)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { success: false, error: 'DUPLICATE_FILE', resume_id: existing.id },
      { status: 409 }
    )
  }

  // ── Convert file to buffer ─────────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // ── Upload to Supabase storage ─────────────────────────────────────────────
  const storagePath = `${user.id}/${Date.now()}-${originalFilename}`
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'STORAGE_UPLOAD_FAILED' },
      { status: 500 }
    )
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  let parsedData: ResumeData

  try {
    parsedData = await parseResume(buffer, file.type)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    await supabase.storage.from('resumes').remove([storagePath])
    if (errMsg === 'SCANNED_PDF') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'SCANNED_PDF' },
        { status: 400 }
      )
    }
    console.error('Parse error:', errMsg)
    return NextResponse.json(
      { success: false, error: 'PARSE_FAILED', detail: errMsg },
      { status: 500 }
    )
  }

  // ── Save to database ───────────────────────────────────────────────────────
  const { data: resume, error: dbError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title: originalFilename,
      raw_text: '',
      parsed_data: parsedData,
      original_file_url: storagePath,
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
