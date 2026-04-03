'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRO_PLAN, type PromoConfig } from '@/lib/pricing'
import PricingToggle from '@/components/shared/PricingToggle'
import PricingCard from '@/components/shared/PricingCard'

interface Props {
  activePromo: PromoConfig | null
}

export default function PricingSection({ activePromo }: Props) {
  const router = useRouter()
  const [selectedPriceId, setSelectedPriceId] = useState(PRO_PLAN.defaultPrice.id)

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
        <p className="mt-2 text-gray-500">Start free, upgrade when you need more power.</p>
      </div>

      {/* Interval toggle */}
      <div className="flex justify-center mb-8">
        <PricingToggle
          selectedPriceId={selectedPriceId}
          onChange={setSelectedPriceId}
          activePromo={activePromo}
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <PricingCard
          variant="free"
          activePromo={activePromo}
          onUpgrade={() => router.push('/auth/register')}
        />
        <PricingCard
          variant="pro"
          selectedPriceId={selectedPriceId}
          activePromo={activePromo}
          onUpgrade={() => router.push('/auth/register')}
        />
        <PricingCard
          variant="professional"
          activePromo={activePromo}
        />
      </div>

      {/* Active promo note */}
      {activePromo?.isBanner && activePromo.paddleDiscountCode && (
        <p className="text-center text-sm text-gray-500 mt-6">
          🎉 <span className="font-medium">{activePromo.badge}</span> active — use code{' '}
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
            {activePromo.paddleDiscountCode}
          </span>{' '}
          at checkout
        </p>
      )}
    </section>
  )
}
