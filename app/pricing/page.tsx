import type { Metadata } from 'next'
import { headers } from 'next/headers'
import PricingSection from '@/components/landing/PricingSection'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import { buildAffiliatePricingPromo } from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  logAffiliateInfrastructureError,
  readAffiliateReferralCodeFromCookies,
} from '@/lib/affiliate-server'
import {
  getActivePromotion,
  getActivePromotionByCode,
  getActivePromotionById,
} from '@/lib/pricing'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { detectRequestCountry } from '@/lib/cookie-consent'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Rezoomed pricing for Free, Pro, and recruiter-led professional resume services.',
}

export default async function PublicPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string; ref?: string }>
}) {
  const params = await searchParams
  const headerStore = await headers()
  const pricingCountryCode = detectRequestCountry(headerStore)
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
    getActivePromotion()

  const autoApplyCode = affiliateAttribution?.discount_code

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />
      <main className="px-4 pb-12 pt-24 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <PricingSection
            activePromo={pricingPromo}
            autoApplyCode={autoApplyCode}
            pricingCountryCode={pricingCountryCode}
          />
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  )
}
