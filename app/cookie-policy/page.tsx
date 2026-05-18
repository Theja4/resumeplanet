import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'

const cookieRows = [
  {
    name: 'Supabase auth cookies',
    category: 'Required',
    purpose: 'Keep users signed in and refresh sessions securely.',
    duration: 'Session / token lifecycle',
  },
  {
    name: 'rezoomed_admin_session',
    category: 'Required',
    purpose: 'Maintains admin access for the protected admin area.',
    duration: '14 days',
  },
  {
    name: 'rezoomed_pending_job_apply',
    category: 'Required',
    purpose: 'Lets Rezoomed ask whether a user completed an external job application.',
    duration: '7 days',
  },
  {
    name: 'rezoomed_cookie_consent',
    category: 'Required',
    purpose: 'Stores a user’s cookie preference in regions where consent is required.',
    duration: '180 days',
  },
  {
    name: 'rezoomed_analytics_attribution',
    category: 'Analytics',
    purpose: 'Tracks attribution like blog CTA or UTM source after consent.',
    duration: 'Session',
  },
  {
    name: 'rezoomed_posthog_distinct_id',
    category: 'Analytics',
    purpose: 'Stores the analytics distinct ID after consent.',
    duration: 'Session',
  },
]

export const metadata = {
  title: 'Cookie Policy',
  alternates: { canonical: '/cookie-policy' },
}

// Pure static legal page — revalidate once an hour.
export const revalidate = 3600

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Cookie Policy
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              How Rezoomed uses cookies
            </h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              We use required cookies to keep sign-in, security, and key product flows working.
              Where required by law, we ask for consent before enabling analytics cookies and similar
              technologies.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-500">
              Last updated: April 6, 2026
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Cookie categories</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[#008f44]/10 bg-[#008f44]/5 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#026d32]">
                  Required cookies
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  These support authentication, security, checkout-adjacent flows, and product
                  functionality requested by the user.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-amber-500/15 bg-amber-50 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-amber-700">
                  Analytics cookies
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  These help us measure traffic and product usage. In stricter regions, Rezoomed only
                  enables them after consent.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <div className="border-b border-zinc-100 px-8 py-6">
              <h2 className="text-2xl font-black tracking-tight">Cookies we currently use</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-8 py-4 font-black uppercase tracking-[0.14em]">Name</th>
                    <th className="px-8 py-4 font-black uppercase tracking-[0.14em]">Category</th>
                    <th className="px-8 py-4 font-black uppercase tracking-[0.14em]">Purpose</th>
                    <th className="px-8 py-4 font-black uppercase tracking-[0.14em]">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieRows.map((row) => (
                    <tr key={row.name} className="border-t border-zinc-100 align-top">
                      <td className="px-8 py-5 font-mono text-[13px] font-semibold text-zinc-900">
                        {row.name}
                      </td>
                      <td className="px-8 py-5 text-zinc-700">{row.category}</td>
                      <td className="px-8 py-5 leading-7 text-zinc-600">{row.purpose}</td>
                      <td className="px-8 py-5 text-zinc-600">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Consent and control</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                In regions where stricter cookie consent rules apply, Rezoomed shows a banner before
                analytics cookies are enabled. Choosing <strong>Required only</strong> keeps only the
                necessary cookies active.
              </p>
              <p>
                If you need help or want us to update this policy, contact{' '}
                <a className="font-semibold text-[#026d32]" href="mailto:support@rezoomed.com">
                  support@rezoomed.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
