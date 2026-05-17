type Segment = { t: string; em?: boolean }

function Q({ segments, className = '' }: { segments: Segment[]; className?: string }) {
  return (
    <p className={className}>
      {segments.map((s, i) =>
        s.em
          ? <strong key={i} className="font-black italic text-[#00a84d]">{s.t}</strong>
          : <span key={i}>{s.t}</span>
      )}
    </p>
  )
}

function Attribution({ name, role }: { name: string; role: string }) {
  return (
    <div className="mt-auto pt-6">
      <p className="text-sm text-zinc-500">{name}</p>
      <p className="text-sm font-black text-zinc-900">{role}</p>
    </div>
  )
}

function Card({
  children,
  className = '',
  delay = 0,
  visible,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  visible: boolean
}) {
  return (
    <div
      className={`group flex flex-col rounded-3xl bg-white p-8 cursor-default transition-transform duration-300 hover:-translate-y-1 ${className}`}
      style={{
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 4px -1px rgba(0,0,0,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.75s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.75s ${delay}ms cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease`,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingTestimonials() {
  const visible = true

  return (
    <section
      className="px-6 py-24 md:py-28"
      style={{ background: '#f0faf3' }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Headline */}
        <div
          className="mb-14 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d] mb-4">
            Trusted by job seekers
          </p>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.0] text-zinc-950">
            Over <em className="landing-italic-safe not-italic font-black">1,000,000</em> resumes<br className="hidden md:block" /> optimized.
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">

          {/* Row 1 — large left + small right */}
          <Card visible={visible} delay={80} className="md:col-span-3 min-h-[280px]">
            <Q
              className="text-2xl md:text-3xl leading-[1.4] text-zinc-800 font-medium"
              segments={[
                { t: '"I applied to 11 companies after running my resume through Rezoomed. Got ' },
                { t: '9 callbacks.', em: true },
                { t: ' I was about to pay $600 for a resume writer — now I don\'t need to."' },
              ]}
            />
            <Attribution name="Priya Sharma" role="Data Scientist · Google" />
          </Card>

          <Card visible={visible} delay={160} className="md:col-span-2">
            <Q
              className="text-xl md:text-2xl leading-[1.45] text-zinc-800 font-medium"
              segments={[
                { t: '"Rezoomed ' },
                { t: '3x\'d my interview rate', em: true },
                { t: ' in the first two weeks. ATS score went from 38% to 96%."' },
              ]}
            />
            <Attribution name="Marcus Chen" role="Senior Software Engineer · Meta" />
          </Card>

          {/* Row 2 — stat left + large right */}
          <Card visible={visible} delay={240} className="md:col-span-2">
            <div>
              <p className="text-7xl md:text-8xl font-black tracking-tighter leading-none text-[#00a84d]">
                3×
              </p>
              <p className="mt-5 text-base leading-relaxed text-zinc-600 font-medium">
                Increase in interview callbacks after using Rezoomed — from{' '}
                <strong className="italic text-zinc-800">under 15% to over 60%.</strong>
              </p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Across active job seekers
              </p>
            </div>
          </Card>

          <Card visible={visible} delay={320} className="md:col-span-3 min-h-[260px]">
            <Q
              className="text-xl md:text-2xl leading-[1.45] text-zinc-800 font-medium"
              segments={[
                { t: '"I paste a job description and Rezoomed tells me exactly what\'s missing. The tailor feature ' },
                { t: 'did almost all the work', em: true },
                { t: ' — I just reviewed and hit submit. Landed a $40k raise switching companies."' },
              ]}
            />
            <Attribution name="Sarah Jenkins" role="Senior Product Manager · Stripe" />
          </Card>

        </div>
      </div>
    </section>
  )
}
