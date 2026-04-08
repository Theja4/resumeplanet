import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  getAffiliateById,
  getAffiliatePayouts,
  getAffiliateReferralPage,
  getAffiliateStats,
} from '@/lib/affiliate-server'
import AffiliateDashboardClient from './AffiliateDashboardClient'
import AffiliateActivationClient from './AffiliateActivationClient'

export const dynamic = 'force-dynamic'

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: affiliateLookup, error: affiliateLookupError } = await serviceSupabase
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateLookupError) {
    throw new Error(`Failed to load affiliate record: ${affiliateLookupError.message}`)
  }

  if (!affiliateLookup?.id) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error(`Failed to load profile for affiliate activation: ${profileError?.message ?? 'Unknown error'}`)
    }

    return (
      <AffiliateActivationClient
        displayName={profile.full_name?.split(' ')[0] ?? profile.email.split('@')[0] ?? 'there'}
      />
    )
  }

  const affiliate = await getAffiliateById(serviceSupabase, affiliateLookup.id)

  if (!affiliate) {
    redirect('/dashboard')
  }

  const [stats, referralsPage, payouts] = await Promise.all([
    getAffiliateStats(serviceSupabase, affiliate.id),
    getAffiliateReferralPage(serviceSupabase, affiliate.id, 1),
    getAffiliatePayouts(serviceSupabase, affiliate.id),
  ])

  return (
    <AffiliateDashboardClient
      initialAffiliate={affiliate}
      initialStats={stats}
      initialReferralPage={referralsPage}
      initialPayouts={payouts}
      appUrl={process.env.NEXT_PUBLIC_APP_URL}
    />
  )
}
