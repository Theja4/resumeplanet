import { Check, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  FREE_PLAN,
  getProPlanForCountry,
  PROFESSIONAL_ORDER,
  getEffectiveDisplay,
  formatPriceDisplay,
  type PromoConfig,
} from '@/lib/pricing'
import PriceDisplay from './PriceDisplay'

interface Props {
  variant: 'free' | 'pro' | 'professional'
  selectedPriceId?: string
  activePromo: PromoConfig | null
  isCurrentPlan?: boolean
  onUpgrade?: () => void
  isUpgrading?: boolean
  compact?: boolean
  delay?: string
  pricingCountryCode?: string | null
}

function FeatureListItem({
  children,
  tone,
  locked = false,
}: {
  children: React.ReactNode
  tone: 'neutral' | 'pro' | 'amber'
  locked?: boolean
}) {
  const iconClassName = locked
    ? 'border border-slate-200 bg-slate-100 text-slate-400'
    : tone === 'pro'
      ? 'border border-white/10 bg-white/10 text-emerald-200'
      : tone === 'amber'
        ? 'border border-amber-100 bg-amber-50 text-amber-600'
        : 'border border-primary/10 bg-primary-container/35 text-primary'

  const textClassName = locked
    ? 'text-slate-400'
    : tone === 'pro'
      ? 'text-white/92'
      : 'text-slate-700'

  return (
    <li className={cn('flex items-start gap-3 text-sm leading-6', textClassName)}>
      <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', iconClassName)}>
        {locked ? <Lock size={11} /> : <Check size={12} />}
      </span>
      <span>{children}</span>
    </li>
  )
}

export default function PricingCard({
  variant,
  selectedPriceId,
  activePromo,
  isCurrentPlan = false,
  onUpgrade,
  isUpgrading = false,
  compact = false,
  delay = '0ms',
  pricingCountryCode,
}: Props) {
  if (variant === 'free') {
    const visibleFreeFeatures = FREE_PLAN.features

    return (
      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,246,0.92))] shadow-[0_24px_70px_rgba(25,28,29,0.07)] opacity-0 [animation:card-enter_0.5s_ease_forwards]',
          compact ? 'min-h-[28.5rem] p-6' : 'min-h-[38rem] p-7'
        )}
        style={{ animationDelay: delay }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_55%)]" />
        <div className="relative flex h-full flex-col">
          <div className={cn('flex items-start justify-between gap-4', compact ? 'mb-5' : 'mb-6')}>
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Starter access
              </p>
              <div>
                <h3 className={cn('font-black tracking-tight text-slate-900', compact ? 'text-[1.65rem]' : 'text-[1.9rem]')}>
                  Free
                </h3>
                <p className={cn('mt-2 text-slate-500', compact ? 'text-[13px] leading-5' : 'text-sm leading-6')}>
                  Best for testing the scanner and trying the core workflow.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Free
            </span>
          </div>

          <div className={cn('border-b border-black/6', compact ? 'mb-5 pb-5' : 'mb-6 pb-6')}>
            <div className="flex items-end gap-2">
              <span className={cn('font-black tracking-tight text-slate-900', compact ? 'text-[2.9rem]' : 'text-5xl')}>
                $0
              </span>
              <span className="pb-2 text-sm text-slate-500">/month</span>
            </div>
            <p className={cn('mt-2 text-slate-500', compact ? 'text-[13px]' : 'text-sm')}>
              No credit card required to get started.
            </p>
          </div>

          {isCurrentPlan ? (
            <div className={cn('rounded-[1.15rem] border border-primary/10 bg-primary-container/30 px-4 py-3 text-center text-sm font-semibold text-on-primary-container', compact ? 'mb-5' : 'mb-6')}>
              Current plan
            </div>
          ) : (
            <div className={cn('rounded-[1.15rem] border border-black/6 bg-black/[0.02] px-4 py-3 text-center text-sm text-slate-500', compact ? 'mb-5' : 'mb-6')}>
              Start here, then upgrade when you need deeper AI analysis.
            </div>
          )}

          <div className={cn('flex flex-1 flex-col', compact ? 'gap-4' : 'gap-5')}>
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400', compact ? 'mb-2' : 'mb-3')}>
                Included
              </p>
              <ul className={compact ? 'space-y-2.5' : 'space-y-3'}>
                {visibleFreeFeatures.map((feature) => (
                  <FeatureListItem key={feature} tone="neutral">
                    {feature}
                  </FeatureListItem>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'pro') {
    const proPlan = getProPlanForCountry(pricingCountryCode)
    const priceOption = proPlan.getPriceById(selectedPriceId ?? 'monthly') ?? proPlan.defaultPrice
    const display = getEffectiveDisplay(priceOption, activePromo)
    const formatted = formatPriceDisplay(display, priceOption)
    const promoBadge = !isCurrentPlan && activePromo?.badge ? activePromo.badge : null
    const proFeatures = proPlan.features

    return (
      <div className="relative opacity-0 [animation:card-enter_0.5s_ease_forwards]" style={{ animationDelay: delay }}>
        {promoBadge && (
          <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
            <span className="whitespace-nowrap rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950 shadow-[0_12px_24px_rgba(245,158,11,0.24)]">
              {promoBadge}
            </span>
          </div>
        )}
        <div className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[linear-gradient(155deg,#026d32_0%,#0b7a3d_42%,#0d3d25_100%)] text-white shadow-[0_30px_80px_rgba(2,109,50,0.32)]',
          compact ? 'min-h-[28.5rem] p-6' : 'min-h-[38rem] p-7'
        )}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 right-[-15%] w-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-emerald-300/12 blur-2xl" />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="absolute bottom-0 top-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent [animation:shimmer-sweep_5s_ease-in-out_2.5s_infinite]" />
          </div>

          <div className="relative flex h-full flex-col">
            <div className={cn('flex items-start justify-between gap-4', compact ? 'mb-5' : 'mb-6')}>
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-100/80">
                  Premium workspace
                </p>
                <div>
                  <h3 className={cn('font-black tracking-tight text-white', compact ? 'text-[1.65rem]' : 'text-[1.9rem]')}>
                    Pro
                  </h3>
                  <p className={cn('mt-2 text-emerald-100/78', compact ? 'text-[13px] leading-5' : 'text-sm leading-6')}>
                    Unlimited scans, advanced AI analysis, exports, and tailor mode in one plan.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                Pro
              </span>
            </div>

            <div className={cn('rounded-[1.5rem] border border-white/12 bg-white/[0.07] backdrop-blur-xl', compact ? 'mb-5 p-4' : 'mb-6 p-5')}>
              <PriceDisplay
                display={formatted}
                size={compact ? 'md' : 'lg'}
                showInterval={true}
                showPerMonth={true}
                showSavings={true}
                className="text-white [&_span]:text-white [&_p]:text-emerald-100/78"
              />
            </div>

            <div className={compact ? 'mb-5' : 'mb-6'}>
              {isCurrentPlan ? (
                <div className="w-full rounded-[1.15rem] border border-white/18 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-emerald-100">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={onUpgrade}
                  disabled={isUpgrading}
                  className="flex w-full items-center justify-center gap-2 rounded-[1.15rem] bg-white px-4 py-3.5 text-sm font-bold text-[#026d32] shadow-[0_18px_32px_rgba(8,15,10,0.18)] transition-all hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpgrading ? 'Opening checkout…' : <>Upgrade to Pro <ArrowRight size={14} /></>}
                </button>
              )}
            </div>

            <div className="flex-1 rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/75', compact ? 'mb-2' : 'mb-3')}>
                Everything included
              </p>
              <ul className={compact ? 'space-y-2.5' : 'space-y-3'}>
                {proFeatures.map((feature) => (
                  <FeatureListItem key={feature} tone="pro">
                    {feature}
                  </FeatureListItem>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const professionalFeatures = PROFESSIONAL_ORDER.features

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,249,238,0.94))] shadow-[0_24px_70px_rgba(28,24,18,0.08)] opacity-0 [animation:card-enter_0.5s_ease_forwards]',
        compact ? 'min-h-[28.5rem] p-6' : 'min-h-[38rem] p-7'
      )}
      style={{ animationDelay: delay }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_58%)]" />
      <div className="relative flex h-full flex-col">
        <div className={cn('flex items-start justify-between gap-4', compact ? 'mb-5' : 'mb-6')}>
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700/70">
              Hands-on service
            </p>
            <div>
              <h3 className={cn('font-black tracking-tight text-slate-900', compact ? 'text-[1.65rem]' : 'text-[1.9rem]')}>
                Professional
              </h3>
              <p className={cn('mt-2 text-slate-500', compact ? 'text-[13px] leading-5' : 'text-sm leading-6')}>
                A recruiter-crafted rewrite when you want expert eyes on the final version.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Pro+
          </span>
        </div>

        <div className={cn('border-b border-amber-100', compact ? 'mb-5 pb-5' : 'mb-6 pb-6')}>
          <div className="flex items-end gap-2">
            <span className={cn('font-black tracking-tight text-slate-900', compact ? 'text-[2.9rem]' : 'text-5xl')}>
              ${PROFESSIONAL_ORDER.display.displayPrice}
            </span>
            <span className="pb-2 text-sm text-slate-500">one-time</span>
          </div>
          <p className={cn('mt-2 text-slate-500', compact ? 'text-[13px]' : 'text-sm')}>
            Delivered within {PROFESSIONAL_ORDER.deliveryHours} hours.
          </p>
        </div>

        <div className={compact ? 'mb-5' : 'mb-6'}>
          <Link
            href="/dashboard/orders/new"
            className="flex w-full items-center justify-center gap-2 rounded-[1.15rem] bg-[linear-gradient(135deg,#ff9d0a,#ff8a00)] px-4 py-3.5 text-sm font-bold text-white shadow-[0_18px_36px_rgba(255,138,0,0.28)] transition-all hover:-translate-y-0.5 hover:brightness-105"
          >
            Order Now <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex-1 rounded-[1.4rem] border border-amber-100 bg-white/78 p-4">
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400', compact ? 'mb-2' : 'mb-3')}>
            Rewrite includes
          </p>
          <ul className={compact ? 'space-y-2.5' : 'space-y-3'}>
            {professionalFeatures.map((feature) => (
              <FeatureListItem key={feature} tone="amber">
                {feature}
              </FeatureListItem>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
