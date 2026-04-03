import { BriefcaseBusiness } from 'lucide-react'

type Company = {
  name: string
  kind: 'google' | 'microsoft' | 'amazon' | 'meta' | 'stripe' | 'figma' | 'shopify' | 'uber'
}

const COMPANIES: Company[] = [
  { name: 'Google', kind: 'google' },
  { name: 'Microsoft', kind: 'microsoft' },
  { name: 'Amazon', kind: 'amazon' },
  { name: 'Meta', kind: 'meta' },
  { name: 'Stripe', kind: 'stripe' },
  { name: 'Figma', kind: 'figma' },
  { name: 'Shopify', kind: 'shopify' },
  { name: 'Uber', kind: 'uber' },
]

function LogoMark({ kind }: Pick<Company, 'kind'>) {
  if (kind === 'microsoft') {
    return (
      <span className="grid h-8 w-8 grid-cols-2 gap-1">
        <span className="rounded-[0.25rem] bg-[#f25022]" />
        <span className="rounded-[0.25rem] bg-[#7fba00]" />
        <span className="rounded-[0.25rem] bg-[#00a4ef]" />
        <span className="rounded-[0.25rem] bg-[#ffb900]" />
      </span>
    )
  }

  if (kind === 'figma') {
    return (
      <span className="grid h-8 w-6 grid-cols-2 gap-[3px]">
        <span className="rounded-tl-full rounded-tr-full rounded-bl-full bg-[#f24e1e]" />
        <span className="rounded-tl-full rounded-tr-full rounded-br-full bg-[#ff7262]" />
        <span className="rounded-tl-full rounded-bl-full rounded-br-full bg-[#a259ff]" />
        <span className="rounded-full bg-[#1abcfe]" />
        <span className="rounded-tl-full rounded-bl-full rounded-br-full bg-[#0acf83]" />
      </span>
    )
  }

  if (kind === 'meta') {
    return (
      <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true">
        <path
          d="M3 12.2C5.7 7 7.3 3.8 8.9 3.8c1.8 0 3.2 3.1 5.2 7.1 2-4 3.4-7.1 5.2-7.1 1.6 0 3.2 3.2 5.9 8.4"
          fill="none"
          stroke="#0866ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
    )
  }

  if (kind === 'stripe') {
    return <span className="-skew-x-12 text-base font-black leading-none text-zinc-950">S</span>
  }

  if (kind === 'amazon') {
    return (
      <span className="relative flex h-8 w-8 items-center justify-center">
        <span className="text-base font-black lowercase leading-none text-zinc-950">a</span>
        <span className="absolute bottom-1 h-[2px] w-4 rounded-full bg-[#ff9900]" />
        <span className="absolute bottom-[2px] right-[6px] h-1.5 w-1.5 rotate-45 border-r-[2px] border-t-[2px] border-[#ff9900]" />
      </span>
    )
  }

  if (kind === 'shopify') {
    return (
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[0.8rem] bg-[#95bf47] text-sm font-black text-[#1f4027] shadow-[inset_0_-4px_8px_rgba(31,64,39,0.14)]">
        S
        <span className="absolute -top-1.5 h-2.5 w-4 rounded-full border-2 border-[#5e8e3e] border-b-0" />
      </span>
    )
  }

  if (kind === 'uber') {
    return <span className="text-base font-black leading-none text-zinc-950">U</span>
  }

  return <span className="text-base font-black leading-none text-zinc-950">G</span>
}

function LogoWordmarkText({ company }: { company: Company }) {
  if (company.kind === 'microsoft') {
    return (
      <span className="text-[1rem] font-semibold tracking-[-0.01em] text-zinc-950">
        Microsoft
      </span>
    )
  }

  if (company.kind === 'amazon') {
    return (
      <span className="relative inline-flex pb-2 text-[1.08rem] font-black lowercase tracking-[-0.03em] text-zinc-950">
        amazon
        <span className="absolute bottom-0 left-1/2 h-[2px] w-[78%] -translate-x-1/2 rounded-full bg-[#ff9900]" />
        <span className="absolute bottom-[1px] right-[8%] h-1.5 w-1.5 rotate-45 border-r-[2px] border-t-[2px] border-[#ff9900]" />
      </span>
    )
  }

  if (company.kind === 'meta') {
    return (
      <span className="text-[1.02rem] font-semibold tracking-[-0.02em] text-zinc-950">
        Meta
      </span>
    )
  }

  if (company.kind === 'figma') {
    return (
      <span className="text-[1.08rem] font-bold lowercase tracking-[-0.03em] text-zinc-950">
        figma
      </span>
    )
  }

  if (company.kind === 'shopify') {
    return (
      <span className="text-[1.02rem] font-bold tracking-[-0.02em] text-[#1f4027]">
        Shopify
      </span>
    )
  }

  if (company.kind === 'stripe') {
    return (
      <span className="text-[1.05rem] font-black italic tracking-[-0.03em] text-[#635bff]">
        Stripe
      </span>
    )
  }

  if (company.kind === 'uber') {
    return (
      <span className="text-[1.02rem] font-black tracking-[0.08em] text-zinc-950">
        UBER
      </span>
    )
  }

  return (
    <span className="text-[1.02rem] font-semibold tracking-[-0.02em] text-zinc-950">
      {company.name}
    </span>
  )
}

function LogoWordmark({ company }: { company: Company }) {
  return (
    <div className="flex min-w-[11rem] shrink-0 items-center gap-4 rounded-[1.6rem] border border-black/5 bg-white/88 px-5 py-4 shadow-[0_18px_40px_rgba(25,28,29,0.06)] backdrop-blur-xl">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(145deg,rgba(243,255,246,0.96),rgba(255,255,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(2,109,50,0.08)]">
        <LogoMark kind={company.kind} />
      </span>
      <LogoWordmarkText company={company} />
    </div>
  )
}

export default function LogoMarqueeSection() {
  const marqueeCompanies = [...COMPANIES, ...COMPANIES]

  return (
    <section className="relative -mt-8 px-6 pb-24 lg:-mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden rounded-[2.2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(246,250,247,0.88))] px-6 py-8 shadow-[0_30px_70px_rgba(25,28,29,0.06)] backdrop-blur-2xl md:px-8 md:py-9">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
                <BriefcaseBusiness size={14} strokeWidth={2.6} />
                Career Outcomes
              </span>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-on-background sm:text-3xl">
                  Our users have landed at companies including
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                  Product, design, growth, and operations candidates use Rezoomed to sharpen each role-specific application before it goes out.
                </p>
              </div>
            </div>
          </div>

          <div className="logo-marquee-mask mt-8">
            <div className="logo-marquee-track flex w-max gap-4 py-2">
              {marqueeCompanies.map((company, index) => (
                <LogoWordmark key={`${company.name}-${index}`} company={company} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
