import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, Zap, TrendingUp, FileText } from 'lucide-react'
import Link from 'next/link'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import BillingUpgradeSection from './BillingUpgradeSection'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import UpgradePoller from '@/components/shared/UpgradePoller'
import { FREE_PLAN, PRO_PLAN, PROFESSIONAL_ORDER, getActiveExitIntentPromo } from '@/lib/pricing'
import type { Profile, Order } from '@/types'

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-600',
  paid:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  delivered:   'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending payment',
  paid:        'Paid — In queue',
  in_progress: 'In progress',
  delivered:   'Delivered',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; promo?: string }>
}) {
  const params = await searchParams
  const upgraded = params.upgraded === 'true'
  const promoCode = params.promo

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileResult, resumeCountResult, ordersResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['paid', 'in_progress', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const profile = profileResult.data as Profile | null
  if (!profile) redirect('/auth/login')

  const isPro = profile.plan === 'pro'
  const resumeCount = resumeCountResult.count ?? 0
  const paidOrders = (ordersResult.data ?? []) as Order[]

  const subscriptionTier =
    !isPro ? 'free'
    : profile.subscription_interval === 'annual' ? 'pro-annual'
    : 'pro-monthly'

  const annualPrice = PRO_PLAN.getPriceById('annual')

  const FREE_ATS_LIMIT = FREE_PLAN.limits.atsScansPerDay
  const exitPromo = getActiveExitIntentPromo()

  return (
    <ExitIntentProvider isPro={isPro} exitPromo={exitPromo}>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        {/* Upgrade success banner */}
        {upgraded && (
          <>
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">You&apos;re now on Pro!</p>
                <p className="text-xs text-green-700 mt-0.5">All Pro features are unlocked. Enjoy unlimited scans and AI-powered tools.</p>
              </div>
            </div>
            <UpgradePoller upgraded={upgraded} isPro={isPro} />
          </>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Plan</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your ResumAI subscription and orders.</p>
        </div>

        {/* Current plan badge */}
        <div className={`rounded-xl border p-5 flex items-center justify-between ${
          isPro ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Plan</p>
            <p className={`text-xl font-bold mt-0.5 ${isPro ? 'text-indigo-700' : 'text-gray-800'}`}>
              {isPro ? 'Pro' : 'Free'}
            </p>
            {profile.subscription_status && isPro && (
              <p className="text-xs text-gray-500 mt-1 capitalize">
                Status: {profile.subscription_status}
              </p>
            )}
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
            isPro ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {isPro ? 'Active' : 'Free tier'}
          </div>
        </div>

        {/* Usage stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Usage this period</h2>

          {/* ATS scans */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <TrendingUp size={14} className="text-gray-400" />
                ATS scans today
              </div>
              <span className="text-sm text-gray-500">
                {isPro ? (
                  <span className="text-indigo-600 font-medium">Unlimited</span>
                ) : (
                  `${profile.ats_scans_today} / ${FREE_ATS_LIMIT}`
                )}
              </span>
            </div>
            {!isPro && (
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    profile.ats_scans_today >= FREE_ATS_LIMIT ? 'bg-red-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (profile.ats_scans_today / FREE_ATS_LIMIT) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Resumes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <FileText size={14} className="text-gray-400" />
                Resumes created
              </div>
              <span className="text-sm text-gray-500">
                {isPro ? (
                  <span className="text-indigo-600 font-medium">{resumeCount} (Unlimited)</span>
                ) : (
                  `${resumeCount} / ${FREE_PLAN.limits.maxResumes}`
                )}
              </span>
            </div>
            {!isPro && (
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    resumeCount >= FREE_PLAN.limits.maxResumes ? 'bg-red-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (resumeCount / FREE_PLAN.limits.maxResumes) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Pro features */}
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Zap size={14} className="text-gray-400" />
            AI optimisation
            <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
              isPro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {isPro ? 'Enabled' : 'Pro only'}
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Plans</h2>
          <BillingUpgradeSection autoFillPromo={promoCode} isPro={isPro} />
        </div>

        {/* Pro: manage subscription button */}
        {subscriptionTier !== 'free' && (
          <ManageSubscriptionButton />
        )}

        {/* Monthly Pro: annual upsell */}
        {subscriptionTier === 'pro-monthly' && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-800">Switch to Annual — Save 31%</p>
              {annualPrice && (
                <p className="text-xs text-indigo-600 mt-1">
                  ${annualPrice.display.displayPrice}/year
                  {' · '}${annualPrice.perMonthEquivalent}/mo
                  {' · '}{annualPrice.savingsNote}
                </p>
              )}
            </div>
            <ManageSubscriptionButton label="Switch plan →" />
          </div>
        )}

        {isPro && (
          <p className="text-center text-xs text-gray-400">
            You can cancel anytime from the customer portal. Your access continues until the end of the billing period.
          </p>
        )}

        {/* Billing history */}
        {paidOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Order history</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paidOrders.map((order, i) => (
                    <tr key={order.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-5 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4 font-medium text-gray-900">Professional Rewrite{order.job_title ? ` — ${order.job_title}` : ''}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">${PROFESSIONAL_ORDER.display.displayPrice}</td>
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ExitIntentProvider>
  )
}
