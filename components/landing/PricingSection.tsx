'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProPlanForCountry, type PromoConfig } from '@/lib/pricing'
import PricingToggle from '@/components/shared/PricingToggle'
import PricingCard from '@/components/shared/PricingCard'

interface Props {
  activePromo: PromoConfig | null
  autoApplyCode?: string
  pricingCountryCode?: string | null
}

export default function PricingSection({
  activePromo,
  autoApplyCode,
  pricingCountryCode,
}: Props) {
  const router = useRouter()
  const proPlan = getProPlanForCountry(pricingCountryCode)
  const [selectedPriceId, setSelectedPriceId] = useState(proPlan.defaultPrice.id)
  const registerHref = autoApplyCode
    ? `/auth/register?ref=${encodeURIComponent(autoApplyCode)}`
    : '/auth/register'

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        {autoApplyCode ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/12 bg-primary-container/35 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-on-primary-container">
            Influencer pricing active
            <span className="rounded-full bg-white/85 px-2 py-1 text-[10px] tracking-[0.18em] text-primary">
              {autoApplyCode}
            </span>
          </div>
        ) : null}
        <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
        <p className="mt-2 text-gray-500">
          {autoApplyCode
            ? 'Your affiliate discount is already applied to the prices below.'
            : 'Start free, upgrade when you need more power.'}
        </p>
      </div>

      {/* Interval toggle */}
      <div className="flex justify-center mb-8">
        <PricingToggle
          selectedPriceId={selectedPriceId}
          onChange={setSelectedPriceId}
          activePromo={activePromo}
          pricingCountryCode={pricingCountryCode}
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <PricingCard
          variant="free"
          activePromo={activePromo}
          onUpgrade={() => router.push(registerHref)}
          pricingCountryCode={pricingCountryCode}
        />
        <PricingCard
          variant="pro"
          selectedPriceId={selectedPriceId}
          activePromo={activePromo}
          onUpgrade={() => router.push(registerHref)}
          pricingCountryCode={pricingCountryCode}
        />
        <PricingCard
          variant="professional"
          activePromo={activePromo}
          pricingCountryCode={pricingCountryCode}
        />
      </div>

      {/* Active promo note */}
      {activePromo?.paddleDiscountCode && (
        <p className="text-center text-sm text-gray-500 mt-6">
          {autoApplyCode ? 'Affiliate discount applied' : 'Offer active'} — use code{' '}
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
            {activePromo.paddleDiscountCode}
          </span>{' '}
          {autoApplyCode ? 'and it will carry into checkout automatically.' : 'at checkout'}
        </p>
      )}
    </section>
  )
}
