import Link from 'next/link'

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
]

export default function PublicSiteFooter() {
  return (
    <footer className="relative w-full overflow-hidden">

      {/* ── Top utility bar ── */}
      <div className="relative z-10 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-6 py-4">
          {/* Logo + copyright */}
          <div className="flex shrink-0 items-center gap-3">
            <img src="/auth-login-logo.png" alt="Rezoomed" className="h-7 w-7 rounded-md object-contain" />
            <span className="text-sm font-semibold text-gray-900">
              © {new Date().getFullYear()} Rezoomed AI.{' '}
              <span className="font-normal text-gray-500">All rights reserved.</span>
            </span>
          </div>

          {/* Legal links – centered */}
          <nav className="flex flex-1 items-center justify-center gap-8">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right slot – placeholder keeps layout balanced */}
          <div className="shrink-0 w-[160px]" />
        </div>
      </div>

      {/* ── Brand hero area ── */}
      <div
        className="relative select-none overflow-hidden"
        style={{
          backgroundImage: [
            'linear-gradient(to bottom, rgba(240,253,244,0.96) 0%, rgba(6,95,70,0.82) 55%, rgba(2,44,34,0.97) 100%)',
            'repeating-linear-gradient(90deg, #10b981 0px, #10b981 1px, #34d399 1px, #34d399 2px)',
          ].join(', '),
        }}
      >
        {/* Giant brand name – bleeds off both sides at the bottom */}
        <div
          className="pointer-events-none -mb-[0.12em] flex items-end justify-center px-0"
          aria-hidden="true"
        >
          <span
            className="block whitespace-nowrap font-black leading-none tracking-[-0.04em] text-[#0a2e1a]"
            style={{ fontSize: 'clamp(72px, 18.5vw, 300px)' }}
          >
            REZOOMED
          </span>
        </div>
      </div>

    </footer>
  )
}
