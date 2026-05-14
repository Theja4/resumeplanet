'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, CircleDot, Mail, GraduationCap, Award, MapPin } from 'lucide-react'
import {
  contactHref,
  educationLabel,
  fadeUp,
  getExperienceTenure,
  hasAny,
  initials,
  popIn,
  projectDescription,
  projectImage,
  proofStats,
  roleLabel,
  skillsFor,
  summaryText,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function PearlTemplate({ data, socialLinks }: TemplateProps) {
  const skills = skillsFor(data)
  const stats = proofStats(data)
  const experienceTenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf6] text-[#26211d]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-[#26211d]/8 bg-[#fbfaf6]/85 px-5 py-5 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#top" className="text-base italic tracking-wide">{data.name || 'Portfolio'}</a>
          <div className="hidden gap-6 text-sm text-[#26211d]/40 md:flex" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
            <a href="#experience" className="hover:text-[#26211d] transition-colors">Experience</a>
            <a href="#projects" className="hover:text-[#26211d] transition-colors">Projects</a>
            <a href="#contact" className="hover:text-[#26211d] transition-colors">Contact</a>
          </div>
        </div>
      </motion.nav>

      <header id="top" className="px-5 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-[#9d3f2f]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
              {roleLabel(data)}
            </p>
            <h1 className="mt-5 text-[clamp(3.5rem,10vw,8rem)] font-normal leading-[0.9] tracking-[-0.04em]">
              {data.name || 'Your Name'}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-xl leading-9 text-[#26211d]/55">{summaryText(data)}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-[#26211d]/35" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
              {data.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {data.location}</span>}
              {experienceTenure?.isExperienced && <span>{experienceTenure.label}+ years experience</span>}
            </div>
            <div className="mt-7 flex justify-center gap-3">
              <a
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center gap-2 rounded-full bg-[#26211d] px-6 py-3 text-sm font-bold text-[#fbfaf6] transition hover:-translate-y-0.5"
                style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}
              >
                <Mail size={15} /> Get in touch
              </a>
              <DownloadResumeButton className="rounded-full border border-[#26211d]/12 px-6 py-3 text-sm font-medium transition hover:bg-[#26211d]/5" />
            </div>
          </motion.div>
        </div>
      </header>

      <section className="border-y border-[#26211d]/8 px-5 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.55, delay: index * 0.08 }} className="text-center">
              <p className="text-5xl font-normal tracking-tight">{stat.value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#26211d]/35" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {skills.length > 0 && (
        <section className="px-5 py-14">
          <motion.div {...fadeUp} className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-normal tracking-tight mb-5 text-center">Skills & Expertise</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {skills.map(skill => (
                <span
                  key={skill}
                  className="rounded-full border border-[#26211d]/10 bg-white px-4 py-2 text-sm text-[#26211d]/55 shadow-sm"
                  style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.65fr_1.35fr]">
            <motion.div {...fadeUp}>
              <p className="text-sm uppercase tracking-[0.25em] text-[#9d3f2f]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>Career</p>
              <h2 className="mt-3 text-4xl font-normal leading-none tracking-[-0.03em]">Experience</h2>
              {experienceTenure?.isExperienced && (
                <div className="mt-6 rounded-2xl border border-[#26211d]/8 bg-[#eee8dd] px-6 py-6 text-center">
                  <p className="text-5xl font-normal tracking-tight">{experienceTenure.label}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9d3f2f]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>years experience</p>
                </div>
              )}
            </motion.div>
            <div className="space-y-3">
              {data.experience.map((exp, index) => (
                <motion.article
                  key={`${exp.company}-${index}`}
                  {...fadeUp}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="rounded-[1.5rem] border border-[#26211d]/8 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-normal">{exp.title}</h3>
                      <p className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-[#9d3f2f]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{exp.company}</p>
                    </div>
                    <p className="text-sm text-[#26211d]/35" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{exp.startDate} — {exp.endDate || 'Present'}</p>
                  </div>
                  {exp.bullets.length > 0 && (
                    <div className="mt-4 space-y-1.5 text-sm leading-relaxed text-[#26211d]/55" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
                      {exp.bullets.slice(0, 3).map((bullet, bulletIndex) => (
                        <p key={bulletIndex} className="flex gap-2">
                          <CircleDot size={12} className="mt-1.5 shrink-0 text-[#d58b72]" />
                          <span>{bullet}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.projects) && (
        <section id="projects" className="bg-[#26211d] px-5 py-16 text-[#fbfaf6]">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-sm uppercase tracking-[0.25em] text-[#d58b72]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>Portfolio</p>
              <h2 className="mt-3 text-4xl font-normal leading-none tracking-[-0.03em]">Projects</h2>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, index) => (
                <motion.article key={`${project.name}-${index}`} {...fadeUp} transition={{ duration: 0.6, delay: index * 0.08 }} className="group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#fbfaf6]/10">
                    <img src={projectImage(index + 1)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-normal">{project.name}</h3>
                    {projectDescription(project) && (
                      <p className="mt-2 text-sm leading-relaxed text-[#fbfaf6]/50" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{projectDescription(project)}</p>
                    )}
                    {project.technologies?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map(tech => (
                          <span key={tech} className="rounded-full border border-[#fbfaf6]/12 px-3 py-1 text-xs text-[#fbfaf6]/50" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
                            {tech}
                          </span>
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

      {hasAny(data.education) && (
        <section className="bg-[#eee8dd] px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-normal tracking-tight">Education</h2>
            </motion.div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.education.map((education, index) => (
                <motion.article key={`${education.institution}-${index}`} {...fadeUp} className="rounded-2xl bg-[#fbfaf6] p-6 shadow-sm">
                  <GraduationCap size={17} className="text-[#9d3f2f]/50 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9d3f2f]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{educationLabel(education)}</p>
                  <h3 className="mt-2 text-xl font-normal">{education.institution}</h3>
                  <p className="mt-1 text-sm text-[#26211d]/50" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{education.degree}{education.field ? `, ${education.field}` : ''}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.certifications) && (
        <section className="px-5 py-12">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="text-xl font-normal tracking-tight mb-4">Certifications</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="flex items-start gap-2.5 rounded-lg border border-[#26211d]/6 bg-white p-3.5 shadow-sm">
                    <Award size={14} className="text-[#9d3f2f]/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{cert.name}</p>
                      {cert.issuer && <p className="text-xs text-[#26211d]/35" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{cert.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {hasAny(data.languages) && (
        <section className="px-5 py-10">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="text-xl font-normal tracking-tight mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {data.languages.map((lang, index) => (
                  <span key={index} className="rounded-full border border-[#26211d]/8 bg-white px-4 py-1.5 text-sm text-[#26211d]/50" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
                    {lang}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <footer id="contact" className="px-5 py-16">
        <motion.div {...fadeUp} className="mx-auto max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-[#9d3f2f]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>Contact</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-normal leading-tight tracking-[-0.03em] md:text-5xl">Let&apos;s connect</h2>
          <p className="mx-auto mt-4 max-w-md text-[#26211d]/45" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
            Open to new opportunities. Feel free to reach out.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-5">
            <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#26211d] px-6 py-3 text-sm font-bold text-[#fbfaf6]" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
              Send a message <ArrowUpRight size={15} />
            </a>
            <SocialLinksBar links={socialLinks} className="justify-center gap-5" iconClassName="text-[#26211d]/35" textClassName="text-sm text-[#26211d]/45 hover:text-[#26211d]" />
          </div>
        </motion.div>
      </footer>
    </div>
  )
}
