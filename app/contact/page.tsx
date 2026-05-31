import Link from 'next/link'
import type { Metadata } from 'next'
import { Mail, Clock3, LifeBuoy, MessageSquare } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'

export const metadata: Metadata = {
  title: 'Contact Rezoomed — Support & Help',
  description:
    'Get in touch with the Rezoomed team for billing, product, or account questions. We usually respond within 1–2 business days.',
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
}

export const revalidate = 3600

const SUPPORT_EMAIL = 'support@rezoomed.com'

const helpTopics = [
  {
    Icon: LifeBuoy,
    title: 'Account & access',
    blurb: 'Sign-in trouble, plan changes, or anything tied to your Rezoomed account.',
  },
  {
    Icon: MessageSquare,
    title: 'Product & bugs',
    blurb: 'Something not working as expected? Tell us the page and what you saw.',
  },
  {
    Icon: Clock3,
    title: 'Billing & refunds',
    blurb: 'Questions about upgrades, invoices, or our refund policy.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* hero */}
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Contact us
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Get in touch with Rezoomed</h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              Whether it&rsquo;s a billing question, a product bug, or an account issue, we keep support
              simple and direct. Email is the fastest way to reach us — we usually respond within{' '}
              <strong className="font-bold text-zinc-900">1&ndash;2 business days</strong>.
            </p>
          </section>

          {/* email card */}
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#026d32] to-[#30c06b] shadow-lg shadow-[#026d32]/20">
                <Mail className="h-6 w-6 text-white" aria-hidden />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                  Reach us via email
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-2xl font-black tracking-tight text-zinc-900 transition hover:text-[#026d32]"
                >
                  {SUPPORT_EMAIL}
                </a>
                <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-500">
                  Include any helpful context — the email on your account, the page you were on, and a
                  short description of the issue — so we can help faster.
                </p>
              </div>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-zinc-950/20 transition hover:bg-zinc-800"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Email support
            </a>
          </section>

          {/* topics */}
          <section className="grid gap-4 sm:grid-cols-3">
            {helpTopics.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#008f44]/10 text-[#026d32]">
                  <t.Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="text-base font-black text-zinc-900">{t.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500">{t.blurb}</p>
              </div>
            ))}
          </section>

          {/* footnote */}
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <p className="text-sm leading-7 text-zinc-600">
              For billing and upgrade questions, mention the email address on your Rezoomed account so we
              can help faster. Refund terms are documented in our{' '}
              <Link href="/refund-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                Refund Policy
              </Link>
              , and you can review how we handle your data in our{' '}
              <Link href="/privacy-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
