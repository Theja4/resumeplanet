import Image from 'next/image'
import Link from 'next/link'
import { getOrganizationSameAsLinks } from '@/lib/site'

type SocialLink = {
  label: string
  hostMatch: string
  icon: React.ReactNode
}

const SOCIAL_LINK_DEFINITIONS: SocialLink[] = [
  {
    label: 'Facebook',
    hostMatch: 'facebook.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    hostMatch: 'instagram.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    hostMatch: 'linkedin.com',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'X',
    hostMatch: 'x.com',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

function resolveSocialLinks() {
  const sameAs = getOrganizationSameAsLinks()
  if (sameAs.length === 0) return []
  return SOCIAL_LINK_DEFINITIONS.flatMap((def) => {
    const href = sameAs.find((url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '').endsWith(def.hostMatch)
      } catch {
        return false
      }
    })
    return href ? [{ ...def, href }] : []
  })
}

const TOOL_LINKS = [
  { label: 'Resume Builder', href: '/resume-builder' },
  { label: 'ATS Checker', href: '/ats-checker' },
  { label: 'Match Score', href: '/match-score' },
  { label: 'Resume Tailoring', href: '/resume-tailoring' },
  { label: 'Cover Letter', href: '/cover-letter-generator' },
  { label: 'Metadata Enhancer', href: '/metadata-enhancer' },
]

const RESOURCE_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Affiliate Program', href: '/affiliate/dashboard' },
  { label: 'Blog', href: '/blog' },
  { label: 'ATS Resume Test', href: '/ats-resume-test' },
  { label: 'Resume Formats', href: '/resume-format' },
]

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refund', href: '/refund-policy' },
  { label: 'Cookies', href: '/cookie-policy' },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h3>
      <ul className="mt-5 flex flex-col gap-3">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link href={href} className="footer-link">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PublicSiteFooter() {
  const socialLinks = resolveSocialLinks()
  const year = new Date().getFullYear()

  return (
    <footer
      className="relative w-full overflow-hidden"
      style={{ background: 'var(--landing-bg)' }}
    >
      {/* Hairline divider with sweeping accent */}
      <div className="footer-divider" />

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="relative px-6 pt-16 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Brand column */}
            <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image
                  src="/auth-login-logo.png"
                  alt="Rezoomed"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-contain"
                />
                <span className="font-semibold tracking-tight text-zinc-900">
                  Rezoomed
                </span>
              </Link>

              <p className="max-w-xs text-sm leading-relaxed text-zinc-600">
                AI resume builder, ATS checker, and tailoring engine for the 2026 job
                market.
              </p>

              {/* Status indicator */}
              <div className="inline-flex items-center gap-2.5">
                <span className="footer-status-dot" />
                <span className="text-xs font-medium text-zinc-700">
                  All systems operational
                </span>
              </div>

              {/* Social icons (only when configured via env) */}
              {socialLinks.length > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  {socialLinks.map(({ label, href, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="footer-social"
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <FooterColumn title="Tools" links={TOOL_LINKS} />
            <FooterColumn title="Resources" links={RESOURCE_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>

          {/* ── Copyright bar ─────────────────────────────────── */}
          <div className="mt-14 border-t border-zinc-900/[0.06] pt-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:items-center md:text-left">
              <p className="text-xs text-zinc-500">
                © {year} Rezoomed.{' '}
                <span className="text-zinc-400">All rights reserved.</span>
              </p>
              <p className="text-xs tracking-wide text-zinc-400 md:text-right">
                Made with care · Built for the 2026 job market
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated wordmark band ────────────────────────────── */}
      <div className="footer-wordmark-stage select-none">
        <div className="relative mx-auto flex max-w-[1600px] justify-center px-6 pb-[0.04em]">
          <span
            aria-hidden="true"
            className="footer-wordmark"
            style={{ fontSize: 'clamp(56px, 15vw, 240px)' }}
          >
            REZOOMED
          </span>
          {/* Visually-hidden accessible name so screen readers still get the brand */}
          <span className="sr-only">Rezoomed</span>
        </div>
      </div>
    </footer>
  )
}
