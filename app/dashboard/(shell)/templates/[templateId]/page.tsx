import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidTemplateId } from '@/components/templates/registry'
import TemplatePreviewClient from './TemplatePreviewClient'
import type { Resume, Profile, TemplateId } from '@/types'

interface Props {
  params: Promise<{ templateId: string }>
}

export default async function TemplatePreviewPage({ params }: Props) {
  const { templateId } = await params

  // Validate template ID via registry — future-proof, auto-accepts new templates
  if (!isValidTemplateId(templateId)) {
    redirect('/dashboard/templates')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [resumesResult, profileResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const resumes = (resumesResult.data ?? []) as Resume[]
  const profile = profileResult.data as Profile | null

  return (
    <TemplatePreviewClient
      initialTemplateId={templateId as TemplateId}
      initialResumes={resumes}
      profile={profile}
    />
  )
}
