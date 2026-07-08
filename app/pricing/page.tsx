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
import { DEFAULT_OG_IMAGE, getAbsoluteUrl } from '@/lib/seo'
import PricingWorkspaceClient from '@/app/dashboard/(shell)/pricing/PricingWorkspaceClient'
import PricingComparisonSection from './PricingComparisonSection'

const pricingPreviewImage = {
  url: getAbsoluteUrl(DEFAULT_OG_IMAGE.url),
  width: DEFAULT_OG_IMAGE.width,
  height: DEFAULT_OG_IMAGE.height,
  alt: DEFAULT_OG_IMAGE.alt,
}

export const metadata: Metadata = {
  title: 'Resume Builder Pricing',
  description:
    'Compare Rezoomed Free and Pro plans for ATS resume optimization, job matching, and AI resume building.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    type: 'website',
    title: 'Resume Builder Pricing | Rezoomed',
    description: 'Compare Rezoomed Free and Pro plans for ATS resume optimization, job matching, and AI resume building.',
    url: '/pricing',
    images: [pricingPreviewImage],
  },
  twitter: {
    card: 'summary',
    title: 'Resume Builder Pricing | Rezoomed',
    description: 'Compare Rezoomed Free and Pro plans for ATS resume optimization, job matching, and AI resume building.',
    images: [pricingPreviewImage.url],
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
          <div id="pricing-top" className="scroll-mt-28">
            <DashboardSurface variant="default" className="space-y-4 p-4 sm:p-5">
              <h1 className="max-w-6xl text-[2.35rem] font-black leading-[0.98] tracking-tight text-on-background sm:text-[clamp(2.7rem,4vw,3.1rem)] lg:whitespace-nowrap">
                Land that dream job with Rezoomed Pro!
              </h1>

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

          <PricingComparisonSection priceOptions={priceOptions} />
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
