'use client'

import { useState } from 'react'
import { usePlan } from '@/lib/context/PlanContext'
import { Check, X } from 'lucide-react'

// ─── Plan feature comparison ───────────────────────────────────────────────────

const FEATURES = [
  { label: 'Resume uploads', free: '1 resume', pro: 'Unlimited' },
  { label: 'ATS scans', free: '3 / day', pro: 'Unlimited' },
  { label: 'ATS analysis tier', free: 'Basic', pro: 'Advanced AI' },
  { label: 'AI resume optimisation', free: false, pro: true },
  { label: 'Score breakdown & keyword analysis', free: false, pro: true },
  { label: 'Resume templates', free: false, pro: true },
  { label: 'Download optimised resume', free: false, pro: true },
  { label: 'Priority support', free: false, pro: true },
  { label: 'Ad-free experience', free: false, pro: true },
]

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-5 w-5 text-green-500 mx-auto" />
  if (value === false) return <X className="h-5 w-5 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-700">{value}</span>
}

// ─── Upgrade button ────────────────────────────────────────────────────────────

function UpgradeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setError(json.error ?? 'Failed to start checkout. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-red-600 text-center">{error}</p>
      )}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Redirecting to checkout…
          </>
        ) : (
          'Upgrade to Pro — $12/mo'
        )}
      </button>
    </div>
  )
}

// ─── Manage subscription button ────────────────────────────────────────────────

function ManageButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManage() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setError(json.error ?? 'Failed to open portal. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-red-600 text-center">{error}</p>
      )}
      <button
        onClick={handleManage}
        disabled={loading}
        className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Opening portal…
          </>
        ) : (
          'Manage Subscription'
        )}
      </button>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { isPro, profile } = usePlan()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Plan</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your ResumAI subscription.</p>
      </div>

      {/* Current plan badge */}
      <div className={`rounded-xl border p-5 flex items-center justify-between ${
        isPro ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Plan</p>
          <p className={`text-xl font-bold mt-0.5 ${isPro ? 'text-indigo-700' : 'text-gray-800'}`}>
            {isPro ? 'Pro' : 'Free'}
          </p>
          {profile?.subscription_status && isPro && (
            <p className="text-xs text-gray-500 mt-1 capitalize">
              Status: {profile.subscription_status}
            </p>
          )}
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
            isPro ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {isPro ? 'Active' : 'Free tier'}
        </div>
      </div>

      {/* Plan comparison table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 border-b border-gray-200">
          <div className="px-4 py-4" />
          <div className="px-4 py-4 text-center border-l border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Free</p>
            <p className="text-lg font-bold text-gray-900 mt-1">$0</p>
            <p className="text-xs text-gray-400">forever</p>
          </div>
          <div className="px-4 py-4 text-center border-l border-gray-100 bg-indigo-50">
            <p className="text-sm font-semibold text-indigo-700">Pro</p>
            <p className="text-lg font-bold text-indigo-900 mt-1">$12</p>
            <p className="text-xs text-indigo-400">per month</p>
          </div>
        </div>

        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            <div className="px-4 py-3 text-sm text-gray-700">{feature.label}</div>
            <div className="px-4 py-3 text-center border-l border-gray-100">
              <FeatureCell value={feature.free} />
            </div>
            <div className="px-4 py-3 text-center border-l border-gray-100">
              <FeatureCell value={feature.pro} />
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-sm mx-auto">
        {isPro ? <ManageButton /> : <UpgradeButton />}
      </div>

      {isPro && (
        <p className="text-center text-xs text-gray-400">
          You can cancel anytime from the customer portal. Your access continues until the end of the billing period.
        </p>
      )}
    </div>
  )
}
