import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react'
import JobTrackerButton from '@/components/jobs/JobTrackerButton'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import { JOB_BOARD_ENABLED } from '@/lib/featureFlags'
import { getJobBySlug } from '@/lib/jobs'
import { formatJobDate, formatJobSource } from '@/lib/jobs/shared'
import { createClient } from '@/lib/supabase/server'
import type { TrackedJobStatus } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  if (!JOB_BOARD_ENABLED) {
    return {
      title: 'Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) {
    return {
      title: 'Jobs',
    }
  }

  if (job.source_provider === 'manual') {
    return {
      title: 'Tracked Job',
      description: 'A manually tracked job in your Rezoomed workspace.',
    }
  }

  return {
    title: `${job.title} at ${job.company_name}`,
    description: job.description_text.slice(0, 160),
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  if (!JOB_BOARD_ENABLED) {
    notFound()
  }

  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) {
    notFound()
  }

  const paragraphs = job.description_text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let trackedStatus: TrackedJobStatus | null = null

  if (user) {
    const { data } = await supabase
      .from('tracked_jobs')
      .select('status')
      .eq('job_id', job.id)
      .eq('user_id', user.id)
      .maybeSingle()

    trackedStatus = (data?.status ?? null) as TrackedJobStatus | null
  }

  if (job.source_provider === 'manual' && !trackedStatus) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader active="jobs" />

      <main className="mx-auto max-w-[92rem] px-6 pb-24 pt-36 lg:px-10">
        <div className="space-y-10">
          <Link href="/jobs" className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#008f44] transition-all hover:gap-3">
            <ArrowLeft size={14} strokeWidth={3} />
            Back to jobs
          </Link>

          <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8 rounded-[2.8rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] px-8 py-10 shadow-[0_24px_60px_rgba(25,28,29,0.08)] sm:px-12 sm:py-12">
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full bg-[#008f44]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#008f44]">
                  {formatJobSource(job.source_provider)}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  {formatJobDate(job.posted_at)}
                </span>
                {!job.is_active ? (
                  <span className="rounded-full bg-amber-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                    Source may be inactive
                  </span>
                ) : null}
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight text-on-background sm:text-5xl lg:text-6xl">
                  {job.title}
                </h1>
                <p className="text-lg font-semibold text-on-surface-variant">{job.company_name}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-on-surface-variant">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} strokeWidth={2.2} />
                    {job.location_text}
                  </span>
                  {job.employment_type ? <span>{job.employment_type}</span> : null}
                  {job.salary_text ? <span>{job.salary_text}</span> : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/86 px-6 py-7 shadow-[0_18px_42px_rgba(25,28,29,0.05)]">
                <div className="space-y-5">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-8 text-on-surface-variant">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-[#008f44]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(236,250,240,0.92))] p-6 shadow-[0_18px_42px_rgba(25,28,29,0.05)]">
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#008f44]">
                    Application Actions
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Save the role to your tracker or go through the tracked apply flow so Rezoomed can ask whether you actually submitted.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  {job.apply_url ? (
                    <Link
                      href={`/jobs/${job.slug}/apply`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                    >
                      Apply on source
                      <ArrowRight size={14} strokeWidth={2.4} />
                    </Link>
                  ) : null}
                  <JobTrackerButton
                    jobId={job.id}
                    initialStatus={trackedStatus}
                    className="w-full border-[#008f44]/18 bg-white"
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/86 p-6 shadow-[0_18px_42px_rgba(25,28,29,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Workflow</p>
                <h2 className="mt-3 text-xl font-black tracking-tight text-on-background">
                  Turn this role into a tailored resume.
                </h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  After saving or applying, bring the posting into your ATS workflow and tighten the resume for the exact role.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/dashboard/jobs"
                    className="inline-flex items-center justify-center rounded-full border border-black/8 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-on-background transition-all hover:bg-black/5"
                  >
                    Open tracker
                  </Link>
                  <Link
                    href="/match-score"
                    className="inline-flex items-center justify-center rounded-full border border-[#008f44]/16 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#008f44] transition-all hover:bg-[#008f44]/6"
                  >
                    Run match score
                  </Link>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
