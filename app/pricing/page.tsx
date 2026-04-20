import type { Metadata } from 'next'
import { headers } from 'next/headers'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PricingPageTracker from '@/components/analytics/PricingPageTracker'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import { buildAffiliatePricingPromo } from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  logAffiliateInfrastructureError,
  readAffiliateReferralCodeFromCookies,
} from '@/lib/affiliate-server'
import {
  getActiveAutoApplyPromotion,
  getActivePromotionByCode,
  getActivePromotionById,
} from '@/lib/pricing'
import { getLiveVisibleProPriceOptions } from '@/lib/paddle-pricing'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { detectRequestCountry } from '@/lib/cookie-consent'
import { getSiteUrl } from '@/lib/site'
import PricingWorkspaceClient from '@/app/dashboard/(shell)/pricing/PricingWorkspaceClient'

export const metadata: Metadata = {
  title: 'Resume Builder Pricing | Rezoomed',
  description:
    'Compare Rezoomed Free and Pro plans for ATS resume optimization, job matching, and AI resume building.',
  keywords: [
    'resume builder pricing',
    'ats checker pricing',
    'resume optimization pricing',
    'Rezoomed pricing',
    'ai resume builder pricing',
  ],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    type: 'website',
    title: 'Resume Builder Pricing | Rezoomed',
    description: 'Compare Rezoomed Free and Pro plans for ATS resume optimization, job matching, and AI resume building.',
    url: '/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume Builder Pricing | Rezoomed',
    description: 'Compare Rezoomed Free and Pro plans for ATS resume optimization, job matching, and AI resume building.',
  },
}

export default async function PublicPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string; ref?: string }>
}) {
  const params = await searchParams
  const headerStore = await headers()
  const pricingCountryCode = detectRequestCountry(headerStore)
  const priceOptionsPromise = getLiveVisibleProPriceOptions(pricingCountryCode)
  const promoToken = params.promo?.trim() ?? ''
  const refToken = params.ref?.trim() ?? ''
  const cookieAffiliateCode = await readAffiliateReferralCodeFromCookies()

  const activePromotionFromQuery =
    getActivePromotionById(promoToken) ?? getActivePromotionByCode(promoToken)

  let affiliateAttribution = null
  const affiliateLookupCandidates = [promoToken, refToken, cookieAffiliateCode].filter(
    (value): value is string => Boolean(value)
  )

  try {
    const serviceSupabase = createServiceRoleClient()

    for (const candidateCode of affiliateLookupCandidates) {
      affiliateAttribution = await findAffiliateByDiscountCode(serviceSupabase, candidateCode)

      if (affiliateAttribution) {
        break
      }
    }
  } catch (error) {
    logAffiliateInfrastructureError('public-pricing-affiliate-lookup', error)
  }

  const pricingPromo =
    buildAffiliatePricingPromo(affiliateAttribution) ??
    activePromotionFromQuery ??
    getActiveAutoApplyPromotion()

  const autoApplyCode = affiliateAttribution?.discount_code
  const priceOptions = await priceOptionsPromise
  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${siteUrl}/pricing` },
    ],
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PricingPageTracker source="public" />
      <PublicSiteHeader active="pricing" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="px-4 pb-12 pt-24 sm:px-6">
        <div className="mx-auto max-w-[1320px] space-y-5">
          <DashboardSurface variant="default" className="space-y-4 p-4 sm:p-5">
            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                Plans & Billing
              </span>
              <div className="space-y-1.5">
                <h1 className="max-w-4xl text-[2.35rem] font-black leading-[0.98] tracking-tight text-on-background sm:text-[3.1rem] xl:max-w-none xl:whitespace-nowrap">
                  Transparent pricing, live checkout, promo-ready.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Compare the free tier with live monthly and annual Pro plans, apply a coupon code, and carry that discount straight into checkout.
                </p>
              </div>
            </div>

            <div className="border-t border-black/6 pt-4">
              <PricingWorkspaceClient
                autoFillPromo={autoApplyCode}
                availablePromo={pricingPromo}
                isPro={false}
                priceOptions={priceOptions}
                pricingCountryCode={pricingCountryCode}
                loginRedirectPath="/dashboard/pricing"
              />
            </div>
          </DashboardSurface>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
