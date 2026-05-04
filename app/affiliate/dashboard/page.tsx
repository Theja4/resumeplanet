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

  const [rawStats, referralsPage, payouts] = await Promise.all([
    getAffiliateStats(serviceSupabase, affiliate.id),
    getAffiliateReferralPage(serviceSupabase, affiliate.id, 1),
    getAffiliatePayouts(serviceSupabase, affiliate.id),
  ])

  // Hardcoded overrides for early affiliate partners until real tracking data is backfilled
  const HARDCODED_STATS: Record<string, { totalSignups: number; activeSubscriptions: number; totalEarned: number; pendingPayout: number }> = {
    CAREER50: { totalSignups: 252, activeSubscriptions: 26, totalEarned: 95.6, pendingPayout: 95.6 },
    NEERAJA50: { totalSignups: 252, activeSubscriptions: 26, totalEarned: 95.6, pendingPayout: 95.6 },
  }
  const override = HARDCODED_STATS[affiliate.discount_code.toUpperCase()]
  const stats = override
    ? { ...rawStats, ...override }
    : rawStats

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
