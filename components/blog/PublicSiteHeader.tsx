'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Menu as MenuIcon, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const FORMAT_MENU_LINKS = [
  { label: 'Resume Format', href: '/resume-format' },
  { label: 'US Resume Format', href: '/us-resume-format' },
  { label: 'ATS Resume Format', href: '/ats-resume-format' },
  { label: 'Resume Format for Job Applications', href: '/resume-format-for-job-applications' },
  { label: 'Software Engineer Format', href: '/resume-format/software-engineer' },
  { label: 'Product Manager Format', href: '/resume-format/product-manager' },
  { label: 'Data Analyst Format', href: '/resume-format/data-analyst' },
  { label: 'Finance Format', href: '/resume-format/finance' },
  { label: 'Marketing Format', href: '/resume-format/marketing' },
] as const

const ATS_MENU_LINKS = [
  { label: 'Resume Scanner', href: '/resume-scanner' },
  { label: 'ATS Resume Test', href: '/ats-resume-test' },
  { label: 'Amazon ATS Resume Guide', href: '/amazon-ats-resume-guide' },
  { label: 'What ATS Does Amazon Use?', href: '/what-ats-does-amazon-use' },
] as const

export default function PublicSiteHeader({
  active = 'none',
}: {
  active?: 'home' | 'blog' | 'pricing' | 'jobs' | 'none'
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false)
  const [isMobileHeaderCondensed, setIsMobileHeaderCondensed] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isMobileMenuOpen && !isDesktopMenuOpen) {
      return
    }

    const closeMenu = () => {
      setIsMobileMenuOpen(false)
      setIsDesktopMenuOpen(false)
    }
    window.addEventListener('resize', closeMenu)
    return () => window.removeEventListener('resize', closeMenu)
  }, [isMobileMenuOpen, isDesktopMenuOpen])

  useEffect(() => {
    if (!isDesktopMenuOpen) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current?.contains(event.target as Node)) {
        return
      }

      setIsDesktopMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDesktopMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isDesktopMenuOpen])

  useEffect(() => {
    let previousScrollY = window.scrollY

    const onScroll = () => {
      const currentScrollY = window.scrollY
      const isMobileViewport = window.innerWidth < 768

      setIsScrolled(currentScrollY > 12)

      if (!isMobileViewport || isMobileMenuOpen) {
        setIsMobileHeaderCondensed(false)
        previousScrollY = currentScrollY
        return
      }

      if (currentScrollY < 24) {
        setIsMobileHeaderCondensed(false)
      } else if (currentScrollY > previousScrollY + 8) {
        setIsMobileHeaderCondensed(true)
      } else if (currentScrollY < previousScrollY - 8) {
        setIsMobileHeaderCondensed(false)
      }

      previousScrollY = currentScrollY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobileMenuOpen])

  const linkClass = (isActive: boolean) =>
    `text-[15px] font-semibold transition-colors duration-150 ${
      isActive ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
    }`

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 z-50 w-full bg-white/80 px-4 backdrop-blur-xl font-['Plus_Jakarta_Sans'] tracking-tight transition-all duration-300 sm:px-6 lg:px-8 ${
        isMobileHeaderCondensed ? 'py-1.5' : 'py-0'
      } ${isScrolled ? 'border-b border-zinc-900/8 shadow-[0_2px_16px_rgba(0,0,0,0.05)]' : 'shadow-none'}`}
    >
      <div className={`relative flex items-center justify-between transition-all duration-300 ${isMobileHeaderCondensed ? 'h-12' : 'h-16'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(value => !value)}
            className={`inline-flex items-center justify-center rounded-full border border-black/8 bg-white/65 text-zinc-700 shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all hover:bg-white md:hidden ${
              isMobileHeaderCondensed ? 'h-9 w-9' : 'h-10 w-10'
            }`}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
          </button>

          <Link
            href="/"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-xl font-bold text-zinc-900 md:static md:translate-x-0"
          >
            <Image
              src="/auth-login-logo.png"
              alt="Rezoomed logo"
              width={32}
              height={32}
              className={`object-contain transition-all duration-300 ${isMobileHeaderCondensed ? 'h-7 w-7' : 'h-8 w-8'}`}
            />
            <span className={`tracking-tighter transition-all duration-300 ${isMobileHeaderCondensed ? 'text-lg' : 'text-xl'}`}>
              Rezoomed
            </span>
          </Link>
        </div>

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <Link className={`pointer-events-auto ${linkClass(active === 'home')}`} href="/">Home</Link>
          <Link className={`pointer-events-auto ${linkClass(false)}`} href="/#features">Features</Link>
          <Link className={`pointer-events-auto ${linkClass(active === 'blog')}`} href="/blog">Blog</Link>
          <Link className={`pointer-events-auto ${linkClass(active === 'pricing')}`} href="/pricing">Pricing</Link>
          <button
            type="button"
            onMouseEnter={() => setIsDesktopMenuOpen(true)}
            onFocus={() => setIsDesktopMenuOpen(true)}
            onClick={() => setIsDesktopMenuOpen(value => !value)}
            className={`pointer-events-auto flex items-center gap-1 text-[15px] font-semibold transition-colors duration-150 ${
              isDesktopMenuOpen ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
            }`}
            aria-expanded={isDesktopMenuOpen}
            aria-controls="public-site-mega-menu"
          >
            More
            <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${isDesktopMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="relative z-10 hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-[15px] font-semibold text-zinc-500 transition-colors duration-150 hover:text-zinc-900"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2 text-sm font-bold text-white transition-all duration-150 hover:bg-zinc-700"
          >
            Sign up
          </Link>
        </div>
      </div>

      <div
        id="public-site-mega-menu"
        onMouseEnter={() => setIsDesktopMenuOpen(true)}
        onMouseLeave={() => setIsDesktopMenuOpen(false)}
        className={`absolute left-0 top-full hidden w-full overflow-hidden border-t border-black/8 bg-white shadow-[0_26px_70px_rgba(18,24,21,0.16)] transition-all duration-250 md:block ${
          isDesktopMenuOpen ? 'max-h-[30rem] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-7xl px-8 py-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.95fr)]">
            <div className="rounded-[1.6rem] border border-zinc-200 bg-[linear-gradient(145deg,#07110b_0%,#0d1c13_100%)] p-5 text-white shadow-[0_22px_50px_rgba(7,17,11,0.18)]">
              <div className="mb-4 border-b border-white/10 pb-4">
                <div>
                  <span className="inline-flex rounded-full bg-[#A3FFB3]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
                    Format
                  </span>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-white/52">
                    Resume layouts, ATS-safe section order, and role-specific format examples.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FORMAT_MENU_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="group rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white/82 shadow-[inset_0_1px_rgba(255,255,255,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#A3FFB3]/45 hover:bg-white/13 hover:text-white"
                  >
                    <span className="block leading-5">{link.label}</span>
                    <span className="mt-2 block h-0.5 w-8 rounded-full bg-[#A3FFB3] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-zinc-200 bg-[linear-gradient(145deg,#07110b_0%,#0d1c13_100%)] p-5 text-white shadow-[0_22px_50px_rgba(7,17,11,0.18)]">
              <div className="mb-4 border-b border-white/10 pb-4">
                <div>
                  <span className="inline-flex rounded-full bg-[#A3FFB3]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
                    ATS
                  </span>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-white/52">
                    Scanner pages, ATS tests, and Amazon-specific application guidance.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                {ATS_MENU_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="group rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white/82 shadow-[inset_0_1px_rgba(255,255,255,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#A3FFB3]/45 hover:bg-white/13 hover:text-white"
                  >
                    <span className="block leading-5">{link.label}</span>
                    <span className="mt-2 block h-0.5 w-8 rounded-full bg-[#A3FFB3] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? 'max-h-[46rem] pb-4 opacity-100' : 'max-h-0 pb-0 opacity-0'
        }`}
      >
        <div className="max-h-[calc(100vh-5.5rem)] space-y-1 overflow-y-auto rounded-2xl border border-black/5 bg-white/92 p-3 shadow-[0_18px_42px_rgba(25,28,29,0.08)]">
          <Link
            className={`block rounded-xl px-3 py-2 text-sm ${active === 'home' ? 'bg-primary-container/40 font-bold text-[#026d32]' : 'text-zinc-700'}`}
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            className="block rounded-xl px-3 py-2 text-sm text-zinc-700"
            href="/#features"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            className={`block rounded-xl px-3 py-2 text-sm ${active === 'blog' ? 'bg-primary-container/40 font-bold text-[#026d32]' : 'text-zinc-700'}`}
            href="/blog"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            className={`block rounded-xl px-3 py-2 text-sm ${active === 'pricing' ? 'bg-primary-container/40 font-bold text-[#026d32]' : 'text-zinc-700'}`}
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </Link>

          <div className="pt-3">
            <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#026d32]">Format</p>
            <div className="mt-2 grid gap-1">
              {FORMAT_MENU_LINKS.map(link => (
                <Link
                  key={link.href}
                  className="block rounded-xl px-3 py-2 text-sm text-zinc-700"
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#026d32]">ATS</p>
            <div className="mt-2 grid gap-1">
              {ATS_MENU_LINKS.map(link => (
                <Link
                  key={link.href}
                  className="block rounded-xl px-3 py-2 text-sm text-zinc-700"
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Link
              href="/auth/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-zinc-700 transition-all hover:bg-black hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-primary-container bg-primary-container/25 px-4 py-2 text-sm font-bold text-primary-landing transition-all hover:bg-primary-container/35"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
