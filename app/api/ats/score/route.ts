import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/claude'
import { getATSModel, getRemainingFreeScans, isPro } from '@/lib/planUtils'
import type { ATSResult, ATSScanTier, APIResponse, Profile } from '@/types'

const BASIC_SYSTEM = `You are an ATS resume analyst. Analyse the resume against the job description provided. If no job description given, analyse against general ATS best practices. Return ONLY valid JSON.`

const ADVANCED_SYSTEM = `You are a senior ATS specialist and career coach with deep expertise in applicant tracking systems. Provide a comprehensive, detailed analysis of this resume. Return ONLY valid JSON.`

const BASIC_SCHEMA = `{
  "score": number 0-100,
  "tier": "basic",
  "missingKeywords": ["string (top 5 only)"],
  "presentKeywords": ["string (top 5 only)"],
  "suggestions": [
    {
      "category": "keywords|formatting|experience|education|skills|summary",
      "severity": "high|medium|low",
      "issue": "string (1 sentence)",
      "fix": "string (1 sentence)"
    }
  ],
  "summary": "string (2 sentences max)"
}`

const ADVANCED_SCHEMA = `{
  "score": number 0-100,
  "tier": "advanced",
  "scoreBreakdown": {
    "keywordMatch": number 0-100,
    "formatting": number 0-100,
    "relevance": number 0-100,
    "completeness": number 0-100,
    "keywordDensity": number 0-100
  },
  "missingKeywords": ["string (ALL missing keywords ranked by importance)"],
  "presentKeywords": ["string (ALL present keywords)"],
  "keywordAnalysis": {
    "mustHave": ["string (critical missing keywords)"],
    "niceToHave": ["string (secondary missing keywords)"],
    "overused": ["string (keywords used too many times)"]
  },
  "suggestions": [
    {
      "category": "keywords|formatting|experience|education|skills|summary",
      "severity": "high|medium|low",
      "issue": "string (detailed explanation)",
      "fix": "string (specific actionable fix)",
      "example": "string (concrete before/after example)"
    }
  ],
  "industryInsight": "string (1-2 sentences about this role/industry ATS patterns)",
  "formattingIssues": ["string (specific formatting problems found)"],
  "summary": "string (3-4 sentences comprehensive summary)"
}`

type ATSScoreResponse = ATSResult & {
  scanTier: ATSScanTier
  scansRemaining: number | null
  scoreId: string
}

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

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { resumeText: string; jobDescription?: string; resumeId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { resumeText, jobDescription, resumeId } = body

  // ── Input validation ───────────────────────────────────────────────────────
  if (!resumeText || resumeText.trim().length < 100) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'RESUME_TOO_SHORT' },
      { status: 400 }
    )
  }

  if (jobDescription && jobDescription.trim().length > 0 && jobDescription.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'JOB_DESCRIPTION_TOO_SHORT' },
      { status: 400 }
    )
  }

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // ── Rate limiting (free plan) ──────────────────────────────────────────────
  if (!isPro(profile)) {
    const now = new Date()
    const resetAt = new Date(profile?.ats_scans_reset_at ?? 0)
    const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceReset >= 24) {
      // Reset the daily counter
      await supabase
        .from('profiles')
        .update({ ats_scans_today: 0, ats_scans_reset_at: now.toISOString() })
        .eq('id', user.id)
      if (profile) {
        profile.ats_scans_today = 0
        profile.ats_scans_reset_at = now.toISOString()
      }
    }

    if ((profile?.ats_scans_today ?? 0) >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'FREE_LIMIT_REACHED',
          scansUsed: 3,
          resetAt: profile?.ats_scans_reset_at,
        },
        { status: 429 }
      )
    }
  }

  // ── Determine model + prompt ───────────────────────────────────────────────
  const model = getATSModel(profile)
  const pro = isPro(profile)
  const schema = pro ? ADVANCED_SCHEMA : BASIC_SCHEMA
  const system = pro ? ADVANCED_SYSTEM : BASIC_SYSTEM
  const jobContext = jobDescription?.trim()
    ? `Job Description:\n${jobDescription}\n\n`
    : 'No job description provided — analyse against general ATS best practices.\n\n'

  const prompt = `${jobContext}Resume Text:\n${resumeText}\n\nReturn a JSON object matching exactly this schema:\n${schema}\n\nOnly include the max allowed suggestions for basic tier (3). For advanced, include all. Ensure all number fields are integers 0-100.`

  // ── Call Claude ────────────────────────────────────────────────────────────
  let result: ATSResult

  try {
    result = await callClaudeJSON<ATSResult>({
      model,
      system,
      prompt,
      maxTokens: pro ? 8192 : 2048,
      timeoutMs: 90000,
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
    console.error('ATS score error:', msg)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  // ── Save to ats_scores ─────────────────────────────────────────────────────
  const { data: savedScore } = await supabase
    .from('ats_scores')
    .insert({
      user_id: user.id,
      resume_id: resumeId ?? null,
      job_description: jobDescription ?? null,
      score: result.score,
      missing_keywords: result.missingKeywords ?? [],
      suggestions: result.suggestions ?? [],
      scan_tier: result.tier ?? (pro ? 'advanced' : 'basic'),
    })
    .select('id')
    .single()

  // ── Increment free scan count ──────────────────────────────────────────────
  if (!pro) {
    await supabase
      .from('profiles')
      .update({ ats_scans_today: (profile?.ats_scans_today ?? 0) + 1 })
      .eq('id', user.id)
  }

  const scansRemaining = pro ? null : getRemainingFreeScans(profile) - 1

  return NextResponse.json<APIResponse<ATSScoreResponse>>(
    {
      success: true,
      data: {
        ...result,
        scanTier: result.tier ?? (pro ? 'advanced' : 'basic'),
        scansRemaining: scansRemaining !== null ? Math.max(0, scansRemaining) : null,
        scoreId: savedScore?.id ?? '',
      },
    },
    { status: 200 }
  )
}
