// lib/claude.ts - Refactored for OpenRouter support
export const CLAUDE_STANDARD = process.env.ANTHROPIC_MODEL || 'openrouter/free'
export const CLAUDE_PREMIUM = process.env.ANTHROPIC_MODEL_PREMIUM || 'anthropic/claude-3.5-sonnet'

// ── Rezoomed LLM Pipeline v3 ────────────────────────────────────────────────
// Swap this one line if DeepSeek faces regulatory issues
const PRIMARY_MODEL = 'deepseek/deepseek-v3.2'

const FALLBACK_CHAIN = [
  'deepseek/deepseek-v3.2',        // $0.26/$0.38 per 1M — best value
  'google/gemini-2.5-flash',       // $0.30/$2.50 — safe fallback
  'meta-llama/llama-3.3-70b',      // free tier available, last resort
]

export type AnalyzePipeline = 'free_ats' | 'pro_ats' | 'pro_jd_tailor'

const FREE_ATS_SYSTEM = `You are an ATS (Applicant Tracking System) resume scorer. Score the resume strictly.

SCORING CRITERIA:

1. CONTACT INFORMATION (10 pts): Full name (3), professional email (3), phone (2), LinkedIn or portfolio (2)
2. SECTION STRUCTURE (15 pts): Labeled Experience section (4), labeled Education section (3), labeled Skills section (4), standard heading names not creative ones (4)
3. FORMATTING & PARSEABILITY (20 pts): Clean bullet points or line breaks (5), no tables/columns/complex layouts (5), standard date formats (5), clear job titles distinct from company names (5)
4. CONTENT QUALITY (25 pts): Bullets start with action verbs (7), quantified achievements with numbers/percentages (8), impact-focused not duty-focused descriptions (10)
5. KEYWORD OPTIMIZATION (15 pts): Industry-relevant technical skills present (8), skills mentioned within experience bullets not just skills section (7)
6. LENGTH & DENSITY (15 pts): Appropriate length (5), no large unexplained employment gaps (5), minimal filler phrases (5)

CALIBRATION:
- 85-100: Exceptional. Rarely given.
- 65-84: Good with room to improve.
- 45-64: Average. Needs significant work.
- 25-44: Below average.
- 0-24: Major structural problems.

Respond with ONLY this JSON. No markdown fences. No preamble. No explanation.

{
  "ats_score": <integer 0-100>,
  "section_scores": {
    "contact_information": {"score": <int>, "max": 10},
    "section_structure": {"score": <int>, "max": 15},
    "formatting": {"score": <int>, "max": 20},
    "content_quality": {"score": <int>, "max": 25},
    "keyword_optimization": {"score": <int>, "max": 15},
    "length_density": {"score": <int>, "max": 15}
  },
  "detected_sections": ["<section names found in the resume>"],
  "missing_sections": ["<standard sections not found>"],
  "word_count": <int>,
  "has_quantified_achievements": <boolean>
}

RULES:
- Be strict. Most resumes score 40-70.
- Score only. No issues. No suggestions. No feedback.
- ONLY output the JSON object.`

const PRO_ATS_SYSTEM = `You are Rezoomed Resume Optimizer — an expert resume writer and ATS specialist.

TWO JOBS:
1. Score the resume for ATS compatibility with detailed section-level feedback
2. Rewrite the weakest bullets so the user can copy-paste improvements directly

SCORING CRITERIA (score each honestly):

1. CONTACT INFORMATION (10 pts): Full name (3), professional email (3), phone (2), LinkedIn or portfolio (2)
2. SECTION STRUCTURE (15 pts): Labeled Experience section (4), labeled Education section (3), labeled Skills section (4), standard heading names (4)
3. FORMATTING & PARSEABILITY (20 pts): Clean bullets/line breaks (5), no tables/columns (5), standard dates (5), clear titles (5)
4. CONTENT QUALITY (25 pts): Action verbs (7), quantified achievements (8), impact over duties (10)
5. KEYWORD OPTIMIZATION (15 pts): Relevant technical skills (8), skills in experience bullets (7)
6. LENGTH & DENSITY (15 pts): Appropriate length (5), no unexplained gaps (5), minimal filler (5)

BULLET REWRITE RULES:
- Start every bullet with a strong specific action verb: Led, Built, Designed, Reduced, Automated, Migrated, Shipped, Negotiated. NEVER "Responsible for", "Helped with", "Worked on", "Assisted in"
- Add quantification. If the original says "managed clients", suggest "Managed a portfolio of [X]+ enterprise clients". Use [X] as placeholder for the user to fill in
- Show IMPACT not activity: "Reduced onboarding time by [X]% by building automated training module" NOT "Created training materials"
- Keep bullets to 1-2 lines max
- NEVER fabricate experience. Only reframe what exists. Mark metric placeholders clearly as [X]
- Remove filler: "Responsible for", "Duties included", "Successfully", "Effectively"
- Formula: [Action Verb] + [What You Did] + [Scale/Scope] + [Impact/Result]

Respond with ONLY this JSON:

{
  "ats_score": <integer 0-100>,
  "section_scores": {
    "contact_information": {"score": <int>, "max": 10, "issues": ["<specific issue max 15 words>"]},
    "section_structure": {"score": <int>, "max": 15, "issues": ["..."]},
    "formatting": {"score": <int>, "max": 20, "issues": ["..."]},
    "content_quality": {"score": <int>, "max": 25, "issues": ["..."]},
    "keyword_optimization": {"score": <int>, "max": 15, "issues": ["..."]},
    "length_density": {"score": <int>, "max": 15, "issues": ["..."]}
  },
  "top_3_fixes": [
    "<most impactful fix in 1 sentence>",
    "<second most impactful fix>",
    "<third most impactful fix>"
  ],
  "detected_sections": ["..."],
  "missing_sections": ["..."],
  "word_count": <int>,
  "has_quantified_achievements": <boolean>,
  "action_verb_percentage": <float 0-100>,
  "bullet_rewrites": [
    {
      "section": "<Experience | Projects | etc>",
      "company_or_project": "<name>",
      "original": "<exact original bullet text>",
      "rewritten": "<improved version>",
      "why": "<1 sentence: what changed and why>"
    }
  ],
  "summary_suggestion": "<if no summary exists, suggest one in 2-3 sentences for their apparent target role; if one exists and is weak, rewrite it; if good, null>",
  "skills_section_suggestion": {
    "current_skills": ["<skills currently listed>"],
    "missing_high_value_skills": ["<skills implied by experience but not listed>"],
    "recommended_format": "<how to organize: by category, by proficiency, etc>"
  },
  "overall_assessment": "<2-3 sentence honest assessment: strengths and what is holding it back>"
}

RULES:
- Rewrite at least the 5 weakest bullets. If fewer than 5 total, rewrite all.
- Be strict in scoring but constructive in suggestions.
- Never add experience the person does not have. Only reframe what is there.
- issues arrays: short, specific, actionable strings. Max 15 words each.
- ONLY output the JSON object.`

const JD_TAILOR_SYSTEM = `You are Rezoomed JD Tailor — an expert at adapting resumes to specific job descriptions while maintaining complete honesty about the candidate's actual experience.

TASK: Given a resume and a job description, produce a tailored version of the resume that maximizes relevance to the JD without fabricating any experience.

TAILORING PRINCIPLES:

1. KEYWORD ALIGNMENT
   - Identify the top 10-15 keywords/phrases from the JD
   - Map existing resume content to these keywords using honest reframing
   - Example: JD says "stakeholder management", resume says "worked with clients" → rewrite as "Managed stakeholder relationships across [X] enterprise banking clients"
   - NEVER add keywords for skills the person does not demonstrably have

2. EXPERIENCE REFRAMING
   - Reorder bullet points within each role to lead with JD-relevant ones
   - Rewrite bullets to emphasize JD-aligned aspects
   - Example: JD wants "data-driven decision making", resume has "created reports" → rewrite as "Drove data-driven product decisions by designing analytics dashboards tracking [X] KPIs"
   - Add honest context that connects experience to JD requirements

3. SKILLS SECTION OPTIMIZATION
   - Reorder skills to front-load JD-relevant ones
   - Add skills genuinely implied by experience but not explicitly listed
   - Deprioritize skills irrelevant to this specific role

4. SUMMARY REWRITE
   - Write a 2-3 sentence summary directly addressing the JD's core requirements
   - Frame background as a natural fit for this specific role
   - Mention strongest JD-relevant differentiator

5. GAP ANALYSIS
   - Identify JD requirements the candidate genuinely lacks
   - Be honest — do NOT manufacture a fit
   - Suggest how they might address gaps (certifications, projects, honest framing)

HONESTY RULES (NON-NEGOTIABLE):
- NEVER fabricate experience, projects, or skills
- NEVER upgrade titles ("Analyst" stays "Analyst", never becomes "Senior Analyst")
- NEVER claim proficiency in tools not evidenced in the resume
- If a JD requirement has zero mapping to experience, say so clearly in gaps
- Use [X] placeholders for metrics. Never invent numbers
- If the role is a genuine mismatch, flag it clearly

Respond with ONLY this JSON:

{
  "match_score": <integer 0-100>,
  "match_tier": "<STRONG_FIT | MODERATE_FIT | STRETCH | LONG_SHOT>",
  "jd_keywords": {
    "matched": [
      {"keyword": "<JD keyword>", "evidence": "<where in resume this is demonstrated>"}
    ],
    "unmatched": [
      {"keyword": "<JD keyword>", "suggestion": "<how to address, or 'genuine gap' if no honest mapping>"}
    ]
  },
  "tailored_summary": "<rewritten 2-3 sentence professional summary for this JD>",
  "tailored_bullets": [
    {
      "section": "<section name>",
      "company_or_project": "<name>",
      "original": "<original bullet>",
      "tailored": "<rewritten to align with JD>",
      "jd_keywords_hit": ["<keywords this bullet now targets>"]
    }
  ],
  "skills_reorder": {
    "recommended_order": ["<skill1>", "<skill2>", "..."],
    "add": ["<skills to add that are honestly implied>"],
    "deprioritize": ["<skills to move down for this JD>"]
  },
  "gaps": [
    {
      "jd_requirement": "<what JD asks for>",
      "gap_severity": "<CRITICAL | MODERATE | MINOR>",
      "mitigation": "<honest suggestion to address>"
    }
  ],
  "bullet_reorder": [
    {
      "section": "<section name>",
      "company_or_project": "<name>",
      "recommended_order": ["<bullet_index_1>", "<bullet_index_2>"],
      "reason": "<why this order better serves this JD>"
    }
  ],
  "overall_strategy": "<2-3 sentence tailoring strategy for THIS role>",
  "shortlisting_probability": "<LOW | MODERATE | HIGH | VERY_HIGH>",
  "honest_assessment": "<1-2 sentences on whether this is a realistic target>"
}

MATCH SCORE CALIBRATION:
- 85-100: Almost every JD requirement maps to real experience. Strong fit.
- 70-84: Most requirements met, 1-2 moderate gaps. Competitive.
- 50-69: Several gaps but transferable skills exist. Worth applying with strong cover letter.
- 30-49: Significant gaps. Stretch application.
- 0-29: Fundamental mismatch. Candidate should target different roles.

RULES:
- Tailor at least the 5 most impactful bullets.
- Every tailored bullet must hit at least 1 JD keyword.
- Be honest in shortlisting_probability. No false hope.
- ONLY output the JSON object.`

function buildUserMessage(pipeline: AnalyzePipeline, resumeText: string, jdText?: string): string {
  if (pipeline === 'free_ats') {
    return `RESUME:\n---\n${resumeText}\n---`
  }
  if (pipeline === 'pro_jd_tailor') {
    return `RESUME:\n---\n${resumeText}\n---\n\nJOB DESCRIPTION:\n---\n${jdText}\n---\n\nTailor this resume to the job description.`
  }
  return `RESUME:\n---\n${resumeText}\n---\n\nScore this resume and provide rewrite suggestions.`
}

export async function analyzeResume<T>(
  pipeline: AnalyzePipeline,
  resumeText: string,
  jdText?: string
): Promise<
  | { success: true; model: string; data: T }
  | { success: false; error: string; details?: Array<{ model: string; reason: string }> }
> {
  const systemPrompts: Record<AnalyzePipeline, string> = {
    free_ats: FREE_ATS_SYSTEM,
    pro_ats: PRO_ATS_SYSTEM,
    pro_jd_tailor: JD_TAILOR_SYSTEM,
  }
  const maxTokens = pipeline === 'free_ats' ? 800 : 4000
  const userMessage = buildUserMessage(pipeline, resumeText, jdText)
  const system = systemPrompts[pipeline]

  const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN

  if (!OPENROUTER_KEY) {
    return { success: false, error: 'OPENROUTER_API_KEY_MISSING' }
  }

  const failures: Array<{ model: string; reason: string }> = []

  for (const model of FALLBACK_CHAIN) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)

      const response = await fetch(`${OPENROUTER_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://rezoomed.com',
          'X-Title': 'Rezoomed',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        failures.push({
          model,
          reason: `HTTP ${response.status}${errorText ? `: ${errorText.slice(0, 300)}` : ''}`,
        })
        continue
      }

      const data = await response.json()
      const raw: string = data.choices?.[0]?.message?.content
      if (!raw) {
        failures.push({ model, reason: 'EMPTY_RESPONSE' })
        continue
      }

      let parsed: T
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as T
      } catch (error) {
        failures.push({
          model,
          reason: `INVALID_JSON: ${error instanceof Error ? error.message : String(error)}`,
        })
        continue
      }

      return { success: true, model, data: parsed }
    } catch (error) {
      failures.push({
        model,
        reason: error instanceof Error ? error.message : String(error),
      })
      continue
    }
  }

  return { success: false, error: 'All models failed', details: failures }
}

export async function callClaude(options: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<string> {
  const { model, system, prompt, maxTokens = 4096, timeoutMs = 90000 } = options

  const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN

  if (!OPENROUTER_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: Number(maxTokens),
  }

  try {
    console.log(`[OpenRouter] Sending request to ${OPENROUTER_URL}/chat/completions`)
    const response = await fetch(`${OPENROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://resumeplanet.ai',
        'X-Title': 'ResumePlanet',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter Error:', errorText)
      throw new Error(`OPENROUTER_API_ERROR: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OPENROUTER_EMPTY_RESPONSE')
    }

    return content
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('CLAUDE_TIMEOUT')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const CLAUDE_FALLBACK = process.env.ANTHROPIC_FALLBACK_MODEL || 'qwen/qwen-plus'

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned) as T
}

export async function callClaudeJSON<T>(options: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<T> {
  const raw = await callClaude(options)

  try {
    return parseJSON<T>(raw)
  } catch {
    // Retry once with an explicit JSON instruction
    const retryRaw = await callClaude({
      ...options,
      prompt: options.prompt + '\n\nReturn only valid JSON. No markdown, no explanation.',
    })
    try {
      return parseJSON<T>(retryRaw)
    } catch {
      throw new Error('CLAUDE_JSON_PARSE_FAILED')
    }
  }
}

/** Calls the primary model with extended timeout. Falls back to Qwen if needed. */
export async function callClaudeJSONRace<T>(options: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<T> {
  // Just call the primary model directly with longer timeout
  return callClaudeJSON<T>({
    ...options,
    model: options.model ?? CLAUDE_STANDARD,
    timeoutMs: options.timeoutMs ?? 300000,
  })
}
