import { ArrowUpRight, DollarSign, TicketPercent, TrendingUp, Users } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { formatUsdCurrency, normalizeAffiliateCode } from '@/lib/affiliate'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type AffiliateRow = {
  id: string
  name: string
  email: string
  discount_code: string
  discount_percent: number | string
  commission_percent: number | string
  created_at: string
}

type ProfileAttributionRow = {
  affiliate_source_code: string | null
  plan: 'free' | 'pro'
  created_at: string
}

type ReferralRow = {
  affiliate_id: string
  status: 'active' | 'trialing' | 'churned'
}

type CommissionRow = {
  affiliate_id: string
  commission_amount: number | string
}

type PayoutRow = {
  affiliate_id: string
  amount: number | string
  status: 'pending' | 'paid' | 'rejected'
}

type InfluencerPerformance = {
  id: string
  name: string
  email: string
  discountCode: string
  discountPercent: number
  commissionPercent: number
  joinedAt: string
  signupCount: number
  proUpgradeCount: number
  activeSubscriptionCount: number
  totalEarned: number
  pendingPayout: number
  lastSignupAt: string | null
}

function toAmount(value: number | string | null | undefined) {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: string
  helper: string
  icon: typeof Users
}) {
  return (
    <DashboardSurface variant="subtle" className="px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-zinc-900">{value}</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{helper}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary-container/60 text-on-primary-container">
          <Icon size={20} />
        </div>
      </div>
    </DashboardSurface>
  )
}

export default async function AdminInfluencersPage() {
  const supabase = createServiceRoleClient()

  const [affiliatesResult, profilesResult, referralsResult, commissionsResult, payoutsResult] =
    await Promise.all([
      supabase
        .from('affiliates')
        .select('id, name, email, discount_code, discount_percent, commission_percent, created_at')
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('affiliate_source_code, plan, created_at')
        .not('affiliate_source_code', 'is', null),
      supabase
        .from('referrals')
        .select('affiliate_id, status'),
      supabase
        .from('affiliate_commissions')
        .select('affiliate_id, commission_amount'),
      supabase
        .from('payouts')
        .select('affiliate_id, amount, status'),
    ])

  if (affiliatesResult.error) {
    throw new Error(`Failed to load influencers: ${affiliatesResult.error.message}`)
  }

  if (profilesResult.error) {
    throw new Error(`Failed to load attributed signups: ${profilesResult.error.message}`)
  }

  if (referralsResult.error) {
    throw new Error(`Failed to load influencer referrals: ${referralsResult.error.message}`)
  }

  if (commissionsResult.error) {
    throw new Error(`Failed to load influencer commissions: ${commissionsResult.error.message}`)
  }

  if (payoutsResult.error) {
    throw new Error(`Failed to load influencer payouts: ${payoutsResult.error.message}`)
  }

  const signupMap = new Map<string, { signupCount: number; proUpgradeCount: number; lastSignupAt: string | null }>()
  const activeSubscriptionCountByAffiliateId = new Map<string, number>()
  const earnedByAffiliateId = new Map<string, number>()
  const reservedPayoutsByAffiliateId = new Map<string, number>()

  for (const row of (profilesResult.data ?? []) as ProfileAttributionRow[]) {
    const code = normalizeAffiliateCode(row.affiliate_source_code)

    if (!code) {
      continue
    }

    const existing = signupMap.get(code) ?? {
      signupCount: 0,
      proUpgradeCount: 0,
      lastSignupAt: null,
    }

    existing.signupCount += 1
    if (row.plan === 'pro') {
      existing.proUpgradeCount += 1
    }
    if (!existing.lastSignupAt || row.created_at > existing.lastSignupAt) {
      existing.lastSignupAt = row.created_at
    }

    signupMap.set(code, existing)
  }

  for (const row of (referralsResult.data ?? []) as ReferralRow[]) {
    if (row.status !== 'active') {
      continue
    }

    activeSubscriptionCountByAffiliateId.set(
      row.affiliate_id,
      (activeSubscriptionCountByAffiliateId.get(row.affiliate_id) ?? 0) + 1
    )
  }

  for (const row of (commissionsResult.data ?? []) as CommissionRow[]) {
    earnedByAffiliateId.set(
      row.affiliate_id,
      roundAmount((earnedByAffiliateId.get(row.affiliate_id) ?? 0) + toAmount(row.commission_amount))
    )
  }

  for (const row of (payoutsResult.data ?? []) as PayoutRow[]) {
    if (row.status !== 'pending' && row.status !== 'paid') {
      continue
    }

    reservedPayoutsByAffiliateId.set(
      row.affiliate_id,
      roundAmount(
        (reservedPayoutsByAffiliateId.get(row.affiliate_id) ?? 0) + toAmount(row.amount)
      )
    )
  }

  const influencerPerformance = ((affiliatesResult.data ?? []) as AffiliateRow[])
    .map((affiliate): InfluencerPerformance => {
      const signupStats = signupMap.get(affiliate.discount_code) ?? {
        signupCount: 0,
        proUpgradeCount: 0,
        lastSignupAt: null,
      }
      const totalEarned = roundAmount(earnedByAffiliateId.get(affiliate.id) ?? 0)
      const reservedPayouts = roundAmount(reservedPayoutsByAffiliateId.get(affiliate.id) ?? 0)

      return {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        discountCode: affiliate.discount_code,
        discountPercent: toAmount(affiliate.discount_percent),
        commissionPercent: toAmount(affiliate.commission_percent),
        joinedAt: affiliate.created_at,
        signupCount: signupStats.signupCount,
        proUpgradeCount: signupStats.proUpgradeCount,
        activeSubscriptionCount: activeSubscriptionCountByAffiliateId.get(affiliate.id) ?? 0,
        totalEarned,
        pendingPayout: roundAmount(Math.max(totalEarned - reservedPayouts, 0)),
        lastSignupAt: signupStats.lastSignupAt,
      }
    })
    .sort((left, right) => {
      if (right.proUpgradeCount !== left.proUpgradeCount) {
        return right.proUpgradeCount - left.proUpgradeCount
      }

      if (right.signupCount !== left.signupCount) {
        return right.signupCount - left.signupCount
      }

      return right.totalEarned - left.totalEarned
    })

  const totals = influencerPerformance.reduce(
    (summary, influencer) => ({
      influencers: summary.influencers + 1,
      signups: summary.signups + influencer.signupCount,
      proUpgrades: summary.proUpgrades + influencer.proUpgradeCount,
      activeSubscriptions: summary.activeSubscriptions + influencer.activeSubscriptionCount,
      totalEarned: roundAmount(summary.totalEarned + influencer.totalEarned),
    }),
    {
      influencers: 0,
      signups: 0,
      proUpgrades: 0,
      activeSubscriptions: 0,
      totalEarned: 0,
    }
  )

  const topPerformer = influencerPerformance[0] ?? null

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        kicker="Influencer Performance"
        title="See which influencers are driving signups and Pro upgrades."
        description="This view rolls up attributed account signups, Pro upgrades, active paid subscriptions, and earnings for every influencer code in one place."
        aside={
          topPerformer ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Top performer</p>
              <p className="text-lg font-black text-on-background">{topPerformer.name}</p>
              <p className="text-sm leading-6 text-on-surface-variant">
                {topPerformer.signupCount} signups, {topPerformer.proUpgradeCount} Pro upgrades, {formatUsdCurrency(topPerformer.totalEarned)} earned.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Attribution logic</p>
              <p className="text-sm leading-6 text-on-surface-variant">
                Signups are counted from profiles attributed to an influencer link or code. Pro upgrades are the attributed users currently on the Pro plan.
              </p>
            </div>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Influencers"
          value={String(totals.influencers)}
          helper="Total activated affiliate profiles."
          icon={Users}
        />
        <StatCard
          label="Attributed Signups"
          value={String(totals.signups)}
          helper="Accounts created from influencer attribution."
          icon={TrendingUp}
        />
        <StatCard
          label="Pro Upgrades"
          value={String(totals.proUpgrades)}
          helper="Attributed users currently on Pro."
          icon={TicketPercent}
        />
        <StatCard
          label="Commission Earned"
          value={formatUsdCurrency(totals.totalEarned)}
          helper="Recorded influencer commission across all billing events."
          icon={DollarSign}
        />
      </div>

      <DashboardSurface variant="default" className="overflow-hidden">
        <div className="border-b border-black/6 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Leaderboard</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
                Influencer-by-influencer breakdown
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant">
              {totals.signups} signups and {totals.activeSubscriptions} active subscriptions attributed overall.
            </p>
          </div>
        </div>

        {influencerPerformance.length === 0 ? (
          <div className="px-6 py-10 text-sm text-on-surface-variant">
            No influencers have activated the program yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/6 bg-black/[0.02]">
                  <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Influencer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Signups</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Pro Upgrades</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Upgrade Rate</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Active Subs</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Earned</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Pending</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Latest Signup</th>
                </tr>
              </thead>
              <tbody>
                {influencerPerformance.map((influencer, index) => {
                  const upgradeRate =
                    influencer.signupCount > 0
                      ? (influencer.proUpgradeCount / influencer.signupCount) * 100
                      : 0

                  return (
                    <tr key={influencer.id} className={index % 2 === 0 ? 'bg-white/70' : 'bg-transparent'}>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-bold tracking-tight text-on-background">{influencer.name}</p>
                          <p className="text-xs text-on-surface-variant">{influencer.email}</p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                            Joined {formatDate(influencer.joinedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full border border-primary/10 bg-primary-container/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-on-primary-container">
                            {influencer.discountCode}
                          </span>
                          <p className="text-xs text-on-surface-variant">
                            {influencer.discountPercent}% off / {influencer.commissionPercent}% commission
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top font-bold text-on-background">{influencer.signupCount}</td>
                      <td className="px-4 py-4 align-top font-bold text-on-background">{influencer.proUpgradeCount}</td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center gap-1 rounded-full border border-black/6 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                          {formatPercent(upgradeRate)}
                          <ArrowUpRight size={12} className="text-primary" />
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top font-bold text-on-background">{influencer.activeSubscriptionCount}</td>
                      <td className="px-4 py-4 align-top font-bold text-on-background">{formatUsdCurrency(influencer.totalEarned)}</td>
                      <td className="px-4 py-4 align-top font-bold text-on-background">{formatUsdCurrency(influencer.pendingPayout)}</td>
                      <td className="px-6 py-4 align-top text-on-surface-variant">
                        {influencer.lastSignupAt ? formatDate(influencer.lastSignupAt) : 'No attributed signups yet'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSurface>
    </div>
  )
}
