import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResumeLioClient from './ResumeLioClient'
import type { Resume, ResumeLioSite } from '@/types'

export default async function ResumeLioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: site } = await supabase
    .from('resume_lio_sites')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, title, parsed_data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <ResumeLioClient
      initialSite={(site as ResumeLioSite | null) ?? null}
      resumes={(resumes as Resume[] | null) ?? []}
    />
  )
}
