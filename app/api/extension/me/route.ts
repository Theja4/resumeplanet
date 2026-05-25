import { NextResponse } from 'next/server'
import { readBearerClaims, verifyExtensionJwt } from '@/lib/extensionAuth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

function secretFingerprint(): string {
  const s = process.env.EXTENSION_JWT_SECRET ?? ''
  if (!s) return 'MISSING'
  return `${s.length}:${s.slice(0, 4)}…${s.slice(-2)}`
}

// Single source of truth for entitlement. Re-reads {plan} from the DB on every
// call so a Pro cancellation propagates the next time the extension pings —
// the JWT's cached plan value is just a hint, never trusted for gating.
export async function GET(request: Request) {
  // TEMP DIAGNOSTIC: report secret fingerprint + verify outcome on 401 so we
  // can compare against /token. Remove once the env drift bug is resolved.
  const claims = await readBearerClaims(request)
  if (!claims) {
    const auth = request.headers.get('authorization') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : ''
    let verifyResult: unknown = 'no-token'
    let verifyError: string | null = null
    if (token) {
      try {
        const r = await verifyExtensionJwt(token)
        verifyResult = r === null ? 'verify_returned_null' : 'unexpected_success'
      } catch (err) {
        verifyError = err instanceof Error ? err.message : String(err)
      }
    }
    return NextResponse.json(
      {
        error: 'invalid_token',
        debug: {
          secret: secretFingerprint(),
          tokenParts: token ? token.split('.').length : 0,
          tokenLen: token.length,
          verifyResult,
          verifyError,
        },
      },
      { status: 401 }
    )
  }

  const supabase = createServiceRoleClient()

  const [{ data: profile, error: profileError }, { count: resumeCount, error: resumeError }] =
    await Promise.all([
      supabase.from('profiles').select('plan, email').eq('id', claims.sub).single(),
      supabase
        .from('resumes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', claims.sub),
    ])

  if (profileError || !profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
  }
  if (resumeError) {
    return NextResponse.json({ error: 'resume_lookup_failed' }, { status: 500 })
  }

  return NextResponse.json(
    {
      userId: claims.sub,
      email: profile.email,
      plan: profile.plan,
      hasResume: (resumeCount ?? 0) > 0,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
