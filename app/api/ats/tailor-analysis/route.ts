import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON, CLAUDE_PREMIUM } from '@/lib/claude'
import { getResumeSkills, syncResumeData } from '@/lib/resume-data'
import { isPro } from '@/lib/planUtils'
import { countWords } from '@/lib/text'
import type { APIResponse, Profile, ResumeData, TailorAnalysis, TailorIntensity } from '@/types'

function getTailorSystemPrompt(hasMultipleSkillSections: boolean) {
  return `You are Rezoomed Tailor Engine, a senior recruiter + ATS strategist that rewrites resumes to maximize shortlist odds for a specific job description without ever fabricating facts.

You are generating DIRECT EDITS that will be applied back into the user's resume builder. Your output must be practical, specific, and grounded in the source resume.

PRIMARY GOAL:
- Increase ATS match quality and recruiter skim quality for this exact job description.

NON-NEGOTIABLE HONESTY RULES:
- Never invent employers, titles, teams, ownership, dates, tools, certifications, metrics, budgets, reports, projects, or outcomes.
- Never upgrade seniority beyond what the source supports.
- Never imply hands-on experience with a tool/discipline unless the resume already provides evidence.
- Never remove an important role, education entry, or substantive experience simply to look cleaner.
- Never collapse multiple roles into one.
- Do not use placeholders like [X], TBD, or bracketed filler text.

REWRITE STANDARD:
- Prefer strong, concrete, recruiter-readable action verbs.
- Front-load the requirements most likely to influence ATS screening.
- Convert vague responsibility bullets into outcome- and scope-oriented bullets when the source supports it.
- Keep rewrites believable, professional, and concise.
- Summary should read like a targeted positioning statement for THIS role, not generic resume fluff.
- Skills ordering should front-load job-relevant skills already evidenced in the resume.

INTENSITY DIALED BY USER:
- conservative: light touch. Keep structure/tone close to the original. Only obvious keyword alignment and phrasing cleanup.
- balanced: clear improvement. Rewrite summary, reorder skills, and rewrite the most important bullets for stronger fit.
- aggressive: push JD alignment hard while staying truthful. Rewrite more bullets, sharpen positioning, and reprioritize content heavily.
- overboard: maximum truthful optimization. Reframe every high-value bullet possible, aggressively front-load keywords and target-role language, but still never invent facts.

OUTPUT CONTRACT:
- Return ONLY valid JSON.
- Use exact original bullet text in bulletRewrites.original so the client can match it.
- sectionId must be one of: summary, skills, experience, projects, education, volunteer.
- bulletRewrites.sectionId must be one of: experience, volunteer, projects.
- bulletOrderPlans.sectionId must be one of: experience, volunteer.
- If a section does not need changes, omit it from sectionFocus or keep arrays empty.
- Keep bulletRewrites focused on the highest-leverage changes. Quality over quantity.
${hasMultipleSkillSections
  ? `- SKILL SECTIONS: The resume has multiple skill sections (e.g. "Product Delivery", "Domain", "Technical"). skillsPlan.recommendedOrder MUST contain one entry per section using the format "SectionTitle: skill1, skill2, ..." — include ALL sections, not just the most relevant one. Never nest section references inside a skill list (e.g. do NOT write "Product Delivery: story refinement" as a skill inside another section). Never emit strings like "Skill section -".`
  : `- SKILL SECTIONS: Return a flat array of skill names in skillsPlan.recommendedOrder. Do not use section prefixes like "SectionTitle:".`}

SCORING CALIBRATION:
- STRONG_FIT / HIGH or VERY_HIGH only when the resume already maps strongly to the role.
- If the role is a stretch, say so clearly in honestAssessment.

Return JSON matching this shape:
{
  "intensity": "conservative | balanced | aggressive | overboard",
  "matchScore": 0,
  "matchTier": "STRONG_FIT | MODERATE_FIT | STRETCH | LONG_SHOT",
  "shortlistingProbability": "LOW | MODERATE | HIGH | VERY_HIGH",
  "overallStrategy": "2-4 sentences",
  "honestAssessment": "1-3 sentences",
  "tailoredHeadline": "string",
  "tailoredSummary": "string",
  "matchedKeywords": [
    { "keyword": "string", "evidence": "string" }
  ],
  "missingKeywords": [
    { "keyword": "string", "suggestion": "string" }
  ],
  "skillsPlan": {
    "recommendedOrder": ["string"],
    "add": ["string"],
    "deprioritize": ["string"],
    "rationale": "string"
  },
  "sectionFocus": [
    {
      "sectionId": "summary | skills | experience | projects | education | volunteer",
      "priority": "high | medium | low",
      "title": "string",
      "reason": "string"
    }
  ],
  "bulletRewrites": [
    {
      "sectionId": "experience | volunteer | projects",
      "companyOrProject": "string",
      "original": "string",
      "tailored": "string",
      "keywordsHit": ["string"],
      "rationale": "string",
      "impact": "high | medium | low"
    }
  ],
  "bulletOrderPlans": [
    {
      "sectionId": "experience | volunteer",
      "companyOrProject": "string",
      "orderedOriginalBullets": ["string"],
      "reason": "string"
    }
  ]
}`
}

interface TailorBody {
  resumeData?: ResumeData
  jobDescription?: string
  intensity?: TailorIntensity
}

function normalizeResumeData(data: Partial<ResumeData> | null | undefined): ResumeData {
  return syncResumeData({
    name: data?.name ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    location: data?.location ?? '',
    linkedin: data?.linkedin ?? '',
    website: data?.website ?? '',
    summary: data?.summary ?? '',
    currentRole: data?.currentRole ?? '',
    experience: data?.experience ?? [],
    education: data?.education ?? [],
    skills: data?.skills ?? [],
    skillSections: data?.skillSections ?? [],
    certifications: data?.certifications ?? [],
    projects: data?.projects ?? [],
    languages: data?.languages ?? [],
    volunteer: data?.volunteer ?? [],
    interests: data?.interests ?? [],
    awards: data?.awards ?? [],
    publications: data?.publications ?? [],
    references: data?.references ?? [],
    customSections: data?.customSections ?? [],
  })
}

function resumeDataToTailorContext(data: ResumeData) {
  return JSON.stringify(
    {
      name: data.name,
      currentRole: data.currentRole,
      summary: data.summary,
      contact: {
        email: data.email,
        phone: data.phone,
        location: data.location,
        linkedin: data.linkedin,
        website: data.website,
      },
      experience: data.experience.map(item => ({
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: item.bullets,
      })),
      education: data.education,
      skills: getResumeSkills(data),
      skillSections: data.skillSections,
      projects: data.projects,
      certifications: data.certifications,
      volunteer: data.volunteer.map(item => ({
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: item.bullets,
      })),
      languages: data.languages,
      interests: data.interests,
      awards: data.awards,
      publications: data.publications,
      references: data.references,
    },
    null,
    2
  )
}

function normalizeTailorAnalysis(raw: Partial<TailorAnalysis> | null | undefined, intensity: TailorIntensity): TailorAnalysis {
  return {
    intensity,
    matchScore: Math.max(0, Math.min(100, Number(raw?.matchScore ?? 0))),
    matchTier: raw?.matchTier ?? 'MODERATE_FIT',
    shortlistingProbability: raw?.shortlistingProbability ?? 'MODERATE',
    overallStrategy: raw?.overallStrategy?.trim() ?? '',
    honestAssessment: raw?.honestAssessment?.trim() ?? '',
    tailoredHeadline: raw?.tailoredHeadline?.trim() ?? '',
    tailoredSummary: raw?.tailoredSummary?.trim() ?? '',
    matchedKeywords: (raw?.matchedKeywords ?? []).filter(item => item?.keyword && item?.evidence),
    missingKeywords: (raw?.missingKeywords ?? []).filter(item => item?.keyword),
    skillsPlan: {
      recommendedOrder: (raw?.skillsPlan?.recommendedOrder ?? []).filter(Boolean),
      add: (raw?.skillsPlan?.add ?? []).filter(Boolean),
      deprioritize: (raw?.skillsPlan?.deprioritize ?? []).filter(Boolean),
      rationale: raw?.skillsPlan?.rationale?.trim() ?? '',
    },
    sectionFocus: (raw?.sectionFocus ?? []).filter(item => item?.sectionId && item?.priority && item?.title),
    bulletRewrites: (raw?.bulletRewrites ?? []).filter(item => item?.sectionId && item?.original && item?.tailored),
    bulletOrderPlans: (raw?.bulletOrderPlans ?? []).filter(item => item?.sectionId && Array.isArray(item?.orderedOriginalBullets)),
  }
}

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
    .select('id, plan')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'id' | 'plan'> | null

  if (!isPro(profile as Profile | null)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Pro plan required' },
      { status: 403 }
    )
  }

  let body: TailorBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const resumeData = normalizeResumeData(body.resumeData)
  const jobDescription = body.jobDescription?.trim() ?? ''
  const intensity: TailorIntensity = body.intensity ?? 'balanced'

  if (countWords(jobDescription) < 20) {
    return NextResponse.json<APIResponse<never>>(
      { 
        success: false, 
        error: 'JOB_DESCRIPTION_TOO_SHORT', 
        message: 'Job description must be at least 20 words. Try copying the full duties and requirements.' 
      },
      { status: 400 }
    )
  }

  if (jobDescription.length > 25000) {
    return NextResponse.json<APIResponse<never>>(
      { 
        success: false, 
        error: 'JOB_DESCRIPTION_TOO_LONG', 
        message: 'Job description is too long (max 25,000 characters). Please focus on the key requirements.' 
      },
      { status: 400 }
    )
  }

  const resumeText = JSON.stringify(resumeData)
  if (resumeText.length > 60000) {
    return NextResponse.json<APIResponse<never>>(
      { 
        success: false, 
        error: 'RESUME_TOO_LONG', 
        message: 'Resume data is too large for AI analysis. Try removing some older or irrelevant sections.' 
      },
      { status: 400 }
    )
  }

  const hasResumeContent =
    resumeData.summary.trim() ||
    resumeData.currentRole.trim() ||
    resumeData.experience.length > 0 ||
    resumeData.skills.length > 0

  if (!hasResumeContent) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Resume content too short' },
      { status: 400 }
    )
  }

  const prompt = `USER-SELECTED INTENSITY: ${intensity}

JOB DESCRIPTION:
---
${jobDescription.slice(0, 16000)}
---

STRUCTURED RESUME DATA:
---
${resumeDataToTailorContext(resumeData)}
---

Produce the strongest truthful tailoring plan possible for this candidate against this JD.

Priority order:
1. Improve shortlist odds for ATS + recruiter skim.
2. Make the headline and summary look role-specific.
3. Rewrite the highest-value bullets that can honestly absorb the JD language.
4. Reorder skills and bullets to front-load relevance.
5. Be explicit about real gaps instead of pretending they do not exist.

Remember:
- Use exact original bullet text in bulletRewrites.original.
- tailoredHeadline should be a better target-facing version of currentRole, but never inflate seniority.
- tailoredSummary should be recruiter-ready prose, not fragments.
- skillsPlan.add may only contain skills clearly implied by the existing resume.
- bulletOrderPlans.orderedOriginalBullets should only reference bullets that already exist in the source resume.
- Keep the output compact, high-signal, and directly actionable.`

  try {
    const analysis = await callClaudeJSON<TailorAnalysis>({
      model: CLAUDE_PREMIUM,
      system: getTailorSystemPrompt(resumeData.skillSections.length > 1),
      prompt,
      maxTokens: 8192,
      timeoutMs: 180000,
    })

    return NextResponse.json<APIResponse<TailorAnalysis>>(
      { success: true, data: normalizeTailorAnalysis(analysis, intensity) },
      { status: 200 }
    )
  } catch (error) {
    console.error('Tailor analysis error:', error)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
