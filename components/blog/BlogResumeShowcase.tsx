import { ArrowRight } from 'lucide-react'
import BlogResumePreview from '@/components/blog/BlogResumePreview'
import BlogTrackedAppLink from '@/components/blog/BlogTrackedAppLink'
import { getBlogResumeExampleById } from '@/lib/blog/resume-examples'

export default function BlogResumeShowcase({
  slug,
  exampleId,
  isAuthenticated,
}: {
  slug: string
  exampleId: string
  isAuthenticated: boolean
}) {
  const example = getBlogResumeExampleById(exampleId)

  if (!example) {
    return null
  }

  const builderHref = `/dashboard/builder/new?example=${encodeURIComponent(example.id)}`
  const ctaHref = isAuthenticated
    ? builderHref
    : `/auth/login?next=${encodeURIComponent(builderHref)}`
  const sourceTagline =
    example.sourceLabel === 'Rezoomed example'
      ? 'Built in Rezoomed'
      : 'Reformatted in Rezoomed'
  const resumeSubject =
    example.blogSlug === 'how-to-land-a-google-job'
      ? 'Google resume example'
      : `${example.title.split(' ')[0]} resume template`
  const ctaText = isAuthenticated
    ? `Customize this ${resumeSubject}`
    : `Log in to customize this ${resumeSubject}`

  return (
    <section className="my-10 overflow-hidden rounded-[2rem] border border-zinc-900/10 bg-[linear-gradient(155deg,#07110b_0%,#0b1d13_46%,#10261a_100%)] shadow-[0_28px_90px_rgba(4,10,7,0.24)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_340px]">
        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-[#A3FFB3]/20 bg-[#A3FFB3]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
              {example.badgeLabel}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
              {sourceTagline}
            </span>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-[inset_0_1px_rgba(255,255,255,0.06)]">
            <div className="bg-[linear-gradient(180deg,#edf3ee_0%,#e7efe8_100%)] p-4 sm:p-5">
              <BlogResumePreview
                data={example.resumeData}
                config={example.templateConfig}
                sectionOrder={example.visibility.sectionOrder}
                sidebarSectionOrder={example.visibility.sidebarSectionOrder}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
              Why this works
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              {example.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {example.sourceNote}
            </p>

            <div className="mt-6 space-y-3">
              {example.analysisPoints.map(point => (
                <div
                  key={point}
                  className="rounded-[1.15rem] border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-sm leading-6 text-white/84">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <BlogTrackedAppLink
              slug={slug}
              ctaType="inline"
              ctaText={ctaText}
              position={1}
              href={ctaHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#A3FFB3] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#062313] transition-all hover:-translate-y-0.5 hover:bg-[#b4ffc1] shadow-lg shadow-[#A3FFB3]/15"
            >
              {isAuthenticated ? `Customize this ${resumeSubject}` : 'Log in to customize this resume'}
              <ArrowRight size={14} strokeWidth={2.5} />
            </BlogTrackedAppLink>
          </div>
        </div>
      </div>
    </section>
  )
}
