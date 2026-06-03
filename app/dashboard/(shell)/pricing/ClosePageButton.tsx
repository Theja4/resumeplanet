'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

export default function ClosePageButton() {
  const router = useRouter()

  function handleClose() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Close"
      className="fixed right-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-on-surface-variant shadow-[0_10px_30px_rgba(25,28,29,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-on-surface sm:right-6 sm:top-6"
    >
      <X size={18} strokeWidth={2.2} />
    </button>
  )
}
