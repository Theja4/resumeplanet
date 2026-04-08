import { NextRequest, NextResponse } from 'next/server'
import {
  normalizeAffiliateCode,
  resolveAffiliateSourceCodeFromProfile,
} from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  readAffiliateReferralCodeFromCookies,
} from '@/lib/affiliate-server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

function ok(sourceCode: string | null, persisted: boolean) {
  return NextResponse.json({
    success: true,
    sourceCode,
    persisted,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | { code?: string }
    | null
  const requestedCode =
    typeof body?.code === 'string' ? normalizeAffiliateCode(body.code) : null
  const cookieCode = await readAffiliateReferralCodeFromCookies()
  const candidateCode = requestedCode || cookieCode

  if (!candidateCode) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('affiliate_source_code')
      .eq('id', user.id)
      .single()

    return ok(resolveAffiliateSourceCodeFromProfile(profile), false)
  }

  const serviceSupabase = createServiceRoleClient()
  const affiliate = await findAffiliateByDiscountCode(serviceSupabase, candidateCode)

  if (!affiliate) {
    return ok(null, false)
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('affiliate_source_code')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(`Failed to load affiliate source profile: ${profileError.message}`)
  }

  const existingSourceCode = resolveAffiliateSourceCodeFromProfile(profile)

  if (existingSourceCode) {
    return ok(existingSourceCode, false)
  }

  const { error: updateError } = await serviceSupabase
    .from('profiles')
    .update({
      affiliate_source_code: affiliate.discount_code,
      affiliate_source_recorded_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    throw new Error(`Failed to persist affiliate source: ${updateError.message}`)
  }

  return ok(affiliate.discount_code, true)
}
