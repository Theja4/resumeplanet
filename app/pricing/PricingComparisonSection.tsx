import type { ReactNode } from 'react'
import Image from 'next/image'
import { BadgeCheck, Check, Crown, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type PriceOption } from '@/lib/pricing'

type ComparisonTone = 'yes' | 'partial' | 'no' | 'price'
type PlatformKey = 'rezoomed' | 'jobright' | 'resumeio' | 'teal' | 'rezi'

type ComparisonCell = {
  value: ReactNode
  tone: ComparisonTone
}

type ComparisonRow = {
  label: string
  rezoomed: ComparisonCell
  jobright: ComparisonCell
  resumeio: ComparisonCell
  teal: ComparisonCell
  rezi: ComparisonCell
}

const BRAND_LOGOS: Record<Exclude<PlatformKey, 'rezoomed'>, {
  src: string
  alt: string
  width: number
  height: number
  className: string
}> = {
  jobright: {
    src: '/blog/comparison-logos/jobright.svg',
    alt: 'Jobright logo',
    width: 144,
    height: 36,
    className: 'h-7 w-auto',
  },
  resumeio: {
    src: '/blog/comparison-logos/resumeio.svg',
    alt: 'Resume.io logo',
    width: 156,
    height: 51,
    className: 'h-7 w-auto',
  },
  teal: {
    src: '/blog/comparison-logos/teal.svg',
    alt: 'Teal logo',
    width: 48,
    height: 48,
    className: 'h-8 w-8',
  },
  rezi: {
    src: '/blog/comparison-logos/rezi.svg',
    alt: 'Rezi logo',
    width: 215,
    height: 91,
    className: 'h-7 w-auto',
  },
}

function intervalLabel(option: PriceOption | undefined) {
  if (!option) return 'mo'
  if (option.interval === 'month') return 'mo'
  if (option.interval === 'year') return 'yr'
  if (option.interval === 'week') return 'wk'
  return option.interval
}

function getMonthlyPriceOption(priceOptions: PriceOption[]) {
  return priceOptions.find(option => option.id === 'monthly') ?? priceOptions[0]
}

function formatCurrencyAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatRegionalPrice(option: PriceOption | undefined, amount?: number) {
  if (!option) return `$${formatCurrencyAmount(amount ?? 19.99)}`

  return `${option.display.currencySymbol}${formatCurrencyAmount(amount ?? option.display.displayPrice)}`
}

function getHalfOffPrice(value: number) {
  return Math.floor(value * 50) / 100
}

function BundleDiscountPrice({
  discountedPrice,
  fullPrice,
  componentPrice,
  interval,
}: {
  discountedPrice: string
  fullPrice: string
  componentPrice: string
  interval: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[12px] font-semibold text-zinc-500 line-through decoration-zinc-400">
          {fullPrice}/{interval}
        </span>
        <span className="text-sm font-black text-[#026d32]">
          {discountedPrice}/{interval}
        </span>
      </div>
      <p className="text-[11px] font-semibold leading-4 text-[#0b5d2b]/78">
        ({componentPrice} Rezoomed + {componentPrice} JobPosted)
      </p>
    </div>
  )
}

function RezoomedDualLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-[0_12px_28px_rgba(2,109,50,0.16)]',
          compact ? 'h-9 w-9' : 'h-10 w-10'
        )}
      >
        <Image
          src="/auth-login-logo.png"
          alt="Rezoomed logo"
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/20 bg-[#a3ffb3] text-[13px] font-black text-[#064421]">
        +
      </span>
      <span
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-xl border border-blue-200 bg-white shadow-[0_12px_28px_rgba(2,109,50,0.14)]',
          compact ? 'h-9 w-9' : 'h-10 w-10'
        )}
      >
        <Image
          src="/jobposted-logo.jpg"
          alt="JobPosted logo"
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </span>
    </div>
  )
}

function PlatformLogo({
  platform,
  compact = false,
  showName = false,
}: {
  platform: Exclude<PlatformKey, 'rezoomed'>
  compact?: boolean
  showName?: boolean
}) {
  const logo = BRAND_LOGOS[platform]
  const label = platform === 'resumeio' ? 'Resume.io' : platform[0].toUpperCase() + platform.slice(1)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-black/6 bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
        compact ? 'min-h-9 px-2.5 py-1.5' : 'min-h-11'
      )}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        unoptimized
        className={cn(logo.className, compact && 'max-h-6')}
      />
      {showName && platform === 'teal' ? (
        <span className="text-sm font-black text-[#005149]">Teal</span>
      ) : null}
      <span className="sr-only">{label}</span>
    </span>
  )
}

function PricingComparisonHero() {
  return (
    <div className="relative overflow-hidden bg-white">
      <Image
        src="/pricing-comparison-hero-v3.png"
        alt="JobPosted plus Rezoomed comparison artwork with the Rezoomed bunny holding a red marker and crossing out competitor cards"
        width={1672}
        height={941}
        priority={false}
        sizes="(min-width: 1320px) 1240px, calc(100vw - 56px)"
        className="block h-auto w-full"
      />
    </div>
  )
}

function CellIcon({ tone }: { tone: ComparisonTone }) {
  if (tone === 'price') {
    return <BadgeCheck size={15} strokeWidth={2.5} />
  }

  if (tone === 'yes') {
    return <Check size={15} strokeWidth={2.8} />
  }

  if (tone === 'partial') {
    return <Minus size={15} strokeWidth={2.8} />
  }

  return <X size={15} strokeWidth={2.8} />
}

function ComparisonValue({ cell, featured = false }: { cell: ComparisonCell; featured?: boolean }) {
  const iconClassName = {
    price: featured
      ? 'border-emerald-500/20 bg-[#a3ffb3] text-[#064421]'
      : 'border-zinc-300 bg-zinc-100 text-zinc-500',
    yes: featured
      ? 'border-emerald-500/20 bg-[#a3ffb3] text-[#064421]'
      : 'border-emerald-500/18 bg-emerald-50 text-[#026d32]',
    partial: featured
      ? 'border-emerald-500/16 bg-white/65 text-[#026d32]'
      : 'border-zinc-300 bg-zinc-100 text-zinc-500',
    no: 'border-rose-200 bg-rose-50 text-rose-600',
  }[cell.tone]

  return (
    <div className={cn('flex items-start gap-2.5 text-left', featured ? 'text-[#063d20]' : 'text-zinc-600')}>
      <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', iconClassName)}>
        <CellIcon tone={cell.tone} />
      </span>
      <div className={cn('text-[13px] leading-5', featured ? 'font-semibold text-[#063d20]' : 'text-zinc-600')}>
        {cell.value}
      </div>
    </div>
  )
}

export default function PricingComparisonSection({
  priceOptions,
}: {
  priceOptions: PriceOption[]
}) {
  const monthlyOption = getMonthlyPriceOption(priceOptions)
  const monthlyDisplayPrice = monthlyOption?.display.displayPrice ?? 19.99
  const rezoomedComponentPrice = formatRegionalPrice(monthlyOption)
  const rezoomedCouponPrice = formatRegionalPrice(monthlyOption, getHalfOffPrice(monthlyDisplayPrice))
  const rezoomedFullBundlePrice = formatRegionalPrice(monthlyOption, monthlyDisplayPrice * 2)
  const rezoomedInterval = intervalLabel(monthlyOption)
  const rezoomedMonthlyPrice = `${rezoomedCouponPrice}/${rezoomedInterval}`

  const comparisonRows: ComparisonRow[] = [
    {
      label: 'Listed recurring cost',
      rezoomed: {
        value: (
          <BundleDiscountPrice
            discountedPrice={rezoomedCouponPrice}
            fullPrice={rezoomedFullBundlePrice}
            componentPrice={rezoomedComponentPrice}
            interval={rezoomedInterval}
          />
        ),
        tone: 'price',
      },
      jobright: { value: '$39.99/mo', tone: 'partial' },
      resumeio: { value: '$29.95/4 weeks', tone: 'partial' },
      teal: { value: '$29/30 days', tone: 'partial' },
      rezi: { value: '$29/mo', tone: 'partial' },
    },
    {
      label: 'Resume builder',
      rezoomed: { value: 'Unlimited Pro resumes with PDF and DOCX export', tone: 'yes' },
      jobright: { value: 'Tailored resume tools', tone: 'partial' },
      resumeio: { value: 'Templates and downloads', tone: 'yes' },
      teal: { value: 'Resume builder with templates', tone: 'yes' },
      rezi: { value: 'AI resume builder', tone: 'yes' },
    },
    {
      label: 'Job posts and tracking',
      rezoomed: { value: 'Job board, saved jobs, tracked status, and resume context together', tone: 'yes' },
      jobright: { value: 'Large job hub plus autofill', tone: 'yes' },
      resumeio: { value: 'Job tracker, not a matched job board', tone: 'partial' },
      teal: { value: 'Strong job tracker', tone: 'yes' },
      rezi: { value: 'Resume-first workflow', tone: 'no' },
    },
    {
      label: 'Autofill and tracker save',
      rezoomed: { value: 'Autofill support plus auto-save into your job tracker', tone: 'yes' },
      jobright: { value: 'Autofill support with job activity tracking', tone: 'yes' },
      resumeio: { value: 'Resume tools without job autofill workflow', tone: 'no' },
      teal: { value: 'Tracker-focused workflow, limited autofill', tone: 'partial' },
      rezi: { value: 'Resume-first tools, no tracker autosave', tone: 'no' },
    },
    {
      label: 'Resume-to-job match',
      rezoomed: { value: 'Match score against any pasted job description', tone: 'yes' },
      jobright: { value: 'Job matching and recommendations', tone: 'partial' },
      resumeio: { value: 'Limited resume-first checks', tone: 'partial' },
      teal: { value: 'Keyword matching and analysis', tone: 'yes' },
      rezi: { value: 'Keyword targeting and score tools', tone: 'yes' },
    },
    {
      label: 'ATS scan',
      rezoomed: { value: 'Unlimited ATS scans plus advanced analysis', tone: 'yes' },
      jobright: { value: 'Resume tips inside the job workflow', tone: 'partial' },
      resumeio: { value: 'Basic resume checks', tone: 'partial' },
      teal: { value: 'ATS checker included', tone: 'yes' },
      rezi: { value: 'ATS checker included', tone: 'yes' },
    },
    {
      label: 'Cover letters',
      rezoomed: { value: 'AI cover letters included with Pro', tone: 'yes' },
      jobright: { value: 'AI help on paid plan', tone: 'partial' },
      resumeio: { value: 'Cover letter builder included', tone: 'yes' },
      teal: { value: 'AI writing with plan limits', tone: 'partial' },
      rezi: { value: 'Cover letters included', tone: 'yes' },
    },
    {
      label: 'Best-value scope',
      rezoomed: { value: 'Lowest listed recurring price here with resume, ATS, matching, cover letters, metadata, and tracked jobs', tone: 'yes' },
      jobright: { value: 'Best for high-volume autofill', tone: 'partial' },
      resumeio: { value: 'Best for quick templates', tone: 'partial' },
      teal: { value: 'Best for job tracking depth', tone: 'partial' },
      rezi: { value: 'Best for resume-only AI depth', tone: 'partial' },
    },
  ]
  const mobilePlatforms: Array<{
    key: PlatformKey
    name: string
    price: string
    featured?: boolean
    logo: ReactNode
  }> = [
    {
      key: 'rezoomed',
      name: 'JobPosted + Rezoomed',
      price: rezoomedMonthlyPrice,
      featured: true,
      logo: <RezoomedDualLogo compact />,
    },
    {
      key: 'jobright',
      name: 'Jobright',
      price: '$39.99/mo',
      logo: <PlatformLogo platform="jobright" compact />,
    },
    {
      key: 'resumeio',
      name: 'Resume.io',
      price: '$29.95/4 weeks',
      logo: <PlatformLogo platform="resumeio" compact />,
    },
    {
      key: 'teal',
      name: 'Teal',
      price: '$29/30 days',
      logo: <PlatformLogo platform="teal" compact showName />,
    },
    {
      key: 'rezi',
      name: 'Rezi',
      price: '$29/mo',
      logo: <PlatformLogo platform="rezi" compact />,
    },
  ]

  return (
    <section
      aria-labelledby="pricing-comparison-heading"
      className="scroll-mt-28 relative rounded-[1.75rem] border border-emerald-500/10 bg-[linear-gradient(180deg,#f7fff9_0%,#ffffff_45%,#eefaf2_100%)] text-zinc-900 shadow-[0_30px_90px_rgba(2,109,50,0.12)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(163,255,179,0.48),transparent_36%),radial-gradient(circle_at_90%_18%,rgba(128,218,146,0.22),transparent_34%)]" />
      <div className="relative">
        <div className="overflow-hidden rounded-t-[1.75rem] border-b border-emerald-500/10">
          <PricingComparisonHero />
        </div>

        <div className="sticky top-[calc(100dvh-5.5rem)] z-30 flex justify-center px-5 py-6 sm:px-7 lg:px-9">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.78)_14%,rgba(255,255,255,0.94)_50%,rgba(255,255,255,0.78)_86%,rgba(255,255,255,0)_100%)] blur-xl" />
          <div className="pointer-events-none absolute inset-x-6 top-1/2 h-16 -translate-y-1/2 bg-white/75 blur-2xl" />
          <a
            href="#pricing-top"
            className="relative inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-7 text-sm font-black text-white shadow-[0_18px_50px_rgba(255,255,255,0.72)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <Crown
              aria-hidden="true"
              className="h-4 w-4 text-[#f7c948]"
              fill="#f7c948"
              strokeWidth={2.4}
            />
            Upgrade to Pro
          </a>
        </div>

        <div className="px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <h2 id="pricing-comparison-heading" className="max-w-4xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
            Why Rezoomed and JobPosted are the best
          </h2>
        </div>

        <div className="space-y-3 border-t border-emerald-500/10 px-4 py-5 md:hidden">
          {mobilePlatforms.map(platform => (
            <article
              key={platform.key}
              className={cn(
                'rounded-[1rem] border bg-white/86 p-4 shadow-[0_14px_35px_rgba(2,109,50,0.07)]',
                platform.featured
                  ? 'border-emerald-500/18 bg-[#f0fff3]'
                  : 'border-zinc-200/80'
              )}
            >
              <div className="flex items-start justify-between gap-3 border-b border-black/6 pb-4">
                <div className="flex items-center gap-3">
                  {platform.logo}
                  <div>
                    <h3 className="text-base font-black text-zinc-950">{platform.name}</h3>
                    {platform.featured ? (
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#026d32]">
                        best value
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className={cn('shrink-0 text-right text-sm font-black', platform.featured ? 'text-[#026d32]' : 'text-zinc-700')}>
                  {platform.price}
                </p>
              </div>
              <dl className="divide-y divide-black/6">
                {comparisonRows.slice(1).map(row => (
                  <div key={row.label} className="grid gap-2 py-3">
                    <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                      {row.label}
                    </dt>
                    <dd>
                      <ComparisonValue cell={row[platform.key]} featured={platform.featured} />
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto border-t border-emerald-500/10 md:block">
          <table className="w-full min-w-[1120px] table-fixed border-collapse bg-white/42">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
              <col className="w-[14.5%]" />
              <col className="w-[14.5%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-emerald-500/10">
                <th className="px-5 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  Feature
                </th>
                <th className="bg-[#eaffef] px-5 py-5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <RezoomedDualLogo />
                    <div>
                      <p className="text-sm font-black text-zinc-950">JobPosted + Rezoomed</p>
                      <p className="text-[11px] font-semibold text-[#026d32]">best value</p>
                    </div>
                  </div>
                </th>
                <th className="px-5 py-5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <PlatformLogo platform="jobright" compact />
                    <p className="text-sm font-bold text-zinc-600">Jobright</p>
                  </div>
                </th>
                <th className="px-5 py-5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <PlatformLogo platform="resumeio" compact />
                    <p className="text-sm font-bold text-zinc-600">Resume.io</p>
                  </div>
                </th>
                <th className="px-5 py-5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <PlatformLogo platform="teal" compact showName />
                    <p className="text-sm font-bold text-zinc-600">Teal</p>
                  </div>
                </th>
                <th className="px-5 py-5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <PlatformLogo platform="rezi" compact />
                    <p className="text-sm font-bold text-zinc-600">Rezi</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(row => (
                <tr key={row.label} className="border-b border-emerald-500/10">
                  <th className="px-5 py-5 text-left text-sm font-semibold text-zinc-700">
                    {row.label}
                  </th>
                  <td className="bg-[#eaffef] px-5 py-5 align-top">
                    <ComparisonValue cell={row.rezoomed} featured />
                  </td>
                  <td className="px-5 py-5 align-top">
                    <ComparisonValue cell={row.jobright} />
                  </td>
                  <td className="px-5 py-5 align-top">
                    <ComparisonValue cell={row.resumeio} />
                  </td>
                  <td className="px-5 py-5 align-top">
                    <ComparisonValue cell={row.teal} />
                  </td>
                  <td className="px-5 py-5 align-top">
                    <ComparisonValue cell={row.rezi} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          aria-hidden="true"
          className="h-24 border-t border-emerald-500/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(238,250,242,0.78)_100%)]"
        />
      </div>
    </section>
  )
}
