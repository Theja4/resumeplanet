import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ResumeData } from '@/types'

export default async function NewBlankResumePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Define a fresh, entirely empty ResumeData object
  const emptyData: ResumeData = {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    volunteer: [],
    interests: [],
    awards: [],
    publications: [],
    references: [],
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
  redirect(`/dashboard/builder/draft?template=modern-minimal`)
}
