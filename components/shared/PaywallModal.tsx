'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import {
  PRO_PLAN,
  getActivePromotion,
  getEffectiveDisplay,
  formatPriceDisplay,
} from '@/lib/pricing'
import PriceDisplay from './PriceDisplay'
import UpgradeButton from './UpgradeButton'
import { Analytics } from '@/lib/analytics'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  reason?: React.ReactNode
}

export default function PaywallModal({ isOpen, onClose, feature, reason }: PaywallModalProps) {
  useEffect(() => {
    if (!isOpen) return

    Analytics.upgradePromptShown({
      location: `paywall:${feature}`,
      variant: 'modal',
    })
  }, [feature, isOpen])

  if (!isOpen) return null

  const activePromo = getActivePromotion()
  const priceOption = PRO_PLAN.defaultPrice
  const display = getEffectiveDisplay(priceOption, activePromo)
  const formatted = formatPriceDisplay(display, priceOption)

  const ctaLabel = formatted.hasDiscount
    ? `Claim Offer — ${formatted.main}/mo`
    : `Upgrade to Pro — ${formatted.main}/mo`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
      {/* Modal Backdrop Overlay */}
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40" onClick={onClose}></div>
      
      {/* Main Modal Container */}
      <div className="relative z-50 w-full max-w-lg bg-white rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] overflow-hidden font-body text-zinc-900">
        
        {/* Status Top Banner */}
        <div className="bg-[#a3ffb3]/40 px-6 py-2 flex justify-center items-center gap-2">
          <ShieldCheck size={16} className="text-[#026d32]" />
          <span className="text-xs font-bold tracking-[0.05em] uppercase text-[#19793c] leading-none">
            Pro Feature Limit Reached
          </span>
        </div>
        
        {/* Content Area */}
        <div className="p-8 md:p-10 relative bg-white">
          {/* Close Button */}
          <button 
            onClick={() => {
              Analytics.upgradePromptDismissed({
                location: `paywall:${feature}`,
              })
              onClose()
            }}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <X size={24} />
          </button>
          
          {/* Brand text */}
          <div className="mb-8">
            <span className="text-zinc-900 font-extrabold text-lg tracking-tighter">Rezoomed</span>
          </div>
          
          {/* Header Section */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
              Upgrade to <br />
              <span className="text-[#80da92]">Unlimited Pro</span>
            </h1>
            <p className="text-zinc-600 text-lg font-medium max-w-sm">
              Unlock {feature} and take your career to the next level.
            </p>
            {reason && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="p-1 rounded-md bg-red-100 text-red-700 shrink-0">
                  <AlertCircle size={16} />
                </div>
                <p className="text-red-900 text-sm font-medium leading-relaxed">
                  {reason}
                </p>
              </div>
            )}
          </div>
          
          {/* Pricing Section (Asymmetric Bento Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mb-8">
            <div className="sm:col-span-3 bg-zinc-50 rounded-xl p-6 flex flex-col justify-center">
              <PriceDisplay
                display={formatted}
                size="lg"
                showInterval={true}
                showPerMonth={false}
                showSavings={false}
                className="items-baseline"
              />
              <p className="mt-2 text-zinc-600 text-sm font-semibold leading-snug">
                Cancel anytime. 
                <span className="block text-xs text-zinc-400 font-normal">7-day money back guarantee</span>
              </p>
            </div>
            
            <div className="sm:col-span-2 space-y-4 py-2">
              {PRO_PLAN.features.slice(0, 3).map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#026d32] shrink-0" />
                  <span className="text-sm font-medium text-zinc-900 leading-tight">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="space-y-4 text-center sm:text-left relative z-20">
            <UpgradeButton
              label={ctaLabel}
              promotionId={activePromo?.isAutoApply ? activePromo.id : undefined}
              promotionCode={activePromo?.isAutoApply ? activePromo.paddleDiscountCode : undefined}
              analyticsLocation={`paywall:${feature}`}
              analyticsVariant="modal"
              className="!bg-[#a3ffb3] !hover:bg-[#9bf7ac] !text-[#19793c] !py-4 !px-8 !font-bold !text-lg !rounded-full !shadow-none !border-none !inline-flex !items-center !justify-center !gap-2 !w-full"
            />
            
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  Analytics.upgradePromptDismissed({
                    location: `paywall:${feature}`,
                  })
                  onClose()
                }}
                className="text-zinc-500 hover:text-zinc-700 text-sm font-semibold transition-colors"
              >
                Maybe later, keep free version
              </button>
            </div>
          </div>
          
          {/* Background Aesthetic Texture */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#a3ffb3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#80da92]/10 rounded-full blur-[80px] pointer-events-none"></div>
        </div>
      </div>
    </div>
  )
}

// Hook for easy usage across the app
export function usePaywall() {
  const [isOpen, setIsOpen] = useState(false)
  const [feature, setFeature] = useState('')
  const [reason, setReason] = useState<React.ReactNode>('')

  function showPaywall(featureName: string, reasonText?: React.ReactNode) {
    setFeature(featureName)
    if (reasonText) setReason(reasonText)
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
        reason={reason}
      />
    )
  }

  return { showPaywall, hidePaywall, PaywallModalComponent }
}
