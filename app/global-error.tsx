'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Critical Root Layout Error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">A critical error occurred</h1>
          <p className="mt-4 text-zinc-600">
            The application failed to load its core structure. Please try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            className="mt-8 rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 active:scale-95"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
