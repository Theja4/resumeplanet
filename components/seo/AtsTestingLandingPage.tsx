import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileSearch, ScanSearch } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import ATSCheckerClient from '@/app/dashboard/(shell)/ats-checker/ATSCheckerClient'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site'
import type { AtsTestingPage } from '@/lib/seo/ats-testing-pages'

export default async function AtsTestingLandingPage({ page }: { page: AtsTestingPage }) {
  const siteUrl = getSiteUrl()
  const supabase = page.showChecker ? await createClient() : null
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: page.heading, item: `${siteUrl}${page.path}` },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
  const applicationJsonLd = page.showChecker
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: page.title,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${siteUrl}${page.path}`,
        description: page.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.title,
        description: page.description,
        mainEntityOfPage: `${siteUrl}${page.path}`,
        publisher: {
          '@type': 'Organization',
          name: 'Rezoomed',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/icon.png`,
          },
        },
      }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }}
      />

      <main className="mx-auto flex-1 max-w-[88rem] px-6 pb-24 pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#07110b] p-6 text-white shadow-[0_28px_80px_rgba(18,24,21,0.14)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(48,192,107,0.14),transparent_30%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,36px_36px,36px_36px]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.7fr)] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#A3FFB3]/20 bg-[#A3FFB3]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
                <ScanSearch size={14} strokeWidth={2.2} />
                {page.eyebrow}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-[3.7rem] lg:leading-[0.98]">
                  {page.heading}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/62">{page.intro}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={page.showChecker ? '#resume-scan' : '/ats-checker'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A3FFB3] px-6 py-3 text-sm font-black text-[#062313] transition-all hover:-translate-y-0.5 hover:bg-[#b7ffc3]"
                >
                  {page.showChecker ? 'Start the scan' : 'Run ATS checker'} <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
                <Link
                  href="/ats-resume-format"
                  className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/14"
                >
                  Fix ATS format first
                </Link>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-white/8 p-5 shadow-[inset_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">Quick diagnostic</p>
              <div className="mt-5 space-y-3">
                {page.checks.slice(0, 4).map((check, index) => (
                  <div key={check.title} className="rounded-[1.1rem] border border-white/8 bg-white/6 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#A3FFB3]/14 text-xs font-black text-[#A3FFB3]">
                        {index + 1}
                      </span>
                      <div>
                        <h2 className="text-sm font-black text-white">{check.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-white/52">{check.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {page.showChecker ? (
          <section id="resume-scan" className="mt-8 scroll-mt-24">
            {user ? (
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">You are signed in</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Open the dashboard checker.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  Your saved resumes and full scan history live inside the dashboard.
                </p>
                <Link
                  href="/dashboard/ats-checker"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                >
                  Open ATS checker <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <ATSCheckerClient resumes={[]} profile={null} publicMode mode="ats" showIntro={false} />
            )}
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Workflow</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Use this order.</h2>
            <div className="mt-6 space-y-3">
              {page.workflow.map((step, index) => (
                <div key={step} className="flex items-start gap-3 border-b border-black/5 pb-3 last:border-b-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#026d32]/10 text-sm font-black text-[#026d32]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-on-surface">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Example rewrite</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">The scanner should push better proof.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.2rem] border border-red-100 bg-red-50/70 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Before</p>
                <p className="mt-3 text-sm leading-7 text-zinc-700">{page.example.before}</p>
              </div>
              <div className="rounded-[1.2rem] border border-emerald-100 bg-emerald-50/80 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">After</p>
                <p className="mt-3 text-sm leading-7 text-zinc-800">{page.example.after}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.74fr)]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">FAQs</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Common questions</h2>
            <div className="mt-6 space-y-4">
              {page.faqs.map(faq => (
                <div key={faq.question} className="rounded-[1.2rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5">
                  <h3 className="text-lg font-black text-on-background">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Next tools</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">Move from reading to checking.</h2>
              <div className="mt-5 space-y-4">
                {page.related.map(link => (
                  <Link key={link.href} href={link.href} className="block rounded-[1.2rem] border border-black/6 bg-white/88 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25">
                    <div className="flex items-start gap-3">
                      <FileSearch size={17} className="mt-0.5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-black text-on-background">{link.label}</p>
                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">{link.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {page.sourceLinks ? (
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-7 shadow-[0_18px_45px_rgba(18,24,21,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Sources</p>
                <div className="mt-5 space-y-4">
                  {page.sourceLinks.map(link => (
                    <a key={link.href} href={link.href} className="block rounded-[1.2rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-black text-on-background">{link.label}</p>
                          <p className="mt-1 text-xs leading-5 text-on-surface-variant">{link.description}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
