import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export default async function NewBlankResumePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check resume limit for free users
  const { count } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'free' && (count ?? 0) >= 3) {
    redirect('/dashboard/resumes?status=limit-reached')
  }

  // Reroute to builder in 'draft' mode. 
  // No database record is created until the user actually makes an edit.
  redirect('/dashboard/builder/draft')
}
