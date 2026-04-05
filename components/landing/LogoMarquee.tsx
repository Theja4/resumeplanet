import React from 'react'
import { BriefcaseBusiness } from 'lucide-react'

// ── Inline brand SVGs with correct brand colors ──────────────────────────────

function GoogleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 488 488" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M488 244c0-14.3-1.3-28.1-3.7-41.5H244v78.6h136.9c-5.9 31.8-23.7 58.7-50.5 76.8v63.8h81.7C462.2 375.8 488 314 488 244z"/>
      <path fill="#34A853" d="M244 488c68.7 0 126.4-22.8 168.5-61.7l-81.7-63.8c-22.7 15.2-51.8 24.2-86.8 24.2-66.7 0-123.3-45-143.5-105.5H16.2v65.9C58.1 434.5 145.5 488 244 488z"/>
      <path fill="#FBBC05" d="M100.5 281.2A147.8 147.8 0 0 1 94 244c0-12.9 1.8-25.4 6.5-37.2v-65.9H16.2A244 244 0 0 0 0 244c0 39.4 9.4 76.7 26.2 109.9l74.3-72.7z"/>
      <path fill="#EA4335" d="M244 96.5c37.6 0 71.3 12.9 97.9 38.3l73.4-73.4C371.5 22.8 313.8 0 244 0 145.5 0 58.1 53.5 16.2 134.1l84.3 65.9C120.7 141.5 177.3 96.5 244 96.5z"/>
    </svg>
  )
}

function MicrosoftLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
      <rect x="0"  y="0"  width="11" height="11" fill="#F25022"/>
      <rect x="12" y="0"  width="11" height="11" fill="#7FBA00"/>
      <rect x="0"  y="12" width="11" height="11" fill="#00A4EF"/>
      <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
    </svg>
  )
}

function AmazonLogo() {
  // "a" with orange smile arrow — Amazon's recognizable icon mark
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span style={{ fontWeight: 900, fontSize: 16, color: '#000', lineHeight: 1 }}>a</span>
      <span className="absolute bottom-0.5 h-[2.5px] w-5 rounded-full bg-[#FF9900]" style={{ left: '50%', transform: 'translateX(-50%)' }} />
      <span className="absolute bottom-[2px] right-[3px] h-2 w-2 rotate-45 border-r-2 border-t-2 border-[#FF9900]" />
    </span>
  )
}

function MetaLogo() {
  return (
    <svg width="26" height="16" viewBox="0 0 287 160" xmlns="http://www.w3.org/2000/svg">
      <path fill="#0866FF" d="M31.9 0C14.3 0 0 24.8 0 55.4c0 20.1 5.4 35.3 13.7 44.2l53.7-88.4C59.8 4.4 46.2 0 31.9 0zM143.5 0c-20 0-37 15.8-50.1 41.6L143.5 118l50.2-76.3C180.5 15.8 163.5 0 143.5 0zM255.1 0c-14.2 0-27.9 4.4-35.5 11.2l53.7 88.4c8.3-8.9 13.7-24.1 13.7-44.2C287 24.8 272.7 0 255.1 0zM55.4 114.7l-42-69.2C9 54.5 6 64.7 6 75.6c0 36.7 23.6 69.4 55.4 82.7l-6-43.6zM169.4 159l-25.9-43.8L117.6 159c8.4 2.5 17 3.8 25.9 3.8s17.5-1.3 25.9-3.8zM231.6 158.3c31.8-13.3 55.4-46 55.4-82.7 0-10.9-3-21.1-7.4-30.1l-42 69.2-6 43.6z"/>
    </svg>
  )
}

function StripeLogo() {
  return (
    <span style={{ fontWeight: 900, fontSize: 18, fontStyle: 'italic', color: '#635BFF', lineHeight: 1, letterSpacing: '-0.02em' }}>
      S
    </span>
  )
}

function FigmaLogo() {
  return (
    <svg width="18" height="26" viewBox="0 0 38 56" xmlns="http://www.w3.org/2000/svg">
      <path fill="#F24E1E" d="M19 28a9 9 0 0 1 9-9h-9a9 9 0 0 1-9-9 9 9 0 0 1 9-9h9a9 9 0 0 1 0 18H19z"/>
      <path fill="#FF7262" d="M28 1H19a9 9 0 0 1 9 9 9 9 0 0 1-9 9h9a9 9 0 0 0 0-18z"/>
      <path fill="#A259FF" d="M10 19a9 9 0 0 0 9 9V10a9 9 0 0 0-9 9z"/>
      <path fill="#1ABCFE" d="M28 19a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
      <path fill="#0ACF83" d="M10 37a9 9 0 0 0 9 9V28a9 9 0 0 0-9 9z"/>
    </svg>
  )
}

function ShopifyLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 109 124" xmlns="http://www.w3.org/2000/svg">
      <path fill="#95BF47" d="M74.7 14.8s-.3 0-2 .6c-.2-.5-.5-1.1-.8-1.7-1.2-2.3-3-3.5-5.1-3.5h-.4c-.6-.8-1.3-1.5-2-2.1-2.5-2.2-5.4-3.3-8.8-3.2-6.8.2-13.5 5.1-19 13.8-3.8 6-6.7 13.6-7.5 19.4-7.7 2.4-13.1 4-13.2 4.1-3.9 1.2-4 1.3-4.5 5-.4 2.8-10.6 81.5-10.6 81.5l80.2 13.8V14.4c-.3 0-.3.4-.3.4zM57.8 20c-3.2 1-6.7 2.1-10.2 3.2.9-3.6 2.8-7.2 5-9.6 1-1 2.3-2 3.8-2.6 1.7 3.3 2.1 7 1.4 9zm-6.7-12.8c1.2 0 2.3.3 3.2.8-1.4.7-2.8 1.7-4.1 3-3.3 3.5-5.8 9-6.8 14.2-3 .9-6 1.9-8.8 2.7 1.7-9.8 8.3-20.4 16.5-20.7zm3 55.6c.4 5.9-16.2 7.3-16.7 2-.2-2.5 1.9-5.3 6.4-5.5 5-.3 10.3 1.9 10.3 3.5zm6.6 32.5c-3.7-1.9-7.9-2.8-12.2-2.8-10.1 0-17 6.4-17 14.6 0 8.1 6.9 13.6 17 13.6 13.3 0 20.5-7.6 20.5-16.8 0-4.9-1.9-9.5-8.3-8.6z"/>
      <path fill="#5E8E3E" d="M72.4 15.4c-.2 0-2 .6-2 .6V110l30.4-7.4S81.2 19.2 81 17.8c-.2-1.4-1.2-2.1-2.3-2.3-1-.2-6.3-.1-6.3-.1z"/>
    </svg>
  )
}

function UberLogo() {
  return (
    <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: '0.06em', color: '#000', lineHeight: 1 }}>
      UBER
    </span>
  )
}

const LOGO_COMPONENTS: Record<string, React.FC> = {
  google: GoogleLogo,
  microsoft: MicrosoftLogo,
  amazon: AmazonLogo,
  meta: MetaLogo,
  stripe: StripeLogo,
  figma: FigmaLogo,
  shopify: ShopifyLogo,
  uber: UberLogo,
}

type Company = {
  name: string
  key: string
}

const COMPANIES: Company[] = [
  { name: 'Google',    key: 'google' },
  { name: 'Microsoft', key: 'microsoft' },
  { name: 'Amazon',    key: 'amazon' },
  { name: 'Meta',      key: 'meta' },
  { name: 'Stripe',    key: 'stripe' },
  { name: 'Figma',     key: 'figma' },
  { name: 'Shopify',   key: 'shopify' },
  { name: 'Uber',      key: 'uber' },
]

function LogoWordmark({ company }: { company: Company }) {
  const Logo = LOGO_COMPONENTS[company.key]
  return (
    <div className="flex min-w-[11rem] shrink-0 items-center gap-4 rounded-[1.6rem] border border-black/5 bg-white/88 px-5 py-4 shadow-[0_18px_40px_rgba(25,28,29,0.06)] backdrop-blur-xl">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(145deg,rgba(243,255,246,0.96),rgba(255,255,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(2,109,50,0.08)]">
        {Logo && <Logo />}
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
