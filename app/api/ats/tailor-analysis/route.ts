import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import type { TailorAnalysis, APIResponse, Profile } from '@/types'

const SYSTEM = `You are a resume career coach. Analyse the provided resume against the job description and return structured JSON. Return ONLY valid JSON.`

const SCHEMA = `{
  "matchScore": number 0-100,
  "missingKeywords": ["string"],
  "suggestions": [
    { "sectionId": "string", "hint": "string" }
  ]
}`

const ALLOWED_SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'volunteer', 'languages', 'interests', 'awards', 'publications', 'references']

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

  const prompt = `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nReturn a JSON object matching exactly this schema:\n${SCHEMA}\n\nRules:\n- matchScore: 0-100 integer\n- missingKeywords: top 8 keywords from the job description that are absent in the resume\n- suggestions: max 5 items, sectionId must be one of: ${ALLOWED_SECTIONS.join(', ')}\n- hint: 1 sentence, actionable`

  let result: TailorAnalysis

  try {
    result = await callClaudeJSON<TailorAnalysis>({
      model: 'claude-sonnet-4-6',
      system: SYSTEM,
      prompt,
      maxTokens: 2048,
      timeoutMs: 60000,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'CLAUDE_TIMEOUT') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'CLAUDE_TIMEOUT' },
        { status: 408 }
      )
    }
    if (msg === 'CLAUDE_JSON_PARSE_FAILED') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'PARSE_FAILED' },
        { status: 422 }
      )
    }
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<TailorAnalysis>>(
    { success: true, data: result },
    { status: 200 }
  )
}
