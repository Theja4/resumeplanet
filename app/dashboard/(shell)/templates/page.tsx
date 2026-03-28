import { createClient } from '@/lib/supabase/server'
import { getAllTemplates } from '@/components/templates/registry'
import { isPro } from '@/lib/planUtils'
import TemplateCard from '@/components/templates/TemplateCard'
import AdBanner from '@/components/shared/AdBanner'
import type { Resume, Profile } from '@/types'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [resumesResult, profileResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const userResumes = (resumesResult.data ?? []) as Resume[]
  const profile = profileResult.data as Profile | null
  const proUser = isPro(profile)

  // Data-driven: getAllTemplates() is the only source of truth.
  // Adding a new registry entry = automatically appears here.
  const templates = getAllTemplates()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          {templates.length} professional templates. Choose one to preview with your resume.
          {!proUser && ' Upgrade to Pro to download.'}
        </p>
      </div>

      <AdBanner size="rectangle" className="mx-auto" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(entry => (
          <TemplateCard
            key={entry.config.id}
            templateId={entry.config.id}
            userResumes={userResumes}
            isPro={proUser}
          />
        ))}
      </div>
    </div>
  )
}
