import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardOnboardingClient from '@/components/onboarding/DashboardOnboardingClient'

export const dynamic = 'force-dynamic'

export default async function DashboardOnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: profile }, { count: resumeCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  if ((resumeCount ?? 0) > 0) {
    redirect('/dashboard')
  }

  return (
    <DashboardOnboardingClient
      userId={user.id}
      initialEmail={profile?.email ?? user.email ?? ''}
      initialName={profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? ''}
    />
  )
}
