import Link from 'next/link'

export default function PublicSiteFooter() {
  return (
    <footer className="mt-10 w-full border-t border-zinc-800 bg-black px-8 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm font-semibold text-zinc-400 md:flex-row">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-white">Rezoomed</span>
        </div>
        <div className="flex items-center gap-8 text-zinc-400">
          <Link className="transition-colors hover:text-white" href="/jobs">Jobs</Link>
          <Link className="transition-colors hover:text-white" href="#">Privacy Policy</Link>
          <Link className="transition-colors hover:text-white" href="#">Terms of Service</Link>
        </div>
        <div className="font-medium text-zinc-400">
          © 2026 Rezoomed AI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
