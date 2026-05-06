'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertTriangle size={32} />
      </div>
      
      <h2 className="mt-6 text-2xl font-bold text-zinc-900">Dashboard is temporarily unavailable</h2>
      <p className="mt-2 max-w-md text-zinc-500">
        We hit a snag while loading your dashboard data. This might be a temporary connection issue.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-lg shadow-zinc-200"
        >
          <RefreshCw size={18} />
          Refresh Dashboard
        </button>
        
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95"
        >
          <LayoutDashboard size={18} />
          Dashboard Home
        </Link>
      </div>

      {error.digest && (
        <div className="mt-12 rounded-lg bg-zinc-50 px-3 py-1.5 text-[10px] font-medium text-zinc-400">
          DEBUG_ID: {error.digest}
        </div>
      )}
    </div>
  )
}
