// Per-section Claude prompts for the LinkedIn rewrite Pro feature.
//
// Design notes:
// - Every system prompt forces JSON output so we never have to parse prose.
// - "About" prompt explicitly guards against the corporate-AI tone that
//   triggers reader distrust (per the brief's "trust penalty" note).
// - Outputs include a short rationale so the UI can show *why* the rewrite is
//   different — helps users decide whether to accept.

import { CLAUDE_PREMIUM, callClaudeJSON } from '@/lib/claude'

export type GeneratorType = 'headline' | 'about' | 'experience_bullets' | 'skills'

export interface GenerateInput {
  generator: GeneratorType
  targetRole: string
  currentText: string
  targetJobDescription?: string
  resumeContext?: {
    headline?: string | null
    currentRole?: string | null
    topSkills?: string[]
  } | null
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

function systemFor(generator: GeneratorType): string {
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

function buildPrompt(input: GenerateInput): string {
  const parts: string[] = []
  parts.push(`Target role: ${input.targetRole}`)
  if (input.targetJobDescription?.trim()) {
    parts.push(`Target job description:\n${input.targetJobDescription.trim()}`)
  }
  if (input.resumeContext) {
    const lines: string[] = []
    if (input.resumeContext.headline) lines.push(`Resume headline/summary: ${input.resumeContext.headline}`)
    if (input.resumeContext.currentRole) lines.push(`Resume current role: ${input.resumeContext.currentRole}`)
    if (input.resumeContext.topSkills?.length) {
      lines.push(`Resume skills: ${input.resumeContext.topSkills.join(', ')}`)
    }
    if (lines.length) parts.push(`Resume context (use as ground truth — don't contradict it):\n${lines.join('\n')}`)
  }
  parts.push(`Current LinkedIn ${input.generator.replace('_', ' ')}:\n${input.currentText.trim() || '(empty)'}`)
  return parts.join('\n\n')
}

export const GENERATOR_PROMPT_VERSION = 1

export async function runGenerator(input: GenerateInput): Promise<RewriteResult> {
  const system = systemFor(input.generator)
  const prompt = buildPrompt(input)

  const raw = await callClaudeJSON<Partial<RewriteResult>>({
    model: CLAUDE_PREMIUM,
    system,
    prompt,
    maxTokens: input.generator === 'about' ? 1200 : 800,
    temperature: 0.6,
  })

  const rewrite = (raw.rewrite ?? '').trim()
  const rewriteLines = Array.isArray(raw.rewriteLines)
    ? raw.rewriteLines.map((line) => String(line).trim()).filter(Boolean)
    : undefined
  const rationale = (raw.rationale ?? '').trim() || 'No rationale provided.'

  return { rewrite, rewriteLines, rationale }
}
