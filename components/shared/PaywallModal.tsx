'use client'

import { useState } from 'react'
import { X, Check, Sparkles } from 'lucide-react'
import {
  PRO_PLAN,
  getActivePromotion,
  getEffectiveDisplay,
  formatPriceDisplay,
} from '@/lib/pricing'
import PriceDisplay from './PriceDisplay'
import UpgradeButton from './UpgradeButton'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  reason?: string
}

export default function PaywallModal({ isOpen, onClose, feature, reason: _reason }: PaywallModalProps) {
  if (!isOpen) return null

  const activePromo = getActivePromotion()
  const priceOption = PRO_PLAN.defaultPrice
  const display = getEffectiveDisplay(priceOption, activePromo)
  const formatted = formatPriceDisplay(display, priceOption)

  const ctaLabel = formatted.hasDiscount
    ? `Upgrade — ${formatted.main}/mo (was ${formatted.actual})`
    : `Upgrade to Pro — ${formatted.main}/mo`

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top gradient section */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex justify-center mb-3">
            <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
          <p className="text-indigo-100 mt-1 text-sm">Unlock {feature}</p>
        </div>

        {/* Bottom section */}
        <div className="p-8">
          {/* Promo badge */}
          {activePromo && (
            <div className="text-center mb-4">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                {activePromo.badge}
              </span>
            </div>
          )}

          <ul className="space-y-2.5 mb-6">
            {PRO_PLAN.features.map(benefit => (
              <li key={benefit} className="flex items-center gap-3">
                <Check size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="text-center mb-6">
            <PriceDisplay
              display={formatted}
              size="lg"
              showInterval={true}
              showPerMonth={false}
              showSavings={false}
              className="items-center"
            />
            <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
          </div>

          <UpgradeButton
            label={ctaLabel}
            couponId={activePromo?.isAutoApply ? activePromo.paddleDiscountId : undefined}
          />

          <button
            onClick={onClose}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easy usage across the app
export function usePaywall() {
  const [isOpen, setIsOpen] = useState(false)
  const [feature, setFeature] = useState('')

  function showPaywall(featureName: string) {
    setFeature(featureName)
    setIsOpen(true)
  }

  function hidePaywall() {
    setIsOpen(false)
  }

  function PaywallModalComponent() {
    return (
      <PaywallModal
        isOpen={isOpen}
        onClose={hidePaywall}
        feature={feature}
      />
    )
  }

  return { showPaywall, hidePaywall, PaywallModalComponent }
}
