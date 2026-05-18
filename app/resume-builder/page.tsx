import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { FileText, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import ToolPageContentSections from '@/components/seo/ToolPageContentSections'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'AI Resume Builder',
  description:
    'Build ATS-friendly resumes faster with Rezoomed AI resume builder, then refine, tailor, and export recruiter-ready versions.',
  alternates: {
    canonical: '/resume-builder',
  },
  openGraph: {
    type: 'website',
    title: 'AI Resume Builder | Rezoomed',
    description: 'Build ATS-friendly resumes faster with Rezoomed AI resume builder, then refine, tailor, and export recruiter-ready versions.',
    url: '/resume-builder',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Resume Builder | Rezoomed',
    description: 'Build ATS-friendly resumes faster with Rezoomed AI resume builder, then refine, tailor, and export recruiter-ready versions.',
    images: ['/opengraph-image'],
  },
}

const FAQS = [
  {
    question: 'Is Rezoomed only a resume builder?',
    answer:
      'No. Rezoomed also includes ATS checking, job-description match analysis, resume tailoring, metadata cleanup, and export workflows.',
  },
  {
    question: 'Can I create multiple resume versions in Rezoomed?',
    answer:
      'Yes. Rezoomed is built for role-specific resume versions so you do not have to force one generic file onto every application.',
  },
  {
    question: 'Does the resume builder help with ATS optimization?',
    answer:
      'Yes. The builder connects with ATS checking and match-score workflows so you can improve the resume after drafting it.',
  },
] as const

export default async function PublicResumeBuilderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/builder')
  }

  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Resume Builder', item: `${siteUrl}/resume-builder` },
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
                <FileText size={14} strokeWidth={2.2} />
                AI resume builder
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                  Build an ATS-friendly resume without starting from scratch every time.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                  Rezoomed helps you build, edit, and export role-ready resumes faster, then move straight into ATS checking and job-description tailoring when you need more precision.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Create a fresh resume draft without waiting on templates or complex setup.',
                  'Refine sections inside the builder and keep role-specific versions organized.',
                  'Move from drafting into ATS review and job-match workflows in one product.',
                  'Export recruiter-ready versions after tightening structure and content.',
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
                The builder opens inside the Rezoomed dashboard after signup.
              </p>
              <div className="mt-5 space-y-3">
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Create Account
                </Link>
                <Link
                  href="/ats-checker"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  Try ATS Checker
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ToolPageContentSections
          toolName="AI resume builder"
          howItWorks={[
            {
              title: 'Start a fresh draft',
              description:
                'Open the builder and start with a blank ATS-safe layout or import an existing PDF or DOCX resume. Section structure is already organized for parsing.',
            },
            {
              title: 'Refine each section with AI guidance',
              description:
                'Rewrite summary lines, sharpen experience bullets, and structure skills using the in-product suggestions so the resume matches how recruiters actually read.',
            },
            {
              title: 'Export and run an ATS check',
              description:
                'Export to PDF or DOCX, then run the resume through the ATS checker and match-score workflows before sending it to employers.',
            },
          ]}
          differentiators={[
            {
              title: 'Built-in ATS workflow',
              description:
                'The builder connects directly to the ATS checker, match-score, and tailoring tools so you can stop juggling separate apps.',
            },
            {
              title: 'Role-specific resume versions',
              description:
                'Maintain multiple targeted resumes per role direction without losing the original — no more overwriting your strongest version.',
            },
            {
              title: 'Recruiter-grade export quality',
              description:
                'PDFs come out clean, ATS-readable, and metadata-safe so the file recruiters open matches what you see on screen.',
            },
          ]}
          relatedReading={[
            {
              title: 'Best AI resume builder for job seekers',
              description: 'What actually helps you get interviews vs. what just looks good.',
              href: '/blog/best-ai-resume-builder-for-job-seekers',
            },
            {
              title: 'Resume builder vs resume template',
              description: 'Which is better for job applications and why most templates fail ATS.',
              href: '/blog/resume-builder-vs-template-which-is-better',
            },
            {
              title: 'ATS resume checker: what it tests',
              description: 'Understand the ATS scoring layer your builder output will be measured against.',
              href: '/blog/ats-resume-checker-what-it-tests-and-why-it-matters',
            },
          ]}
        />

        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">FAQs</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Resume builder questions</h2>
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
