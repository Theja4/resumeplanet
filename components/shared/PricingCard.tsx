import { Check, Lock } from 'lucide-react'
import {
  FREE_PLAN,
  PRO_PLAN,
  PROFESSIONAL_ORDER,
  getEffectiveDisplay,
  formatPriceDisplay,
  type PromoConfig,
} from '@/lib/pricing'
import PriceDisplay from './PriceDisplay'

interface Props {
  variant: 'free' | 'pro' | 'professional'
  selectedPriceId?: string
  activePromo: PromoConfig | null
  isCurrentPlan?: boolean
  onUpgrade?: () => void
  isUpgrading?: boolean
}

export default function PricingCard({
  variant,
  selectedPriceId,
  activePromo,
  isCurrentPlan = false,
  onUpgrade,
  isUpgrading = false,
}: Props) {
  if (variant === 'free') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Free</span>
          <div className="mt-2">
            <span className="text-4xl font-bold text-gray-900">$0</span>
            <span className="text-gray-500 ml-1">/month</span>
          </div>
        </div>

        <ul className="space-y-2 mb-6 flex-1">
          {FREE_PLAN.features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
              <Check size={15} className="text-green-500 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
          {FREE_PLAN.lockedFeatures.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
              <Lock size={13} className="shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <div className="w-full text-center py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">
            Current plan
          </div>
        ) : (
          <button
            onClick={onUpgrade}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Get started free
          </button>
        )}
      </div>
    )
  }

  if (variant === 'pro') {
    const priceOption = PRO_PLAN.getPriceById(selectedPriceId ?? 'monthly') ?? PRO_PLAN.defaultPrice
    const display = getEffectiveDisplay(priceOption, activePromo)
    const formatted = formatPriceDisplay(display, priceOption)

    const promoBadge = activePromo?.overrideDisplay &&
      (activePromo.appliesTo === 'all' || activePromo.appliesTo === priceOption.id)
      ? activePromo.badge
      : null

    return (
      <div className="bg-indigo-600 rounded-2xl p-6 flex flex-col relative text-white">
        {/* Badge */}
        {promoBadge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              {promoBadge}
            </span>
          </div>
        )}

        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Pro</span>
          <div className="mt-2">
            <PriceDisplay
              display={formatted}
              size="lg"
              showInterval={true}
              showPerMonth={true}
              showSavings={true}
              className="text-white [&_span]:text-white [&_p]:text-indigo-200"
            />
          </div>
        </div>

        <ul className="space-y-2 mb-6 flex-1">
          {PRO_PLAN.features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-white">
              <Check size={15} className="text-indigo-200 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <div className="w-full text-center py-3 text-sm text-indigo-200 border border-indigo-400 rounded-xl">
            Current plan
          </div>
        ) : (
          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpgrading ? 'Opening checkout…' : 'Upgrade to Pro'}
          </button>
        )}
      </div>
    )
  }

  // Professional
  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-6 flex flex-col">
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Professional</span>
        <div className="mt-2">
          <span className="text-4xl font-bold text-gray-900">
            ${PROFESSIONAL_ORDER.display.displayPrice}
          </span>
          <span className="text-gray-500 ml-1">one-time</span>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {PROFESSIONAL_ORDER.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <Check size={15} className="text-amber-500 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={onUpgrade}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        Order now →
      </button>
    </div>
  )
}
