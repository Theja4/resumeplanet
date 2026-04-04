'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function AdminLogoutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogout() {
    setIsSubmitting(true)

    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
      })
    } finally {
      router.replace('/admin/login')
      router.refresh()
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogOut size={14} />
      {isSubmitting ? 'Leaving...' : 'Logout'}
    </button>
  )
}
