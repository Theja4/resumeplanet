import { NextRequest, NextResponse } from 'next/server'
import {
  buildAIRequestSignature,
  readAIRequestCache,
  writeAIRequestCache,
} from '@/lib/aiRequestCache'
import { CLAUDE_PREMIUM } from '@/lib/claude'
import { readBearerClaims } from '@/lib/extensionAuth'
import { isPro } from '@/lib/planUtils'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  GENERATOR_PROMPT_VERSION,
  type GeneratorType,
  runGenerator,
} from '@/lib/linkedin/generators'
import type { ResumeData } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Sync-from-resume runs four single-section generators in parallel
// (headline, about, experience_bullets, skills) using the user's
// resume as PRIMARY source. This is the Pro-only "Resume↔LinkedIn
// consistency" Pro fix — the moat over Careerflow's format converter.
//
// Apply UX is unchanged: this endpoint produces text the extension
// shows next to Copy + Open-in-LinkedIn buttons. We never auto-write
// to LinkedIn (their UX terms forbid it).

const SYNC_GENERATORS: ReadonlyArray<GeneratorType> = [
  'headline',
  'about',
  'experience_bullets',
  'skills',
]

interface RequestBody {
  targetRole?: unknown
  /** Optional explicit resume to sync from. Defaults to most recent. */
  resumeId?: unknown
  /** Optional pasted JD that augments the per-section AND clauses. */
  targetJobDescription?: unknown
  /** Current LinkedIn text per section, scraped client-side. Used as
   *  anti-contradiction signal — never as primary source in this mode. */
  linkedinCurrent?: {
    headline?: unknown
    about?: unknown
    experience_bullets?: unknown
    skills?: unknown
  }
}

interface SyncSectionPayload {
  generator: GeneratorType
  rewrite: string
  rewriteLines?: string[]
  rationale: string
  cached: boolean
  /** Empty when the resume context was too thin to support this section. */
  empty: boolean
}

const MAX_TARGET_ROLE = 200
const MAX_JD = 8_000
const MAX_LINKEDIN_TEXT = 12_000

function clampString(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, max)
}

interface ResumePullResult {
  resumeId: string
  resumeTitle: string
  context: {
    headline: string | null
    currentRole: string | null
    topSkills: string[]
    experienceBullets: string[]
    summary: string | null
  }
}

/**
 * Pull the user's resume + extract the bits the from_resume generator
 * cares about. Returns null when the user has no resume — caller
 * should respond with hasResume:false so the UI can prompt upload.
 */
async function loadResumeBundle(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  requestedId: string | null
): Promise<ResumePullResult | null> {
  const baseQuery = supabase
    .from('resumes')
    .select('id, title, parsed_data')
    .eq('user_id', userId)

  const { data } = requestedId
    ? await baseQuery.eq('id', requestedId).maybeSingle()
    : await baseQuery.order('updated_at', { ascending: false }).limit(1).maybeSingle()

  if (!data?.parsed_data) return null

  const parsed = data.parsed_data as ResumeData

  // Pull bullets from up to the 3 most recent experience entries. We
  // cap depth so the prompt stays tight; the model sees the recent,
  // relevant work rather than a 10-year archaeology dump.
  const experienceBullets: string[] = []
  for (const entry of (parsed.experience ?? []).slice(0, 3)) {
    if (!entry?.bullets) continue
    for (const bullet of entry.bullets) {
      if (typeof bullet === 'string' && bullet.trim()) experienceBullets.push(bullet.trim())
    }
  }

  return {
    resumeId: data.id as string,
    resumeTitle: (data.title as string) || 'Untitled resume',
    context: {
      headline: parsed.summary?.trim() || null,
      currentRole:
        parsed.currentRole?.trim() || parsed.experience?.[0]?.title?.trim() || null,
      topSkills: (parsed.skills ?? []).slice(0, 18),
      experienceBullets: experienceBullets.slice(0, 12),
      summary: parsed.summary?.trim() || null,
    },
  }
}

export async function POST(request: NextRequest) {
  // 1. JWT verification — same path as the rest of /api/extension/*.
  const claims = await readBearerClaims(request)
  if (!claims) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  // 2. Parse + validate body.
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }
  const targetRole = clampString(body.targetRole, MAX_TARGET_ROLE).trim()
  if (!targetRole) {
    return NextResponse.json({ error: 'missing_target_role' }, { status: 400 })
  }
  const targetJobDescription = clampString(body.targetJobDescription, MAX_JD).trim() || undefined
  const requestedResumeId =
    typeof body.resumeId === 'string' && body.resumeId ? body.resumeId : null

  const linkedinCurrent: Record<GeneratorType, string> = {
    headline: clampString(body.linkedinCurrent?.headline, MAX_LINKEDIN_TEXT),
    about: clampString(body.linkedinCurrent?.about, MAX_LINKEDIN_TEXT),
    experience_bullets: clampString(body.linkedinCurrent?.experience_bullets, MAX_LINKEDIN_TEXT),
    skills: clampString(body.linkedinCurrent?.skills, MAX_LINKEDIN_TEXT),
  }

  const supabase = createServiceRoleClient()

  // 3. Entitlement: re-read plan from DB. Sync is Pro-only.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, payment_provider, current_period_end')
    .eq('id', claims.sub)
    .single()
  if (!profile || !isPro(profile as Parameters<typeof isPro>[0])) {
    return NextResponse.json(
      {
        error: 'pro_required',
        message: 'Resume↔LinkedIn sync is a Rezoomed Pro feature.',
        upgradeUrl: 'https://rezoomed.com/pricing?ref=ext_sync_gate',
      },
      { status: 402 }
    )
  }

  // 4. Rate-limit (sync runs 4 generators in one request — keep this
  // tighter than per-section /generate, which is 10 per 5 minutes).
  const rl = await consumeRateLimit({
    request,
    scope: 'linkedin_rewrite_authenticated',
    limit: 6,
    windowSeconds: 300,
    userId: claims.sub,
  })
  if (!rl.allowed) {
    return createRateLimitResponse(rl)
  }

  // 5. Load resume bundle. Without a resume there's nothing to sync.
  const bundle = await loadResumeBundle(supabase, claims.sub, requestedResumeId)
  if (!bundle) {
    return NextResponse.json(
      {
        error: 'no_resume',
        message:
          'No resume found. Upload a resume to Rezoomed first, then run sync again.',
      },
      { status: 404 }
    )
  }

  // 6. Run the four generators in parallel. Each one reuses the
  // standard ai_request_cache pattern so a re-run with the same
  // inputs returns the cached rewrite without billing tokens.
  const sections = await Promise.all(
    SYNC_GENERATORS.map((generator) =>
      runOneSection({
        supabase,
        userId: claims.sub,
        generator,
        targetRole,
        targetJobDescription,
        currentText: linkedinCurrent[generator],
        resumeContext: bundle.context,
      })
    )
  )

  // 7. Metadata log (no profile content stored).
  await supabase.from('linkedin_generations').insert({
    user_id: claims.sub,
    generator_type: 'sync_from_resume',
    target_role: targetRole,
    features_used: {
      used_jd: !!targetJobDescription,
      used_resume: true,
      resume_id: bundle.resumeId,
      sections_run: sections.map((s) => s.generator),
    },
    cached: sections.every((s) => s.cached),
    model: CLAUDE_PREMIUM,
  })

  return NextResponse.json(
    {
      resumeId: bundle.resumeId,
      resumeTitle: bundle.resumeTitle,
      sections,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}

interface RunOneSectionArgs {
  supabase: ReturnType<typeof createServiceRoleClient>
  userId: string
  generator: GeneratorType
  targetRole: string
  targetJobDescription?: string
  currentText: string
  resumeContext: ResumePullResult['context']
}

async function runOneSection({
  supabase,
  userId,
  generator,
  targetRole,
  targetJobDescription,
  currentText,
  resumeContext,
}: RunOneSectionArgs): Promise<SyncSectionPayload> {
  const signature = buildAIRequestSignature({
    v: GENERATOR_PROMPT_VERSION,
    mode: 'from_resume',
    generator,
    targetRole,
    currentText,
    targetJobDescription: targetJobDescription ?? null,
    resumeContext,
  })

  const cached = await readAIRequestCache<{
    rewrite: string
    rewriteLines?: string[]
    rationale: string
  }>({
    supabase,
    userId,
    feature: 'linkedin_rewrite',
    signature,
    version: GENERATOR_PROMPT_VERSION,
  })

  if (cached) {
    return {
      generator,
      rewrite: cached.rewrite,
      rewriteLines: cached.rewriteLines,
      rationale: cached.rationale,
      cached: true,
      empty: !cached.rewrite && !(cached.rewriteLines?.length ?? 0),
    }
  }

  try {
    const result = await runGenerator({
      mode: 'from_resume',
      generator,
      targetRole,
      currentText,
      targetJobDescription,
      resumeContext,
    })
    const empty = !result.rewrite && !(result.rewriteLines?.length ?? 0)
    if (!empty) {
      await writeAIRequestCache({
        supabase,
        userId,
        feature: 'linkedin_rewrite',
        signature,
        version: GENERATOR_PROMPT_VERSION,
        data: result,
      })
    }
    return {
      generator,
      rewrite: result.rewrite,
      rewriteLines: result.rewriteLines,
      rationale: result.rationale,
      cached: false,
      empty,
    }
  } catch (err) {
    console.error(`sync-from-resume[${generator}] failed`, err)
    return {
      generator,
      rewrite: '',
      rationale: 'Generation failed for this section. Try again in a moment.',
      cached: false,
      empty: true,
    }
  }
}
