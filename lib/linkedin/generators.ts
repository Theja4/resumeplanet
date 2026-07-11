// Per-section Claude prompts for the LinkedIn rewrite Pro feature.
//
// Design notes:
// - Every system prompt forces JSON output so we never have to parse prose.
// - "About" prompt explicitly guards against the corporate-AI tone that
//   triggers reader distrust (per the brief's "trust penalty" note).
// - Outputs include a short rationale so the UI can show *why* the rewrite is
//   different — helps users decide whether to accept.
// - Two modes:
//     * 'polish' (default) — improve current LinkedIn text; resume context is
//       a supplementary signal but the primary source is the LinkedIn input.
//     * 'from_resume' — generate LinkedIn output using the resume as ground
//       truth, broadening vocabulary for LinkedIn's recruiter Boolean net
//       without inventing facts. Used by the Resume↔LinkedIn consistency
//       sync flow.

import { CLAUDE_PREMIUM, callClaudeJSON } from '@/lib/claude'

export type GeneratorType = 'headline' | 'about' | 'experience_bullets' | 'skills'

export type GeneratorMode = 'polish' | 'from_resume'

export interface GenerateInput {
  generator: GeneratorType
  targetRole: string
  /** LinkedIn current text. Treated as primary source in 'polish' mode and
   *  as supplementary anti-contradiction signal in 'from_resume' mode. */
  currentText: string
  targetJobDescription?: string
  resumeContext?: {
    headline?: string | null
    currentRole?: string | null
    topSkills?: string[]
    /** Richer context used by from_resume mode. Optional. */
    experienceBullets?: string[]
    summary?: string | null
  } | null
  mode?: GeneratorMode
}

export interface RewriteResult {
  rewrite: string
  rewriteLines?: string[] // only for experience_bullets / skills
  rationale: string
}

const COMMON_GUIDANCE = `
Hard constraints:
- Respond with raw JSON only. No markdown fences, no preamble.
- Never invent employers, dates, degrees, metrics, or projects not present in the input.
- If the input is too thin to rewrite responsibly, set "rewrite" to "" and explain in "rationale".
- British or American spelling: match the input.
`.trim()

const HEADLINE_SYSTEM = `You rewrite LinkedIn headlines so recruiters' Boolean searches surface them. ${COMMON_GUIDANCE}

Headline rules:
- Maximum 220 characters. Aim for 90–160.
- Lead with role/specialty, separator (|), then 2–3 concrete domains/tools/audiences, separator, then a short proof or unique angle.
- Pull keywords from the target role + JD. Skip vanity adjectives ("passionate", "dynamic", "results-driven").
- Output JSON: {"rewrite": "<headline>", "rationale": "<one sentence explaining the keyword choices>"}.`

const ABOUT_SYSTEM = `You rewrite LinkedIn About sections in the candidate's voice. ${COMMON_GUIDANCE}

About rules:
- First-person. Mix sentence lengths — short punchy lines interleaved with one or two longer ones.
- Open with a concrete hook in 1–2 lines (what they do + the kind of problem they solve), not a self-description.
- Include at least one specific anecdote or quantified outcome drawn from the input. If no metric exists, say so plainly instead of inventing one.
- BAN these phrases and any close paraphrase: "passionate about", "team player", "results-oriented", "detail-oriented", "fast-paced environment", "results-driven", "synergy", "leverage", "excellence", "thrive", "go-getter", "rockstar", "ninja", "huge fan of".
- 700–1500 characters. Three or four paragraphs. End with a short line about what they're open to.
- Output JSON: {"rewrite": "<about text with \\n\\n between paragraphs>", "rationale": "<one sentence>"}.`

const BULLETS_SYSTEM = `You rewrite LinkedIn Experience bullets so each one is scannable, quantified, and keyword-aligned. ${COMMON_GUIDANCE}

Bullets rules:
- Each bullet 18–30 words, starts with an action verb, ends with measurable impact (numbers, %, $, time saved, team size, scope).
- 4–6 bullets total. No fluff bullets ("worked closely with stakeholders"); cut anything that doesn't say what changed.
- Use vocabulary the target role's recruiters search for, but only when the underlying work supports the term.
- Output JSON: {"rewriteLines": ["bullet 1", "bullet 2", ...], "rewrite": "<rewriteLines joined with \\n>", "rationale": "<one sentence>"}.`

const SKILLS_SYSTEM = `You suggest the LinkedIn Skills list a recruiter Boolean search for the target role would actually filter on. ${COMMON_GUIDANCE}

Skills rules:
- Return 18–25 skills, ordered by how likely a recruiter is to filter on them for this role.
- Only include skills the candidate plausibly has based on the current text + resume context. Don't invent expertise.
- Mix hard skills, tools/platforms, and methodologies. Avoid soft skills unless they're in recruiter Boolean strings for this role.
- Output JSON: {"rewriteLines": ["skill 1", "skill 2", ...], "rewrite": "<rewriteLines joined with \\n>", "rationale": "<one sentence>"}.`

function systemFor(generator: GeneratorType, mode: GeneratorMode): string {
  if (mode === 'from_resume') {
    return systemForFromResume(generator)
  }
  switch (generator) {
    case 'headline':
      return HEADLINE_SYSTEM
    case 'about':
      return ABOUT_SYSTEM
    case 'experience_bullets':
      return BULLETS_SYSTEM
    case 'skills':
      return SKILLS_SYSTEM
  }
}

const FROM_RESUME_PREAMBLE = `
You are running in RESUME-AS-GROUND-TRUTH mode. The candidate's resume has already been carefully ATS-optimized; you are now translating that resume content onto LinkedIn.

Hard rules for this mode:
- Treat the supplied resume context as the PRIMARY source of facts. The current LinkedIn text (if any) is a secondary signal you may consult only to preserve voice and avoid contradicting things the candidate already publicly stated.
- Do not invent employers, titles, dates, metrics, or projects that aren't in the resume.
- Broaden vocabulary for LinkedIn's wider keyword net: where the resume says "PM", you may also include "Product Manager"; where the resume lists "Roadmapping", you may surface "roadmap" / "prioritization". Synonyms must remain truthful.
- Do not strip ATS keywords. LinkedIn surfaces both human readers and Boolean searches — keep the ATS-friendly terms AND add the recruiter-Boolean-friendly synonyms.
- If the resume context is too thin to support a section, set "rewrite" to "" and explain in "rationale".
`.trim()

const HEADLINE_FROM_RESUME = `${FROM_RESUME_PREAMBLE}

Headline rules:
- Maximum 220 characters. Aim for 90–160.
- Lead with the candidate's role/specialty (from resume currentRole / latest experience title), then 2–3 concrete domains/tools/audiences pulled from the resume, then a short proof or unique angle.
- Include 1–2 Boolean-friendly synonyms (e.g. "Product Manager | PM" rather than just "PM"). Recruiters running OR clauses will then surface the profile regardless of which abbreviation they typed.
- Skip vanity adjectives ("passionate", "dynamic", "results-driven").
- Output JSON: {"rewrite": "<headline>", "rationale": "<one sentence on which resume facts you pulled and what synonyms you added>"}.`

const ABOUT_FROM_RESUME = `${FROM_RESUME_PREAMBLE}

About rules:
- First-person. Mix sentence lengths.
- Open with a concrete hook in 1–2 lines built from the candidate's resume summary + currentRole. No self-description openings ("I am a passionate…").
- Use at least one specific anecdote or quantified outcome drawn from the resume's experience bullets. Don't invent — if no metric exists, use a non-metric concrete detail.
- Layer in Boolean-friendly synonyms (industry, methodology, tooling) so a recruiter searching the LinkedIn keyword net catches the profile.
- BAN these phrases and any close paraphrase: "passionate about", "team player", "results-oriented", "detail-oriented", "fast-paced environment", "results-driven", "synergy", "leverage", "excellence", "thrive", "go-getter", "rockstar", "ninja", "huge fan of".
- 700–1500 characters. Three or four paragraphs. End with a short line about what they're open to.
- Output JSON: {"rewrite": "<about text with \\n\\n between paragraphs>", "rationale": "<one sentence>"}.`

const BULLETS_FROM_RESUME = `${FROM_RESUME_PREAMBLE}

Bullets rules:
- Pull bullets from the resume's experienceBullets. Rewrite each one to read naturally on LinkedIn (slightly more first-person, less terse), but PRESERVE every metric, scope number, percentage, or dollar figure verbatim.
- Each bullet 18–30 words, starts with an action verb, ends with measurable impact.
- 4–6 bullets total. Drop boilerplate ("worked closely with stakeholders") if present in the resume.
- Add Boolean-friendly variants where natural ("Owned product roadmap and prioritization for B2B SaaS" — covers both "roadmap" and "prioritization" tokens).
- Output JSON: {"rewriteLines": ["bullet 1", "bullet 2", ...], "rewrite": "<rewriteLines joined with \\n>", "rationale": "<one sentence>"}.`

const SKILLS_FROM_RESUME = `${FROM_RESUME_PREAMBLE}

Skills rules:
- Start from the resume's topSkills. Add Boolean-friendly variants and adjacent skills the resume implies (e.g. resume has "Roadmapping" → also surface "Roadmap", "Product Strategy"; resume has "Python" → surface "Python", "Pandas" only if mentioned in the experienceBullets).
- 18–25 skills total. Order by how likely a recruiter Boolean for the target role is to filter on them.
- Mix hard skills, tools/platforms, and methodologies. Avoid soft skills unless they're in recruiter Boolean strings for this role.
- Never invent expertise the resume doesn't support.
- Output JSON: {"rewriteLines": ["skill 1", "skill 2", ...], "rewrite": "<rewriteLines joined with \\n>", "rationale": "<one sentence>"}.`

function systemForFromResume(generator: GeneratorType): string {
  switch (generator) {
    case 'headline':
      return HEADLINE_FROM_RESUME
    case 'about':
      return ABOUT_FROM_RESUME
    case 'experience_bullets':
      return BULLETS_FROM_RESUME
    case 'skills':
      return SKILLS_FROM_RESUME
  }
}

function buildPrompt(input: GenerateInput): string {
  const parts: string[] = []
  parts.push(`Target role: ${input.targetRole}`)
  if (input.targetJobDescription?.trim()) {
    parts.push(`Target job description:\n${input.targetJobDescription.trim()}`)
  }
  if (input.resumeContext) {
    const lines: string[] = []
    if (input.resumeContext.headline) lines.push(`Resume headline/summary: ${input.resumeContext.headline}`)
    if (input.resumeContext.summary && input.resumeContext.summary !== input.resumeContext.headline) {
      lines.push(`Resume professional summary: ${input.resumeContext.summary}`)
    }
    if (input.resumeContext.currentRole) lines.push(`Resume current role: ${input.resumeContext.currentRole}`)
    if (input.resumeContext.topSkills?.length) {
      lines.push(`Resume skills: ${input.resumeContext.topSkills.join(', ')}`)
    }
    if (input.resumeContext.experienceBullets?.length) {
      // Limit to a manageable number of bullets so the prompt stays focused.
      const bullets = input.resumeContext.experienceBullets.slice(0, 12)
      lines.push(`Resume top experience bullets:\n${bullets.map((b) => `- ${b}`).join('\n')}`)
    }
    if (lines.length) {
      const heading =
        input.mode === 'from_resume'
          ? `Resume (PRIMARY SOURCE — use as ground truth):`
          : `Resume context (use as ground truth — don't contradict it):`
      parts.push(`${heading}\n${lines.join('\n')}`)
    }
  }
  const linkedinHeading =
    input.mode === 'from_resume'
      ? `Current LinkedIn ${input.generator.replace('_', ' ')} (secondary; preserve voice, do not contradict):`
      : `Current LinkedIn ${input.generator.replace('_', ' ')}:`
  parts.push(`${linkedinHeading}\n${input.currentText.trim() || '(empty)'}`)
  return parts.join('\n\n')
}

// Bumped to 2 because the prompt branch now varies on `mode`. Cached
// from_resume results must not collide with cached polish results.
export const GENERATOR_PROMPT_VERSION = 2

export async function runGenerator(input: GenerateInput): Promise<RewriteResult> {
  const mode: GeneratorMode = input.mode ?? 'polish'
  const system = systemFor(input.generator, mode)
  const prompt = buildPrompt({ ...input, mode })

  const raw = await callClaudeJSON<Partial<RewriteResult>>({
    model: CLAUDE_PREMIUM,
    system,
    prompt,
    // On GPT-5.x this cap includes reasoning tokens; the old 800/1200 caps
    // would starve the visible output. temperature only reaches
    // non-reasoning fallback models.
    maxTokens: input.generator === 'about' ? 3000 : 2400,
    temperature: 0.6,
    reasoningEffort: 'low',
    verbosity: 'low',
    label: 'linkedin_rewrite',
  })

  const rewrite = (raw.rewrite ?? '').trim()
  const rewriteLines = Array.isArray(raw.rewriteLines)
    ? raw.rewriteLines.map((line) => String(line).trim()).filter(Boolean)
    : undefined
  const rationale = (raw.rationale ?? '').trim() || 'No rationale provided.'

  return { rewrite, rewriteLines, rationale }
}
