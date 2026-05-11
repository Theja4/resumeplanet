import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON, CLAUDE_PREMIUM } from '@/lib/claude'
import { hasUnresolvedPlaceholderText, startsWithWeakResumePhrase } from '@/lib/ai-insights'
import { getResumeSkills, syncResumeData } from '@/lib/resume-data'
import { isPro } from '@/lib/planUtils'
import { countWords } from '@/lib/text'
import type { APIResponse, Profile, ResumeData, TailorAnalysis, TailorIntensity } from '@/types'

function getTailorSystemPrompt(hasMultipleSkillSections: boolean) {
  return `You are Rezoomed Tailor Engine, a senior recruiter + ATS strategist that rewrites resumes to maximize shortlist odds for a specific job description without ever fabricating facts.

You are generating DIRECT EDITS that will be applied back into the user's resume builder. Your output must be practical, specific, and grounded in the source resume.

PRIMARY GOAL:
- Increase ATS match quality and recruiter skim quality for this exact job description.

HELPFULNESS STANDARD:
- Extract the maximum truthful alignment possible from the resume for the selected intensity.
- The user should get a complete, directly actionable tailoring plan, not generic advice.
- The strongest output usually improves headline, summary, skill ordering, top bullets, and gap framing.
- Do not under-tailor when stronger truthful alignment is available. Do not over-tailor by adding unsupported claims.

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
- tailoredHeadline should be 4-9 words, target-facing, and built from supported role/function/domain terms. Good: "Product Delivery Manager | AI Support Workflows". Bad: "Visionary Senior AI Product Leader" when seniority or AI leadership is not supported.
- tailoredSummary should be 45-75 words across 2-3 sentences. It must mention the target role direction, 2-4 supported capabilities, and one concrete supported outcome or scope signal when available.
- matchedKeywords evidence must quote or closely mirror source resume evidence.

INTENSITY DIALED BY USER:
- conservative: light touch. Keep structure/tone close to the original. Improve headline/summary only if clearly weak, reorder skills, and rewrite 2-4 obvious high-value bullets.
- balanced: clear improvement. Rewrite headline/summary, reorder skills, and rewrite 4-7 important bullets for stronger fit.
- aggressive: push JD alignment hard while staying truthful. Rewrite 6-10 bullets, sharpen positioning, and reprioritize content heavily.
- overboard: maximum truthful optimization. Reframe every high-value bullet possible, usually 8-14 rewrites if supported, aggressively front-load keywords and target-role language, but still never invent facts.

GOOD TAILORING EXAMPLES:
- JD asks for "stakeholder management"; resume says "Coordinated weekly updates with clients and implementation teams" -> "Coordinated stakeholder updates across client and implementation teams to keep delivery risks, timelines, and handoffs visible."
- JD asks for "SQL dashboards"; resume says "Built reporting dashboards using SQL" -> "Built SQL reporting dashboards that helped teams monitor performance trends and prioritize operational follow-up."

BAD TAILORING EXAMPLES:
- Adding "Python, AWS, Kubernetes" when those tools do not appear in the resume.
- Turning "Analyst" into "Senior Product Strategist" when the title/scope does not support it.
- Adding "improved revenue by 35%" unless that exact metric is already present in the source resume.

OUTPUT CONTRACT:
- Return ONLY valid JSON.
- Use exact original bullet text in bulletRewrites.original so the client can match it.
- sectionId must be one of: summary, skills, experience, projects, education, volunteer.
- bulletRewrites.sectionId must be one of: experience, volunteer, projects.
- bulletOrderPlans.sectionId must be one of: experience, volunteer.
- If a section does not need changes, omit it from sectionFocus or keep arrays empty.
- Keep bulletRewrites focused on the highest-leverage changes. Quality over quantity.
- Every tailored bullet must improve JD alignment and remain paste-ready for a real resume.
- If a JD requirement is unsupported, list it in missingKeywords or honestAssessment instead of forcing it into the resume.
${hasMultipleSkillSections
  ? `- SKILL SECTIONS: The resume has multiple skill sections (e.g. "Product Delivery", "Domain", "Technical"). skillsPlan.recommendedOrder MUST contain one entry per section using the format "SectionTitle: skill1, skill2, ..." — include ALL sections, not just the most relevant one. Never nest section references inside a skill list (e.g. do NOT write "Product Delivery: story refinement" as a skill inside another section). Never emit strings like "Skill section -".`
  : `- SKILL SECTIONS: Return a flat array of skill names in skillsPlan.recommendedOrder. Do not use section prefixes like "SectionTitle:".`}

SCORING CALIBRATION:
- STRONG_FIT / HIGH or VERY_HIGH only when the resume already maps strongly to the role.
- If the role is a stretch, say so clearly in honestAssessment.
- matchScore 85-100: strong direct fit with most critical requirements supported.
- matchScore 70-84: credible fit with one major gap or several secondary gaps.
- matchScore 55-69: partial fit with transferable evidence but important gaps.
- matchScore below 55: stretch or long shot unless the user adds stronger evidence.

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

function normalizeComparableText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function extractNumericTokens(text: string) {
  return new Set((text.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? []).map(token => token.toLowerCase()))
}

function hasUnsupportedNumericClaim(beforeText: string, afterText: string, sourceText: string) {
  const beforeNumbers = extractNumericTokens(beforeText)
  const sourceNumbers = extractNumericTokens(sourceText)
  const afterNumbers = extractNumericTokens(afterText)

  for (const token of afterNumbers) {
    if (!beforeNumbers.has(token) && !sourceNumbers.has(token)) return true
  }

  return false
}

function collectTailorEditableText(data: ResumeData) {
  return {
    sourceText: [
      data.currentRole,
      data.summary,
      ...getResumeSkills(data),
      ...data.experience.flatMap(item => [item.company, item.title, ...item.bullets]),
      ...data.projects.flatMap(item => [
        item.name,
        item.description,
        ...(item.bullets ?? []),
        ...(item.technologies ?? []),
      ]),
      ...data.volunteer.flatMap(item => [item.company, item.title, ...item.bullets]),
      ...data.education.flatMap(item => [item.institution, item.degree, item.field, item.gpa]),
      ...data.certifications.flatMap(item => [item.name, item.issuer]),
    ]
      .map(value => value?.trim())
      .filter(Boolean)
      .join('\n'),
    experienceBullets: new Set(data.experience.flatMap(item => item.bullets.map(normalizeComparableText))),
    volunteerBullets: new Set(data.volunteer.flatMap(item => item.bullets.map(normalizeComparableText))),
    projectTexts: new Set(
      data.projects.flatMap(item => [
        item.description,
        ...(item.bullets ?? []),
      ].map(normalizeComparableText))
    ),
    existingSkills: new Set(getResumeSkills(data).map(skill => skill.toLowerCase().trim())),
  }
}

function isSupportedRewrite(
  rewrite: TailorAnalysis['bulletRewrites'][number],
  evidence: ReturnType<typeof collectTailorEditableText>
) {
  const original = normalizeComparableText(rewrite.original ?? '')
  const tailored = normalizeComparableText(rewrite.tailored ?? '')

  if (!original || !tailored || original === tailored) return false
  if (hasUnresolvedPlaceholderText(tailored)) return false
  if (startsWithWeakResumePhrase(tailored)) return false
  if (hasUnsupportedNumericClaim(original, tailored, evidence.sourceText)) return false

  if (rewrite.sectionId === 'experience') return evidence.experienceBullets.has(original)
  if (rewrite.sectionId === 'volunteer') return evidence.volunteerBullets.has(original)
  if (rewrite.sectionId === 'projects') return evidence.projectTexts.has(original)
  return false
}

function normalizeTailorAnalysis(
  raw: Partial<TailorAnalysis> | null | undefined,
  intensity: TailorIntensity,
  resumeData: ResumeData
): TailorAnalysis {
  const evidence = collectTailorEditableText(resumeData)
  const sourceTextLower = evidence.sourceText.toLowerCase()
  const supportedSkillAdds = (raw?.skillsPlan?.add ?? [])
    .map(skill => skill?.trim())
    .filter((skill): skill is string => Boolean(skill))
    .filter(skill => {
      const lower = skill.toLowerCase()
      return !evidence.existingSkills.has(lower) && sourceTextLower.includes(lower)
    })

  const supportedRewrites = (raw?.bulletRewrites ?? [])
    .filter(item => item?.sectionId && item?.original && item?.tailored)
    .filter(item => isSupportedRewrite(item, evidence))
    .map(item => ({
      ...item,
      original: normalizeComparableText(item.original),
      tailored: normalizeComparableText(item.tailored),
    }))

  const supportedOrderPlans = (raw?.bulletOrderPlans ?? [])
    .filter(item => item?.sectionId && Array.isArray(item?.orderedOriginalBullets))
    .map(item => ({
      ...item,
      orderedOriginalBullets: item.orderedOriginalBullets
        .map(normalizeComparableText)
        .filter(bullet =>
          item.sectionId === 'experience'
            ? evidence.experienceBullets.has(bullet)
            : evidence.volunteerBullets.has(bullet)
        ),
    }))
    .filter(item => item.orderedOriginalBullets.length >= 2)

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
      add: supportedSkillAdds,
      deprioritize: (raw?.skillsPlan?.deprioritize ?? []).filter(Boolean),
      rationale: raw?.skillsPlan?.rationale?.trim() ?? '',
    },
    sectionFocus: (raw?.sectionFocus ?? []).filter(item => item?.sectionId && item?.priority && item?.title),
    bulletRewrites: supportedRewrites,
    bulletOrderPlans: supportedOrderPlans,
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
      system: getTailorSystemPrompt((resumeData.skillSections?.length ?? 0) > 1),
      prompt,
      maxTokens: 8192,
      timeoutMs: 180000,
    })

    return NextResponse.json<APIResponse<TailorAnalysis>>(
      { success: true, data: normalizeTailorAnalysis(analysis, intensity, resumeData) },
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
