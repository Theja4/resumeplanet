import { Check, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
  delay?: string
}

export default function PricingCard({
  variant,
  selectedPriceId,
  activePromo,
  isCurrentPlan = false,
  onUpgrade,
  isUpgrading = false,
  delay = '0ms',
}: Props) {
  if (variant === 'free') {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col h-full relative overflow-hidden opacity-0 [animation:card-enter_0.5s_ease_forwards]"
        style={{ animationDelay: delay }}
      >
          <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-bold text-gray-900">Free</span>
          <span className="text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            FREE
          </span>
        </div>

        <div className="mb-5">
          <span className="text-4xl font-bold text-gray-900">$0</span>
          <span className="text-gray-500 text-sm ml-1">/month</span>
        </div>

        {isCurrentPlan && (
          <div className="mb-6 w-full text-center py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">
            Current plan
          </div>
        )}

        <p className="text-xs text-gray-400 font-medium mb-3">Free plan includes:</p>
        <ul className="space-y-2.5 flex-1">
          {FREE_PLAN.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
              <Check size={15} className="text-gray-400 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
          {FREE_PLAN.lockedFeatures.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
              <Lock size={13} className="shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (variant === 'pro') {
    const priceOption = PRO_PLAN.getPriceById(selectedPriceId ?? 'monthly') ?? PRO_PLAN.defaultPrice
    const display = getEffectiveDisplay(priceOption, activePromo)
    const formatted = formatPriceDisplay(display, priceOption)

    const promoBadge =
      !isCurrentPlan &&
      activePromo?.overrideDisplay &&
      (activePromo.appliesTo === 'all' || activePromo.appliesTo === priceOption.id)
        ? activePromo.badge
        : null

    return (
      <div
        className="bg-[#026d32] rounded-2xl p-7 flex flex-col h-full relative overflow-hidden text-white opacity-0 [animation:card-enter_0.5s_ease_forwards]"
        style={{ animationDelay: delay }}
      >
        {/* Shimmer */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent [animation:shimmer-sweep_5s_ease-in-out_2.5s_infinite]" />
        </div>

        {promoBadge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              {promoBadge}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-bold text-white">Pro</span>
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full">
            PRO
          </span>
        </div>

        <div className="mb-5">
          <PriceDisplay
            display={formatted}
            size="lg"
            showInterval={true}
            showPerMonth={true}
            showSavings={true}
            className="text-white [&_span]:text-white [&_p]:text-green-200"
          />
        </div>

        <div className="mb-6">
          {isCurrentPlan ? (
            <div className="w-full text-center py-3 text-sm text-green-200 border border-white/30 rounded-xl">
              Current plan
            </div>
          ) : (
            <button
              onClick={onUpgrade}
              disabled={isUpgrading}
              className="w-full py-3 bg-white text-[#026d32] rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isUpgrading ? (
                'Opening checkout…'
              ) : (
                <>Upgrade to Pro <ArrowRight size={14} /></>
              )}
            </button>
          )}
        </div>

        <p className="text-xs text-green-200 font-medium mb-3">Pro plan includes:</p>
        <ul className="space-y-2.5 flex-1">
          {PRO_PLAN.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-white">
              <Check size={15} className="text-green-300 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Professional Rewrite
  return (
    <div
      className="bg-white rounded-2xl border border-amber-200 p-7 flex flex-col h-full relative overflow-hidden opacity-0 [animation:card-enter_0.5s_ease_forwards]"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-lg font-bold text-gray-900">Professional</span>
        <span className="text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
          PRO+
        </span>
      </div>

      <div className="mb-5">
        <span className="text-4xl font-bold text-gray-900">
          ${PROFESSIONAL_ORDER.display.displayPrice}
        </span>
        <span className="text-gray-500 text-sm ml-1">one-time</span>
      </div>

      <div className="mb-6">
        <Link
          href="/dashboard/orders/new"
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          Order Now <ArrowRight size={14} />
        </Link>
      </div>

      <p className="text-xs text-gray-400 font-medium mb-3">Rewrite includes:</p>
      <ul className="space-y-2.5 flex-1">
        {PROFESSIONAL_ORDER.features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check size={15} className="text-amber-500 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
