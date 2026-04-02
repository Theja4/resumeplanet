import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllTemplates, getPresetConfig } from '@/types'
import { SAMPLE_RESUME } from '@/lib/sampleResumeData'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import UniversalTemplate to avoid SSR issues
const UniversalTemplate = dynamic(
  () => import('@/components/templates/UniversalTemplate').then(mod => mod.default),
  { ssr: false }
)

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/resumes')

  const { data: resumesData } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  const latestResume = (resumesData?.[0] ?? null)

  const presets = getAllTemplates()

  return (
    <div className="min-h-screen bg-gray-50/60 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Starting Style</h1>
          <p className="text-gray-500">Select a preset to begin customizing your resume.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map(entry => {
            const config = entry.config
            const presetId = config.id
            const presetConfig = getPresetConfig(presetId)

            return (
              <Link
                key={config.id}
                href={
                  latestResume
                    ? `/dashboard/builder/${latestResume.id}?template=${presetId}`
                    : '/dashboard/resumes'
                }
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Preview thumbnail */}
                <div className="h-[260px] overflow-hidden bg-white relative border-b border-gray-100">
                  <div
                    style={{
                      transform: 'scale(0.27)',
                      transformOrigin: 'top left',
                      width: '794px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    <UniversalTemplate
                      data={SAMPLE_RESUME}
                      isEditing={false}
                      onFieldChange={() => {}}
                      config={presetConfig}
                      density={presetConfig.density}
                    />
                  </div>
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: presetConfig.accentColor }}
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{config.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{config.targetRole}</p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: presetConfig.accentColor }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 group-hover:underline">
                    Use this style <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {!latestResume && (
          <p className="text-center text-gray-500 text-sm mt-8">
            Upload a resume first to apply this style.
          </p>
        )}
      </div>
    </div>
  )
}

