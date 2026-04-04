'use client'

import { cn } from '@/lib/utils'
import {
  PRO_PLAN,
  getEffectiveDisplay,
  formatPriceDisplay,
  type PromoConfig,
} from '@/lib/pricing'

interface Props {
  selectedPriceId: string
  onChange: (priceId: string) => void
  activePromo: PromoConfig | null
}

export default function PricingToggle({ selectedPriceId, onChange, activePromo }: Props) {
  const visiblePrices = PRO_PLAN.visiblePrices

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/86 p-1.5 shadow-[0_18px_40px_rgba(25,28,29,0.08)] backdrop-blur-xl">
      {visiblePrices.map(option => {
        const display = formatPriceDisplay(getEffectiveDisplay(option, activePromo), option)
        const badge = activePromo?.appliesTo === option.id || activePromo?.appliesTo === 'all'
          ? activePromo.badge
          : option.badge
        const isSelected = selectedPriceId === option.id

        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
              isSelected
                ? 'bg-zinc-950 text-white shadow-[0_12px_24px_rgba(17,24,39,0.16)]'
                : 'text-slate-600 hover:bg-black/[0.04]'
            )}
          >
            {option.label}
            {badge && (
              <span className="absolute -right-2 -top-2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-white shadow-[0_10px_20px_rgba(2,109,50,0.24)]">
                {badge}
              </span>
            )}
            {/* Show discount indicator in button when not selected */}
            {!isSelected && display.hasDiscount && !badge && (
              <span className="absolute -right-2 -top-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                SALE
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
