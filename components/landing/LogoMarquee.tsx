import { BriefcaseBusiness } from 'lucide-react'

type Company = {
  name: string
  slug: string
  color: string
}

const COMPANIES: Company[] = [
  { name: 'Google',    slug: 'google',    color: '4285F4' },
  { name: 'Microsoft', slug: 'microsoft', color: '00A4EF' },
  { name: 'Amazon',    slug: 'amazon',    color: 'FF9900' },
  { name: 'Meta',      slug: 'meta',      color: '0866FF' },
  { name: 'Stripe',    slug: 'stripe',    color: '635BFF' },
  { name: 'Figma',     slug: 'figma',     color: 'F24E1E' },
  { name: 'Shopify',   slug: 'shopify',   color: '96BF48' },
  { name: 'Uber',      slug: 'uber',      color: '000000' },
]

function LogoWordmark({ company }: { company: Company }) {
  return (
    <div className="flex min-w-[11rem] shrink-0 items-center gap-4 rounded-[1.6rem] border border-black/5 bg-white/88 px-5 py-4 shadow-[0_18px_40px_rgba(25,28,29,0.06)] backdrop-blur-xl">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(145deg,rgba(243,255,246,0.96),rgba(255,255,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(2,109,50,0.08)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://cdn.simpleicons.org/${company.slug}/${company.color}`}
          alt={company.name}
          width={24}
          height={24}
          loading="lazy"
          decoding="async"
          className="h-6 w-6 object-contain"
        />
      </span>
      <span className="text-[1.02rem] font-semibold tracking-[-0.02em] text-zinc-950">
        {company.name}
      </span>
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
                <h2 className="text-2xl font-black tracking-[-0.03em] text-on-background sm:text-3xl">
                  Our users have landed at companies including
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
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
