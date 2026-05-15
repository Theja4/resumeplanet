'use client'

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { getResumeSkills } from '@/lib/resume-data'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function TemplatePortfolite({ data, socialLinks }: TemplateProps) {
  const skills = getResumeSkills(data)
  const firstName = data.name?.split(' ')[0] || 'You'

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-[#171717] selection:bg-emerald-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200/50 bg-[#fafafa]/80 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">{firstName}.</span>
          <div className="flex items-center gap-6">
            <SocialLinksBar links={socialLinks} className="gap-4 hidden sm:flex" iconClassName="text-neutral-400" textClassName="text-neutral-500 hover:text-neutral-900 text-sm" />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 md:px-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 md:grid-cols-[1fr_360px] md:items-center">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-neutral-300" />
                <span className="text-sm text-neutral-500">{data.currentRole || 'Product Manager'}</span>
              </div>
              
              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                Turning complex problems into{' '}
                <span className="text-emerald-600">simple solutions.</span>
              </h1>
              
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-neutral-500">
                {data.summary || "I bridge the gap between user needs and business goals. Currently shipping products that help teams work smarter, not harder."}
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                {data.email && (
                  <a href={`mailto:${data.email}`} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
                    Let&apos;s Talk
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
            
            {/* Quick stats card */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">📊</div>
                  <div>
                    <p className="text-2xl font-bold">{data.experience.length}+</p>
                    <p className="text-xs text-neutral-500">Years in Product</p>
                  </div>
                </div>
                <div className="h-px bg-neutral-100" />
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">🚀</div>
                  <div>
                    <p className="text-2xl font-bold">{data.projects.length}+</p>
                    <p className="text-xs text-neutral-500">Products Shipped</p>
                  </div>
                </div>
                <div className="h-px bg-neutral-100" />
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">⭐</div>
                  <div>
                    <p className="text-2xl font-bold">{skills.length}+</p>
                    <p className="text-xs text-neutral-500">Skills Mastered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-6 py-20 md:px-16 md:py-28 border-y border-neutral-100">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">What I Bring</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { title: 'Product Strategy', desc: 'Defining roadmaps, prioritizing features, and aligning stakeholders around a shared vision.', icon: '🎯' },
              { title: 'User Research', desc: 'Conducting interviews, analyzing behavior, and translating insights into actionable product decisions.', icon: '🔍' },
              { title: 'Go-to-Market', desc: 'Launching products with positioning, messaging, and growth strategies that drive adoption.', icon: '📈' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 bg-white p-8 transition hover:shadow-lg hover:shadow-neutral-100/50">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies / Projects */}
      {data.projects.length > 0 && (
        <section className="px-6 py-20 md:px-16 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">Case Studies</h2>
            <div className="mt-10 space-y-8">
              {data.projects.map((proj, i) => (
                <div key={i} className="group grid gap-8 rounded-3xl border border-neutral-100 bg-white p-8 md:grid-cols-[1fr_280px] md:p-10 transition hover:border-neutral-200">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                        {['📱','💻','🌐','📊','⚙️','🔧'][i % 6]}
                      </span>
                      <h3 className="text-xl font-semibold">{proj.name}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-600">{proj.description || 'A product initiative focused on solving real user problems through thoughtful design and iterative development.'}</p>
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {proj.bullets.slice(0, 3).map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-neutral-500">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    {proj.technologies.length > 0 && (
                      <div className="rounded-2xl bg-neutral-50 p-6">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-3">Tools & Tech</p>
                        <div className="flex flex-wrap gap-2">
                          {proj.technologies.map((t) => (
                            <span key={t} className="rounded-lg bg-white border border-neutral-100 px-3 py-1 text-xs text-neutral-600">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="px-6 py-20 md:px-16 md:py-28 bg-white">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">Career Journey</h2>
            <div className="mt-10 space-y-0">
              {data.experience.map((exp, i) => (
                <div key={i} className="group border-l-2 border-neutral-100 pl-8 pb-10 last:pb-0 relative">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-emerald-400" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <h3 className="text-lg font-semibold">{exp.title}</h3>
                    <span className="text-xs text-neutral-400 font-mono">{exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ''}</span>
                  </div>
                  <p className="text-sm text-emerald-600 mt-1">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {exp.bullets.slice(0, 2).map((b, j) => (
                        <li key={j} className="text-sm text-neutral-500">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="px-6 py-20 md:px-16 md:py-28 border-y border-neutral-100">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">Toolkit</h2>
            <div className="mt-10 flex flex-wrap gap-3">
              {skills.map((s) => (
                <span key={s} className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-neutral-700 transition hover:border-emerald-300 hover:text-emerald-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20 md:px-16 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Ready to build the next{' '}
            <span className="text-emerald-600">big thing?</span>
          </h2>
          <p className="mt-6 text-lg text-neutral-500">
            {data.email ? `Shoot me an email at ${data.email}` : "I'm always excited to discuss new ideas and opportunities."}
          </p>
          <div className="mt-8 flex justify-center">
            <SocialLinksBar links={socialLinks} className="gap-5" iconClassName="text-neutral-400" textClassName="text-neutral-500 hover:text-neutral-900" />
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 px-6 py-8 md:px-16">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-400">{data.name} · {data.currentRole}</p>
          <p className="text-xs text-neutral-300">Built with Resume Lio</p>
        </div>
      </footer>
    </div>
  )
}
