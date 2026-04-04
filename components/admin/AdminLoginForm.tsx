'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, LockKeyhole, Shield } from 'lucide-react'

export default function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const json = await response.json()

      if (!response.ok || !json.success) {
        setError(json.error ?? 'Admin login failed.')
        return
      }

      const next = searchParams.get('next')
      router.replace(next || '/admin')
      router.refresh()
    } catch {
      setError('Admin login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="admin-username" className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Username
        </label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={event => setUsername(event.target.value)}
          className="w-full rounded-[1.2rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
          placeholder="Admin username"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          className="w-full rounded-[1.2rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
          placeholder="Admin password"
        />
      </div>

      {error ? (
        <div className="rounded-[1rem] bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !username.trim() || !password}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isSubmitting ? (
          <>
            <LockKeyhole size={16} />
            Verifying admin access...
          </>
        ) : (
          <>
            <Shield size={16} />
            Enter Admin Panel
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  )
}
