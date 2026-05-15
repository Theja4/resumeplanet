'use client'

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { getResumeSkills } from '@/lib/resume-data'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function TemplatePortez({ data, socialLinks }: TemplateProps) {
  const skills = getResumeSkills(data)
  const firstName = data.name?.split(' ')[0] || 'You'

  return (
    <div className="min-h-screen w-full bg-[#0c0c0e] text-white selection:bg-indigo-500/30">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-12 pb-24 md:px-16 md:pt-20 md:pb-40">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        
        <div className="relative mx-auto max-w-6xl">
          <nav className="mb-20 flex items-center justify-between">
            <span className="text-lg font-bold tracking-tight">{firstName}.</span>
            <div className="flex items-center gap-6">
              <SocialLinksBar links={socialLinks} className="gap-4" iconClassName="text-white/50" textClassName="text-white/50 hover:text-white text-sm" />
            </div>
          </nav>

          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Open to work
            </div>
            
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              {data.currentRole || 'Software Engineer'} building{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                digital products
              </span>{' '}
              that scale.
            </h1>
            
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
              {data.summary || "I craft performant, accessible, and delightful user experiences. Currently focused on full-stack development and system architecture."}
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              {data.email && (
                <a href={`mailto:${data.email}`} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  Get in Touch
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              )}
              {socialLinks.github && (
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
                  View GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 px-6 py-12 md:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="text-3xl font-bold text-white md:text-4xl">{data.experience.length}+</p>
            <p className="mt-1 text-sm text-white/40">Years Experience</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white md:text-4xl">{data.projects.length}+</p>
            <p className="mt-1 text-sm text-white/40">Projects Shipped</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white md:text-4xl">{skills.length}+</p>
            <p className="mt-1 text-sm text-white/40">Tech Skills</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white md:text-4xl">{data.certifications.length}</p>
            <p className="mt-1 text-sm text-white/40">Certifications</p>
          </div>
        </div>
      </section>

      {/* What I Do */}
      <section className="px-6 py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">What I Do</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { title: 'Frontend Architecture', desc: 'Building scalable component systems, design systems, and performant UIs with modern frameworks.', icon: '🎨' },
              { title: 'Backend Systems', desc: 'Designing APIs, databases, and microservices that handle millions of requests reliably.', icon: '⚡' },
              { title: 'Product Engineering', desc: 'Translating business needs into technical solutions that users genuinely love.', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition hover:border-white/10 hover:bg-white/[0.04]">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      {data.projects.length > 0 && (
        <section className="px-6 py-24 md:px-16 md:py-32 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">Featured Work</h2>
                <p className="mt-2 text-white/50">Selected projects I have built.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {data.projects.map((proj, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent p-8 transition hover:border-white/10">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition group-hover:bg-indigo-500/20" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-lg">
                        {['🔧','🛠️','⚙️','🔩','⚡','🎯'][i % 6]}
                      </span>
                      <h3 className="text-xl font-semibold">{proj.name}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/50">{proj.description || 'A project built with modern technologies, focusing on performance and user experience.'}</p>
                    {proj.technologies.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {proj.technologies.map((t) => (
                          <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Timeline */}
      {data.experience.length > 0 && (
        <section className="px-6 py-24 md:px-16 md:py-32">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">Experience</h2>
            <div className="mt-12 space-y-8">
              {data.experience.map((exp, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12 group">
                  <div className="md:w-48 shrink-0">
                    <p className="text-sm text-white/30 font-mono">{exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ''}</p>
                  </div>
                  <div className="flex-1 border-l border-white/5 md:border-l-0 md:border-t md:pt-8 pb-8">
                    <h3 className="text-lg font-semibold">{exp.title}</h3>
                    <p className="mt-1 text-sm text-indigo-400">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    {exp.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="text-sm text-white/40 leading-relaxed">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skills Cloud */}
      {skills.length > 0 && (
        <section className="px-6 py-24 md:px-16 md:py-32 border-y border-white/5">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">Tech Stack</h2>
            <div className="mt-12 flex flex-wrap gap-3">
              {skills.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:border-indigo-500/30 hover:text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-24 md:px-16 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
            Let&apos;s build something{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">amazing</span>{' '}
            together.
          </h2>
          <p className="mt-6 text-lg text-white/40">
            {data.email ? `Reach me at ${data.email}` : 'Open to new opportunities and collaborations.'}
          </p>
          <div className="mt-10">
            <SocialLinksBar links={socialLinks} className="justify-center gap-6" iconClassName="text-white/40" textClassName="text-white/40 hover:text-white" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 md:px-16">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">{data.name} · {data.currentRole}</p>
          <p className="text-xs text-white/20">Built with Resume Lio</p>
        </div>
      </footer>
    </div>
  )
}
