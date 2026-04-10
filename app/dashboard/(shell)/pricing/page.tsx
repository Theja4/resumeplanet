import {
  buildAffiliatePricingPromo,
  resolveAffiliateSourceCodeFromProfile,
} from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  logAffiliateInfrastructureError,
  readAffiliateReferralCodeFromCookies,
} from '@/lib/affiliate-server'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'
import BillingUpgradeSection from './BillingUpgradeSection'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import UpgradePoller from '@/components/shared/UpgradePoller'
import { PROFESSIONAL_ORDER, getActiveExitIntentPromo, getActivePromotion } from '@/lib/pricing'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import PricingPageTracker from '@/components/analytics/PricingPageTracker'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Affiliate, Order } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { detectRequestCountry } from '@/lib/cookie-consent'

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

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; promo?: string; source?: string }>
}) {
  const headerStore = await headers()
  const pricingCountryCode = detectRequestCountry(headerStore)
  const params = await searchParams
  const upgraded = params.upgraded === 'true'
  const pricingSource = params.source ?? 'dashboard'
  const cookieAffiliateCode = await readAffiliateReferralCodeFromCookies()
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const [ordersResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['paid', 'in_progress', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const storedAffiliateCode = resolveAffiliateSourceCodeFromProfile(profile)
  const affiliateLookupCandidates = params.promo
    ? [params.promo]
    : [cookieAffiliateCode, storedAffiliateCode].filter((value): value is string => Boolean(value))

  let affiliateAttribution: Affiliate | null = null
  try {
    const serviceSupabase = createServiceRoleClient()

    for (const candidateCode of affiliateLookupCandidates) {
      affiliateAttribution = await findAffiliateByDiscountCode(serviceSupabase, candidateCode)

      if (affiliateAttribution) {
        break
      }
    }
  } catch (error) {
    logAffiliateInfrastructureError('pricing-page-affiliate-lookup', error)
  }

  const promoCode =
    params.promo ?? affiliateAttribution?.discount_code ?? storedAffiliateCode ?? undefined
  const pricingPromo = buildAffiliatePricingPromo(affiliateAttribution) ?? getActivePromotion()
  const isPro = profile.plan === 'pro'
  const paidOrders = (ordersResult.data ?? []) as Order[]
  const exitPromo = getActiveExitIntentPromo()

  return (
    <ExitIntentProvider isPro={isPro} exitPromo={exitPromo}>
      <PricingPageTracker source={pricingSource} />
      <div className="mx-auto w-full max-w-[1320px] space-y-5 pb-8">
        {/* Upgrade success banner */}
        {upgraded && (
          <>
            <DashboardSurface variant="accent" className="flex items-center gap-3 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">You&apos;re now on Pro!</p>
                <p className="text-xs text-green-700 mt-0.5">All Pro features are unlocked. Enjoy unlimited scans and AI-powered tools.</p>
              </div>
            </DashboardSurface>
            <UpgradePoller upgraded={upgraded} isPro={isPro} />
          </>
        )}

        <DashboardSurface variant="default" className="space-y-4 p-4 sm:p-5">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              Plans & Billing
            </span>
            <div className="space-y-1.5">
              <h1 className="max-w-4xl text-[2.35rem] font-black tracking-tight leading-[0.98] text-on-background sm:text-[3.1rem] xl:max-w-none xl:whitespace-nowrap">
                {isPro ? 'Billing, simplified.' : 'Choose the plan that fits your workflow.'}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                Compare the self-serve plans with the recruiter-led rewrite service in one cleaner view.
              </p>
            </div>
          </div>

          <div className="border-t border-black/6 pt-4">
            <BillingUpgradeSection
              autoFillPromo={promoCode}
              displayPromo={pricingPromo}
              isPro={isPro}
              compact
              pricingCountryCode={pricingCountryCode}
            />
          </div>
        </DashboardSurface>

        {/* Order history */}
        {paidOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Order history</h2>
            <DashboardSurface variant="default" className="overflow-hidden">
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
            </DashboardSurface>
          </div>
        )}
      </div>
    </ExitIntentProvider>
  )
}
