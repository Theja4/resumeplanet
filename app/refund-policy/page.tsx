import Link from 'next/link'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'

const policySections = [
  {
    title: 'No refunds',
    points: [
      'All purchases are final and non-refundable, including subscription charges, renewals, discounted purchases, and paid software access.',
      'We do not provide refunds for unused time, accidental purchases, change of mind, failure to cancel before renewal, or dissatisfaction after access has been granted.',
      'Canceling a subscription prevents future renewals but does not refund prior charges or the current billing period.',
    ],
  },
  {
    title: 'Technical or billing issues',
    points: [
      'If you believe a payment, subscription, or product-access issue was caused by a technical error, contact support@rezoomed.com before opening a chargeback or payment-provider dispute.',
      'Include your account email, billed amount, transaction date, payment provider, and a short description of the issue so our team can investigate.',
      'Contacting support does not guarantee a refund. Any remedy for a verified technical or billing issue is handled at Rezoomed\'s discretion, subject to applicable law.',
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
              Refund policy
            </h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              Rezoomed follows a strict no-refunds policy for software purchases made on rezoomed.com.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-500">Last updated: May 13, 2026</p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">How to dispute a technical issue</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                If you believe a charge or access issue was caused by a technical problem, contact{' '}
                <a className="font-semibold text-[#026d32]" href="mailto:support@rezoomed.com">
                  support@rezoomed.com
                </a>{' '}
                from the email tied to your account.
              </p>
              <p>
                Include your account email, the billed amount, transaction date, payment provider,
                and any screenshots or details that help us investigate the issue.
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
