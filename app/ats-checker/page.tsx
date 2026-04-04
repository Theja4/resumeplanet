import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ATSCheckerClient from '@/app/dashboard/(shell)/ats-checker/ATSCheckerClient'

export default async function PublicATSCheckerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/ats-checker')
  }

  return (
    <div className="min-h-screen bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 px-8 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl font-['Plus_Jakarta_Sans'] tracking-tight">
        <Link href="/" className="text-xl font-bold tracking-tighter text-zinc-900">
          Rezoomed
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full border-2 border-transparent px-6 py-2 text-sm font-bold text-zinc-500 transition-all hover:bg-black hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary-container bg-primary-container/10 px-6 py-2 text-sm font-bold text-primary-landing transition-all hover:bg-primary-container/20"
          >
            Create Account
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <ATSCheckerClient resumes={[]} profile={null} publicMode />
      </main>
    </div>
  )
}
