# ATS Insights Overhaul — Deterministic Scoring + Expert LLM Suggestions

**Date:** 2026-04-03
**Status:** Draft
**Goal:** Build a scoring system where applying fixes always improves the score, suggestions genuinely help users get shortlisted, and token costs are minimized.

---

## Problem Statement

The current system uses a single LLM call to both score the resume AND generate suggestions. This causes:
1. **Score regression after fixes** — rescanning produces a different score because LLM scoring is non-deterministic
2. **Double-rewriting** — apply-fix sends the suggestion through another LLM pass, drifting from what the user approved
3. **No per-suggestion impact** — users can't tell which fixes matter most
4. **Score not persisted** — dashboard/resume cards can't show the builder's ATS score

## Architecture: Two-Layer System

### Layer 1: Deterministic Resume Quality Scorer (zero LLM tokens)

A pure function `scoreResume(data: ResumeData): ScorerResult` that runs entirely in code. Evaluates structural quality, bullet strength, and ATS parseability.

#### Rubric (100 points)

| ID | Category | Max | Criteria |
|----|----------|-----|----------|
| `contact` | Contact Info | 8 | Name (2), professional email (2), phone (2), LinkedIn or website (2) |
| `summary` | Professional Summary | 12 | Exists (4), 30-80 words (4), contains at least 2 role-relevant terms from experience titles (4) |
| `exp_verbs` | Action Verbs | 12 | % of experience bullets starting with a strong action verb. 80%+ = 12, 60-79% = 8, 40-59% = 5, <40% = 2. Deduct 1 per filler phrase ("Responsible for", "Helped with", "Worked on", "Duties included", "Assisted in", "Participated in") |
| `exp_metrics` | Quantified Impact | 14 | Count of bullets containing quantified results (\d+%, $\d+, \d+ users/clients/teams, \d+x, etc.). 0 = 0, 1-2 = 4, 3-4 = 8, 5-7 = 11, 8+ = 14 |
| `exp_depth` | Experience Depth | 8 | Avg bullets per role: 4+ = 8, 3 = 6, 2 = 4, 1 = 2, 0 = 0. At least 2 roles required for full marks. |
| `skills` | Skills Section | 12 | Has skills section (4), 8+ skills listed (4), skills also appear within experience bullets — not just listed in isolation (4) |
| `structure` | Section Structure | 10 | Has experience (3), has education (3), has skills (2), standard ordering: summary > experience > education > skills (2) |
| `education` | Education | 6 | Institution (2), degree+field (2), graduation date (2) |
| `keywords` | Keyword Integration | 10 | Skills/technologies mentioned in experience context, not just skills list. Count of skills that appear in at least one bullet. 60%+ = 10, 40-59% = 7, 20-39% = 4, <20% = 1 |
| `polish` | Length & Polish | 8 | Word count 300-900 (3), no completely empty standard sections (3), no single-word bullets (2) |

**Total: 100**

#### Calibration & Score Labels

- **0-30 → "Poor":** Skeleton resume, missing major sections
- **31-55 → "Fair":** Has content but weak bullets, no metrics, filler phrases
- **56-80 → "Good":** Decent structure, some metrics, mixed verb quality
- **81-100 → "Excellent":** Strong throughout, well-integrated keywords, complete sections

#### Edge Cases

- No experience section: `exp_verbs`, `exp_metrics`, `exp_depth` all score 0 (not an error)
- No skills section: `skills` and `keywords` score 0
- No education section: `education` scores 0
- Empty resume: returns score 0 with all criteria at 0, `weakAreas` covers all categories

#### Return Type

```typescript
interface ScorerResult {
  score: number // 0-100
  scoreLabel: 'Poor' | 'Fair' | 'Good' | 'Excellent'
  breakdown: Record<string, {
    score: number
    max: number
    details: string // human-readable explanation
  }>
  weakAreas: Array<{
    criterionId: string
    currentScore: number
    maxScore: number
    gap: number // maxScore - currentScore
    description: string // what needs improvement
    // Data the LLM needs to generate a fix:
    relevantText: string[] // the specific bullets/text that are weak
  }>
}
```

`weakAreas` is sorted by `gap` descending — biggest improvement opportunities first. This becomes the input to the LLM suggestion prompt.

#### Action Verb Set

Maintain a curated set of ~120 strong action verbs organized by category:

- **Leadership:** Led, Directed, Managed, Oversaw, Coordinated, Mentored, Supervised
- **Achievement:** Achieved, Exceeded, Surpassed, Delivered, Accomplished, Earned
- **Creation:** Built, Designed, Developed, Created, Launched, Established, Founded, Pioneered
- **Improvement:** Improved, Optimized, Enhanced, Streamlined, Accelerated, Reduced, Increased
- **Technical:** Engineered, Architected, Implemented, Deployed, Automated, Migrated, Integrated
- **Analysis:** Analyzed, Evaluated, Assessed, Researched, Identified, Diagnosed, Audited
- **Communication:** Presented, Negotiated, Collaborated, Facilitated, Advocated, Persuaded
- **Operations:** Executed, Administered, Maintained, Processed, Resolved, Organized, Consolidated

#### Filler Phrase Set

Phrases that weaken bullets and should be flagged:

- "Responsible for", "Duties included", "Tasked with"
- "Helped with", "Assisted in", "Participated in", "Involved in"
- "Worked on", "Contributed to" (when used as the leading verb)
- "Successfully" (redundant — show success through results)
- "Various", "Multiple", "Several" (vague — use numbers)

---

### Layer 2: LLM Suggestion Generator (one focused call)

The deterministic scorer identifies WHAT is weak. The LLM figures out HOW to fix it.

#### Input Construction

From the `ScorerResult.weakAreas`, we build a focused prompt containing only the relevant sections. We do NOT send the full resume — only the weak text that needs improvement.

#### System Prompt

```
You are an elite resume strategist who has reviewed 50,000+ resumes and worked with Fortune 500 hiring managers and ATS systems (Workday, Greenhouse, Lever, Taleo).

Your task: rewrite specific resume text to maximize ATS pass-through rate and recruiter engagement. You will receive a list of weak areas identified by our scoring engine, along with the exact text that needs improvement.

REWRITING PRINCIPLES:

1. STAR STRUCTURE for every bullet:
   - Situation/Scope: Scale of responsibility (team size, budget, user base)
   - Task: What was the challenge or objective
   - Action: Specific action taken using a strong verb
   - Result: Quantified outcome (%, $, time saved, users impacted)
   Example: "Worked on improving deployment" becomes "Architected CI/CD pipeline reducing deployment time by 73% (45min to 12min), enabling 15+ daily releases across 3 engineering teams"

2. METRICS INJECTION:
   - If the original has no metrics, add realistic placeholders using [X] notation
   - Prefer concrete over vague: "[X]% reduction" not "significant improvement"
   - Common metric patterns: revenue ($[X]M), users ([X]K MAU), efficiency ([X]% faster), scale ([X] team members), time ([X] hours/week saved)
   - NEVER fabricate specific numbers — always use [X] for the user to fill in

3. ACTION VERB UPGRADES:
   - Replace passive/weak openings with category-appropriate strong verbs
   - Match verb to achievement type: "Led" for leadership, "Architected" for technical, "Negotiated" for business
   - Never start with "Responsible for", "Helped", "Worked on", "Assisted"

4. KEYWORD INTEGRATION:
   - Weave skills/technologies into achievement context naturally
   - Bad: "Used Python and SQL" → Good: "Engineered Python-based ETL pipeline processing [X]M daily records via optimized SQL queries"
   - Skills in context carry 3x more weight with ATS systems than skills in isolation

5. SUMMARY OPTIMIZATION:
   - Formula: [Title] with [X]+ years [domain expertise] | [Key differentiator] | [Top achievement with metric]
   - Must contain the target role's core keywords naturally
   - 2-3 sentences maximum, every word earns its place

HONESTY RULES (NON-NEGOTIABLE):
- NEVER invent experience, titles, companies, or skills the person doesn't have
- NEVER upgrade titles ("Analyst" stays "Analyst")
- Use [X] placeholders for any metric you cannot derive from the original text
- Only reframe what exists — amplify, don't fabricate

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema. No markdown fences, no explanation.

{
  "suggestions": [
    {
      "criterionId": "string (which scoring criterion this fixes, from the weak areas list)",
      "type": "action-verb" | "metric" | "keyword" | "format" | "section",
      "title": "string (short, specific title e.g. 'Strengthen deployment bullet with metrics')",
      "beforeText": "string (EXACT text from the resume, copy-paste precision)",
      "afterText": "string (the complete replacement text, ready to apply)",
      "sectionHint": "experience" | "summary" | "skills" | "education" | "projects",
      "estimatedPoints": number (how many rubric points this fix is worth),
      "reasoning": "string (one sentence: what changed and why it scores higher)"
    }
  ]
}

RULES:
- Generate exactly one suggestion per weak area provided
- beforeText must be an EXACT substring match from the resume text provided
- estimatedPoints must be realistic based on the rubric gap provided
- Order suggestions by estimatedPoints descending (highest impact first)
- Maximum 8 suggestions per scan
```

#### User Prompt Construction (built in code)

```typescript
function buildSuggestionPrompt(weakAreas: WeakArea[], resumeData: ResumeData): string {
  const parts: string[] = ['WEAK AREAS TO FIX:\n']
  
  for (const area of weakAreas.slice(0, 8)) {
    parts.push(`--- ${area.criterionId} (${area.currentScore}/${area.maxScore}, gap: ${area.gap} pts) ---`)
    parts.push(`Issue: ${area.description}`)
    parts.push(`Text to improve:\n${area.relevantText.join('\n')}\n`)
  }
  
  // Only include sections relevant to weak areas
  parts.push('\nRESUME CONTEXT (relevant sections only):')
  // ... include only the sections that contain weak text
  
  return parts.join('\n')
}
```

This keeps the prompt tight — only weak sections, not the full resume. Typical prompt: ~500-1000 tokens input, ~800-1200 tokens output.

---

### Apply Fix Flow (zero LLM tokens)

1. User clicks "Apply Fix" on a suggestion card
2. `afterText` is applied directly to `resumeData` — no API call, no LLM
3. Deterministic scorer re-runs on updated `resumeData`
4. Score ring animates to new value
5. Other suggestion cards update their `estimatedPoints` if the scorer breakdown changed
6. Score is persisted to `resumes.ats_score` via the existing auto-save debounce

#### Fix Application Logic (replaces current fuzzy matching)

```typescript
function applyFixToResumeData(
  data: ResumeData,
  suggestion: Suggestion
): ResumeData {
  const updated = structuredClone(data)
  const { beforeText, afterText, sectionHint } = suggestion

  if (sectionHint === 'experience') {
    for (const exp of updated.experience) {
      const idx = exp.bullets.indexOf(beforeText)
      if (idx !== -1) {
        exp.bullets[idx] = afterText
        return updated
      }
    }
    // Fallback: partial match (beforeText is a substring of a bullet)
    for (const exp of updated.experience) {
      const idx = exp.bullets.findIndex(b => b.includes(beforeText))
      if (idx !== -1) {
        exp.bullets[idx] = exp.bullets[idx].replace(beforeText, afterText)
        return updated
      }
    }
  }

  if (sectionHint === 'summary') {
    if (beforeText && updated.summary.includes(beforeText)) {
      updated.summary = updated.summary.replace(beforeText, afterText)
    } else {
      updated.summary = afterText
    }
    return updated
  }

  if (sectionHint === 'skills') {
    // For skills, afterText is a comma-separated list
    updated.skills = afterText.split(',').map(s => s.trim()).filter(Boolean)
    return updated
  }

  return updated // no match found, return unchanged
}
```

Key improvement: exact `indexOf` match first, partial `includes` as fallback, never silently replace summary as catch-all.

---

### Score Persistence

#### Migration: `011_add_ats_score_to_resumes.sql`

```sql
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS ats_score integer;
```

#### When `ats_score` is written:

1. **After insights scan** — scorer runs, score saved
2. **After fix applied** — scorer re-runs, score updated (via existing auto-save debounce on `resumeData` change)
3. **After ATS checker page scan** — same scorer, score saved

#### Dashboard reads:

- **"Last ATS Score" stat card** — `SELECT MAX(ats_score) FROM resumes WHERE user_id = $1`
- **Resume cards** — `ats_score` column read directly from the resume row (no join to `ats_scores`)

---

### ATS Checker Page Integration

The ATS checker page (`/dashboard/ats-checker`) uses the same `scoreResume()` function. The scorer is a shared utility in `lib/ats-scorer.ts`. Results are consistent across builder insights and the standalone checker.

When the checker page completes a scan:
1. Run `scoreResume(parsedData)` 
2. Save score to `resumes.ats_score`
3. Optionally insert a row into `ats_scores` for history

---

### Tailor Feature (Layer 2 — JD Match)

When the user pastes a job description and clicks "Start Tailoring":

1. Deterministic scorer runs first (base quality)
2. LLM receives: resume text + job description + base score breakdown
3. LLM returns: keyword gap analysis, tailored bullet rewrites, match score 0-100
4. Match score shown separately as "JD Match: X%" alongside the base quality score
5. Tailored suggestions follow the same apply-fix flow (exact afterText, scorer re-runs)

This is a separate feature — not changing the current tailor implementation in this spec. But the scorer infrastructure supports it.

---

### File Structure

```
lib/
  ats-scorer.ts          # scoreResume(), rubric definitions, verb/filler sets
  ats-scorer-verbs.ts    # ACTION_VERBS set, FILLER_PHRASES set

app/api/ats/
  insights/route.ts      # Uses scorer for scoring, LLM for suggestions only
  apply-fix/route.ts     # DELETED or gutted — apply is now client-side only
  score/route.ts         # Uses same scorer

components/builder/
  AIInsightsPanel.tsx     # Shows scorer breakdown, live score updates
  AIInsightCard.tsx       # Shows "+N pts" badge per suggestion

supabase/migrations/
  011_add_ats_score_to_resumes.sql
```

---

### Token Cost Comparison

| Action | Current | New |
|--------|---------|-----|
| Insights scan (score + suggestions) | ~3000 input + ~2000 output = ~5000 tokens | ~800 input + ~1200 output = ~2000 tokens (suggestions only, no scoring) |
| Apply fix | ~500 tokens per fix (LLM rewrite) | 0 tokens (client-side) |
| Apply all (5 fixes) | ~2500 tokens | 0 tokens |
| Rescan after fixes | ~5000 tokens (full re-analysis) | ~2000 tokens (if suggestions needed) or 0 (scorer only) |
| **Total for full flow** | **~12,500 tokens** | **~2,000-4,000 tokens** |

~70-85% token reduction.
