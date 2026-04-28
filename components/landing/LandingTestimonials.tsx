'use client'

type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
  color: string
  featured: boolean
  proof: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I applied to 8 companies and got 6 callbacks. The tailoring feature alone is worth it — it's like having a career coach on demand.",
    name: 'Priya Sharma',
    role: 'Data scientist',
    initials: 'PS',
    color: 'from-[#dbeafe] to-[#93c5fd]',
    featured: true,
    proof: 'Shared after resume tailoring + ATS scan',
  },
  {
    quote: "The AI identified achievements I hadn't even thought to include. The ATS score jumped from 62% to 94% on my first try.",
    name: 'Marcus Kane',
    role: 'Marketing lead',
    initials: 'MK',
    color: 'from-[#ffe8bd] to-[#f5c87a]',
    featured: false,
    proof: 'Shared after first resume upload',
  },
  {
    quote: "Rezoomed didn't just fix my resume — it helped me understand my own worth. I landed a Senior Role within two weeks.",
    name: 'Sarah Jenkins',
    role: 'Product designer',
    initials: 'SJ',
    color: 'from-[#A3FFB3] to-[#80da92]',
    featured: false,
    proof: 'Shared after resume rewrite',
  },
  {
    quote: "Switched from Jobscan. Night and day difference. Rezoomed actually shows you what to fix, not just a score.",
    name: "James O'Brien",
    role: 'Engineering manager',
    initials: 'JO',
    color: 'from-[#fce7f3] to-[#f9a8d4]',
    featured: false,
    proof: 'Compared after ATS review',
  },
  {
    quote: "I was skeptical about AI resume tools, but Rezoomed surfaced keywords I'd never have thought to include. Got an offer 3 weeks later.",
    name: 'Aisha Thompson',
    role: 'UX researcher',
    initials: 'AT',
    color: 'from-[#d1fae5] to-[#6ee7b7]',
    featured: false,
    proof: 'Shared after job-description tailoring',
  },
  {
    quote: "Applied to 12 roles, heard back from 9. My recruiter actually complimented my resume format — that's never happened before.",
    name: 'Daniel Park',
    role: 'Software engineer',
    initials: 'DP',
    color: 'from-[#ede9fe] to-[#c4b5fd]',
    featured: false,
    proof: 'Shared after export + submit workflow',
  },
  {
    quote: "The tailor feature is insane. I paste a job description and it tells me exactly what's missing. Interviews went from 10% to 60% callback rate.",
    name: 'Leila Nasser',
    role: 'Product manager',
    initials: 'LN',
    color: 'from-[#fff7ed] to-[#fed7aa]',
    featured: false,
    proof: 'Shared after repeated ATS checks',
  },
  {
    quote: "I used three other tools before this. Rezoomed is the only one that felt like it actually understood what recruiters are looking for.",
    name: 'Ryan Okafor',
    role: 'Operations lead',
    initials: 'RO',
    color: 'from-[#fef9c3] to-[#fde047]',
    featured: false,
    proof: 'Shared after resume review + export',
  },
]

export default function LandingTestimonials() {
  return (
    <section className="py-24 md:py-28 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8faf9 100%)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">User feedback</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.06] text-zinc-950">
            Quiet wins from <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">real job seekers.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-zinc-600 leading-relaxed">
            Feedback shared after uploads, ATS scans, and tailoring flows. Identity kept light on the public page.
          </p>
        </div>
      </div>

      <div className="testimonial-mask">
        <div className="testimonial-track flex w-max gap-6 px-6">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className={`w-[300px] sm:w-[340px] shrink-0 rounded-3xl p-7 flex flex-col justify-between space-y-5 ${
                t.featured
                  ? 'bg-gradient-to-br from-[#00a84d] via-[#019a47] to-[#026d32] border border-[#026d32] shadow-[0_30px_60px_-20px_rgba(2,109,50,0.5)]'
                  : 'bg-white border border-zinc-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                    t.featured ? 'bg-white/20 text-white' : 'bg-[#A3FFB3]/30 text-[#026d32]'
                  }`}>
                    Early user
                  </span>
                </div>
                <p className={`text-base leading-7 ${t.featured ? 'text-white/95' : 'text-zinc-700'}`}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className={`flex items-center gap-3 pt-2 border-t ${t.featured ? 'border-white/20' : 'border-zinc-100'}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${t.featured ? 'bg-white/20 text-white' : `bg-gradient-to-br ${t.color} text-zinc-800`}`}>
                  {t.initials}
                </div>
                <div>
                  <p className={`text-sm font-black ${t.featured ? 'text-white' : 'text-zinc-900'}`}>{t.name}</p>
                  <p className={`text-xs ${t.featured ? 'text-white/70' : 'text-zinc-500'}`}>{t.role}</p>
                  <p className={`mt-1 text-[11px] ${t.featured ? 'text-white/70' : 'text-zinc-400'}`}>{t.proof}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
