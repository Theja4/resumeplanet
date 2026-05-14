'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail, GraduationCap, Award, MapPin } from 'lucide-react'
import {
  contactHref,
  educationLabel,
  fadeUp,
  firstName,
  getExperienceTenure,
  hasAny,
  initials,
  projectDescription,
  projectImage,
  roleLabel,
  skillsFor,
  summaryText,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function SignalTemplate({ data, socialLinks }: TemplateProps) {
  const skills = skillsFor(data)
  const experienceTenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f1e8] text-[#171717]">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-black/8 bg-[#f4f1e8]/85 px-5 py-4 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#top" className="text-sm font-bold uppercase tracking-[0.2em]">{data.name || 'Profile'}</a>
          <div className="hidden gap-6 text-sm text-black/40 md:flex">
            <a href="#experience" className="hover:text-black transition-colors">Experience</a>
            <a href="#projects" className="hover:text-black transition-colors">Projects</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </motion.nav>

      <header id="top" className="px-5 pt-10 md:pt-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="grid gap-6 border-b border-black/8 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d83f31]">{roleLabel(data)}</p>
              <h1 className="mt-4 max-w-5xl text-[clamp(3.5rem,11vw,9rem)] font-bold leading-[0.82] tracking-[-0.06em]">
                {data.name || 'Your Name'}
              </h1>
            </div>
            <div className="max-w-sm">
              <p className="text-base leading-7 text-black/55">{summaryText(data)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-black/30">
                {data.location && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {data.location}</span>}
                {experienceTenure?.isExperienced && <span>{experienceTenure.label}+ yrs</span>}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
                  <Mail size={15} /> Contact
                </a>
                <DownloadResumeButton className="rounded-full border border-black/12 px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5" />
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 py-5 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div {...fadeUp} className="grid h-52 place-items-center rounded-[2rem] border border-black/6 bg-[#eee8dd] md:h-72">
              <div className="text-center">
                <p className="text-6xl font-bold text-[#171717]/10 md:text-8xl">{initials(data.name || '')}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-black/25">{roleLabel(data)}</p>
              </div>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <motion.div {...fadeUp} className="rounded-[2rem] bg-[#d83f31] p-6 text-white">
                <p className="mt-6 text-4xl font-bold">{experienceTenure?.isExperienced ? experienceTenure.label : data.experience.length || 0}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-white/65">
                  {experienceTenure?.isExperienced ? 'years experience' : 'roles held'}
                </p>
              </motion.div>
              <motion.div {...fadeUp} transition={{ duration: 0.65, delay: 0.08 }} className="rounded-[2rem] bg-[#ffdc5e] p-6">
                <p className="mt-6 text-4xl font-bold">{skills.length}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-black/45">skills</p>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {skills.length > 0 && (
        <section className="px-5 py-12">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
            </motion.div>
            <motion.div {...fadeUp} className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span key={skill} className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-black/55 shadow-sm">{skill}</span>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {hasAny(data.experience) && (
        <section id="experience" className="bg-[#171717] px-5 py-16 text-white md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <motion.div {...fadeUp}>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ffdc5e]">Career</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">Experience</h2>
              {experienceTenure?.isExperienced && (
                <div className="mt-6 border-y border-[#ffdc5e]/30 py-4">
                  <p className="text-5xl font-bold tracking-tight text-[#ffdc5e]">{experienceTenure.label}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/40">years experience</p>
                </div>
              )}
            </motion.div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {data.experience.map((exp, index) => (
                <motion.article key={`${exp.company}-${index}`} {...fadeUp} transition={{ duration: 0.55, delay: index * 0.06 }} className="py-6">
                  <div className="grid gap-3 md:grid-cols-[0.75fr_1.25fr]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">{exp.startDate} — {exp.endDate || 'Present'}</p>
                      <h3 className="mt-2 text-xl font-bold">{exp.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-[#ffdc5e]/80">{exp.company}</p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-1.5 text-sm leading-relaxed text-white/50">
                        {exp.bullets.slice(0, 3).map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex items-start gap-2">
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

      {hasAny(data.projects) && (
        <section id="projects" className="px-5 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2454ff]">Portfolio</p>
                <h2 className="mt-2 text-4xl font-bold tracking-tight">Projects</h2>
              </div>
            </motion.div>
            <div className="grid gap-5 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, index) => (
                <motion.article
                  key={`${project.name}-${index}`}
                  {...fadeUp}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className={`${index === 0 ? 'md:col-span-2' : ''} group overflow-hidden rounded-2xl bg-white shadow-sm`}
                >
                  <div className={`${index === 0 ? 'md:grid md:grid-cols-[1.1fr_0.9fr]' : ''}`}>
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={projectImage(index)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-col justify-between p-6">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">{project.name}</h3>
                        {projectDescription(project) && <p className="mt-2 text-sm leading-relaxed text-black/50">{projectDescription(project)}</p>}
                      </div>
                      {project.technologies?.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {project.technologies.slice(0, 5).map(tech => (
                            <span key={tech} className="rounded-full bg-[#f4f1e8] px-3 py-1 text-xs font-medium text-black/50">{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.education) && (
        <section className="px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Education</h2>
            </motion.div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.education.map((education, index) => (
                <motion.article key={`${education.institution}-${index}`} {...fadeUp} className="rounded-2xl bg-white p-6 shadow-sm">
                  <GraduationCap size={17} className="text-black/20 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d83f31]">{educationLabel(education)}</p>
                  <h3 className="mt-2 text-xl font-bold">{education.institution}</h3>
                  <p className="mt-1 text-sm text-black/50">{education.degree}{education.field ? `, ${education.field}` : ''}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.certifications) && (
        <section className="px-5 py-10">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="text-xl font-bold tracking-tight mb-4">Certifications</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="flex items-start gap-2.5 rounded-lg bg-white p-3.5 shadow-sm">
                    <Award size={14} className="text-[#d83f31]/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">{cert.name}</p>
                      {cert.issuer && <p className="text-xs text-black/40">{cert.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <footer id="contact" className="px-5 pb-10">
        <motion.div {...fadeUp} className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#2454ff] p-8 text-white md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Contact</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">Interested in working together?</h2>
              <p className="mt-3 text-white/55 max-w-md">I&apos;m open to new opportunities and would love to hear from you.</p>
            </div>
            <div className="space-y-4">
              <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-white text-[#2454ff] px-6 py-3 text-sm font-bold">
                Get in touch <ArrowUpRight size={15} />
              </a>
              <SocialLinksBar links={socialLinks} className="gap-4" iconClassName="text-white/55" textClassName="text-sm font-semibold text-white/65 hover:text-white" />
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  )
}
