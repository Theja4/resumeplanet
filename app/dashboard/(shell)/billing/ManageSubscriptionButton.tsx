'use client'

import { useState } from 'react'

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManage() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paddle/portal', { method: 'POST' })
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
        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
