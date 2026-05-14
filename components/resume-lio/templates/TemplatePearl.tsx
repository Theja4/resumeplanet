'use client'

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { getResumeSkills } from '@/lib/resume-data'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function TemplatePearl({ data, socialLinks }: TemplateProps) {
  const skills = getResumeSkills(data)
  const firstName = data.name?.split(' ')[0] || 'You'

  return (
    <div className="min-h-screen w-full bg-[#f5f0eb] text-[#2c241b]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {/* Navigation */}
      <nav className="px-6 py-6 md:px-16">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-base font-medium italic tracking-wide">{firstName}.</span>
          <div className="flex items-center gap-6">
            <SocialLinksBar links={socialLinks} className="gap-5 hidden sm:flex" iconClassName="text-[#8c7b6b]" textClassName="text-[#8c7b6b] hover:text-[#2c241b] text-sm" />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-8 pb-20 md:px-16 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-[2fr_1fr] md:items-end">
            <div>
              <p className="text-sm text-[#8c7b6b] mb-4 tracking-wide">{data.currentRole || 'Creative Technologist'}</p>
              <h1 className="text-5xl font-normal leading-[1.1] md:text-7xl lg:text-8xl" style={{ fontFamily: 'Georgia, serif' }}>
                {data.name || 'Your Name'}
              </h1>
            </div>
            <div className="md:text-right">
              <p className="text-base leading-relaxed text-[#6b5d4f] max-w-sm md:ml-auto">
                {data.summary || 'Crafting thoughtful digital experiences at the intersection of design and technology.'}
              </p>
              {data.email && (
                <a href={`mailto:${data.email}`} className="mt-6 inline-block text-sm underline underline-offset-4 decoration-[#c4b5a0] hover:decoration-[#2c241b] transition-colors">
                  {data.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="mx-auto max-w-6xl px-6 md:px-16">
        <div className="h-px bg-[#d4c8b8]" />
      </div>

      {/* Stats */}
      <section className="px-6 py-16 md:px-16 md:py-24">
        <div className="mx-auto max-w-6xl grid grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-4xl font-light md:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>{data.experience.length}+</p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[#8c7b6b]">Years</p>
          </div>
          <div className="text-center border-x border-[#d4c8b8]">
            <p className="text-4xl font-light md:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>{data.projects.length}+</p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[#8c7b6b]">Projects</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light md:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>{skills.length}+</p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[#8c7b6b]">Skills</p>
          </div>
        </div>
      </section>

      {/* Selected Work */}
      {data.projects.length > 0 && (
        <section className="px-6 py-20 md:px-16 md:py-28 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-baseline justify-between mb-12">
              <h2 className="text-2xl font-normal md:text-3xl" style={{ fontFamily: 'Georgia, serif' }}>Selected Work</h2>
              <span className="text-xs uppercase tracking-[0.15em] text-[#8c7b6b]">{data.projects.length} Projects</span>
            </div>
            <div className="space-y-16">
              {data.projects.map((proj, i) => (
                <div key={i} className="group grid gap-8 md:grid-cols-[1fr_400px] md:items-center">
                  <div className="order-2 md:order-1">
                    <span className="text-xs uppercase tracking-[0.15em] text-[#8c7b6b]">
                      {proj.technologies.slice(0, 3).join(' · ') || 'Project'}
                    </span>
                    <h3 className="mt-3 text-2xl font-normal md:text-3xl" style={{ fontFamily: 'Georgia, serif' }}>{proj.name}</h3>
                    <p className="mt-4 text-base leading-relaxed text-[#6b5d4f]">{proj.description || 'A thoughtful approach to solving real problems through design and engineering.'}</p>
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul className="mt-6 space-y-3">
                        {proj.bullets.map((b, j) => (
                          <li key={j} className="text-sm text-[#8c7b6b] leading-relaxed border-l border-[#d4c8b8] pl-4">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="order-1 md:order-2">
                    <div 
                      className="aspect-[4/3] rounded-lg border border-[#e8e0d6] bg-[#f5f0eb] flex items-center justify-center transition group-hover:border-[#c4b5a0]"
                      style={{ backgroundColor: ['#f0ebe5', '#ebe5dd', '#f5efe8', '#ede8e0'][i % 4] }}
                    >
                      <span className="text-6xl opacity-30">{['✦','◈','◉','✶','◆','◇'][i % 6]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Philosophy / What I Do */}
      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-2xl font-normal" style={{ fontFamily: 'Georgia, serif' }}>Approach</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {[
                { title: 'Strategy', desc: 'Understanding the problem deeply before proposing solutions. Research-driven decisions.' },
                { title: 'Design', desc: 'Crafting interfaces that feel intuitive. Every pixel serves a purpose.' },
                { title: 'Engineering', desc: 'Building with modern tools while keeping maintainability and performance in mind.' },
                { title: 'Collaboration', desc: 'Working closely with teams to align vision, execution, and business outcomes.' },
              ].map((item, i) => (
                <div key={i}>
                  <h3 className="text-base font-medium mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#6b5d4f]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="px-6 py-20 md:px-16 md:py-28 bg-white">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-normal mb-12" style={{ fontFamily: 'Georgia, serif' }}>Experience</h2>
            <div className="space-y-0">
              {data.experience.map((exp, i) => (
                <div key={i} className="group flex flex-col md:flex-row md:items-baseline gap-2 md:gap-12 border-t border-[#e8e0d6] py-8">
                  <div className="md:w-48 shrink-0">
                    <p className="text-xs text-[#8c7b6b] tracking-wide">{exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ''}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{exp.title}</h3>
                    <p className="text-sm text-[#8c7b6b] mt-1">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="px-6 py-20 md:px-16 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-normal mb-12" style={{ fontFamily: 'Georgia, serif' }}>Capabilities</h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((s) => (
                <span key={s} className="rounded-full border border-[#d4c8b8] bg-white px-5 py-2 text-sm text-[#6b5d4f]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20 md:px-16 md:py-32 bg-[#2c241b] text-[#f5f0eb]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-normal md:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>
            Let&apos;s create something meaningful together.
          </h2>
          <p className="mt-6 text-base text-[#a89888]">
            {data.email || 'Open to collaborations and new opportunities.'}
          </p>
          <div className="mt-8 flex justify-center">
            <SocialLinksBar links={socialLinks} className="gap-6" iconClassName="text-[#a89888]" textClassName="text-[#a89888] hover:text-[#f5f0eb]" />
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 md:px-16">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#8c7b6b]">{data.name} · {data.currentRole}</p>
          <p className="text-xs text-[#a89888]">Built with Resume Lio</p>
        </div>
      </footer>
    </div>
  )
}
