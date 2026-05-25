import { NextResponse } from 'next/server'
import { getOptionalAuthenticatedUserContext } from '@/lib/authenticated-user'
import { signExtensionJwt } from '@/lib/extensionAuth'

export const dynamic = 'force-dynamic'

// Called by /extension-auth after we've confirmed the user has a live Supabase
// session. Mints a 30-day extension JWT keyed only to {userId, email, plan} so
// the extension never sees Supabase cookies.
export async function POST() {
  const context = await getOptionalAuthenticatedUserContext()
  if (!context) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { token, expiresAt } = await signExtensionJwt({
    userId: context.userId,
    email: context.user.email ?? context.profile.email,
    plan: context.profile.plan,
  })

  return NextResponse.json(
    { token, expiresAt },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
