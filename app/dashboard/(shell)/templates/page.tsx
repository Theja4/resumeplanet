import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_UNIVERSAL_CONFIG } from '@/types'
import { SAMPLE_RESUME } from '@/lib/sampleResumeData'
import Link from 'next/link'
import { ArrowRight, LayoutDashboard, Palette, Type } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { LucideIcon } from 'lucide-react'

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

  const builderHref = latestResume ? `/dashboard/builder/${latestResume.id}` : '/dashboard/resumes'
  const customTemplateControls: Array<{
    title: string
    description: string
    icon: LucideIcon
  }> = [
    {
      title: 'Layout controls',
      description: 'Switch structure, spacing, and header treatment without changing tools.',
      icon: LayoutDashboard,
    },
    {
      title: 'Color themes',
      description: 'Dial in accent colors that match your personal brand or target role.',
      icon: Palette,
    },
    {
      title: 'Typography',
      description: 'Choose the font treatment that best fits your experience and tone.',
      icon: Type,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/60 py-12 px-4">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
              <LayoutDashboard size={14} strokeWidth={2.4} />
              Custom Template
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customize one professional template.</h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Rezoomed now uses a single flexible template system. Adjust layout, typography, color, and spacing inside the builder, then export polished PDF or DOCX files when you&apos;re ready.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {customTemplateControls.map(item => {
              const ItemIcon = item.icon
              return (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <ItemIcon size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={builderHref}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              {latestResume ? 'Open Builder' : 'Upload a Resume'}
              <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
            <Link
              href="/dashboard/resumes"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Manage resumes
            </Link>
          </div>

          {!latestResume && (
            <p className="text-sm text-gray-500">
              Upload a resume first to preview your own content inside the customizable template.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Live template preview</p>
              <p className="text-xs text-gray-500">The builder lets you customize this template in real time.</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Flexible
            </div>
          </div>

          <div className="relative h-[540px] overflow-hidden bg-white">
            <div
              className="absolute left-1/2 top-6 -translate-x-1/2"
              style={{
                transform: 'translateX(-50%) scale(0.54)',
                transformOrigin: 'top center',
                width: '794px',
                pointerEvents: 'none',
              }}
            >
              <UniversalTemplate
                data={SAMPLE_RESUME}
                isEditing={false}
                onFieldChange={() => {}}
                config={DEFAULT_UNIVERSAL_CONFIG}
                density={DEFAULT_UNIVERSAL_CONFIG.density}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
