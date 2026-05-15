'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowUpRight, Mail, GraduationCap, Award } from 'lucide-react'
import {
  contactHref,
  fadeUp,
  staggerContainer,
  firstName,
  getExperienceTenure,
  hasAny,
  initials,
  projectDescription,
  projectImage,
  proofStats,
  roleLabel,
  skillsFor,
  groupedSkills,
  summaryText,
  capabilityCards,
  educationLabel,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { EditableImage } from '@/components/resume-lio/edit/EditableImage'
import { EditableLink } from '@/components/resume-lio/edit/EditableLink'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
}

/* ── Colors ────────────────────────────────────────────────────── */
const C = {
  bg: '#161616',
  bgCard: '#1e1e1e',
  cream: '#f0ebd6',
  creamMuted: '#dad6c4',
  grey: '#9f9c90',
  greyLight: '#bab9ae',
  coral: '#f96f4d',
  border: '#2b2b2b',
  offWhite: '#fbfaf4',
}

/* ── Animations ────────────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const

const slideUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease } },
}

/* ── Custom Cursor ─────────────────────────────────────────────── */
function CustomCursor() {
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)
  const smoothX = useSpring(mouseX, { damping: 25, stiffness: 250 })
  const smoothY = useSpring(mouseY, { damping: 25, stiffness: 250 })
  const [hovered, setHovered] = useState(false)

  if (typeof window !== 'undefined') {
    /* eslint-disable react-hooks/rules-of-hooks */
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-hover]')) setHovered(true)
    }
    const onOut = () => setHovered(false)

    if (typeof document !== 'undefined' && !((window as unknown as Record<string, unknown>).__casefileCursorBound)) {
      (window as unknown as Record<string, unknown>).__casefileCursorBound = true
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseover', onOver)
      document.addEventListener('mouseout', onOut)
    }
    /* eslint-enable react-hooks/rules-of-hooks */
  }

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-difference hidden md:block print:hidden"
      style={{
        x: smoothX,
        y: smoothY,
        width: hovered ? 64 : 20,
        height: hovered ? 64 : 20,
        marginLeft: hovered ? -32 : -10,
        marginTop: hovered ? -32 : -10,
        backgroundColor: C.offWhite,
        transition: 'width 0.3s, height 0.3s, margin 0.3s',
      }}
    />
  )
}

/* ── Marquee ───────────────────────────────────────────────────── */
function Marquee({ items }: { items: Array<{ label: string; field: string }> }) {
  const separator = ' — '
  return (
    <div className="overflow-hidden border-y py-5" style={{ borderColor: C.border }}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 1].map(copy => (
          <span key={copy} className="text-sm uppercase tracking-[0.25em] pr-4" style={{ color: C.grey }}>
            {items.map((item, i) => (
              <span key={i}><EditableText field={item.field} as="span">{item.label}</EditableText>{separator}</span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ── Main Template ───────────────────────────────────────────────── */

export default function CasefileTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const name = data.name || 'Your Name'
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || projectImage(i)
  const skills = skillsFor(data)
  const skillGroups = groupedSkills(data)
  const marqueeSkills = skillGroups
    .flatMap(group => group.skills.map((skill, index) => ({ label: skill, field: group.skillFields[index] })))
    .slice(0, 8)
  const stats = proofStats(data)
  const statsGridClass = stats.length === 1
    ? 'md:grid-cols-1 md:max-w-sm md:mx-auto'
    : stats.length === 2
      ? 'md:grid-cols-2 md:max-w-3xl md:mx-auto'
      : 'md:grid-cols-3'
  const tenure = getExperienceTenure(data.experience)
  const capabilities = capabilityCards(data)

  return (
    <div
      className="min-h-screen overflow-x-hidden cursor-none [&_*]:cursor-none"
      style={{ backgroundColor: C.bg, color: C.cream, fontFamily: 'Inter, "Inter Placeholder", sans-serif' }}
    >
      <CustomCursor />

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 px-6 py-5 backdrop-blur-xl" style={{ backgroundColor: `${C.bg}e6`, borderBottom: `1px solid ${C.border}` }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <a href="#top" className="text-base font-medium tracking-tight" style={{ color: C.cream }}><EditableText field="name" as="span">{name}</EditableText></a>
          <div className="hidden items-center gap-8 text-sm md:flex" style={{ color: C.grey }}>
            <a href="#work" data-hover className="transition-colors duration-300 hover:text-[#f0ebd6]"><EditableText field="navLabel.work" as="span">Work</EditableText></a>
            <a href="#about" data-hover className="transition-colors duration-300 hover:text-[#f0ebd6]"><EditableText field="navLabel.about" as="span">About</EditableText></a>
            <a href="#contact" data-hover className="transition-colors duration-300 hover:text-[#f0ebd6]"><EditableText field="navLabel.contact" as="span">Contact</EditableText></a>
          </div>
          <DownloadResumeButton className="rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 hover:opacity-80" iconSize={14} />
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <header id="top" className="px-6 pt-20 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-[1200px]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={slideUp} className="text-lg md:text-xl" style={{ color: C.grey }}>
              <EditableText field="heroGreeting" as="span">Hello, I&apos;m</EditableText>
            </motion.p>
            <motion.h1
              variants={slideUp}
              className="mt-3 text-[clamp(3.5rem,10vw,8rem)] leading-[0.92] tracking-[-0.04em]"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              <EditableText field="name">{name}</EditableText>
            </motion.h1>
            <motion.p
              variants={slideUp}
              className="mt-2 text-[clamp(1.2rem,3vw,2rem)] italic"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif', color: C.coral }}
            >
              <EditableText field="currentRole" as="span">{roleLabel(data)}</EditableText>
            </motion.p>
            <motion.p variants={slideUp} className="mt-8 max-w-xl text-base leading-8" style={{ color: C.grey }}>
              <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
            </motion.p>
            <motion.div variants={slideUp} className="mt-10 flex flex-wrap gap-4">
              <EditableLink
                linkField="social.email"
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-[0.1em] transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: C.cream, color: C.bg }}
              >
                <EditableText field="heroCtaText" as="span">Start a project</EditableText> <ArrowUpRight size={15} />
              </EditableLink>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-[1200px]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className={`grid gap-px rounded-2xl overflow-hidden ${statsGridClass}`} style={{ backgroundColor: C.border }}>
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={slideUp} className="p-8 text-center" style={{ backgroundColor: C.bgCard }}>
                <p className="text-5xl font-light tracking-tight" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}><EditableText field={stat.valueField} as="span">{stat.value}</EditableText><span style={{ color: C.coral }}>+</span></p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em]" style={{ color: C.grey }}><EditableText field={stat.labelField} as="span">{stat.label}</EditableText></p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Marquee ────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <div className="my-8">
          <Marquee items={marqueeSkills} />
        </div>
      )}

      {/* ── Work / Projects ────────────────────────────────────── */}
      {hasAny(data.projects) && (
        <section id="work" className="px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...fadeUp} className="mb-14">
              <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: C.grey }}><EditableText field="projectsKicker" as="span">Selected Work</EditableText></p>
              <h2 className="text-5xl md:text-6xl tracking-tight" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}><EditableText field="projectsHeading" as="span">Projects</EditableText></h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-6 md:grid-cols-2">
              {data.projects.slice(0, 6).map((project, index) => (
                <motion.article
                  key={`${project.name}-${index}`}
                  variants={slideUp}
                  data-hover
                  className="group relative overflow-hidden rounded-2xl"
                  style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <EditableImage
                      imageKey={`project_image_${index}`}
                      src={resolvedProjectImg(index)}
                      className="h-full w-full object-cover opacity-50 transition-all duration-700 group-hover:opacity-70 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-medium" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}><EditableText field={`projects.${index}.name`}>{project.name}</EditableText></h3>
                        {projectDescription(project) && (
                          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.grey }}><EditableText field={`projects.${index}.description`} multiline as="span">{projectDescription(project)}</EditableText></p>
                        )}
                      </div>
                      <span className="shrink-0 grid h-10 w-10 place-items-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: C.coral, color: C.bg }}>
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.technologies.slice(0, 4).map((tech, techIndex) => (
                          <span key={tech} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: `${C.border}`, color: C.grey }}><EditableText field={`projects.${index}.technologies.${techIndex}`} as="span">{tech}</EditableText></span>
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

      {/* ── Experience ─────────────────────────────────────────── */}
      {hasAny(data.experience) && (
        <section className="px-6 py-20" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...fadeUp} className="mb-14">
              <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: C.grey }}><EditableText field="experienceKicker" as="span">Career</EditableText></p>
              <h2 className="text-5xl md:text-6xl tracking-tight" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}><EditableText field="experienceHeading" as="span">Experience</EditableText></h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-0 divide-y" style={{ borderColor: C.border }}>
              {data.experience.map((exp, index) => (
                <motion.div
                  key={`${exp.company}-${index}`}
                  variants={slideUp}
                  className="py-8 first:pt-0 last:pb-0"
                  style={{ borderColor: C.border }}
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_200px]">
                    <div>
                      <h3 className="text-2xl font-normal" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}><EditableText field={`experience.${index}.title`}>{exp.title}</EditableText></h3>
                      <p className="mt-1 text-sm" style={{ color: C.coral }}><EditableText field={`experience.${index}.company`}>{exp.company}</EditableText></p>
                    </div>
                    <p className="text-sm md:text-right" style={{ color: C.grey }}><EditableText field={`experience.${index}.startDate`}>{exp.startDate}</EditableText> — <EditableText field={`experience.${index}.endDate`}>{exp.endDate || 'Present'}</EditableText></p>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed" style={{ color: C.creamMuted }}>
                      {exp.bullets.slice(0, 3).map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-2 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: C.coral }} />
                          <EditableText field={`experience.${index}.bullets.${i}`} multiline as="span">{bullet}</EditableText>
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

      {/* ── About ──────────────────────────────────────────────── */}
      <section id="about" className="px-6 py-20" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 md:grid-cols-[1.2fr_0.8fr]">
            <motion.div {...fadeUp}>
              <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: C.grey }}><EditableText field="aboutKicker" as="span">About</EditableText></p>
              <h2 className="text-4xl md:text-5xl tracking-tight leading-[1.1]" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
                <EditableText field="aboutGreeting" as="span">Hello, I&apos;m {firstName(data)},</EditableText><br />
                <span style={{ color: C.grey }}><EditableText field="aboutRole" as="span">a {roleLabel(data).toLowerCase()}</EditableText></span>
                {data.location && <span style={{ color: C.grey }}> <EditableText field="aboutLocationPrefix" as="span">based in</EditableText> <EditableText field="location" as="span">{data.location}</EditableText>.</span>}
              </h2>
              <p className="mt-8 text-base leading-8" style={{ color: C.creamMuted }}><EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText></p>
            </motion.div>

            <motion.div {...fadeUp} className="space-y-6">
              {hasAny(data.education) && data.education.map((edu, index) => (
                <div key={`${edu.institution}-${index}`} className="rounded-2xl p-6" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}>
                  <GraduationCap size={18} className="mb-3" style={{ color: C.grey }} />
                  <h4 className="text-base font-medium" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}><EditableText field={`education.${index}.institution`}>{edu.institution}</EditableText></h4>
                  <p className="text-sm mt-1" style={{ color: C.grey }}><EditableText field={`education.${index}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${index}.field`} as="span">{edu.field}</EditableText></> : ''}</p>
                  <p className="text-xs mt-1" style={{ color: C.grey }}><EditableText field={`educationDateLabel.${index}`} as="span">{educationLabel(edu)}</EditableText></p>
                </div>
              ))}

              {hasAny(data.certifications) && data.certifications.map((cert, index) => (
                <div key={`cert-${index}`} className="flex items-start gap-3 rounded-2xl p-6" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}` }}>
                  <Award size={16} className="mt-0.5 shrink-0" style={{ color: C.coral }} />
                  <div>
                    <p className="font-medium text-sm"><EditableText field={`certifications.${index}.name`}>{cert.name}</EditableText></p>
                    {cert.issuer && <p className="text-xs mt-0.5" style={{ color: C.grey }}><EditableText field={`certifications.${index}.issuer`}>{cert.issuer}</EditableText></p>}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>


      {/* ── Footer / Contact ───────────────────────────────────── */}
      <footer id="contact" className="px-6 py-24" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="mx-auto max-w-[1200px]">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] mb-8" style={{ color: C.grey }}><EditableText field="contactKicker" as="span">Contact</EditableText></p>
            <h2 className="text-6xl md:text-8xl tracking-tight" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
              <EditableText field="footerHeading" multiline as="span">get in<br />
              <span style={{ color: C.coral }}>touch</span></EditableText>
            </h2>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <EditableLink
                linkField="social.email"
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium uppercase tracking-[0.1em] transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: C.cream, color: C.bg }}
              >
                <Mail size={15} /> <EditableText field="contactCtaText" as="span">Send a message</EditableText>
              </EditableLink>
              {socialLinks.linkedin && (
                <EditableLink
                  linkField="social.linkedin"
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium uppercase tracking-[0.1em] transition-all duration-300"
                  style={{ border: `1px solid ${C.border}`, color: C.grey }}
                >
                  <EditableText field="linkedinCtaText" as="span">LinkedIn</EditableText> <ArrowUpRight size={15} />
                </EditableLink>
              )}
            </div>
            <div className="mt-10">
              <SocialLinksBar links={{ ...socialLinks, website: '' }} className="justify-center gap-6" iconClassName="text-[#9f9c90]" textClassName="text-sm text-[#9f9c90] hover:text-[#f0ebd6] transition-colors duration-300" />
            </div>
          </motion.div>

          <div className="mt-20 flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.15em]" style={{ color: C.grey, borderTop: `1px solid ${C.border}`, paddingTop: '1.5rem' }}>
            <p>&copy; <EditableText field="copyrightText" as="span">{new Date().getFullYear()} {name}</EditableText></p>
            <div className="flex gap-6">
              <a href="#work" data-hover className="transition-colors duration-300 hover:text-[#f0ebd6]"><EditableText field="footerLabel.work" as="span">Work</EditableText></a>
              <a href="#about" data-hover className="transition-colors duration-300 hover:text-[#f0ebd6]"><EditableText field="footerLabel.about" as="span">About</EditableText></a>
              <a href="#contact" data-hover className="transition-colors duration-300 hover:text-[#f0ebd6]"><EditableText field="footerLabel.contact" as="span">Contact</EditableText></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
