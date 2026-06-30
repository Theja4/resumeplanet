import { NextResponse } from 'next/server'
import { getOptionalAuthenticatedUserContext } from '@/lib/authenticated-user'
import { readBearerClaims, signExtensionJwt } from '@/lib/extensionAuth'

export const dynamic = 'force-dynamic'

function issue(userId: string, email: string, plan: 'free' | 'pro') {
  return signExtensionJwt({ userId, email, plan })
}

// Mints a 30-day extension JWT keyed only to {userId, email, plan} so the
// extension never sees Supabase cookies. Two entry paths:
//
//  1. Live Supabase web session — used by /extension-auth right after the
//     user signs in. Plan is read fresh from the profile.
//  2. A still-valid extension bearer token — used by the extension's tab-free
//     silent refresh. readBearerClaims verifies the HMAC signature + expiry,
//     so only an unexpired token we signed is accepted; it's then re-minted
//     for a fresh TTL (a sliding session) with no cross-site cookie needed.
//     The plan carried here is only a hint — gating always re-reads it via
//     /api/extension/me — so re-minting from the claim is safe.
export async function POST(request: Request) {
  const context = await getOptionalAuthenticatedUserContext()
  if (context) {
    const { token, expiresAt } = await issue(
      context.userId,
      context.user.email ?? context.profile.email,
      context.profile.plan
    )
    return NextResponse.json(
      { token, expiresAt },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  const claims = await readBearerClaims(request)
  if (claims) {
    const { token, expiresAt } = await issue(claims.sub, claims.email, claims.plan)
    return NextResponse.json(
      { token, expiresAt },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
}
