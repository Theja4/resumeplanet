import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, CreditCard, ListChecks, Lock, Target } from 'lucide-react'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import UpgradeButton from './UpgradeButton'

interface ProFeaturePageGateProps {
  feature: string
  title: string
  description: string
  bullets: string[]
  analyticsLocation: string
}

type FeatureGateVisual = {
  eyebrow: string
  mascotSrc: string
  mascotAlt: string
  ctaTitle: string
  ctaDescription: string
  proof: string[]
}

const FEATURE_VISUALS: Record<string, FeatureGateVisual> = {
  'Tailor Mode': {
    eyebrow: 'Role-specific rewrites',
    mascotSrc: '/pro-gate-tailor-v4.webp',
    mascotAlt: 'Rezoomed mascot tailoring a resume',
    ctaTitle: 'Unlock Tailor Mode',
    ctaDescription: 'Paste a job description, apply the strongest rewrites, and keep your resume honest.',
    proof: ['JD-aware bullets', 'Keyword gaps', 'Builder apply'],
  },
  'Match Score': {
    eyebrow: 'Resume-to-role fit',
    mascotSrc: '/pro-gate-match-v4.webp',
    mascotAlt: 'Rezoomed mascot presenting a match score',
    ctaTitle: 'Unlock Match Score',
    ctaDescription: 'See fit gaps before you apply and focus your edits on the requirements that matter.',
    proof: ['Fit score', 'Missing evidence', 'Role priorities'],
  },
  'Cover Letter': {
    eyebrow: 'Application letter draft',
    mascotSrc: '/pro-gate-cover-letter-v4.webp',
    mascotAlt: 'Rezoomed mascot holding a cover letter',
    ctaTitle: 'Unlock Cover Letters',
    ctaDescription: 'Turn your resume and target job into a cleaner first draft without starting from zero.',
    proof: ['Resume-aware draft', 'JD context', 'PDF + DOCX'],
  },
  'Metadata Enhancer': {
    eyebrow: 'Hidden PDF cleanup',
    mascotSrc: '/pro-gate-metadata-v4.webp',
    mascotAlt: 'Rezoomed mascot checking PDF metadata',
    ctaTitle: 'Unlock Metadata Enhancer',
    ctaDescription: 'Find weak PDF fields, understand what they affect, and export a cleaner file.',
    proof: ['Title + author', 'ATS keywords', 'Patched PDF'],
  },
}

const DEFAULT_VISUAL: FeatureGateVisual = {
  eyebrow: 'Pro workflow',
  mascotSrc: '/pro-gate-tailor-v4.webp',
  mascotAlt: 'Rezoomed mascot',
  ctaTitle: 'Unlock Pro',
  ctaDescription: 'Upgrade once and use every advanced resume workflow in the dashboard.',
  proof: ['Unlimited tools', 'AI workflows', 'Cleaner exports'],
}

const PROOF_CARD_STYLES = [
  'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(236,253,245,0.96),rgba(255,255,255,0.9))] text-emerald-950 shadow-[0_14px_32px_rgba(16,185,129,0.12)] hover:border-emerald-300',
  'border-sky-200/80 bg-[linear-gradient(145deg,rgba(240,249,255,0.96),rgba(255,255,255,0.9))] text-sky-950 shadow-[0_14px_32px_rgba(14,165,233,0.1)] hover:border-sky-300',
  'border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,251,235,0.96),rgba(255,255,255,0.9))] text-amber-950 shadow-[0_14px_32px_rgba(245,158,11,0.1)] hover:border-amber-300',
]

const FEATURE_CARD_STYLES = [
  {
    card: 'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(236,253,245,0.98),rgba(255,255,255,0.9))] shadow-[0_18px_44px_rgba(16,185,129,0.12)] hover:border-emerald-300 hover:shadow-[0_26px_58px_rgba(16,185,129,0.18)]',
    icon: 'bg-emerald-600 text-white shadow-[0_10px_22px_rgba(16,185,129,0.24)]',
  },
  {
    card: 'border-sky-200/80 bg-[linear-gradient(145deg,rgba(240,249,255,0.98),rgba(255,255,255,0.9))] shadow-[0_18px_44px_rgba(14,165,233,0.1)] hover:border-sky-300 hover:shadow-[0_26px_58px_rgba(14,165,233,0.16)]',
    icon: 'bg-sky-600 text-white shadow-[0_10px_22px_rgba(14,165,233,0.22)]',
  },
  {
    card: 'border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,251,235,0.98),rgba(255,255,255,0.9))] shadow-[0_18px_44px_rgba(245,158,11,0.1)] hover:border-amber-300 hover:shadow-[0_26px_58px_rgba(245,158,11,0.16)]',
    icon: 'bg-amber-500 text-white shadow-[0_10px_22px_rgba(245,158,11,0.24)]',
  },
]

const FEATURE_CARD_ICONS = [Target, ListChecks, CreditCard]

export default function ProFeaturePageGate({
  feature,
  title,
  description,
  bullets,
  analyticsLocation,
}: ProFeaturePageGateProps) {
  const visual = FEATURE_VISUALS[feature] ?? DEFAULT_VISUAL

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardSurface variant="default" className="p-5 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.34),transparent_52%),radial-gradient(circle_at_top_right,rgba(2,109,50,0.12),transparent_42%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)] lg:items-center">
          <div className="space-y-7 pr-0 lg:pr-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-on-primary-container">
              <Lock size={14} strokeWidth={2.2} />
              {visual.eyebrow}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-on-background sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                {description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {visual.proof.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-[1.15rem] border px-4 py-3 transition-all duration-300 hover:-translate-y-1 ${PROOF_CARD_STYLES[index % PROOF_CARD_STYLES.length]}`}
                >
                  <CheckCircle2 size={17} className="text-primary" strokeWidth={2.2} />
                  <p className="mt-2 text-sm font-bold leading-5 text-on-surface">{item}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="sm:min-w-56">
                  <UpgradeButton
                    label={visual.ctaTitle}
                    analyticsLocation={analyticsLocation}
                    analyticsVariant="route-gate"
                    className="!rounded-full !bg-zinc-950 !px-6 !py-3.5 !text-sm !font-black !uppercase !tracking-[0.14em] !text-white !shadow-[0_18px_38px_rgba(15,23,42,0.18)] hover:!-translate-y-0.5 hover:!bg-zinc-900"
                  />
                </div>
              </div>
              <p className="text-sm leading-6 text-on-surface-variant">
                {visual.ctaDescription}
              </p>
            </div>
          </div>

          <div className="relative order-first lg:order-last">
            <div className="relative h-[25rem] overflow-hidden rounded-[2rem] border border-primary/10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.96),rgba(236,253,245,0.9)_45%,rgba(163,255,179,0.38))] shadow-[0_26px_70px_rgba(2,109,50,0.14)] sm:h-[30rem] lg:h-[34rem]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_36%)]" />
              <Image
                src={visual.mascotSrc}
                alt={visual.mascotAlt}
                fill
                priority
                sizes="(min-width: 1024px) 544px, 100vw"
                className="object-contain object-center p-5 transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>
            <Link
              href="/dashboard/pricing"
              className="absolute -bottom-4 left-5 right-5 rounded-[1.25rem] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_24px_58px_rgba(15,23,42,0.16)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Pro Access</p>
                  <p className="mt-1 text-sm font-bold text-on-background">All advanced workflows included.</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-primary" strokeWidth={2.2} />
              </div>
            </Link>
          </div>
        </div>
      </DashboardSurface>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {bullets.map((bullet, index) => {
          const style = FEATURE_CARD_STYLES[index % FEATURE_CARD_STYLES.length]
          const FeatureIcon = FEATURE_CARD_ICONS[index % FEATURE_CARD_ICONS.length]
          return (
          <div
            key={bullet}
            className={`group rounded-[1.25rem] border px-4 py-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${style.card}`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${style.icon}`}>
              <FeatureIcon size={16} strokeWidth={2.2} />
            </div>
            <p className="mt-3 text-sm leading-6 text-on-surface">{bullet}</p>
          </div>
          )
        })}
      </div>
    </div>
  )
}
