'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Unhandled Application Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-rose-500" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">Something went wrong</h1>
        <p className="mt-6 text-base leading-7 text-zinc-600">
          An unexpected error occurred. We&apos;ve been notified and are looking into it.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-all active:scale-95"
          >
            <RefreshCcw size={16} />
            Try again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
          >
            <Home size={16} />
            Go back home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-zinc-400">
            Error ID: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  )
}
