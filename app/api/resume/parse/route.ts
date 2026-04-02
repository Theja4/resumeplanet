import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ResumeData, APIResponse, Resume } from '@/types'

const ALLOWED_MIME_TYPE = 'application/pdf'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

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
      { success: false, error: 'INVALID_FILE_TYPE', message: 'Only PDF files are supported' },
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
  let parsedData: ResumeData
  try {
    parsedData = JSON.parse(parsedDataStr as string)
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INVALID_PARSED_DATA' },
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

  // ── Upload to Supabase storage ─────────────────────────────────────────────
  const storagePath = `${user.id}/${Date.now()}-${originalFilename}`
  const buffer = Buffer.from(await file.arrayBuffer())
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

  // ── Save to database (no server-side parsing — client already parsed) ──────
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
