import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ATSCheckerClient from '@/app/dashboard/(shell)/ats-checker/ATSCheckerClient'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker | Rezoomed',
  description:
    'Check your resume for ATS issues, keyword gaps, formatting problems, and recruiter readability before you apply.',
  keywords: [
    'free ats resume checker',
    'ats checker',
    'resume checker',
    'ats optimization',
    'resume optimization',
    'resume score',
  ],
  alternates: {
    canonical: '/ats-checker',
  },
}

export default async function PublicATSCheckerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/ats-checker')
  }

  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'ATS Checker', item: `${siteUrl}/ats-checker` },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-[90rem] px-6 pb-20 pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(241,247,243,0.88))] px-6 py-5 shadow-[0_24px_60px_rgba(18,24,21,0.06)] backdrop-blur-2xl sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.26),transparent_40%),radial-gradient(circle_at_center,rgba(123,211,252,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_36%)]" />
          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-primary-container/50 bg-primary-container/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                Resume checker
              </span>
              <h1 className="max-w-2xl text-3xl font-black tracking-tight text-on-background sm:text-4xl lg:text-[3.35rem] lg:leading-[0.98]">
                Is your resume good enough?
              </h1>
            </div>
            <div className="space-y-3 lg:max-w-[26rem] lg:justify-self-end">
              <p className="text-sm leading-6 text-on-surface-variant sm:text-[15px]">
                A free ATS score checker that catches parsing, keyword, structure, and recruiter-readability issues before your resume ever hits a rejection filter.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-on-surface-variant">
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">1 scan before signup</span>
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">PDF and DOCX</span>
                <span className="rounded-full border border-black/8 bg-white/86 px-3 py-1.5 font-bold uppercase tracking-[0.16em]">Instant feedback</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <ATSCheckerClient resumes={[]} profile={null} publicMode mode="ats" showIntro={false} />
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
