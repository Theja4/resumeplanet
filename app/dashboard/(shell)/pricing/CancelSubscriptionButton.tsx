'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  provider?: string | null
  className?: string
}

export default function CancelSubscriptionButton({ provider, className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleCancel() {
    setLoading(true)
    setError(null)
    try {
      if (provider === 'razorpay') {
        const res = await fetch('/api/razorpay/subscription/cancel', { method: 'POST' })
        const json = await res.json()

        if (json.success) {
          setSuccess(true)
          setTimeout(() => window.location.reload(), 3000)
        } else {
          setError(json.error ?? 'Failed to cancel subscription. Please try again.')
          setLoading(false)
        }
        return
      }

      if (provider === 'polar' || process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'polar') {
        const res = await fetch('/api/polar/subscription/cancel', { method: 'POST' })
        const json = await res.json()
        if (json.success) {
          setSuccess(true)
          setTimeout(() => window.location.reload(), 3000)
          return
        }
        setError(json.error ?? 'Failed to cancel subscription. Please contact support@rezoomed.com.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/paddle/subscription/cancel', { method: 'POST' })
      const json = await res.json()
      
      if (json.success) {
        setSuccess(true)
        // Refresh the page after a short delay to reflect the scheduled cancellation state
        setTimeout(() => window.location.reload(), 3000)
      } else {
        setError(json.error ?? 'Failed to cancel subscription. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
        <p className="font-bold">Cancellation Scheduled</p>
        <p className="mt-1 opacity-90">Your Pro access will remain active until the end of your current billing period. The page will reload shortly.</p>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className ?? "text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition-colors"}
      >
        Cancel Subscription
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_32px_80px_rgba(0,0,0,0.12)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">Cancel your Pro plan?</h3>
            
            <p className="mt-4 text-sm leading-7 text-slate-500">
              You will keep all Pro features until your current period ends. 
              <span className="block mt-2 font-bold text-slate-700 underline underline-offset-4 decoration-red-200">No partial refunds are issued.</span>
              After your period ends, you will lose access to AI insights, unlimited scans, and tailored resume versions.
            </p>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="w-full rounded-full border border-slate-200 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-50"
              >
                Nevermind, keep Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
