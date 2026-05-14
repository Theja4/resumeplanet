'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react'
import {
  contactHref,
  fadeUp,
  popIn,
  firstName,
  getExperienceTenure,
  hasAny,
  initials,
  projectDescription,
  projectImage,
  proofStats,
  roleLabel,
  skillsFor,
  summaryText,
  capabilityCards,
  educationLabel,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

/* ── Stat Icon SVGs (matching the blue-tinted icon style) ─────── */

function CampaignIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function ProjectIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  )
}

function SkillIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ServiceSVG({ index }: { index: number }) {
  const icons = [
    <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>,
    <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>,
    <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
  ]
  return icons[index % icons.length]
}

const STAT_ICONS = [CampaignIcon, ProjectIcon, SkillIcon]

/* ── Main Template ───────────────────────────────────────────────── */

export default function VeloraTemplate({ data, socialLinks }: TemplateProps) {
  const name = data.name || 'Your Name'
  const skills = skillsFor(data)
  const stats = proofStats(data)
  const tenure = getExperienceTenure(data.experience)
  const capabilities = capabilityCards(data)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f5f0] text-[#171717]">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#f7f5f0]/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <a href="#top" className="text-base font-semibold capitalize tracking-tight">{name}</a>
          <div className="hidden items-center gap-6 text-sm md:flex">
            <a href="#experience" className="text-[#737373] hover:text-[#171717] transition-colors">Experience</a>
            <a href="#projects" className="text-[#737373] hover:text-[#171717] transition-colors">Projects</a>
            <a href="#about" className="text-[#737373] hover:text-[#171717] transition-colors">About</a>
            <a href="#contact" className="text-[#737373] hover:text-[#171717] transition-colors">Contact</a>
          </div>
          <DownloadResumeButton className="rounded-[80px] bg-[#171717] px-5 py-2.5 text-sm font-medium text-[#f7f5f0]" />
        </div>
        <div className="mx-auto mt-4 max-w-5xl border-b border-[#d4d4d4]" />
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <header id="top" className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="max-w-3xl">
            <p className="text-lg text-[#737373]">Hey, I&apos;m</p>
            <h1 className="mt-2 text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.95] tracking-[-0.03em]">
              {name} <span className="inline-block">👋</span>
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-[#525252] md:text-2xl">
              Your go-to{' '}
              <span className="text-[#3e8bc2]">{roleLabel(data).toLowerCase()}</span>.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#737373]">
              {data.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {data.location}</span>}
              {tenure?.isExperienced && <span className="inline-flex items-center gap-1.5"><Briefcase size={14} /> {tenure.label}+ years experience</span>}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-[80px] bg-[#171717] px-6 py-3 text-sm font-medium text-[#f7f5f0]">
                <Mail size={15} /> Contact {firstName(data)}
              </a>
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[80px] border border-[#d4d4d4] px-6 py-3 text-sm font-medium text-[#404040] hover:bg-[#171717] hover:text-[#f7f5f0] hover:border-[#171717] transition-all">
                  LinkedIn <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <motion.p {...fadeUp} className="mb-6 text-sm text-[#737373]">My track record, see for yourself:</motion.p>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat, index) => {
              const Icon = STAT_ICONS[index % STAT_ICONS.length]
              return (
                <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.55, delay: index * 0.08 }} className="flex items-center gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[#3e8bc2]" style={{ backgroundColor: 'rgba(62, 139, 194, 0.15)' }}>
                    <Icon />
                  </div>
                  <div>
                    <p className="text-sm text-[#737373]">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Services / Capabilities (Dark) ─────────────────────── */}
      {capabilities.length > 0 && (
        <section className="bg-[#171717] px-5 py-20 text-[#f7f5f0]">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-12">
              <h2 className="text-center text-3xl font-bold leading-tight md:text-4xl">
                Helping with{' '}
                <span className="text-[#56b87d]">{roleLabel(data).toLowerCase()}</span>{' '}
                and delivery
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[#737373]">{summaryText(data)}</p>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2">
              {capabilities.slice(0, 4).map((cap, index) => (
                <motion.div key={cap.title} {...fadeUp} transition={{ duration: 0.55, delay: index * 0.06 }} className="rounded-2xl border border-[#333] p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl text-[#3e8bc2]" style={{ backgroundColor: 'rgba(62, 139, 194, 0.15)' }}>
                    <ServiceSVG index={index} />
                  </div>
                  <h3 className="text-lg font-bold text-[#f7f5f0]">{cap.title}</h3>
                  {cap.description && <p className="mt-2 text-sm leading-relaxed text-[#737373]">{cap.description}</p>}
                </motion.div>
              ))}
            </div>
            <motion.div {...fadeUp} className="mt-10 text-center">
              <a href="#experience" className="inline-flex items-center gap-2 rounded-[80px] bg-[#f7f5f0] px-7 py-3.5 text-sm font-semibold text-[#171717]">
                My Experience <ArrowUpRight size={15} />
              </a>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Experience ─────────────────────────────────────────── */}
      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-16">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Work Experience</h2>
              <p className="mt-2 text-[#737373]">My professional background and key accomplishments.</p>
            </motion.div>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <motion.div key={`${exp.company}-${index}`} {...fadeUp} className="rounded-2xl border border-[#e5e5e5] bg-white p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{exp.title}</h3>
                      <p className="text-sm text-[#3e8bc2]">{exp.company}</p>
                    </div>
                    <span className="rounded-[80px] bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#525252] whitespace-nowrap">{exp.startDate} — {exp.endDate || 'Present'}</span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-[#525252] leading-relaxed">
                      {exp.bullets.slice(0, 4).map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#3e8bc2] shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Projects ───────────────────────────────────────────── */}
      {hasAny(data.projects) && (
        <section id="projects" className="px-5 py-16">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Featured Projects</h2>
            </motion.div>
            <div className="grid gap-5 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, index) => (
                <motion.article key={`${project.name}-${index}`} {...fadeUp} className="group overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
                  <div className="overflow-hidden">
                    <img src={projectImage(index + 2)} alt="" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    {projectDescription(project) && <p className="mt-1.5 text-sm leading-relaxed text-[#525252]">{projectDescription(project)}</p>}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map(tech => (
                          <span key={tech} className="rounded-[80px] bg-[#f5f5f5] px-2.5 py-1 text-xs font-medium text-[#525252]">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About (Dark) ───────────────────────────────────────── */}
      <section id="about" className="bg-[#171717] px-5 py-20 text-[#f7f5f0]">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-start">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl font-bold md:text-4xl">But who am I?</h2>
              <h2 className="mt-1 text-3xl font-bold text-[#737373] md:text-4xl">But who am I?</h2>
              <p className="mt-6 text-lg leading-8 text-[#a3a3a3]">
                {summaryText(data)}
              </p>
              <a href={contactHref(data.email || socialLinks.email)} className="mt-6 inline-flex items-center gap-2 rounded-[80px] bg-[#f7f5f0] px-6 py-3 text-sm font-semibold text-[#171717]">
                My Projects <ArrowUpRight size={15} />
              </a>
            </motion.div>

            <motion.div {...fadeUp} className="space-y-5">
              {/* Fav Quote card */}
              <div className="rounded-2xl border border-[#333] p-6">
                <p className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-3">My Fav Quote</p>
                <p className="text-sm leading-relaxed text-[#d4d4d4]">
                  &quot;{data.experience?.[0]?.bullets?.[0] || 'Great work speaks for itself — just make it easy to find.'}&quot;
                </p>
              </div>

              {/* Location card */}
              {data.location && (
                <div className="rounded-2xl border border-[#333] p-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#737373] mb-2">Based in</p>
                  <p className="text-lg font-semibold text-[#f7f5f0]">{data.location} 📍</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Skills ─────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <section className="px-5 py-16">
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Skills &amp; Tools</h2>
            </motion.div>
            <motion.div {...fadeUp} className="flex flex-wrap gap-2.5">
              {skills.map(skill => (
                <span key={skill} className="rounded-[80px] border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm text-[#525252]">{skill}</span>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Education & Certs ──────────────────────────────────── */}
      {(hasAny(data.education) || hasAny(data.certifications)) && (
        <section className="px-5 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-2">
              {hasAny(data.education) && (
                <motion.div {...fadeUp}>
                  <h3 className="mb-4 text-lg font-bold">Education</h3>
                  <div className="space-y-3">
                    {data.education.map((edu, index) => (
                      <div key={`${edu.institution}-${index}`} className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#3e8bc2]" style={{ backgroundColor: 'rgba(62, 139, 194, 0.15)' }}>
                            <GraduationCap size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{edu.institution}</h4>
                            <p className="text-sm text-[#525252]">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                            <p className="text-xs text-[#a3a3a3] mt-0.5">{educationLabel(edu)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {hasAny(data.certifications) && (
                <motion.div {...fadeUp}>
                  <h3 className="mb-4 text-lg font-bold">Certifications</h3>
                  <div className="space-y-3">
                    {data.certifications.map((cert, index) => (
                      <div key={`cert-${index}`} className="flex items-start gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-5">
                        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#56b87d]" style={{ backgroundColor: 'rgba(86, 184, 125, 0.15)' }}>
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{cert.name}</p>
                          {cert.issuer && <p className="text-xs text-[#a3a3a3]">{cert.issuer}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}


      {/* ── Contact Footer ─────────────────────────────────────── */}
      <footer id="contact" className="bg-[#171717] px-5 py-16 text-[#f7f5f0]">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Let&apos;s work together 🤝</h2>
            <p className="mx-auto mt-3 max-w-md text-base text-[#737373]">Open to new opportunities. Feel free to reach out and let&apos;s create something great.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-[80px] bg-[#f7f5f0] px-7 py-3.5 text-sm font-semibold text-[#171717]">
                <Mail size={15} /> Send a message
              </a>
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[80px] border border-[#404040] px-6 py-3.5 text-sm font-medium text-[#a3a3a3] hover:bg-white/5 transition-colors">
                  LinkedIn <ArrowUpRight size={15} />
                </a>
              )}
            </div>
            <div className="mt-8">
              <SocialLinksBar links={socialLinks} className="justify-center gap-5" iconClassName="text-[#525252]" textClassName="text-sm text-[#525252] hover:text-[#f7f5f0] transition-colors" />
            </div>
          </motion.div>
          <div className="mx-auto mt-14 flex max-w-5xl flex-wrap items-center justify-center gap-6 border-t border-[#333] pt-8 text-sm text-[#525252]">
            <a href="#experience" className="hover:text-[#f7f5f0] transition-colors">Experience</a>
            <a href="#projects" className="hover:text-[#f7f5f0] transition-colors">Projects</a>
            <a href="#about" className="hover:text-[#f7f5f0] transition-colors">About</a>
            <a href="#contact" className="hover:text-[#f7f5f0] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
