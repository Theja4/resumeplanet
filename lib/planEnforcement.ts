import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

interface AuthResult {
  userId: string
  profile: Profile
  user: User
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
}

/** Use at the top of Pro-gated API routes. Returns 401/403 NextResponse if check fails. */
export async function requirePro(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan !== 'pro') {
    return NextResponse.json({ success: false, error: 'PRO_REQUIRED' }, { status: 403 })
  }

  return { userId: user.id, user, profile: profile as Profile, supabase }
}

/** Use at the top of auth-required API routes. Returns 401 NextResponse if not logged in. */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 401 })
  }

  return { userId: user.id, user, profile: profile as Profile, supabase }
}
