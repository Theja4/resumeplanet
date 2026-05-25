import { NextResponse } from 'next/server'
import { readBearerClaims } from '@/lib/extensionAuth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// Single source of truth for entitlement. Re-reads {plan} from the DB on every
// call so a Pro cancellation propagates the next time the extension pings —
// the JWT's cached plan value is just a hint, never trusted for gating.
export async function GET(request: Request) {
  const claims = await readBearerClaims(request)
  if (!claims) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
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
