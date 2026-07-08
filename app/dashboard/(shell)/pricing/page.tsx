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
import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import PricingWorkspaceClient from './PricingWorkspaceClient'
import ClosePageButton from './ClosePageButton'
import UpgradePoller from '@/components/shared/UpgradePoller'
import PricingComparisonSection from '@/app/pricing/PricingComparisonSection'
import {
  HUMAN_WRITTEN_ORDER,
  getActiveAutoApplyPromotion,
  getActivePromotionByCode,
  getActivePromotionById,
} from '@/lib/pricing'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import PricingPageTracker from '@/components/analytics/PricingPageTracker'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Affiliate, Order } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { detectRequestCountry } from '@/lib/cookie-consent'
import { getLiveVisibleProPriceOptions } from '@/lib/paddle-pricing'
import { isPro as hasActiveProAccess } from '@/lib/planUtils'

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

function formatOrderAmount(amount?: number | null) {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return `$${(amount / 100).toFixed(2)}`
  }

  return `$${HUMAN_WRITTEN_ORDER.display.displayPrice.toFixed(2)}`
}

function RezoomedBrandMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/auth-login-logo.png"
        alt="Rezoomed logo"
        width={32}
        height={32}
        className="h-7 w-7 object-contain"
        priority
      />
      <span className="text-sm font-black tracking-tighter text-primary sm:text-base">
        Rezoomed
      </span>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; promo?: string; source?: string }>
}) {
  const headerStore = await headers()
  const pricingCountryCode = detectRequestCountry(headerStore)
  const priceOptionsPromise = getLiveVisibleProPriceOptions(pricingCountryCode)
  const params = await searchParams
  const upgraded = params.upgraded === 'true'
  const pricingSource = params.source ?? 'dashboard'
  const cookieAffiliateCode = await readAffiliateReferralCodeFromCookies()
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const ordersResult = HUMAN_WRITTEN_SERVICE_ENABLED
    ? await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['paid', 'in_progress', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] }

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
  const activePromotionFromQuery = params.promo
    ? getActivePromotionById(params.promo) ?? getActivePromotionByCode(params.promo)
    : null
  const pricingPromo =
    buildAffiliatePricingPromo(affiliateAttribution) ??
    activePromotionFromQuery ??
    getActiveAutoApplyPromotion()
  const isPro = hasActiveProAccess(profile)
  const paidOrders = (ordersResult.data ?? []) as Order[]
  const priceOptions = await priceOptionsPromise

  return (
    <>
      <PricingPageTracker source={pricingSource} />
      {/* Full-screen layer — covers the dashboard sidebar/nav for a focused upgrade flow */}
      <div className="fixed inset-0 z-[60] bg-[linear-gradient(180deg,#f8f9fa_0%,#f3f6f4_100%)]">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-25" />
        <ClosePageButton />
        {/* Only this inner layer scrolls — the close button stays pinned */}
        <div className="absolute inset-0 overflow-y-auto">
        <div className="relative mx-auto w-full max-w-[1320px] space-y-4 px-4 pb-10 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
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

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5">
            {isPro ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                  Plans & Billing
                </span>
                <div className="space-y-1.5">
                  <h1 className="max-w-4xl text-[1.9rem] font-black leading-[1.02] tracking-tight text-on-background sm:text-[2.45rem]">
                    Billing, simplified.
                  </h1>
                  <p className="max-w-2xl text-sm leading-5 text-on-surface-variant">
                    Compare the free tier with the live monthly and annual Pro plans in one cleaner view.
                  </p>
                </div>
              </>
            ) : (
              <div className="grid items-center gap-2 text-center sm:grid-cols-[minmax(8rem,1fr)_minmax(0,48rem)_minmax(8rem,1fr)]">
                <RezoomedBrandMark className="justify-self-center sm:justify-self-start" />
                <div className="space-y-1.5 sm:col-start-2">
                  <h1 className="mx-auto max-w-3xl text-[1.9rem] font-black leading-[1.04] tracking-tight text-on-background sm:text-[2.45rem]">
                    You&apos;re about to get hired faster
                  </h1>
                  <p className="mx-auto max-w-4xl text-sm leading-5 text-on-surface-variant">
                    90%+ of resumes are auto-rejected before a human reads them. Unlock the AI tools that land interviews.
                  </p>
                </div>
                <div className="hidden sm:block" />
              </div>
            )}
          </div>

          <div className={isPro ? 'border-t border-black/6 pt-3' : 'pt-0'}>
            <PricingWorkspaceClient
              autoFillPromo={promoCode}
              availablePromo={pricingPromo}
              isPro={isPro}
              priceOptions={priceOptions}
              currentSubscriptionInterval={profile.subscription_interval}
              currentPaymentProvider={profile.payment_provider}
              currentPeriodEnd={profile.current_period_end}
              pricingCountryCode={pricingCountryCode}
              consumeCheckoutIntent
            />
          </div>
        </div>

        {!isPro && (
          <PricingComparisonSection priceOptions={priceOptions} />
        )}

        {/* Order history */}
        {HUMAN_WRITTEN_SERVICE_ENABLED && paidOrders.length > 0 && (
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
                      <td className="px-5 py-4 font-medium text-gray-900">Human-Written Resume{order.job_title ? ` — ${order.job_title}` : ''}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{formatOrderAmount(order.amount)}</td>
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
        </div>
      </div>
    </>
  )
}
