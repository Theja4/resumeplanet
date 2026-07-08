import { redirect } from 'next/navigation'
import { getOptionalAuthenticatedUserContext } from '@/lib/authenticated-user'
import { ATS_TEMPLATE_PRESETS } from '@/lib/templateOptions'
import { mapJobPostedResume } from '@/lib/jobposted-import'
import type { ResumeData } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * Handoff target for JobPosted's "Edit in Rezoomed" button. JobPosted tailors a resume
 * and stores its structured form as `{path}.json` next to the PDF in the shared Supabase
 * `resumes` bucket. Given the tailored `documents` row id (?doc=), this reads that JSON,
 * maps it into Rezoomed's schema, creates a resume in the "Timeless" (Jake) template, and
 * opens the builder pre-filled. Unauthenticated users are sent through login and returned
 * here (?next=).
 */
export default async function BuilderImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const docId = typeof params.doc === 'string' ? params.doc.trim() : ''
  const selfPath = `/dashboard/builder/import?doc=${encodeURIComponent(docId)}`

  const context = await getOptionalAuthenticatedUserContext()
  if (!context) {
    redirect(`/auth/login?next=${encodeURIComponent(selfPath)}`)
  }
  const { supabase, userId } = context

  if (!docId) {
    redirect('/dashboard/builder/new')
  }

  // JobPosted's tailored-resume document (same Supabase project) → its storage path.
  const { data: doc } = await supabase
    .schema('jobposted')
    .from('documents')
    .select('storage_path')
    .eq('id', docId)
    .eq('user_id', userId)
    .maybeSingle()

  const storagePath = typeof doc?.storage_path === 'string' ? doc.storage_path : ''
  if (!storagePath) {
    redirect('/dashboard/builder/new?import=missing')
  }

  // The structured resume JobPosted saved alongside the rendered PDF.
  const jsonPath = storagePath.replace(/\.pdf$/i, '.json')
  const { data: blob, error: downloadError } = await supabase.storage.from('resumes').download(jsonPath)
  if (downloadError || !blob) {
    redirect('/dashboard/builder/new?import=missing')
  }

  let parsedData: ResumeData | null = null
  try {
    parsedData = mapJobPostedResume(JSON.parse(await blob.text()))
  } catch {
    parsedData = null
  }
  if (!parsedData) {
    redirect('/dashboard/builder/new?import=invalid')
  }

  const timeless = ATS_TEMPLATE_PRESETS.find((preset) => preset.id === 'timeless')
  const title = parsedData.currentRole ? `${parsedData.currentRole} — tailored` : 'Tailored resume'

  const { data: created, error: insertError } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title,
      raw_text: '',
      parsed_data: parsedData,
      template_config: timeless?.config ?? null,
      original_file_url: null,
    })
    .select('id')
    .single()

  if (insertError || !created?.id) {
    redirect('/dashboard/builder/new?import=failed')
  }

  redirect(`/dashboard/builder/${created.id}?source=jobposted`)
}
