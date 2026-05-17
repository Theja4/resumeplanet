import Link from 'next/link'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'

const dataSections = [
  {
    title: 'Account and identity data',
    points: [
      'Name, email address, authentication identifiers, and account profile details.',
      'Plan and billing status needed to control access to free and paid features.',
    ],
  },
  {
    title: 'Resume and application data',
    points: [
      'Resume files, parsed resume data, builder edits, saved resumes, exported resume versions, and related documents you upload or create.',
      'Job descriptions, match-score inputs, tailoring inputs, cover-letter inputs, and job tracker records you save in the product.',
    ],
  },
  {
    title: 'Usage and device data',
    points: [
      'Product events, page activity, attribution data, and analytics identifiers when analytics is enabled.',
      'Basic request metadata, security logs, and rate-limiting signals used to protect the service.',
    ],
  },
  {
    title: 'Billing and transaction data',
    points: [
      'Subscription state, Paddle customer identifiers, billing status, and transaction references.',
      'Rezoomed does not store full card numbers; payments are handled by Paddle.',
    ],
  },
]

const processorRows = [
  {
    name: 'Supabase',
    role: 'Authentication, database, and secure file storage',
  },
  {
    name: 'Paddle',
    role: 'Checkout, subscriptions, billing, and related tax/compliance processing',
  },
  {
    name: 'PostHog',
    role: 'Product analytics when analytics consent or default analytics rules allow it',
  },
  {
    name: 'OpenRouter and model providers',
    role: 'AI-powered features such as ATS analysis, match scoring, tailoring support, resume repair, and cover-letter generation',
  },
]

export const metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy-policy' },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Privacy Policy
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              How Rezoomed handles personal data
            </h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              Rezoomed helps job seekers create, tailor, score, track, and improve resumes and related
              career materials. This policy explains what personal data we process, why we process it,
              and how the current Rezoomed architecture handles that data.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-500">
              Last updated: April 17, 2026
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Who controls your data</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Rezoomed is the controller of the personal data processed through this website and
                product, except where third parties such as Paddle act as independent controllers for
                their own compliance obligations.
              </p>
              <p>
                Contact us at{' '}
                <a className="font-semibold text-[#026d32]" href="mailto:support@rezoomed.com">
                  support@rezoomed.com
                </a>{' '}
                for privacy questions or requests.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">What data we collect</h2>
            <div className="mt-6 space-y-5">
              {dataSections.map((section) => (
                <div key={section.title} className="rounded-[1.4rem] border border-zinc-100 bg-zinc-50/70 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-800">
                    {section.title}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-600">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Why we use it</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[#008f44]/10 bg-[#008f44]/5 p-5 text-sm leading-7 text-zinc-600">
                <p className="font-black uppercase tracking-[0.14em] text-[#026d32]">To run the product</p>
                <p className="mt-3">
                  We use account, resume, job, and billing data to provide authentication, resume
                  storage, ATS scoring, match scoring, tailoring tools, cover-letter generation, job
                  tracking, checkout, and account management.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-amber-500/15 bg-amber-50 p-5 text-sm leading-7 text-zinc-600">
                <p className="font-black uppercase tracking-[0.14em] text-amber-700">To improve and protect the service</p>
                <p className="mt-3">
                  We use analytics, logs, and rate-limiting data to understand usage, measure
                  performance, prevent abuse, investigate bugs, and secure the platform.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <div className="border-b border-zinc-100 px-8 py-6">
              <h2 className="text-2xl font-black tracking-tight">Service providers we use</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-8 py-4 font-black uppercase tracking-[0.14em]">Provider</th>
                    <th className="px-8 py-4 font-black uppercase tracking-[0.14em]">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {processorRows.map((row) => (
                    <tr key={row.name} className="border-t border-zinc-100 align-top">
                      <td className="px-8 py-5 font-semibold text-zinc-900">{row.name}</td>
                      <td className="px-8 py-5 leading-7 text-zinc-600">{row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Analytics and cookies</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Rezoomed uses required cookies for login, security, and essential product flows. We use
                analytics technologies to understand product usage, but in stricter regions we keep those
                disabled until consent is given.
              </p>
              <p>
                For details, see our{' '}
                <Link href="/cookie-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Retention and security</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                We retain data for as long as needed to operate the service, maintain your account,
                comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
              <p>
                Resume files and account data are stored in authenticated infrastructure, and we apply
                access controls, private storage configuration, rate limiting, and other security
                measures appropriate to the service.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Your rights and choices</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Depending on where you live, you may have rights to access, correct, delete, restrict,
                or object to certain processing, and to request a copy of your data.
              </p>
              <p>
                To make a request, email{' '}
                <a className="font-semibold text-[#026d32]" href="mailto:support@rezoomed.com">
                  support@rezoomed.com
                </a>
                . If you are in the UK or EU, you may also have the right to complain to your local data
                protection authority.
              </p>
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
