import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { FilePenLine, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Resume Metadata Enhancer | Rezoomed',
  description:
    'Improve PDF resume metadata like title, author, keywords, and language so your file is cleaner, more searchable, and recruiter-ready.',
  keywords: [
    'resume metadata enhancer',
    'pdf resume metadata',
    'resume metadata optimizer',
    'resume pdf title author keywords',
    'resume metadata tool',
    'resume optimization',
    'meta data enhancer',
    'meta data optimizer',
  ],
  alternates: {
    canonical: '/metadata-enhancer',
  },
  openGraph: {
    type: 'website',
    title: 'Resume Metadata Enhancer | Rezoomed',
    description: 'Improve PDF resume metadata like title, author, keywords, and language so your file is cleaner, more searchable, and recruiter-ready.',
    url: '/metadata-enhancer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume Metadata Enhancer | Rezoomed',
    description: 'Improve PDF resume metadata like title, author, keywords, and language so your file is cleaner, more searchable, and recruiter-ready.',
  },
}

const FAQS = [
  {
    question: 'What resume metadata does Rezoomed check?',
    answer:
      'Rezoomed checks PDF title, author, subject, keywords, creator, and language fields so you can spot weak metadata before sending the file.',
  },
  {
    question: 'Does resume metadata affect ATS results?',
    answer:
      'Metadata is not the main ATS factor, but it improves file clarity, searchability, and professionalism around the actual resume content.',
  },
  {
    question: 'Can I download an updated PDF after fixing metadata?',
    answer:
      'Yes. The metadata workflow is built to help you review hidden fields and export a cleaner recruiter-ready PDF.',
  },
] as const

export default async function PublicMetadataEnhancerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/metadata-enhancer')
  }

  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Metadata Enhancer', item: `${siteUrl}/metadata-enhancer` },
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
                <FilePenLine size={14} strokeWidth={2.2} />
                PDF metadata
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                  Clean up the hidden metadata inside your resume PDF.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Rezoomed audits PDF title, author, subject, keywords, creator, and language fields so your resume file looks more intentional, searchable, and recruiter-ready.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Audit hidden PDF fields most job seekers never check.',
                  'Fix weak title, author, and keyword values before you send the file.',
                  'Export a cleaner recruiter-ready PDF after the audit.',
                  'Pair metadata cleanup with ATS and job-match workflows in one tool.',
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
                Metadata Enhancer lives inside the Rezoomed dashboard and is available on Pro after signup.
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
          <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Resume metadata questions</h2>
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
