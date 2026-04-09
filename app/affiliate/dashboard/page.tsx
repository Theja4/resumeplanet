import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  getAffiliateById,
  getAffiliatePayouts,
  getAffiliateReferralPage,
  getAffiliateStats,
} from '@/lib/affiliate-server'
import AffiliateDashboardClient from './AffiliateDashboardClient'
import AffiliateActivationClient from './AffiliateActivationClient'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function AffiliateDashboardPage() {
  const { userId, profile } = await getAuthenticatedUserContext()

  const serviceSupabase = createServiceRoleClient()
  const { data: affiliateLookup, error: affiliateLookupError } = await serviceSupabase
    .from('affiliates')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (affiliateLookupError) {
    throw new Error(`Failed to load affiliate record: ${affiliateLookupError.message}`)
  }

  if (!affiliateLookup?.id) {
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
