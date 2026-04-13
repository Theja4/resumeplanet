import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Mail, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator | Rezoomed',
  description:
    'Generate a role-specific cover letter from your resume and target job description, then export a cleaner draft faster with Rezoomed.',
  keywords: [
    'ai cover letter generator',
    'cover letter generator',
    'job specific cover letter',
    'cover letter from resume',
    'ai cover letter tool',
    'rezoomed cover letter',
  ],
  alternates: {
    canonical: '/cover-letter-generator',
  },
}

const FAQS = [
  {
    question: 'How does the cover letter generator work?',
    answer:
      'Rezoomed uses your resume and the target job description to create a role-specific first draft that you can review and export faster.',
  },
  {
    question: 'Should I still edit an AI-generated cover letter?',
    answer:
      'Yes. The strongest workflow is to review the draft, tighten the tone, and make sure the details reflect your real experience and the role.',
  },
  {
    question: 'Is a cover letter still worth sending?',
    answer:
      'For the right job, yes. A short, role-specific cover letter can reinforce fit and reduce hiring doubt when the employer actually reads it.',
  },
] as const

export default async function PublicCoverLetterGeneratorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/cv-generator')
  }

  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Cover Letter Generator', item: `${siteUrl}/cover-letter-generator` },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-6xl px-6 pb-20 pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.88))] p-8 shadow-[0_24px_60px_rgba(25,28,29,0.08)] backdrop-blur-2xl sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <Mail size={14} strokeWidth={2.2} />
                Cover letter
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                  Generate a role-specific cover letter from your resume and the job description.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Rezoomed turns your saved resume plus target role context into a faster first draft, so you can send a cleaner cover letter without starting from a blank page.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Use your resume plus a target job description to produce a role-specific draft.',
                  'Keep the letter aligned with the same experience you already show on the resume.',
                  'Avoid blank-page friction when a strong application needs a tailored note.',
                  'Export the result after generation instead of rewriting everything manually.',
                ].map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 rounded-[1.2rem] bg-white/80 px-4 py-3">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
                    <p className="text-sm leading-6 text-on-surface">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/6 bg-white/84 p-5 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Start here</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Create your account first.</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Cover letter generation lives inside the dashboard and unlocks on Pro.
              </p>
              <div className="mt-5 space-y-3">
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Create Account
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">FAQs</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Cover letter questions</h2>
          <div className="mt-6 grid gap-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5">
                <h3 className="text-lg font-black text-on-background">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
