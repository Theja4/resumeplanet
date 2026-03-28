import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adaptResumeForTemplate } from '@/lib/resumeParser'
import { isValidTemplateId } from '@/components/templates/registry'
import { isPro } from '@/lib/planUtils'
import type { ResumeData, APIResponse, Profile } from '@/types'

// Zero Claude calls. Pure JavaScript data adaptation.
// This route is template-agnostic — it never contains template-specific
// rendering logic. Adding new templates never requires changing this file.

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  // ── Auth ───────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // ── Fetch profile (for Pro check) ─────────────────────────────────────────
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // ── Pro gate ───────────────────────────────────────────────────────────────
  if (!isPro(profile)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PRO_REQUIRED' },
      { status: 403 }
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { resumeData: ResumeData; templateId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { resumeData, templateId } = body

  // ── Validate templateId via registry (future-proof: accepts any registered ID) ──
  if (!templateId || !isValidTemplateId(templateId)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INVALID_TEMPLATE_ID' },
      { status: 400 }
    )
  }

  if (!resumeData || typeof resumeData !== 'object') {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'RESUME_DATA_REQUIRED' },
      { status: 400 }
    )
  }

  // ── Adapt data for template (pure JS, zero AI) ────────────────────────────
  const adapted = adaptResumeForTemplate(resumeData, templateId)

  return NextResponse.json<APIResponse<ResumeData>>(
    { success: true, data: adapted },
    { status: 200 }
  )
}
