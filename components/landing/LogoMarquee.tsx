import { BriefcaseBusiness } from 'lucide-react'

// ── Inline SVGs for logos that need multiple brand colors ─────────────────────

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 488 488" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M488 244c0-14.3-1.3-28.1-3.7-41.5H244v78.6h136.9c-5.9 31.8-23.7 58.7-50.5 76.8v63.8h81.7C462.2 375.8 488 314 488 244z"/>
      <path fill="#34A853" d="M244 488c68.7 0 126.4-22.8 168.5-61.7l-81.7-63.8c-22.7 15.2-51.8 24.2-86.8 24.2-66.7 0-123.3-45-143.5-105.5H16.2v65.9C58.1 434.5 145.5 488 244 488z"/>
      <path fill="#FBBC05" d="M100.5 281.2A147.8 147.8 0 0 1 94 244c0-12.9 1.8-25.4 6.5-37.2v-65.9H16.2A244 244 0 0 0 0 244c0 39.4 9.4 76.7 26.2 109.9l74.3-72.7z"/>
      <path fill="#EA4335" d="M244 96.5c37.6 0 71.3 12.9 97.9 38.3l73.4-73.4C371.5 22.8 313.8 0 244 0 145.5 0 58.1 53.5 16.2 134.1l84.3 65.9C120.7 141.5 177.3 96.5 244 96.5z"/>
    </svg>
  )
}

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="0"  y="0"  width="10" height="10" fill="#F25022"/>
      <rect x="11" y="0"  width="10" height="10" fill="#7FBA00"/>
      <rect x="0"  y="11" width="10" height="10" fill="#00A4EF"/>
      <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
    </svg>
  )
}

function AmazonLogo() {
  // Amazon's "a" mark with orange smile arrow
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <text x="50" y="58" textAnchor="middle" fontSize="52" fontWeight="900" fontFamily="Georgia, serif" fill="#000">a</text>
      <path d="M18 75 Q50 90 82 75" stroke="#FF9900" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <polyline points="76,70 82,75 76,80" fill="none" stroke="#FF9900" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function FigmaLogo() {
  return (
    <svg width="18" height="26" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#F24E1E" d="M0 9.5C0 14.747 4.253 19 9.5 19H19V0H9.5C4.253 0 0 4.253 0 9.5z"/>
      <path fill="#FF7262" d="M19 0v19h9.5C33.747 19 38 14.747 38 9.5S33.747 0 28.5 0H19z"/>
      <path fill="#A259FF" d="M0 28.5C0 33.747 4.253 38 9.5 38H19V19H9.5C4.253 19 0 23.253 0 28.5z"/>
      <circle fill="#1ABCFE" cx="28.5" cy="28.5" r="9.5"/>
      <path fill="#0ACF83" d="M0 47.5C0 52.747 4.253 57 9.5 57S19 52.747 19 47.5V38H9.5C4.253 38 0 42.253 0 47.5z"/>
    </svg>
  )
}

// ── CDN img for single-color brand logos (Simple Icons) ───────────────────────

type CdnCompany = { name: string; slug: string; color: string }
type InlineCompany = { name: string; slug: 'google' | 'microsoft' | 'amazon' | 'figma' }
export type Company = CdnCompany | InlineCompany

function isCdn(c: Company): c is CdnCompany {
  return 'color' in c
}

export const COMPANIES: Company[] = [
  { name: 'Google',    slug: 'google' },
  { name: 'Microsoft', slug: 'microsoft' },
  { name: 'Amazon',    slug: 'amazon' },
  { name: 'Meta',      slug: 'meta',      color: '0866FF' },
  { name: 'Stripe',    slug: 'stripe',    color: '635BFF' },
  { name: 'Figma',     slug: 'figma' },
  { name: 'Shopify',   slug: 'shopify',   color: '96BF48' },
  { name: 'Uber',      slug: 'uber',      color: '000000' },
]

export function LogoIcon({ company }: { company: Company }) {
  if (!isCdn(company)) {
    if (company.slug === 'google')    return <GoogleLogo />
    if (company.slug === 'microsoft') return <MicrosoftLogo />
    if (company.slug === 'amazon')    return <AmazonLogo />
    if (company.slug === 'figma')     return <FigmaLogo />
  }
  const c = company as CdnCompany
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.simpleicons.org/${c.slug}/${c.color}`}
        alt={c.name}
        width={22}
        height={22}
        loading="lazy"
        decoding="async"
        className="h-[22px] w-[22px] object-contain"
      />
    </>
  )
}

function LogoWordmark({ company }: { company: Company }) {
  return (
    <div className="flex min-w-[11rem] shrink-0 items-center gap-4 rounded-[1.6rem] border border-black/5 bg-white/88 px-5 py-4 shadow-[0_18px_40px_rgba(25,28,29,0.06)] backdrop-blur-xl">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(145deg,rgba(243,255,246,0.96),rgba(255,255,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(2,109,50,0.08)]">
        <LogoIcon company={company} />
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
