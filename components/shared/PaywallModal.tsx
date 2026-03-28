'use client'

import { useState } from 'react'
import { X, Check, Sparkles } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  reason?: string
}

async function startCheckout(): Promise<string | null> {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'subscription' }),
    })
    const json = await res.json()
    return json.data?.checkoutUrl ?? null
  } catch {
    return null
  }
}

const PRO_BENEFITS = [
  'Unlimited ATS scans',
  'Advanced AI analysis (Claude Opus)',
  'All 5 resume templates + download',
  'Resume auto-optimiser',
  'Ad-free experience',
  'Full resume builder',
]

export default function PaywallModal({ isOpen, onClose, feature, reason: _reason }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    const url = await startCheckout()
    if (url) {
      window.location.href = url
    } else {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

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
          <ul className="space-y-2.5 mb-6">
            {PRO_BENEFITS.map(benefit => (
              <li key={benefit} className="flex items-center gap-3">
                <Check size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="text-center mb-6">
            <p className="text-3xl font-bold text-gray-900">$12 <span className="text-lg font-normal text-gray-500">/ month</span></p>
            <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center mb-3">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting to checkout…' : 'Upgrade to Pro →'}
          </button>

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
