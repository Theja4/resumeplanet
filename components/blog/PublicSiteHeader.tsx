'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PublicSiteHeader({
  active = 'none',
}: {
  active?: 'home' | 'blog' | 'pricing' | 'jobs' | 'none'
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileHeaderCondensed, setIsMobileHeaderCondensed] = useState(false)

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const closeMenu = () => setIsMobileMenuOpen(false)
    window.addEventListener('resize', closeMenu)
    return () => window.removeEventListener('resize', closeMenu)
  }, [isMobileMenuOpen])

  useEffect(() => {
    let previousScrollY = window.scrollY

    const onScroll = () => {
      const currentScrollY = window.scrollY
      const isMobileViewport = window.innerWidth < 768

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
    `font-semibold border-b-2 pb-1 transition-all ${
      isActive
        ? 'text-[#026d32] border-[#A3FFB3]'
        : 'text-zinc-500 border-transparent hover:!text-[#026d32] hover:!border-[#A3FFB3]'
    }`

  return (
    <nav
      className={`fixed top-0 z-50 w-full bg-white/70 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl font-['Plus_Jakarta_Sans'] tracking-tight transition-all duration-300 sm:px-6 lg:px-8 ${
        isMobileHeaderCondensed ? 'py-1.5' : 'py-0'
      }`}
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
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-zinc-900">
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

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex group">
          <Link className={`pointer-events-auto ${linkClass(active === 'home')}`} href="/">
            Home
          </Link>
          <Link className={`pointer-events-auto ${linkClass(false)}`} href="/#features">
            Features
          </Link>
          <Link className={`pointer-events-auto ${linkClass(active === 'blog')}`} href="/blog">
            Blog
          </Link>
          <Link className={`pointer-events-auto ${linkClass(active === 'pricing')}`} href="/pricing">
            Pricing
          </Link>
        </div>

        <div className="relative z-10 hidden items-center gap-4 md:flex">
          <Link
            href="/auth/login"
            className="inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-transparent px-6 py-2 text-sm font-bold text-zinc-500 transition-all hover:bg-black hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary-container bg-primary-container/10 px-6 py-2 text-sm font-bold text-primary-landing transition-all hover:bg-primary-container/20"
          >
            Create Account
          </Link>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? 'max-h-[22rem] pb-4 opacity-100' : 'max-h-0 pb-0 opacity-0'
        }`}
      >
        <div className="space-y-1 rounded-2xl border border-black/5 bg-white/92 p-3 shadow-[0_18px_42px_rgba(25,28,29,0.08)]">
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
