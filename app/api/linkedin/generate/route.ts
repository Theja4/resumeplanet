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

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALLOWED_GENERATORS: ReadonlySet<GeneratorType> = new Set([
  'headline',
  'about',
  'experience_bullets',
  'skills',
])

interface RequestBody {
  generator?: unknown
  targetRole?: unknown
  currentText?: unknown
  targetJobDescription?: unknown
  useResumeContext?: unknown
}

const MAX_CURRENT_TEXT = 12_000
const MAX_JD = 8_000
const MAX_TARGET_ROLE = 200

function isString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}

interface ResumeContext {
  headline: string | null
  currentRole: string | null
  topSkills: string[]
}

async function loadResumeContext(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<ResumeContext | null> {
  const { data } = await supabase
    .from('resumes')
    .select('parsed_data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data?.parsed_data) return null
  const parsed = data.parsed_data as {
    summary?: string
    currentRole?: string
    experience?: { title?: string }[]
    skills?: string[]
  }
  return {
    headline: parsed.summary?.trim() || null,
    currentRole: parsed.currentRole?.trim() || parsed.experience?.[0]?.title?.trim() || null,
    topSkills: (parsed.skills ?? []).slice(0, 12),
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
  const generator = body.generator as GeneratorType | undefined
  if (!generator || !ALLOWED_GENERATORS.has(generator)) {
    return NextResponse.json({ error: 'invalid_generator' }, { status: 400 })
  }
  if (!isString(body.targetRole, MAX_TARGET_ROLE)) {
    return NextResponse.json({ error: 'missing_target_role' }, { status: 400 })
  }
  if (!isString(body.currentText, MAX_CURRENT_TEXT)) {
    return NextResponse.json({ error: 'missing_current_text' }, { status: 400 })
  }
  const targetJobDescription =
    typeof body.targetJobDescription === 'string' && body.targetJobDescription.length <= MAX_JD
      ? body.targetJobDescription
      : undefined
  const useResumeContext = body.useResumeContext === true

  const supabase = createServiceRoleClient()

  // 3. Entitlement: re-read plan from DB; never trust the JWT's cached plan.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, payment_provider, current_period_end')
    .eq('id', claims.sub)
    .single()
  if (!profile || !isPro(profile as Parameters<typeof isPro>[0])) {
    return NextResponse.json(
      {
        error: 'pro_required',
        message: 'Per-section AI rewrites are a Rezoomed Pro feature.',
        upgradeUrl: 'https://rezoomed.com/pricing?ref=ext_rewrite_gate',
      },
      { status: 402 }
    )
  }

  // 4. Rate-limit (10 rewrites per 5 minutes per user).
  const rl = await consumeRateLimit({
    request,
    scope: 'linkedin_rewrite_authenticated',
    limit: 10,
    windowSeconds: 300,
    userId: claims.sub,
  })
  if (!rl.allowed) {
    return createRateLimitResponse(rl)
  }

  // 5. Optionally load resume context (read-only; not persisted in response).
  const resumeContext = useResumeContext ? await loadResumeContext(supabase, claims.sub) : null

  // 6. Cache check. Signature covers everything that affects the output.
  const signature = buildAIRequestSignature({
    v: GENERATOR_PROMPT_VERSION,
    generator,
    targetRole: body.targetRole,
    currentText: body.currentText,
    targetJobDescription: targetJobDescription ?? null,
    resumeContext,
  })
  const cached = await readAIRequestCache<{ rewrite: string; rewriteLines?: string[]; rationale: string }>({
    supabase,
    userId: claims.sub,
    feature: 'linkedin_rewrite',
    signature,
    version: GENERATOR_PROMPT_VERSION,
  })

  let result: { rewrite: string; rewriteLines?: string[]; rationale: string }
  let fromCache = false
  if (cached) {
    result = cached
    fromCache = true
  } else {
    try {
      result = await runGenerator({
        generator,
        targetRole: body.targetRole,
        currentText: body.currentText,
        targetJobDescription,
        resumeContext,
      })
    } catch (err) {
      console.error('linkedin generate failed', err)
      return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
    }
    if (result.rewrite || result.rewriteLines?.length) {
      await writeAIRequestCache({
        supabase,
        userId: claims.sub,
        feature: 'linkedin_rewrite',
        signature,
        version: GENERATOR_PROMPT_VERSION,
        data: result,
      })
    }
  }

  // 7. Metadata log (no profile content).
  await supabase.from('linkedin_generations').insert({
    user_id: claims.sub,
    generator_type: generator,
    target_role: body.targetRole,
    features_used: {
      used_jd: !!targetJobDescription,
      used_resume: !!resumeContext,
      current_text_length: body.currentText.length,
    },
    cached: fromCache,
    model: CLAUDE_PREMIUM,
  })

  return NextResponse.json(
    { ...result, cached: fromCache },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
