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
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
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
              'relative px-5 py-2 rounded-full text-sm transition-all font-medium',
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            {option.label}
            {badge && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                {badge}
              </span>
            )}
            {/* Show discount indicator in button when not selected */}
            {!isSelected && display.hasDiscount && !badge && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                SALE
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
