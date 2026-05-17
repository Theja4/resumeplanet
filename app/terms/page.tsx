import Link from 'next/link'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'

const termsSections = [
  {
    title: 'Accounts and eligibility',
    points: [
      'You are responsible for keeping your login credentials secure and for all activity that happens under your account.',
      'You must provide accurate information when creating an account and keep your account details reasonably up to date.',
      'If you use Rezoomed on behalf of a company or other organization, you confirm that you have authority to bind that organization to these terms.',
    ],
  },
  {
    title: 'Resume, job, and uploaded content',
    points: [
      'You keep ownership of the resumes, job descriptions, notes, and other content you upload or create in Rezoomed.',
      'You give Rezoomed the limited rights needed to host, process, analyze, store, and display that content so the product can provide resume storage, ATS scoring, match scoring, tailoring, cover-letter generation, exports, and job tracking.',
      'You are responsible for making sure you have the right to upload and use any content you submit.',
    ],
  },
  {
    title: 'AI-powered features',
    points: [
      'Rezoomed uses AI systems to generate ATS insights, match scoring, tailoring guidance, parser repair, cover letters, and related outputs.',
      'AI output may be incomplete, inaccurate, or imperfect. You are responsible for reviewing and deciding whether to use any generated suggestions or documents before sending them to employers.',
      'Rezoomed does not guarantee interviews, offers, recruiter responses, or any specific hiring outcome.',
    ],
  },
  {
    title: 'Subscriptions and payments',
    points: [
      'Paid plans, billing, taxes, renewals, and checkout are handled through Paddle and related payment providers.',
      'If you subscribe to a paid plan, you authorize recurring charges until you cancel, subject to the billing terms presented during checkout.',
      'All paid purchases are final and non-refundable except where required by law. Technical or billing issue disputes must be sent to support@rezoomed.com as described in the Refund Policy.',
      'Access to paid features may be suspended or changed if payment fails, a charge is reversed, or a subscription is cancelled or expires.',
    ],
  },
  {
    title: 'Acceptable use',
    points: [
      'Do not use the service to break the law, infringe rights, scrape or abuse protected systems, upload malware, or interfere with the service.',
      'Do not attempt to bypass rate limits, plan restrictions, security controls, or protected areas of the product.',
      'Do not use Rezoomed to generate deceptive application materials, impersonate another person, or submit false employment information.',
    ],
  },
  {
    title: 'Availability and changes',
    points: [
      'Rezoomed may change, improve, pause, or remove features over time, including beta features and third-party integrations.',
      'We may apply reasonable limits, maintenance windows, abuse protections, and security controls to protect the product and other users.',
      'We are not responsible for outages, feature changes, or behavior caused by third-party providers such as hosting, analytics, payment, authentication, or AI services.',
    ],
  },
]

export const metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Terms of Service
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Terms for using Rezoomed
            </h1>
            <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
              These terms govern your access to and use of Rezoomed, including the website, resume
              builder, ATS tools, match-scoring tools, AI-assisted career features, job tracker, job
              board, exports, and related software services.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-500">
              Last updated: April 17, 2026
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Agreement overview</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Rezoomed is operated by <strong>CHITTURI VENKATA SAI THEJA</strong>.
              </p>
              <p>
                By accessing or using Rezoomed, you agree to these terms and to our{' '}
                <Link href="/refund-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                  Refund Policy
                </Link>
                ,{' '}
                <Link href="/privacy-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/cookie-policy" className="font-semibold text-[#026d32] underline underline-offset-4">
                  Cookie Policy
                </Link>
                .
              </p>
              <p>
                If you do not agree, do not use the service.
              </p>
            </div>
          </section>

          <section className="space-y-5">
            {termsSections.map((section) => (
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
            <h2 className="text-2xl font-black tracking-tight">Intellectual property</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Rezoomed, including its software, branding, layout, and product design, is protected by
                intellectual property laws. These terms do not transfer ownership of Rezoomed or its
                underlying technology to you.
              </p>
              <p>
                We grant you a limited, non-exclusive, revocable right to use the service in accordance
                with these terms.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Disclaimers and limits</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Rezoomed is provided on an “as is” and “as available” basis to the maximum extent
                permitted by law. We do not promise uninterrupted service, perfect parsing, perfect AI
                output, or perfect compatibility with every employer system or ATS.
              </p>
              <p>
                To the maximum extent permitted by law, Rezoomed is not liable for indirect, incidental,
                special, consequential, exemplary, or lost-profit damages arising from your use of the
                service, your reliance on AI output, or your job-search outcomes.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Suspension and termination</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                We may suspend, restrict, or terminate access to the service if we reasonably believe
                you violated these terms, created security risk, abused the platform, or used the service
                in a way that harms Rezoomed or other users.
              </p>
              <p>
                You may stop using the service at any time. Subscription cancellation timing and billing
                consequences are handled through the billing flow presented by Paddle.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight">Contact</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Questions about these terms can be sent to{' '}
                <a className="font-semibold text-[#026d32]" href="mailto:support@rezoomed.com">
                  support@rezoomed.com
                </a>
                .
              </p>
              <p>
                We generally respond within 1-2 business days.
              </p>
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
