import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type RateLimitScope =
  | 'admin_login'
  | 'ats_extract_authenticated'
  | 'ats_extract_anonymous'
  | 'ats_score_authenticated'
  | 'ats_score_anonymous'
  | 'match_score_authenticated'
  | 'resume_parse_authenticated'
  | 'cover_letter_generate_authenticated'
  | 'metadata_audit_authenticated'
  | 'ats_insights_authenticated'
  | 'ats_optimise_authenticated'
  | 'ats_tailor_authenticated'
  | 'linkedin_rewrite_authenticated'

// Scopes guarding expensive AI calls. We fail CLOSED on Supabase RPC errors for
// these to prevent unbounded LLM token spend if the rate-limit RPC is down.
const AI_SCOPES = new Set<RateLimitScope>([
  'ats_score_authenticated',
  'ats_score_anonymous',
  'match_score_authenticated',
  'cover_letter_generate_authenticated',
  'metadata_audit_authenticated',
  'ats_insights_authenticated',
  'ats_optimise_authenticated',
  'ats_tailor_authenticated',
  'linkedin_rewrite_authenticated',
])

interface ConsumeRateLimitOptions {
  request: NextRequest
  scope: RateLimitScope
  limit: number
  windowSeconds: number
  userId?: string | null
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: string
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  return (
    request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  )
}

function getRateLimitSecret() {
  const configuredSecret =
    process.env.RATE_LIMIT_SECRET
    ?? process.env.ADMIN_SESSION_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (configuredSecret) {
    return configuredSecret
  }

  if (process.env.NODE_ENV !== 'production') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'resumeplanet-local-rate-limit'
  }

  throw new Error('RATE_LIMIT_SECRET is not configured')
}

function hashIdentifier(value: string) {
  return createHash('sha256')
    .update(`${getRateLimitSecret()}:${value}`)
    .digest('hex')
}

export async function consumeRateLimit({
  request,
  scope,
  limit,
  windowSeconds,
  userId,
}: ConsumeRateLimitOptions): Promise<RateLimitResult> {
  const identifier = userId ? `user:${userId}` : `ip:${getClientIp(request)}`
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.rpc('consume_api_rate_limit', {
    p_scope: scope,
    p_identifier_hash: hashIdentifier(identifier),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    const failClosed = AI_SCOPES.has(scope)
    console.error(
      `Rate limit RPC failed (${failClosed ? 'failing CLOSED' : 'failing open'}) scope=${scope}:`,
      error
    )
    return {
      allowed: !failClosed,
      remaining: failClosed ? 0 : limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
    }
  }

  const row = Array.isArray(data) ? data[0] : data
  const requestCount = typeof row?.request_count === 'number' ? row.request_count : limit + 1
  const resetAt = typeof row?.window_ends_at === 'string'
    ? row.window_ends_at
    : new Date(Date.now() + windowSeconds * 1000).toISOString()
  const allowed = Boolean(row?.allowed)

  return {
    allowed,
    remaining: Math.max(0, limit - requestCount),
    resetAt,
  }
}

export function createRateLimitResponse(
  result: RateLimitResult,
  error = 'RATE_LIMITED'
) {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000)
  )

  return NextResponse.json(
    {
      success: false,
      error,
      resetAt: result.resetAt,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}
