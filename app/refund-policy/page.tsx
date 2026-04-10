import Link from 'next/link'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'

const policySections = [
  {
    title: 'Subscription refunds (Pro plan)',
    points: [
      'If you were charged in error, email support@rezoomed.com with your account email and charge details.',
      'Requests are reviewed case-by-case based on billing activity, account usage, and charge timing.',
      'If approved, refunds are processed through Paddle to the original payment method.',
    ],
  },
  {
    title: 'Cancellation and future billing',
    points: [
      'Canceling a subscription prevents future renewal charges and keeps access active until the current billing period ends.',
      'Cancellation does not automatically create a refund for past charges unless a refund is explicitly approved.',
      'You can manage subscription billing through the in-app billing flow.',
    ],
  },
  {
    title: 'Professional one-time service orders',
    points: [
      'Professional rewrite orders begin fulfillment after payment confirmation.',
      'Once delivery work has started, refunds may be reduced or denied based on work already completed.',
      'If there is a clear delivery failure, contact support and we will review and resolve it directly.',
    ],
  },
]

export const metadata = {
  title: 'Refund Policy',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Refund Policy
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Refunds and billing disputes
            </h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              This policy explains how Rezoomed handles refund requests for subscriptions and one-time
              services purchased through Paddle.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-500">Last updated: April 10, 2026</p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">How to request a refund</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Send your request to{' '}
                <a className="font-semibold text-[#026d32]" href="mailto:support@rezoomed.com">
                  support@rezoomed.com
                </a>{' '}
                from the email tied to your account.
              </p>
              <p>
                Include the billed amount, charge date, and reason for the request so we can resolve it
                quickly.
              </p>
            </div>
          </section>

          <section className="space-y-5">
            {policySections.map((section) => (
              <div
                key={section.title}
                className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]"
              >
                <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Related policies</h2>
            <div className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
              <p>
                This refund policy should be read together with the{' '}
                <Link href="/terms" className="font-semibold text-[#026d32] underline underline-offset-4">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                  Privacy Policy
                </Link>
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
