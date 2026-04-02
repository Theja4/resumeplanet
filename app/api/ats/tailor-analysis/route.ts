import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeResume } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import type { JDTailorResult, APIResponse, Profile } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (!isPro(profile)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Pro plan required' },
      { status: 403 }
    )
  }

  let body: { resumeText: string; jobDescription: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { resumeText, jobDescription } = body

  if (!resumeText || resumeText.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Resume text too short' },
      { status: 400 }
    )
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Job description too short' },
      { status: 400 }
    )
  }

  // Trim to Pro tier limit (~5000 tokens)
  const trimmedResume = resumeText.slice(0, 20000)
  const trimmedJD = jobDescription.slice(0, 8000)

  const llmResult = await analyzeResume<JDTailorResult>('pro_jd_tailor', trimmedResume, trimmedJD)

  if (!llmResult.success) {
    console.error('JD tailor error:', llmResult.error)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<JDTailorResult>>(
    { success: true, data: llmResult.data },
    { status: 200 }
  )
}
