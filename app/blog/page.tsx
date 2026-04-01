import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/70 backdrop-blur-xl dark:bg-zinc-900/70 shadow-[0_8px_24px_rgba(0,0,0,0.06)] font-['Plus_Jakarta_Sans'] tracking-tight">
        <div className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Link href="/" className="tracking-tighter">Rezoomed</Link>
        </div>
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 group">
          <Link className="font-semibold border-b-2 pb-1 transition-all text-zinc-500 dark:text-zinc-400 border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="/">Home</Link>
          <Link className="font-semibold border-b-2 pb-1 transition-all text-zinc-500 dark:text-zinc-400 border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="/#features">Features</Link>
          <Link className="font-semibold border-b-2 pb-1 transition-all text-[#026d32] dark:text-[#A3FFB3] border-[#A3FFB3] group-hover:text-zinc-500 group-hover:border-transparent hover:!text-[#026d32] dark:hover:!text-[#A3FFB3] hover:!border-[#A3FFB3]" href="/blog">Blog</Link>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-bold text-zinc-500 hover:text-white hover:bg-black transition-all px-6 py-2 border-2 border-transparent rounded-full cursor-pointer">Sign In</button>
          <Link href="/dashboard" className="text-sm font-bold text-primary-landing border-2 border-primary-container bg-primary-container/10 px-6 py-2 rounded-full hover:bg-primary-container/20 transition-all">Sign Up</Link>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto space-y-20">
        <div className="space-y-6 text-center reveal-on-scroll active">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-on-background">The Career <span className="text-[#008f44]">Curator</span>.</h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">Insights, strategies, and updates from the team building the future of ATS optimization.</p>
        </div>
        
        {/* Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {[
            { tag: 'Career Strategy', title: 'How to beat the modern ATS tracking systems in 2026', date: 'March 31, 2026' },
            { tag: 'Product Update', title: 'Introducing the Optic Precision Parsing Engine', date: 'March 28, 2026' },
            { tag: 'Success Story', title: 'From rejection to FAANG: A keyword story', date: 'March 22, 2026' },
            { tag: 'Resume Tips', title: 'Why 16:9 formatting creates the perfect visual weight', date: 'March 15, 2026' },
            { tag: 'Industry News', title: 'The hidden algorithms behind automated rejection emails', date: 'March 08, 2026' },
            { tag: 'Design System', title: 'Building a modern application with dark transitions', date: 'March 01, 2026' },
          ].map((post, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-container-highest overflow-hidden card-hover transition-all flex flex-col cursor-pointer group">
              <div className="h-56 bg-zinc-50 flex items-center justify-center border-b border-surface-container-highest relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-[#A3FFB3]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="text-zinc-200 font-bold text-4xl group-hover:scale-105 transition-transform duration-500">Image Asset</div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#008f44] mb-3">{post.tag}</div>
                <h3 className="text-xl font-extrabold text-on-background mb-4 leading-tight group-hover:text-[#008f44] transition-colors">{post.title}</h3>
                <p className="text-on-surface-variant text-sm mb-8 flex-1 line-clamp-3">Discover the hidden mechanics behind modern career optimization and how you can leverage these formatting rules to bypass the robotic gatekeepers.</p>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{post.date}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 mt-10 border-t border-zinc-100 dark:border-zinc-800 bg-[#f8f9fa] dark:bg-zinc-950">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto text-sm text-zinc-500 font-semibold">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-zinc-600 text-lg">Rezoomed</span>
          </div>
          <div className="flex items-center gap-8 text-zinc-400">
            <Link className="hover:text-zinc-700 transition-colors" href="#">Privacy Policy</Link>
            <Link className="hover:text-zinc-700 transition-colors" href="#">Terms of Service</Link>
            <Link className="hover:text-zinc-700 transition-colors" href="#">Security</Link>
            <Link className="hover:text-zinc-700 transition-colors" href="#">Status</Link>
          </div>
          <div className="text-zinc-400 font-medium">
            © 2024 Rezoomed AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
