import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { analyzeResume } from '@/lib/claude'
import { getRemainingFreeScans, isPro } from '@/lib/planUtils'
import { FREE_PLAN } from '@/lib/pricing'
import type { APIResponse, ATSResult, ATSSuggestion, ATSScanTier, Profile, FreeATSResult, ProATSResult, ResumeData } from '@/types'

type ATSScoreResponse = ATSResult & {
  pipeline: 'free_ats' | 'pro_ats'
  scansRemaining: number | null
  scoreId: string
  scanTier: ATSScanTier
}

function toPercent(score: number, max: number): number {
  if (!max) return 0
  return Math.max(0, Math.min(100, Math.round((score / max) * 100)))
}

function buildFreeSuggestions(result: FreeATSResult): ATSSuggestion[] {
  return result.missing_sections.map(section => ({
    category: 'keywords',
    severity: 'medium',
    issue: `Missing ${section} section`,
    fix: `Add a clear ${section} section using a standard resume heading.`,
  }))
}

function buildProSuggestions(result: ProATSResult): ATSSuggestion[] {
  const suggestions: ATSSuggestion[] = []

  for (const [category, data] of Object.entries(result.section_scores)) {
    const mappedCategory: ATSSuggestion['category'] =
      category === 'formatting' ? 'formatting'
        : category === 'education' ? 'education'
        : category === 'skills' ? 'skills'
        : category === 'summary' ? 'summary'
        : 'experience'

    for (const issue of data.issues ?? []) {
      suggestions.push({
        category: mappedCategory,
        severity: data.score < data.max * 0.5 ? 'high' : data.score < data.max * 0.75 ? 'medium' : 'low',
        issue,
        fix: result.top_3_fixes.find(fix => fix.toLowerCase().includes(issue.toLowerCase().split(' ')[0])) ?? result.top_3_fixes[0] ?? 'Improve this section for better ATS performance.',
      })
    }
  }

  return suggestions
}

function normalizeATSResult(result: FreeATSResult | ProATSResult, pro: boolean): ATSResult {
  if (!pro) {
    const freeResult = result as FreeATSResult
    return {
      score: freeResult.ats_score,
      tier: 'basic',
      missingKeywords: freeResult.missing_sections ?? [],
      presentKeywords: freeResult.detected_sections ?? [],
      suggestions: buildFreeSuggestions(freeResult),
      summary: freeResult.has_quantified_achievements
        ? `Resume scored ${freeResult.ats_score}/100. Core sections detected: ${(freeResult.detected_sections ?? []).join(', ') || 'none'}.`
        : `Resume scored ${freeResult.ats_score}/100 and needs stronger quantified achievements plus clearer ATS structure.`,
      scoreBreakdown: {
        keywordMatch: toPercent(freeResult.section_scores.keyword_optimization.score, freeResult.section_scores.keyword_optimization.max),
        formatting: toPercent(freeResult.section_scores.formatting.score, freeResult.section_scores.formatting.max),
        relevance: toPercent(freeResult.section_scores.content_quality.score, freeResult.section_scores.content_quality.max),
        completeness: toPercent(freeResult.section_scores.section_structure.score, freeResult.section_scores.section_structure.max),
        keywordDensity: toPercent(freeResult.section_scores.length_density.score, freeResult.section_scores.length_density.max),
      },
      keywordAnalysis: {
        mustHave: freeResult.missing_sections ?? [],
        niceToHave: [],
        overused: [],
      },
      formattingIssues: [],
    }
  }

  const proResult = result as ProATSResult
  return {
    score: proResult.ats_score,
    tier: 'advanced',
    missingKeywords: proResult.missing_sections ?? [],
    presentKeywords: proResult.detected_sections ?? [],
    suggestions: buildProSuggestions(proResult),
    summary: proResult.overall_assessment,
    scoreBreakdown: {
      keywordMatch: toPercent(proResult.section_scores.keyword_optimization.score, proResult.section_scores.keyword_optimization.max),
      formatting: toPercent(proResult.section_scores.formatting.score, proResult.section_scores.formatting.max),
      relevance: toPercent(proResult.section_scores.content_quality.score, proResult.section_scores.content_quality.max),
      completeness: toPercent(proResult.section_scores.section_structure.score, proResult.section_scores.section_structure.max),
      keywordDensity: toPercent(proResult.section_scores.length_density.score, proResult.section_scores.length_density.max),
    },
    keywordAnalysis: {
      mustHave: proResult.missing_sections ?? [],
      niceToHave: proResult.skills_section_suggestion?.missing_high_value_skills ?? [],
      overused: [],
    },
    industryInsight: proResult.summary_suggestion ?? undefined,
    formattingIssues: proResult.section_scores.formatting.issues ?? [],
  }
}

function resumeDataToText(data: ResumeData | null): string {
  if (!data) return ''

  const parts: string[] = [
    data.name,
    data.currentRole,
    data.summary,
    data.email,
    data.phone,
    data.location,
    data.linkedin,
    data.website,
  ]

  for (const item of data.experience) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of data.education) {
    parts.push(item.institution, item.degree, item.field, item.graduationDate, item.gpa)
  }

  parts.push(...data.skills)

  for (const item of data.projects) {
    parts.push(item.name, item.description, ...(item.technologies ?? []))
  }

  for (const item of data.certifications) {
    parts.push(item.name, item.issuer, item.date)
  }

  for (const item of data.volunteer) {
    parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
    parts.push(...item.bullets)
  }

  for (const item of data.awards) {
    parts.push(item.title, item.issuer, item.date)
  }

  for (const item of data.publications) {
    parts.push(item.title, item.publisher, item.date)
  }

  parts.push(...data.languages, ...data.interests, ...data.references)

  for (const section of data.customSections ?? []) {
    parts.push(section.title)
    if (section.type === 'text') parts.push(section.text ?? '')
    if (section.type === 'tags') parts.push(...(section.tags ?? []))
    if (section.type === 'complex') {
      for (const item of section.items ?? []) {
        parts.push(item.title, item.company, item.location, item.startDate, item.endDate, item.summary ?? '')
        parts.push(...(item.bullets ?? []))
      }
    }
  }

  return parts.map(part => part?.trim()).filter(Boolean).join('\n')
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
  let body: { resumeText: string; resumeId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  let { resumeText } = body
  const { resumeId } = body

  if ((!resumeText || resumeText.trim().length < 100) && resumeId) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('raw_text, parsed_data')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()

    const fallbackText =
      resume?.raw_text?.trim() ||
      resumeDataToText((resume?.parsed_data as ResumeData | null) ?? null)

    if (fallbackText.trim().length > 0) {
      resumeText = fallbackText
    }
  }

  // ── Input validation ───────────────────────────────────────────────────────
  if (!resumeText || resumeText.trim().length < 100) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'RESUME_TOO_SHORT' },
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
  const pro = isPro(profile)

  // ── Rate limiting (free plan) ──────────────────────────────────────────────
  if (!pro) {
    const now = new Date()
    const resetAt = new Date(profile?.ats_scans_reset_at ?? 0)
    const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceReset >= 24) {
      await supabase
        .from('profiles')
        .update({ ats_scans_today: 0, ats_scans_reset_at: now.toISOString() })
        .eq('id', user.id)
      if (profile) {
        profile.ats_scans_today = 0
        profile.ats_scans_reset_at = now.toISOString()
      }
    }

    if ((profile?.ats_scans_today ?? 0) >= FREE_PLAN.limits.atsScansPerDay) {
      return NextResponse.json(
        {
          success: false,
          error: 'FREE_LIMIT_REACHED',
          scansUsed: FREE_PLAN.limits.atsScansPerDay,
          resetAt: profile?.ats_scans_reset_at,
        },
        { status: 429 }
      )
    }
  }

  // ── Trim input to tier limit ───────────────────────────────────────────────
  const maxChars = pro ? 20000 : 8000
  const trimmedText = resumeText.slice(0, maxChars)

  // ── Call LLM pipeline ─────────────────────────────────────────────────────
  const pipeline = pro ? 'pro_ats' : 'free_ats'
  const llmResult = pro
    ? await analyzeResume<ProATSResult>(pipeline, trimmedText)
    : await analyzeResume<FreeATSResult>(pipeline, trimmedText)

  if (!llmResult.success) {
    console.error('ATS score error:', {
      error: llmResult.error,
      pipeline,
      pro,
      inputChars: trimmedText.length,
      details: llmResult.details ?? [],
    })
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  const result = llmResult.data
  const normalizedResult = normalizeATSResult(result, pro)

  // ── Save to ats_scores ─────────────────────────────────────────────────────
  const { data: savedScore } = await supabase
    .from('ats_scores')
    .insert({
      user_id: user.id,
      resume_id: resumeId ?? null,
      job_description: null,
      score: normalizedResult.score,
      missing_keywords: normalizedResult.missingKeywords,
      suggestions: [],
      scan_tier: pro ? 'advanced' : 'basic',
    })
    .select('id')
    .single()

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/resumes')
  if (resumeId) {
    revalidatePath(`/dashboard/resumes/${resumeId}`)
  }

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
        ...normalizedResult,
        pipeline,
        scansRemaining: scansRemaining !== null ? Math.max(0, scansRemaining) : null,
        scoreId: savedScore?.id ?? '',
        scanTier: pro ? 'advanced' : 'basic',
      },
    },
    { status: 200 }
  )
}
