import { createClient } from '@/lib/supabase/server'
import CVGeneratorClient from '@/components/cv/CVGeneratorClient'
import ProFeaturePageGate from '@/components/shared/ProFeaturePageGate'
import type { Resume, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CVGeneratorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [profileResult, resumesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('resumes')
      .select('id, title, parsed_data')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const profile = profileResult.data as Profile | null

  if (profile?.plan !== 'pro') {
    return (
      <ProFeaturePageGate
        feature="Cover Letter"
        title="Cover Letter generation is a Pro workflow."
        description="Generate a role-specific cover letter from your saved resume or an uploaded file, then export it immediately once it is ready."
        bullets={[
          'Use your resume plus a target job description to draft a tailored letter.',
          'Download the result as PDF or DOCX after generation.',
          'Upgrade instantly through Paddle without leaving the dashboard.',
        ]}
        analyticsLocation="route-gate:cover-letter"
      />
    )
  }

  const resumes = (resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'parsed_data'>[]

  return <CVGeneratorClient resumes={resumes} />
}
