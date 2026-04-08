import Link from 'next/link'
import Image from 'next/image'

export default function PublicSiteFooter() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-black px-8 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm font-semibold text-zinc-400 md:flex-row">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Rezoomed logo" width={28} height={28} className="rounded-md shadow-sm" />
          <span className="text-lg font-extrabold text-white">Rezoomed</span>
        </div>
        <div className="flex items-center gap-8 text-zinc-400">
          <Link className="hover:text-white transition-colors" href="/cookie-policy">Cookie Policy</Link>
          <Link className="hover:text-white transition-colors" href="/privacy-policy">Privacy Policy</Link>
          <Link className="hover:text-white transition-colors" href="/terms">Terms of Service</Link>
        </div>
        <div className="font-medium text-zinc-400">
          © 2026 Rezoomed AI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
