'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail, MapPin, GraduationCap, Award, Briefcase } from 'lucide-react'
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

/* ── Capability card colors (rotating) ─────────────────────────── */
const CARD_COLORS = [
  'bg-[#c8f7a0]', // lime green
  'bg-[#8dd4f7]', // sky blue
  'bg-[#f7c8f0]', // pink
  'bg-[#fde68a]', // amber/yellow
  'bg-[#c4b5fd]', // violet
  'bg-[#fca5a5]', // red
]

/* ── Animations ────────────────────────────────────────────────── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const ease = [0.22, 1, 0.36, 1] as const

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
}

const heroText = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
}

const heroBadge = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, delay: 0.2, ease } },
}

const heroImage = {
  hidden: { opacity: 0, scale: 0.9, x: 30 },
  visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.7, delay: 0.3, ease } },
}

const heroButtons = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5, ease } },
}

/* ── Main Template ───────────────────────────────────────────────── */

export default function JaneTemplate({ data, socialLinks }: TemplateProps) {
  const name = data.name || 'Your Name'
  const skills = skillsFor(data)
  const stats = proofStats(data)
  const tenure = getExperienceTenure(data.experience)
  const capabilities = capabilityCards(data)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fef3de] text-[#0a0a0a]">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#fef3de]/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#top" className="text-base font-bold tracking-tight">{name}</a>
          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#projects" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors">Projects</a>
            <a href="#about" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors">About</a>
            <a href="#contact" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors">Contact</a>
          </div>
          <DownloadResumeButton className="rounded-full bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white" />
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <header id="top" className="px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2rem] bg-[#fbbf24] px-8 pb-10 pt-8 md:px-12 md:pb-14 md:pt-10"
          >
            {/* Badge */}
            <motion.div variants={heroBadge} className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#4ade80] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#0a0a0a]">
              <span className="text-sm">✨</span> Hey, I&apos;m {firstName(data)}
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                {/* Giant heading */}
                <motion.h1 variants={heroText} className="text-[clamp(3rem,9vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.04em]">
                  {name.split(' ').map((word, i) => <span key={i}>{word}<br /></span>)}
                  <span className="text-[#0a0a0a]/40">{roleLabel(data).split(' ').slice(0, 2).join(' ')}.</span>
                </motion.h1>

                <motion.p variants={slideUp} className="mt-6 max-w-md text-base leading-7 text-[#0a0a0a]/70">
                  {summaryText(data)}
                </motion.p>

                <motion.div variants={heroButtons} className="mt-6 flex flex-wrap gap-3">
                  <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white">
                    <Mail size={15} /> Hire {firstName(data)}
                  </a>
                  <a href="#projects" className="inline-flex items-center gap-2 rounded-full border-2 border-[#0a0a0a]/20 bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:border-[#0a0a0a]/40 transition-colors">
                    See projects <ArrowUpRight size={15} />
                  </a>
                </motion.div>
              </div>

              {/* Photo area + initials badge */}
              <motion.div variants={heroImage} className="relative flex justify-end">
                <div className="relative">
                  <img
                    src={projectImage(0)}
                    alt=""
                    className="aspect-[4/3] w-full max-w-sm rounded-2xl object-cover shadow-2xl md:aspect-[3/2]"
                    style={{ filter: 'saturate(0.8) hue-rotate(280deg) brightness(0.7)' }}
                  />
                  <div className="absolute -bottom-4 -left-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-lg font-bold shadow-lg">
                    {initials(name)}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-3 md:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} variants={slideUp} className="rounded-2xl border border-[#0a0a0a]/8 bg-white p-6">
                <p className="text-[2.5rem] font-black leading-none tracking-tight">{stat.value}{index === 0 ? '+' : index === 2 ? '+' : ''}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a]/40">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Capability Cards (colorful) ────────────────────────── */}
      {capabilities.length > 0 && (
        <section className="px-5 py-10">
          <div className="mx-auto max-w-6xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-3 md:grid-cols-2">
              {capabilities.map((cap, index) => (
                <motion.div key={cap.title} variants={scaleIn} className={`rounded-2xl p-7 ${CARD_COLORS[index % CARD_COLORS.length]}`}>
                  <p className="mb-3 text-sm font-bold text-[#0a0a0a]/30">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="text-2xl font-black tracking-tight">{cap.title}</h3>
                  {cap.description && <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/60">{cap.description}</p>}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Experience ─────────────────────────────────────────── */}
      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-8">
              <h2 className="text-3xl font-black tracking-tight">Work Experience</h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-3">
              {data.experience.map((exp, index) => (
                <motion.div key={`${exp.company}-${index}`} variants={slideUp} className="rounded-2xl border border-[#0a0a0a]/8 bg-white p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fbbf24]/30">
                        <Briefcase size={18} className="text-[#0a0a0a]/50" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{exp.title}</h3>
                        <p className="text-sm text-[#0a0a0a]/50">{exp.company}</p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-[#0a0a0a]/5 px-3 py-1 text-xs font-semibold text-[#0a0a0a]/45">{exp.startDate} — {exp.endDate || 'Present'}</span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-4 ml-13 space-y-2 text-sm text-[#0a0a0a]/55 leading-relaxed">
                      {exp.bullets.slice(0, 4).map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#fbbf24] shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Skills (pill cloud) ────────────────────────────────── */}
      {skills.length > 0 && (
        <section className="px-5 py-10">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-black tracking-tight">Skills</h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-wrap gap-2.5">
              {skills.map((skill, i) => (
                <motion.span key={skill} variants={scaleIn} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Projects ───────────────────────────────────────────── */}
      {hasAny(data.projects) && (
        <section id="projects" className="px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-8">
              <h2 className="text-3xl font-black tracking-tight">Projects</h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-4 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, index) => (
                <motion.article key={`${project.name}-${index}`} variants={scaleIn} className="group overflow-hidden rounded-2xl border border-[#0a0a0a]/8 bg-white">
                  <div className="overflow-hidden">
                    <img src={projectImage(index + 2)} alt="" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold">{project.name}</h3>
                    {projectDescription(project) && <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/50">{projectDescription(project)}</p>}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map((tech, ti) => (
                          <span key={tech} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CARD_COLORS[ti % CARD_COLORS.length]} text-[#0a0a0a]/70`}>{tech}</span>
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

      {/* ── About ──────────────────────────────────────────────── */}
      <section id="about" className="px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-8">
            <h2 className="text-3xl font-black tracking-tight">About</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <motion.div {...fadeUp} className="space-y-6">
              <div className="rounded-2xl bg-[#fbbf24] p-7">
                <p className="text-lg leading-8 text-[#0a0a0a]/80">{summaryText(data)}</p>
              </div>
              {data.location && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0a0a0a]/8 px-5 py-3 text-sm font-medium">
                  <MapPin size={15} className="text-[#0a0a0a]/40" /> {data.location}
                </div>
              )}
            </motion.div>

            <motion.div {...fadeUp} className="space-y-4">
              {hasAny(data.education) && data.education.map((edu, index) => (
                <div key={`${edu.institution}-${index}`} className="rounded-2xl border border-[#0a0a0a]/8 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8dd4f7]/40">
                      <GraduationCap size={18} className="text-[#0a0a0a]/50" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{edu.institution}</h4>
                      <p className="text-sm text-[#0a0a0a]/50">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                      <p className="text-xs text-[#0a0a0a]/30 mt-0.5">{educationLabel(edu)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {hasAny(data.certifications) && data.certifications.map((cert, index) => (
                <div key={`cert-${index}`} className="flex items-start gap-3 rounded-2xl border border-[#0a0a0a]/8 bg-white p-5">
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c8f7a0]/50">
                    <Award size={18} className="text-[#0a0a0a]/50" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{cert.name}</p>
                    {cert.issuer && <p className="text-xs text-[#0a0a0a]/35">{cert.issuer}</p>}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer id="contact" className="px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="rounded-[2rem] bg-[#0a0a0a] p-10 text-white md:p-14">
            <h2 className="text-4xl font-black md:text-5xl">Let&apos;s connect 🤝</h2>
            <p className="mt-4 max-w-md text-base text-white/45">Open to new opportunities. Feel free to reach out.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-7 py-3.5 text-sm font-bold text-[#0a0a0a]">
                <Mail size={15} /> Send a message
              </a>
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/60 hover:bg-white/5 transition-colors">
                  LinkedIn <ArrowUpRight size={15} />
                </a>
              )}
            </div>
            <div className="mt-8">
              <SocialLinksBar links={socialLinks} className="gap-5" iconClassName="text-white/40" textClassName="text-sm text-white/40 hover:text-[#fbbf24] transition-colors" />
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
