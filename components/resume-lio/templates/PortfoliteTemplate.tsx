'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, MapPin, Mail, Phone, GraduationCap, Award } from 'lucide-react'
import { contactHref, fadeUp, popIn, staggerContainer, getExperienceTenure, hasAny, initials, projectDescription, projectImage, proofStats, roleLabel, skillsFor, summaryText, educationLabel } from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

const fadeUpStagger = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

export default function PortfoliteTemplate({ data, socialLinks }: TemplateProps) {
  const skills = skillsFor(data)
  const stats = proofStats(data)
  const tenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen bg-[#111] text-white overflow-x-hidden">
      <nav className="sticky top-0 z-50 px-5 py-4 bg-[#111]/90 backdrop-blur-xl border-b border-white/8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="#top" className="font-bold text-xl tracking-tight">{data.name || 'Resume'}</a>
          <div className="hidden gap-8 text-sm font-medium text-white/50 md:flex">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#experience" className="hover:text-white transition-colors">Experience</a>
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <DownloadResumeButton className="rounded-full bg-white text-black px-5 py-2 text-sm font-semibold hover:bg-white/90 transition-colors" />
        </div>
      </nav>

      <header id="top" className="px-5 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="space-y-6">
              <motion.div {...fadeUp}>
                {data.location && (
                  <p className="text-sm font-medium text-white/40 mb-3 inline-flex items-center gap-1.5">
                    <MapPin size={13} /> {data.location}
                  </p>
                )}
                <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em]">
                  {data.name || 'Your Name'}
                </h1>
                <p className="mt-4 text-2xl font-medium text-white/60">{roleLabel(data)}</p>
              </motion.div>
              <motion.p {...fadeUp} className="text-lg leading-relaxed text-white/45 max-w-xl">
                {summaryText(data)}
              </motion.p>
              <motion.div {...fadeUp} className="flex flex-wrap gap-3">
                <a
                  href={contactHref(data.email || socialLinks.email)}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-7 py-3.5 text-sm font-semibold hover:bg-white/90 transition-all"
                >
                  Get in touch <ArrowUpRight size={15} />
                </a>
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium hover:border-white/40 transition-all"
                  >
                    View LinkedIn
                  </a>
                )}
              </motion.div>
            </div>
            <motion.div {...popIn} className="flex justify-center">
              <div className="relative">
                <div className="h-56 w-56 rounded-3xl border border-white/10 bg-white/5 grid place-items-center md:h-72 md:w-72">
                  <span className="text-7xl font-bold text-white/15 md:text-8xl">{initials(data.name || '')}</span>
                </div>
                {tenure && (
                  <div className="absolute -bottom-3 -right-3 rounded-xl bg-white text-black p-4">
                    <p className="text-2xl font-bold">{tenure.label}+</p>
                    <p className="text-xs text-black/50 font-medium">Years Exp.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <section id="about" className="px-5 py-16 border-t border-white/8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <motion.div {...fadeUp} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3">About</p>
                <h2 className="text-3xl font-bold tracking-tight">Professional Summary</h2>
              </div>
              <p className="text-lg leading-relaxed text-white/55">{summaryText(data)}</p>
              {data.location && (
                <p className="text-white/40 text-sm">Based in {data.location}</p>
              )}
            </motion.div>
            <motion.div {...fadeUp} className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-4">Core Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 12).map(skill => (
                    <span key={skill} className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-white/60">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-4">Overview</h3>
                <div className="grid grid-cols-3 gap-3">
                  {stats.map(stat => (
                    <div key={stat.label} className="text-center rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-white/35 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-16 border-t border-white/8">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3">Career</p>
              <h2 className="text-3xl font-bold tracking-tight">Work Experience</h2>
            </motion.div>
            <div className="space-y-6">
              {data.experience.map((exp, index) => (
                <motion.article
                  key={`${exp.company}-${index}`}
                  {...fadeUp}
                  className="group relative pl-7 border-l border-white/10"
                >
                  <div className="absolute left-0 top-1 h-2.5 w-2.5 -translate-x-[0.375rem] rounded-full bg-white/15 group-hover:bg-white/40 transition-colors" />
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{exp.title}</h3>
                        <p className="text-white/55">{exp.company}</p>
                      </div>
                      <p className="text-sm text-white/35 shrink-0">{exp.startDate} — {exp.endDate || 'Present'}</p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-1.5 text-sm text-white/45 leading-relaxed">
                        {exp.bullets.slice(0, 4).map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-2 h-1 w-1 rounded-full bg-white/25 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.projects) && (
        <section id="projects" className="px-5 py-16 border-t border-white/8">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3">Portfolio</p>
              <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {data.projects.slice(0, 6).map((project, index) => (
                <motion.article
                  key={`${project.name}-${index}`}
                  variants={fadeUpStagger}
                  className="group rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03] hover:border-white/15 transition-all"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={projectImage(index)}
                      alt=""
                      className="h-full w-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    {projectDescription(project) && <p className="text-white/40 text-sm leading-relaxed">{projectDescription(project)}</p>}
                    {project.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies.slice(0, 3).map(tech => (
                          <span key={tech} className="text-xs text-white/30 bg-white/5 rounded px-2 py-0.5">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {hasAny(data.education) && (
        <section className="px-5 py-16 border-t border-white/8">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3">Background</p>
              <h2 className="text-3xl font-bold tracking-tight">Education</h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.education.map((edu, index) => (
                <motion.div
                  key={`${edu.institution}-${index}`}
                  {...fadeUp}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
                >
                  <GraduationCap size={18} className="text-white/25 mb-3" />
                  <h3 className="text-lg font-bold">{edu.institution}</h3>
                  <p className="text-white/50 mt-1">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                  <p className="text-sm text-white/30 mt-1">{edu.startDate} — {edu.endDate || 'Present'}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.certifications) && (
        <section className="px-5 py-12 border-t border-white/8">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl font-bold tracking-tight mb-4">Certifications</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <Award size={16} className="text-white/25 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{cert.name}</p>
                      {cert.issuer && <p className="text-xs text-white/35 mt-0.5">{cert.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <footer id="contact" className="px-5 py-16 border-t border-white/8">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3">Contact</p>
              <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
              <p className="text-lg text-white/45 mt-4 max-w-md">
                Open to new opportunities and collaborations. Let&apos;s connect.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {(data.email || socialLinks.email) && (
                  <a href={`mailto:${data.email || socialLinks.email}`} className="inline-flex items-center gap-2.5 text-white/60 hover:text-white transition-colors">
                    <Mail size={17} className="text-white/30" />
                    {data.email || socialLinks.email}
                  </a>
                )}
                {data.phone && (
                  <a href={`tel:${data.phone}`} className="inline-flex items-center gap-2.5 text-white/60 hover:text-white transition-colors">
                    <Phone size={17} className="text-white/30" />
                    {data.phone}
                  </a>
                )}
                {data.location && (
                  <span className="inline-flex items-center gap-2.5 text-white/60">
                    <MapPin size={17} className="text-white/30" />
                    {data.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-end gap-5">
              <SocialLinksBar links={socialLinks} className="gap-5" iconClassName="text-white/40 hover:text-white/70" textClassName="text-sm text-white/40 hover:text-white/70" />
              <a
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-7 py-3.5 text-sm font-semibold hover:bg-white/90 transition-all mt-2"
              >
                Send a message <ArrowUpRight size={15} />
              </a>
            </div>
          </motion.div>
          <div className="mt-12 pt-6 border-t border-white/8 text-center">
            <p className="text-white/20 text-sm">&copy; {new Date().getFullYear()} {data.name}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
