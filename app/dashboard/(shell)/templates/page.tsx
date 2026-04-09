import { DEFAULT_UNIVERSAL_CONFIG } from '@/types'
import { SAMPLE_RESUME } from '@/lib/sampleResumeData'
import Link from 'next/link'
import { ArrowRight, LayoutDashboard, Palette, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { TemplateGalleryLink, TemplateGalleryTracker } from '@/components/analytics/TemplateGalleryAnalytics'
import UniversalTemplatePreview from '@/components/templates/UniversalTemplatePreview'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function TemplatesPage() {
  const { supabase, userId } = await getAuthenticatedUserContext()

  const { data: resumesData } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)
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
    <div className="space-y-8">
      <TemplateGalleryTracker totalTemplates={1} />
      <DashboardPageIntro
        kicker="Template System"
        title="Customize one flexible template with premium polish."
        description="The builder now uses a single adaptable template system. Adjust structure, typography, and brand tone without jumping across multiple preset layouts."
        actions={
          <>
            <TemplateGalleryLink
              href={builderHref}
              templateId="universal"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
            >
              {latestResume ? 'Open Builder' : 'Upload a Resume'}
              <ArrowRight size={15} strokeWidth={2.2} />
            </TemplateGalleryLink>
            <Link
              href="/dashboard/resumes"
              className="inline-flex items-center rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
            >
              Manage resumes
            </Link>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <DashboardSurface variant="default" className="p-6">
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
          </DashboardSurface>

          <div className="space-y-3">
            {customTemplateControls.map(item => {
              const ItemIcon = item.icon
              return (
                <DashboardSurface key={item.title} variant="subtle" className="dashboard-card-hover p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <ItemIcon size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </DashboardSurface>
              )
            })}
          </div>

          {!latestResume && (
            <p className="text-sm text-gray-500">
              Upload a resume first to preview your own content inside the customizable template.
            </p>
          )}
        </div>

        <DashboardSurface variant="default" className="overflow-hidden">
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
              <UniversalTemplatePreview
                data={SAMPLE_RESUME}
                config={DEFAULT_UNIVERSAL_CONFIG}
              />
            </div>
          </div>
        </DashboardSurface>
      </div>
    </div>
  )
}
