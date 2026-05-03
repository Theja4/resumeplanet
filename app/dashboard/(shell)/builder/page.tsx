import { redirect } from 'next/navigation'
import TailorModeEntryDialog from '@/components/builder/TailorModeEntryDialog'
import ProFeaturePageGate from '@/components/shared/ProFeaturePageGate'
import type { Resume } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

function buildRedirectQuery(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach(entry => query.append(key, entry))
    }
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export default async function BuilderIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const mode = typeof resolvedSearchParams.mode === 'string' ? resolvedSearchParams.mode : null

  if (mode !== 'tailor') {
    // The user wants the 'Resume Builder' tab to always start a new resume
    redirect(`/dashboard/builder/new${buildRedirectQuery(resolvedSearchParams)}`)
  }

  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const [resumesResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
  ])

  if (profile?.plan !== 'pro') {
    return (
      <ProFeaturePageGate
        feature="Tailor Mode"
        title="Tailor Mode is a Pro workflow."
        description="Open any saved resume, paste a target job description, and let Rezoomed rewrite the strongest parts of your profile for that role."
        bullets={[
          'Open the resume builder directly in the Tailor tab.',
          'Get section-by-section rewrite suggestions tied to the target role.',
          'Compare Pro plans on the pricing page before upgrading.',
        ]}
        analyticsLocation="route-gate:tailor-mode"
      />
    )
  }

  const resumes = (resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'created_at' | 'updated_at'>[]

  return <TailorModeEntryDialog resumes={resumes} />
}
