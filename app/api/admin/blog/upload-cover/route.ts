import { NextRequest, NextResponse } from 'next/server'
import { BLOG_COVER_BUCKET } from '@/lib/blog'
import { getAdminSession } from '@/lib/admin-auth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function ensureBlogCoverBucket() {
  const supabase = createServiceRoleClient()
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    throw error
  }

  const existingBucket = buckets.find(bucket => bucket.name === BLOG_COVER_BUCKET || bucket.id === BLOG_COVER_BUCKET)

  if (existingBucket) {
    return supabase
  }

  const { error: createError } = await supabase.storage.createBucket(BLOG_COVER_BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })

  if (createError && !/already exists/i.test(createError.message)) {
    throw createError
  }

  return supabase
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession()

  if (!adminSession) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'Image must be 5MB or smaller' }, { status: 400 })
  }

  try {
    const supabase = await ensureBlogCoverBucket()
    const safeName = sanitizeFilename(file.name || 'cover-image')
    const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(BLOG_COVER_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error('Blog cover upload failed:', uploadError)
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BLOG_COVER_BUCKET).getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path,
    })
  } catch (error) {
    console.error('Blog cover upload setup failed:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
