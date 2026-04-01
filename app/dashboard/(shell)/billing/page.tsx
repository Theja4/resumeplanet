import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import BillingUpgradeSection from './BillingUpgradeSection'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import UpgradePoller from '@/components/shared/UpgradePoller'
import { PRO_PLAN, PROFESSIONAL_ORDER, getActiveExitIntentPromo } from '@/lib/pricing'
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

  const [profileResult, ordersResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
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
  const paidOrders = (ordersResult.data ?? []) as Order[]

  const subscriptionTier =
    !isPro ? 'free'
    : profile.subscription_interval === 'annual' ? 'pro-annual'
    : 'pro-monthly'

  const annualPrice = PRO_PLAN.getPriceById('annual')
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
          isPro ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Plan</p>
            <p className={`text-xl font-bold mt-0.5 ${isPro ? 'text-[#026d32]' : 'text-gray-800'}`}>
              {isPro ? 'Pro' : 'Free'}
            </p>
            {profile.subscription_status && isPro && (
              <p className="text-xs text-gray-500 mt-1 capitalize">
                Status: {profile.subscription_status}
              </p>
            )}
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
            isPro ? 'bg-[#026d32] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {isPro ? 'Active' : 'Free tier'}
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
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-800">Switch to Annual — Save 31%</p>
              {annualPrice && (
                <p className="text-xs text-green-700 mt-1">
                  ${annualPrice.display.displayPrice}/year
                  {' · '}${annualPrice.perMonthEquivalent}/mo
                  {' · '}{annualPrice.savingsNote}
                </p>
              )}
            </div>
            <ManageSubscriptionButton
            label="Switch plan →"
            className="px-4 py-2 bg-[#026d32] text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          />
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
                        <Link href={`/dashboard/orders/${order.id}`} className="text-[#026d32] hover:text-green-800 font-medium text-xs">
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
