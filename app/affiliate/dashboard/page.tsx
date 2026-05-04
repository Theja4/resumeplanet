import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  getAffiliateById,
  getAffiliatePayouts,
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

  const [rawStats, payouts] = await Promise.all([
    getAffiliateStats(serviceSupabase, affiliate.id),
    getAffiliatePayouts(serviceSupabase, affiliate.id),
  ])

  // Hardcoded overrides for early affiliate partners until real tracking data is backfilled
  const HARDCODED_OVERRIDE = {
    totalSignups: 261,
    activeSubscriptions: 26,
    totalEarned: 98.3,
    pendingPayout: 98.3,
    monthlySignups: [
      { monthKey: '2025-12', label: 'Dec', signups: 0 },
      { monthKey: '2026-01', label: 'Jan', signups: 0 },
      { monthKey: '2026-02', label: 'Feb', signups: 0 },
      { monthKey: '2026-03', label: 'Mar', signups: 0 },
      { monthKey: '2026-04', label: 'Apr', signups: 183 },
      { monthKey: '2026-05', label: 'May', signups: 69 },
    ],
  }
  const HARDCODED_CODES = new Set(['CAREER50', 'NEERAJA50'])
  const stats = HARDCODED_CODES.has(affiliate.discount_code.toUpperCase())
    ? { ...rawStats, ...HARDCODED_OVERRIDE }
    : rawStats

  return (
    <AffiliateDashboardClient
      initialAffiliate={affiliate}
      initialStats={stats}
      initialPayouts={payouts}
      appUrl={process.env.NEXT_PUBLIC_APP_URL}
    />
  )
}
