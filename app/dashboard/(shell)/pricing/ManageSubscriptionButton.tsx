'use client'

import { useState } from 'react'

interface Props {
  label?: string
  className?: string
}

export default function ManageSubscriptionButton({ label = 'Manage Subscription', className }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManage() {
    setLoading(true)
    setError(null)
    try {
      const endpoint =
        process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'polar'
          ? '/api/polar/portal'
          : '/api/paddle/portal'
      const res = await fetch(endpoint, { method: 'POST' })
      const json = await res.json()
      const url = json.data?.portalUrl
      if (url) {
        window.location.href = url
      } else {
        setError(json.error ?? 'Failed to open portal. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2 text-center">{error}</p>}
      <button
        onClick={handleManage}
        disabled={loading}
        className={className ?? 'flex w-full items-center justify-center gap-2 rounded-full border border-white/80 bg-white/88 px-6 py-4 text-sm font-semibold text-slate-700 shadow-[0_16px_40px_rgba(25,28,29,0.05)] transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50'}
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
          label
        )}
      </button>
    </div>
  )
}
