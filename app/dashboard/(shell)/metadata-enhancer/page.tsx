import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import ProFeaturePageGate from '@/components/shared/ProFeaturePageGate'
import MetadataEnhancerClient from './MetadataEnhancerClient'
import type { Resume } from '@/types'

export default async function MetadataEnhancerPage() {
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  if (profile?.plan !== 'pro') {
    return (
      <ProFeaturePageGate
        feature="Metadata Enhancer"
        title="ATS systems read your PDF metadata too."
        description="Most resumes fail ATS screening before a human ever reads them — because of hidden metadata fields like Author, Keywords, and Title that were never set correctly."
        bullets={[
          'Audit all 6 PDF metadata fields against your resume content.',
          'Get plain-English explanations of why each issue hurts ATS parsing.',
          'Fix everything in one click and download your patched resume PDF.',
        ]}
        analyticsLocation="route-gate:metadata-enhancer"
      />
    )
  }

  const { data: resumesData } = await supabase
    .from('resumes')
    .select('id, title, raw_text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const resumes = (resumesData ?? []) as Pick<Resume, 'id' | 'title' | 'raw_text'>[]

  return <MetadataEnhancerClient resumes={resumes} />
}
