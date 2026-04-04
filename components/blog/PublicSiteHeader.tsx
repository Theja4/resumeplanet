import Link from 'next/link'

export default function PublicSiteHeader({ active = 'blog' }: { active?: 'home' | 'blog' | 'jobs' }) {
  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 px-8 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl font-['Plus_Jakarta_Sans'] tracking-tight">
      <div className="text-xl font-bold text-zinc-900 flex items-center gap-2">
        <Link href="/" className="tracking-tighter">Rezoomed</Link>
      </div>
      <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex group">
        <Link className={`pointer-events-auto font-semibold border-b-2 pb-1 transition-all ${active === 'home' ? 'text-[#026d32] border-[#A3FFB3]' : 'text-zinc-500 border-transparent hover:!text-[#026d32] hover:!border-[#A3FFB3]'}`} href="/">
          Home
        </Link>
        <Link className="pointer-events-auto font-semibold border-b-2 pb-1 transition-all text-zinc-500 border-transparent hover:!text-[#026d32] hover:!border-[#A3FFB3]" href="/#features">
          Features
        </Link>
        <Link className={`pointer-events-auto font-semibold border-b-2 pb-1 transition-all ${active === 'blog' ? 'text-[#026d32] border-[#A3FFB3]' : 'text-zinc-500 border-transparent hover:!text-[#026d32] hover:!border-[#A3FFB3]'}`} href="/blog">
          Blog
        </Link>
        <Link className={`pointer-events-auto font-semibold border-b-2 pb-1 transition-all ${active === 'jobs' ? 'text-[#026d32] border-[#A3FFB3]' : 'text-zinc-500 border-transparent hover:!text-[#026d32] hover:!border-[#A3FFB3]'}`} href="/jobs">
          Jobs
        </Link>
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <Link
          href="/ats-checker"
          className="inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-transparent px-6 py-2 text-sm font-bold text-zinc-500 transition-all hover:bg-black hover:text-white"
        >
          Free ATS Score
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-full border-2 border-primary-container bg-primary-container/10 px-6 py-2 text-sm font-bold text-primary-landing transition-all hover:bg-primary-container/20"
        >
          Sign In
        </Link>
      </div>
    </nav>
  )
}
