'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, GraduationCap, Award, MapPin } from 'lucide-react'
import { contactHref, fadeUp, firstName, getExperienceTenure, hasAny, initials, projectDescription, projectImage, roleLabel, skillsFor, summaryText } from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
}

export default function WelvetTemplate({ data, socialLinks }: TemplateProps) {
  const skills = skillsFor(data)
  const tenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen bg-[#efebe2] text-[#171411]">
      <nav className="px-5 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <a href="#top" className="text-xl font-semibold tracking-tight">{data.name || 'Profile'}</a>
          <div className="flex gap-5 text-black/45">
            <a href="#experience" className="hover:text-black transition-colors">Experience</a>
            <a href="#about" className="hover:text-black transition-colors">About</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      <header id="top" className="px-5 pb-16 pt-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <motion.div {...fadeUp}>
            <p className="text-sm uppercase tracking-[0.2em] text-black/30 mb-3">{roleLabel(data)}</p>
            <h1 className="text-[clamp(3.5rem,10vw,9rem)] font-medium leading-[0.85] tracking-[-0.06em]">{data.name || 'Your Name'}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-black/50">{summaryText(data)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/30">
              {data.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {data.location}</span>}
              {tenure?.isExperienced && <span>{tenure.label}+ years experience</span>}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#171411] px-6 py-3 text-sm font-semibold text-white">Get in touch <ArrowUpRight size={15} /></a>
              <DownloadResumeButton className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium hover:bg-black/5 transition-colors" />
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="flex justify-center">
            <div className="grid h-52 w-52 place-items-center rounded-full border border-black/6 bg-[#e4dfd6] md:h-64 md:w-64">
              <span className="text-5xl font-medium text-[#171411]/12 md:text-6xl">{initials(data.name || '')}</span>
            </div>
          </motion.div>
        </div>
      </header>

      {hasAny(data.experience) && (
        <section id="experience" className="border-y border-black/8 px-5 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[220px_1fr]">
            <div>
              <h2 className="text-3xl font-medium">Experience</h2>
            </div>
            <div className="divide-y divide-black/8">
              {data.experience.map((exp, index) => (
                <motion.article key={`${exp.company}-${index}`} {...fadeUp} className="py-5">
                  <div className="grid gap-2 md:grid-cols-[1fr_160px]">
                    <div>
                      <h3 className="text-xl font-medium">{exp.title}</h3>
                      <p className="text-sm text-black/45">{exp.company}</p>
                    </div>
                    <p className="text-sm text-black/30">{exp.startDate} — {exp.endDate || 'Present'}</p>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm text-black/45 leading-relaxed">
                      {exp.bullets.slice(0, 3).map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-black/15 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasAny(data.projects) && (
        <section className="px-5 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[220px_1fr]">
            <div>
              <h2 className="text-3xl font-medium">Projects</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, index) => (
                <motion.article key={`${project.name}-${index}`} {...fadeUp} className="group rounded-2xl bg-white p-4 shadow-sm">
                  <div className="overflow-hidden rounded-xl">
                    <img src={projectImage(index)} alt="" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-medium">{project.name}</h3>
                    {projectDescription(project) && <p className="mt-1.5 text-sm leading-relaxed text-black/45">{projectDescription(project)}</p>}
                    {project.technologies?.length > 0 && (
                      <p className="mt-2 text-xs text-black/30">{project.technologies.slice(0, 3).join(' • ')}</p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="about" className="px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[220px_1fr]">
          <div>
            <h2 className="text-3xl font-medium">About</h2>
          </div>
          <div className="space-y-8">
            {skills.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/30 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => <span key={skill} className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-black/50">{skill}</span>)}
                </div>
              </div>
            )}

            {hasAny(data.education) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/30 mb-3">Education</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {data.education.map((edu, index) => (
                    <div key={`${edu.institution}-${index}`} className="rounded-lg border border-black/6 bg-white p-4">
                      <GraduationCap size={16} className="text-black/20 mb-1.5" />
                      <h4 className="font-medium text-sm">{edu.institution}</h4>
                      <p className="text-sm text-black/40">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasAny(data.certifications) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/30 mb-3">Certifications</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {data.certifications.map((cert, index) => (
                    <div key={`cert-${index}`} className="flex items-start gap-2 rounded-lg border border-black/6 bg-white p-3.5">
                      <Award size={14} className="text-black/20 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{cert.name}</p>
                        {cert.issuer && <p className="text-xs text-black/35">{cert.issuer}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasAny(data.languages) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/30 mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {data.languages.map((lang, index) => (
                    <span key={index} className="rounded-full border border-black/8 bg-white px-4 py-1.5 text-sm text-black/45">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#171411] px-5 py-16 text-[#efebe2]">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-medium tracking-tight md:text-5xl">Let&apos;s connect</h2>
          <p className="mt-3 text-[#efebe2]/45 text-lg max-w-md">Open to discussing new opportunities and collaborations.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-white text-[#171411] px-6 py-3 text-sm font-semibold">
              Get in touch <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="mt-6"><SocialLinksBar links={socialLinks} className="gap-5" iconClassName="text-[#efebe2]/45" textClassName="text-sm text-[#efebe2]/55 hover:text-[#efebe2]" /></div>
        </div>
      </footer>
    </div>
  )
}
