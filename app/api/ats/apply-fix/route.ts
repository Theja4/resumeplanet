import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSONRace } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import type { Profile, APIResponse } from '@/types'

const APPLY_SYSTEM = `You are an expert resume editor. The user wants to apply a specific fix to their resume text. Return ONLY a JSON object with the "newText" key containing the improved text.

Rules:
- Preserve the original meaning and facts
- Only improve the specified text, do not rewrite the entire section
- Use strong action verbs
- Add realistic quantifiable details if the context supports it
- Return ONLY {"newText": "the improved text"}`

type ApplyFixResponse = {
  newText: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let body: { beforeText: string; afterText: string; sectionHint: string; resumeContext: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const { beforeText, afterText, sectionHint, resumeContext } = body

  if (!afterText) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Missing afterText' },
      { status: 400 }
    )
  }

  // No beforeText means nothing to locate in the resume — return afterText as-is
  if (!beforeText) {
    return NextResponse.json<APIResponse<ApplyFixResponse>>(
      { success: true, data: { newText: afterText } },
      { status: 200 }
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  const pro = isPro(profile)

  if (!pro) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PRO_REQUIRED' },
      { status: 403 }
    )
  }

  // Refine the fix with the full resume context
  const prompt = `Resume Context:\n${resumeContext}\n\nImprove this specific text:\nBEFORE: "${beforeText}"\nSUGGESTED: "${afterText}"\n\nSection: ${sectionHint}\n\nRefine the suggested text and return ONLY JSON with a "newText" key. Keep it realistic and impactful.`

  let result: ApplyFixResponse

  try {
    result = await callClaudeJSONRace<ApplyFixResponse>({
      model: (() => {
        const m = process.env.ANTHROPIC_MODEL_PREMIUM
        if (!m) console.warn('ANTHROPIC_MODEL_PREMIUM is not set — falling back to default model')
        return m || 'deepseek/deepseek-v4-flash'
      })(),
      system: APPLY_SYSTEM,
      prompt,
      maxTokens: 512,
      timeoutMs: 60000,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Apply fix error:', msg)
    // Fallback to the pre-computed afterText
    return NextResponse.json<APIResponse<ApplyFixResponse>>(
      { success: true, data: { newText: afterText } },
      { status: 200 }
    )
  }

  return NextResponse.json<APIResponse<ApplyFixResponse>>(
    { success: true, data: result },
    { status: 200 }
  )
}
