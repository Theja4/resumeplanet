import Link from 'next/link'
import { LifeBuoy, Mail, Clock3 } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardPageIntro
        kicker="Contact Us"
        title="Need help with Rezoomed?"
        description="Reach out whenever you run into a billing question, product bug, or account issue. We keep support simple and direct."
        aside={
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Support</p>
            <p className="text-lg font-black leading-tight text-on-background">
              We usually respond within 1-2 business days.
            </p>
            <p className="text-sm leading-6 text-on-surface-variant">
              Email is the fastest way to reach us for anything account, billing, or product related.
            </p>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <DashboardSurface variant="default" className="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <LifeBuoy size={14} strokeWidth={2.2} />
              Help Desk
            </div>

            <div className="rounded-[1.5rem] border border-black/6 bg-white/80 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary-container/35 text-primary">
                  <Mail size={18} strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Reach us via email</p>
                  <Link
                    href="mailto:support@rezoomed.com"
                    className="text-2xl font-black tracking-tight text-on-background hover:text-primary"
                  >
                    support@rezoomed.com
                  </Link>
                  <p className="text-sm leading-6 text-on-surface-variant">
                    Include any helpful context like your account email, the page you were on, and a short description of the issue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardSurface>

        <DashboardSurface variant="subtle" className="p-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock3 size={18} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
              <div>
                <p className="text-sm font-bold text-on-background">Response time</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">We respond in 1-2 business days.</p>
              </div>
            </div>
            <div className="rounded-[1.2rem] bg-white/80 px-4 py-4 text-sm leading-6 text-on-surface-variant">
              For billing and upgrade questions, mention the email address on your Rezoomed account so we can help faster.
            </div>
          </div>
        </DashboardSurface>
      </div>
    </div>
  )
}
