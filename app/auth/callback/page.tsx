'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/login?error=server_error')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}
