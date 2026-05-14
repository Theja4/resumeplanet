'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, GraduationCap, Award } from 'lucide-react'
import { contactHref, fadeUp, firstName, getExperienceTenure, hasAny, initials, projectDescription, projectImage, roleLabel, skillsFor, summaryText, educationLabel } from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function StelvioTemplate({ data, socialLinks }: TemplateProps) {
  const skills = skillsFor(data)
  const tenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen bg-[#080808] text-[#f4f0e8]">
      <nav className="sticky top-0 z-50 px-5 py-5 bg-[#080808]/90 backdrop-blur-xl border-b border-white/6">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm font-medium">
          <a href="#top" className="text-white/90">{data.name || 'Profile'}</a>
          <div className="hidden gap-7 text-white/40 md:flex">
            <a href="#experience" className="hover:text-white transition-colors">Experience</a>
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <DownloadResumeButton className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 hover:bg-white hover:text-black transition-all" />
        </div>
      </nav>

      <header id="top" className="px-5 pb-16 pt-20 md:pt-28">
        <div className="mx-auto max-w-6xl">
          <motion.p {...fadeUp} className="text-sm uppercase tracking-[0.24em] text-white/35">{roleLabel(data)}</motion.p>
          <motion.h1 {...fadeUp} className="mt-4 max-w-5xl text-[clamp(3.5rem,11vw,9rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
            {data.name || 'Your Name'}
          </motion.h1>
          <motion.div {...fadeUp} className="mt-8 grid gap-6 md:grid-cols-[1fr_0.7fr]">
            <p className="max-w-2xl text-xl leading-9 text-white/55">{summaryText(data)}</p>
            <div className="space-y-3 text-sm text-white/40">
              {tenure?.isExperienced && <p className="border-t border-white/10 pt-3">{tenure.label}+ years experience</p>}
              {data.location && <p className="border-t border-white/10 pt-3">{data.location}</p>}
              {skills.length > 0 && <p className="border-t border-white/10 pt-3">{skills.slice(0, 4).join(' / ')}</p>}
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="mt-8 flex flex-wrap gap-3">
            <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white hover:bg-white hover:text-black transition-all">
              Get in touch <ArrowUpRight size={15} />
            </a>
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-white/50 hover:border-white/25 transition-all">
                LinkedIn
              </a>
            )}
          </motion.div>
        </div>
      </header>

      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-16 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/30 mb-2">Career</p>
              <h2 className="text-4xl font-semibold tracking-tight">Experience</h2>
            </motion.div>
            <div className="space-y-1">
              {data.experience.map((exp, index) => (
                <motion.article key={`${exp.company}-${index}`} {...fadeUp} className="group border-t border-white/8 py-6">
                  <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
                    <div>
                      <p className="text-xs text-white/30">{exp.startDate} — {exp.endDate || 'Present'}</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight">{exp.title}</h3>
                      <p className="mt-1 text-sm text-white/45">{exp.company}</p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-1.5 text-sm leading-relaxed text-white/40">
                        {exp.bullets.slice(0, 3).map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-2 h-1 w-1 rounded-full bg-white/20 shrink-0" />
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

      {skills.length > 0 && (
        <section className="px-5 py-14 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Skills</h2>
            </motion.div>
            <motion.div {...fadeUp} className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50">{skill}</span>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {hasAny(data.projects) && (
        <section id="projects" className="px-5 py-16 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/30 mb-2">Portfolio</p>
              <h2 className="text-4xl font-semibold tracking-tight">Projects</h2>
            </motion.div>
            <div className="grid gap-5">
              {data.projects.slice(0, 6).map((item, index) => (
                <motion.article key={`${item.name}-${index}`} {...fadeUp} className="group grid gap-5 border-t border-white/8 py-6 md:grid-cols-[0.5fr_1.5fr]">
                  <div>
                    <p className="text-sm text-white/25">0{index + 1}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">{item.name}</h3>
                  </div>
                  <div className="overflow-hidden rounded-[1.5rem] bg-white/5">
                    <img src={projectImage(index + 3)} alt="" className="aspect-[16/9] w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
                    <div className="p-5">
                      {projectDescription(item) && <p className="text-sm leading-relaxed text-white/45">{projectDescription(item)}</p>}
                      {item.technologies?.length > 0 && <p className="mt-3 text-xs uppercase tracking-[0.15em] text-white/25">{item.technologies.slice(0, 4).join(' / ')}</p>}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.education) && (
        <section className="px-5 py-14 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Education</h2>
            </motion.div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.education.map((edu, index) => (
                <motion.div key={`${edu.institution}-${index}`} {...fadeUp} className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                  <GraduationCap size={17} className="text-white/20 mb-2" />
                  <h3 className="font-semibold">{edu.institution}</h3>
                  <p className="text-sm text-white/45 mt-0.5">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                  <p className="text-xs text-white/25 mt-1">{edu.startDate} — {edu.endDate || 'Present'}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.certifications) && (
        <section className="px-5 py-10 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Certifications</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-white/[0.02] p-3.5">
                    <Award size={14} className="text-white/20 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{cert.name}</p>
                      {cert.issuer && <p className="text-xs text-white/30">{cert.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <footer id="contact" className="px-5 py-16 border-t border-white/6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">Open to new opportunities.</h2>
            <p className="mt-3 text-white/40 max-w-md">Let&apos;s discuss how I can contribute to your team.</p>
          </div>
          <div className="space-y-4">
            <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-all">
              Contact me <ArrowUpRight size={15} />
            </a>
            <SocialLinksBar links={socialLinks} className="gap-5" iconClassName="text-white/40" textClassName="text-sm text-white/45 hover:text-white" />
          </div>
        </div>
      </footer>
    </div>
  )
}
