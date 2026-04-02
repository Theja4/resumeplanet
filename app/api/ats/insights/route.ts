import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import type { Profile, APIResponse } from '@/types'

const BASIC_SYSTEM = `You are an ATS resume analyst. Analyse the provided resume text and return 3-5 actionable improvement suggestions. Return ONLY valid JSON matching the schema. Focus on:
1. Weak action verbs in experience bullets — suggest stronger action verb replacements
2. Missing quantifiable metrics — numbers, percentages, dollar amounts
3. Missing keywords for the role described
4. Redundant or empty sections
5. Summary quality

For each suggestion:
- Provide a short title
- Specify the type: "action-verb", "metric", "keyword", "format", or "section"
- Include the exact BEFORE text (the specific word/phrase to replace)
- Include the suggested AFTER text (ready to apply)
- Specify sectionHint: "experience", "summary", "skills", "education", or "projects"

Return ONLY valid JSON matching this schema:
{
  "score": number 0-100,
  "scoreLabel": "Poor" | "Fair" | "Good" | "Excellent",
  "summary": "1-2 sentences about overall quality",
  "suggestions": [
    {
      "type": "action-verb" | "metric" | "keyword" | "format" | "section",
      "title": "string (short, e.g., Action Verb Suggestion)",
      "beforeText": "string (exact text in the resume to improve)",
      "afterText": "string (suggested replacement text)",
      "sectionHint": "experience" | "summary" | "skills" | "education" | "projects"
    }
  ]
}
Rules:
- NEVER fabricate data not in the source. Only suggest changes to existing content.
- Use empty array for suggestions if no improvements needed.
- Do NOT include markdown or explanation text — ONLY the JSON object.`

const ADVANCED_SYSTEM = `You are a senior ATS specialist and career coach with deep expertise in applicant tracking systems and resume optimization. Provide 5-10 actionable, specific improvement suggestions. Return ONLY valid JSON matching the schema. Focus on:
1. Weak action verbs — replace with stronger, more impactful alternatives
2. Missing quantifiable metrics — suggest realistic-sounding additions (e.g., "~N% increase", "N users", "$N revenue")
3. Missing industry keywords critical for the target role
4. Formatting issues that could hurt ATS parsing
5. Summary optimization for keyword density and impact
6. Experience bullet restructuring (STAR format: Situation, Task, Action, Result)
7. Skills ordering and missing complementary skills
8. Section gaps that are standard for the role

For each suggestion:
- Provide a descriptive title
- Specify the type: "action-verb", "metric", "keyword", "format", or "section"
- Include exact BEFORE text from the resume
- Include a detailed AFTER replacement with improved wording
- Specify the sectionHint

Return ONLY valid JSON matching this schema:
{
  "score": number 0-100,
  "scoreLabel": "Poor" | "Fair" | "Good" | "Excellent",
  "summary": "2-3 sentences comprehensive assessment",
  "suggestions": [
    {
      "type": "action-verb" | "metric" | "keyword" | "format" | "section",
      "title": "string",
      "beforeText": "string",
      "afterText": "string (detailed, production-ready replacement text)",
      "sectionHint": "experience" | "summary" | "skills" | "education" | "projects"
    }
  ]
}
Rules:
- Use the full resume context to make specific, relevant suggestions.
- NEVER fabricate false claims — only improve wording and add realistic metrics.
- Do NOT include markdown or explanation text — ONLY the JSON object.`

type InsightsResponse = {
  score: number
  scoreLabel: string
  summary: string
  suggestions: Array<{
    type: string
    title: string
    beforeText: string
    afterText: string
    sectionHint: string
  }>
}

function generateFallbackInsights(resumeText: string): InsightsResponse {
  const hasSummary = /summary|profile|objective|about me/i.test(resumeText)
  const expLines = resumeText.split('\n').filter(l => /^[A-Z]/.test(l) && /at |\.|\d/.test(l))
  const skillLines = resumeText.match(/Skills:?\s*(.*)/i)
  const hasSkills = skillLines && skillLines[1] && skillLines[1].split(/[,\|]/).length > 3
  const hasMetrics = /\d+%|\$\d+|\d+ users?|\d+ teams?/i.test(resumeText)

  const suggestions: InsightsResponse['suggestions'] = []

  if (!hasSummary) {
    suggestions.push({
      type: 'format',
      title: 'Add a Professional Summary',
      beforeText: '',
      afterText: 'Consider adding a 2-3 sentence summary highlighting your key experience, skills, and career goals.',
      sectionHint: 'summary',
    })
  }

  if (expLines.length > 0 && !hasMetrics) {
    suggestions.push({
      type: 'metric',
      title: 'Add Quantifiable Metrics',
      beforeText: expLines[0]?.substring(0, 50) ?? '',
      afterText: 'Include specific numbers: e.g., improved performance by 30%, managed 10+ clients, reduced costs by $50K.',
      sectionHint: 'experience',
    })
  }

  if (!hasSkills) {
    suggestions.push({
      type: 'keyword',
      title: 'Strengthen Skills Section',
      beforeText: '',
      afterText: 'Add relevant technical skills, tools, and technologies specific to your target role.',
      sectionHint: 'skills',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'format',
      title: 'Review Overall Structure',
      beforeText: '',
      afterText: 'Your resume looks good. Try tailoring it for a specific job description to improve keyword match.',
      sectionHint: 'summary',
    })
  }

  return {
    score: 50,
    scoreLabel: 'Fair',
    summary: 'We had trouble analyzing your resume right now. Here are some general recommendations.',
    suggestions,
  }
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

  let body: { resumeText: string; resumeId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const { resumeText, resumeId } = body
  if (!resumeText || resumeText.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Resume text too short' },
      { status: 400 }
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  const pro = isPro(profile)

  const system = pro ? ADVANCED_SYSTEM : BASIC_SYSTEM
  const prompt = `Resume Text:\n\n${resumeText}\n\nAnalyze this resume and return ONLY valid JSON matching the schema.`

  let result: InsightsResponse

  try {
    if (pro) {
      result = await callClaudeJSON<InsightsResponse>({
        model: process.env.ANTHROPIC_MODEL_PREMIUM || 'anthropic/claude-3.5-sonnet',
        system,
        prompt,
        maxTokens: 4096,
        timeoutMs: 180000,
      })
    } else {
      result = await callClaudeJSON<InsightsResponse>({
        model: process.env.ANTHROPIC_MODEL || 'qwen/qwen3.6-plus-preview:free',
        system,
        prompt,
        maxTokens: 2048,
        timeoutMs: 180000,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('AI analysis failed, using fallback:', msg)
    result = generateFallbackInsights(resumeText)
  }

  return NextResponse.json<APIResponse<InsightsResponse>>(
    { success: true, data: result },
    { status: 200 }
  )
}
