import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import {
  buildFunnelCtaHref,
  getAllFunnelPlatformSlugs,
  getFunnelPlatform,
} from '@/lib/seo/funnel-pages'
import { getSiteUrl } from '@/lib/site'
import { toJsonLd } from '@/lib/seo'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllFunnelPlatformSlugs().map(platform => ({ platform }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>
}): Promise<Metadata> {
  const { platform } = await params
  const data = getFunnelPlatform(platform)
  if (!data) return { title: 'Not found' }
  return {
    title: `${data.heading} | Rezoomed`,
    description: data.subheading,
    alternates: { canonical: `/from/${data.slug}` },
    // No-index funnel pages — they're for paid/referred traffic, not organic search.
    // Indexing them would dilute the canonical /ats-checker authority and surface
    // these "you came from X" pages for branded queries.
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      title: `${data.platformName} → Rezoomed`,
      description: data.subheading,
      url: `/from/${data.slug}`,
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.platformName} → Rezoomed`,
      description: data.subheading,
      images: ['/opengraph-image'],
    },
  }
}

export default async function FunnelLandingPage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  const data = getFunnelPlatform(platform)
  if (!data) notFound()

  const primaryCtaHref = buildFunnelCtaHref(data, '/ats-checker')
  const secondaryCtaHref = buildFunnelCtaHref(data, data.secondaryCtaHref)

  const siteUrl = getSiteUrl()
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: `From ${data.platformName}`,
        item: `${siteUrl}/from/${data.slug}`,
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />

      <main className="mx-auto flex-1 w-full max-w-5xl px-6 pb-20 pt-28">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,247,243,0.9))] p-8 shadow-[0_24px_60px_rgba(18,24,21,0.08)] sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.10),transparent_36%)]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <Sparkles size={14} strokeWidth={2.2} />
              {data.eyebrow}
            </span>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02]">
              {data.heading}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-on-surface-variant sm:text-lg">
              {data.subheading}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-950/15 transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
              >
                {data.primaryCtaLabel} <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-6 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                {data.secondaryCtaLabel}
              </Link>
            </div>

            <p className="mt-6 text-xs font-medium text-on-surface-variant">{data.proofLine}</p>
          </div>
        </section>

        {/* What the platform does vs what Rezoomed adds */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.8rem] border border-black/6 bg-white/88 p-7 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              What the {data.platformName} {data.platformShort} does
            </p>
            <p className="mt-3 text-sm leading-7 text-on-surface">{data.thePlatformDoes}</p>
          </div>
          <div className="rounded-[1.8rem] border border-primary/15 bg-[linear-gradient(145deg,rgba(237,255,241,0.92),rgba(255,255,255,0.92))] p-7 shadow-[0_18px_45px_rgba(0,168,77,0.10)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              What Rezoomed adds
            </p>
            <p className="mt-3 text-sm leading-7 text-on-surface">{data.whatRezoomedAdds}</p>
          </div>
        </section>

        {/* Three differentiators */}
        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_18px_45px_rgba(25,28,29,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            What changes when you bring your real file
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background sm:text-3xl">
            Three things you can only do with the full Rezoomed workflow.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {data.bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="rounded-[1.4rem] border border-black/6 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,249,0.96))] p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-container/40 text-[12px] font-black text-on-primary-container">
                    {idx + 1}
                  </span>
                  <CheckCircle2 size={18} className="shrink-0 text-primary" />
                </div>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{bullet}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-8 rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,#013d1c_0%,#026d32_100%)] p-8 text-center text-white shadow-[0_24px_70px_rgba(2,109,50,0.25)] sm:p-12">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
            Free first scan · No signup
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
            Run your real resume through Rezoomed in 30 seconds.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/65">
            Bring your PDF or DOCX. Get an ATS score, the issues that matter, and a clear next move.
          </p>
          <Link
            href={primaryCtaHref}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#013d1c] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#f0fdf4]"
          >
            {data.primaryCtaLabel} <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
