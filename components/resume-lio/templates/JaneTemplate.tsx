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
  groupedSkills,
  summaryText,
  capabilityCards,
  educationLabel,
  editableTextStoredValue,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { EditableImage } from '@/components/resume-lio/edit/EditableImage'
import { EditableLink } from '@/components/resume-lio/edit/EditableLink'
import { useResumeLioEdit } from '@/components/resume-lio/edit/ResumeLioEditContext'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
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

export default function JaneTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const editContext = useResumeLioEdit()
  const isEditing = !!editContext?.editMode
  const name = data.name || 'Your Name'
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || projectImage(i)
  const skills = skillsFor(data)
  const skillGroups = groupedSkills(data)
  const stats = proofStats(data)
  const statsGridClass = stats.length === 1
    ? 'md:grid-cols-1 md:max-w-xs md:mx-auto'
    : stats.length === 2
      ? 'md:grid-cols-2 md:max-w-2xl md:mx-auto'
      : 'md:grid-cols-3'
  const tenure = getExperienceTenure(data.experience)
  const capabilities = capabilityCards(data)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fef3de] text-[#0a0a0a]">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#fef3de]/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#top" className="text-base font-bold tracking-tight"><EditableText field="name" as="span">{name}</EditableText></a>
          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#projects" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors"><EditableText field="navLabel.projects" as="span">Projects</EditableText></a>
            <a href="#about" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors"><EditableText field="navLabel.about" as="span">About</EditableText></a>
            <a href="#contact" className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] transition-colors"><EditableText field="navLabel.contact" as="span">Contact</EditableText></a>
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
              <span className="text-sm">✨</span> <EditableText field="heroBadgeText" as="span">Hey, I&apos;m {firstName(data)}</EditableText>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                {/* Giant heading */}
                <motion.h1 variants={heroText} className="text-[clamp(3rem,9vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.04em]">
                  <EditableText field="name" as="span" className="block whitespace-pre-line">{name.split(' ').join('\n')}</EditableText>
                  <EditableText field="currentRole" as="span" className="text-[#0a0a0a]/40">{roleLabel(data).split(' ').slice(0, 2).join(' ')}.</EditableText>
                </motion.h1>

                <motion.p variants={slideUp} className="mt-6 max-w-md text-base leading-7 text-[#0a0a0a]/70">
                  <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
                </motion.p>

                <motion.div variants={heroButtons} className="mt-6 flex flex-wrap gap-3">
                  <EditableLink linkField="social.email" href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white">
                    <Mail size={15} /> <EditableText field="heroCtaText" as="span">Hire {firstName(data)}</EditableText>
                  </EditableLink>
                  <a href="#projects" className="inline-flex items-center gap-2 rounded-full border-2 border-[#0a0a0a]/20 bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:border-[#0a0a0a]/40 transition-colors">
                    <EditableText field="projectsCtaText" as="span">See projects</EditableText> <ArrowUpRight size={15} />
                  </a>
                </motion.div>
              </div>

              {/* Photo area + initials badge */}
              <motion.div variants={heroImage} className="relative flex justify-end">
                <div className="relative">
                  <EditableImage
                    imageKey="project_image_0"
                    src={resolvedProjectImg(0)}
                    className="aspect-[4/3] w-full max-w-sm rounded-2xl object-cover shadow-2xl md:aspect-[3/2]"
                    style={{ filter: 'saturate(0.8) hue-rotate(280deg) brightness(0.7)' }}
                  />
                  <div className="absolute -bottom-4 -left-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-lg font-bold shadow-lg">
                    <EditableText field="initials" as="span">{initials(name)}</EditableText>
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
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className={`grid gap-3 ${statsGridClass}`}>
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={slideUp} className="rounded-2xl border border-[#0a0a0a]/8 bg-white p-6">
                <p className="text-[2.5rem] font-black leading-none tracking-tight"><EditableText field={stat.valueField} as="span">{stat.value}</EditableText>{stat.id !== 'projects' ? '+' : ''}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a]/40"><EditableText field={stat.labelField} as="span">{stat.label}</EditableText></p>
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
              {capabilities.map((cap, index) => {
                const descriptionField = `capability.${index}.description`
                const description = editableTextStoredValue(data, descriptionField) ?? cap.description

                return (
                  <motion.div key={cap.title} variants={scaleIn} className={`rounded-2xl p-7 ${CARD_COLORS[index % CARD_COLORS.length]}`}>
                    <p className="mb-3 text-sm font-bold text-[#0a0a0a]/30">{String(index + 1).padStart(2, '0')}</p>
                    <h3 className="text-2xl font-black tracking-tight"><EditableText field={`capability.${index}.title`}>{cap.title}</EditableText></h3>
                    {(description || isEditing) && (
                      <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/60">
                        <EditableText field={descriptionField} multiline as="span" placeholder="Add supporting detail">{description}</EditableText>
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Experience ─────────────────────────────────────────── */}
      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-8">
              <h2 className="text-3xl font-black tracking-tight"><EditableText field="experienceHeading" as="span">Work Experience</EditableText></h2>
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
                        <h3 className="text-lg font-bold"><EditableText field={`experience.${index}.title`}>{exp.title}</EditableText></h3>
                        <p className="text-sm text-[#0a0a0a]/50"><EditableText field={`experience.${index}.company`}>{exp.company}</EditableText></p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-[#0a0a0a]/5 px-3 py-1 text-xs font-semibold text-[#0a0a0a]/45"><EditableText field={`experience.${index}.startDate`}>{exp.startDate}</EditableText> — <EditableText field={`experience.${index}.endDate`}>{exp.endDate || 'Present'}</EditableText></span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-4 ml-13 space-y-2 text-sm text-[#0a0a0a]/55 leading-relaxed">
                      {exp.bullets.slice(0, 4).map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#fbbf24] shrink-0" />
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

      {/* ── Skills (pill cloud) ────────────────────────────────── */}
      {skills.length > 0 && (
        <section className="px-5 py-10">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-black tracking-tight"><EditableText field="skillsHeading" as="span">Skills</EditableText></h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              {skillGroups.map(group => (
                <div key={group.title} className="mb-4 last:mb-0">
                  {skillGroups.length > 1 && (
                    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-black/40 mb-2">
                      <EditableText field={group.titleField} as="span">{group.title}</EditableText>
                    </h4>
                  )}
                  <div className="flex flex-wrap gap-2.5">
                    {group.skills.map((skill, i) => (
                      <motion.span key={skill} variants={scaleIn} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                        <EditableText field={group.skillFields[i]} as="span">{skill}</EditableText>
                      </motion.span>
                    ))}
                  </div>
                </div>
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
              <h2 className="text-3xl font-black tracking-tight"><EditableText field="projectsHeading" as="span">Projects</EditableText></h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-4 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, index) => (
                <motion.article key={`${project.name}-${index}`} variants={scaleIn} className="group overflow-hidden rounded-2xl border border-[#0a0a0a]/8 bg-white">
                  <div className="overflow-hidden">
                    <EditableImage imageKey={`project_image_${index + 2}`} src={resolvedProjectImg(index + 2)} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold"><EditableText field={`projects.${index}.name`}>{project.name}</EditableText></h3>
                    {projectDescription(project) && <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/50"><EditableText field={`projects.${index}.description`} multiline as="span">{projectDescription(project)}</EditableText></p>}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map((tech, ti) => (
                          <span key={tech} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CARD_COLORS[ti % CARD_COLORS.length]} text-[#0a0a0a]/70`}><EditableText field={`projects.${index}.technologies.${ti}`} as="span">{tech}</EditableText></span>
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
            <h2 className="text-3xl font-black tracking-tight"><EditableText field="aboutHeading" as="span">About</EditableText></h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <motion.div {...fadeUp} className="space-y-6">
              <div className="rounded-2xl bg-[#fbbf24] p-7">
                <p className="text-lg leading-8 text-[#0a0a0a]/80"><EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText></p>
              </div>
              {data.location && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0a0a0a]/8 px-5 py-3 text-sm font-medium">
                  <MapPin size={15} className="text-[#0a0a0a]/40" /> <EditableText field="location" as="span">{data.location}</EditableText>
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
                      <h4 className="font-bold text-sm"><EditableText field={`education.${index}.institution`}>{edu.institution}</EditableText></h4>
                      <p className="text-sm text-[#0a0a0a]/50"><EditableText field={`education.${index}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${index}.field`} as="span">{edu.field}</EditableText></> : ''}</p>
                      <p className="text-xs text-[#0a0a0a]/30 mt-0.5"><EditableText field={`education.${index}.startDate`} as="span">{edu.startDate}</EditableText>{edu.startDate && edu.endDate ? ' — ' : ''}<EditableText field={`education.${index}.endDate`} as="span">{edu.endDate}</EditableText></p>
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
                    <p className="font-bold text-sm"><EditableText field={`certifications.${index}.name`}>{cert.name}</EditableText></p>
                    {cert.issuer && <p className="text-xs text-[#0a0a0a]/35"><EditableText field={`certifications.${index}.issuer`}>{cert.issuer}</EditableText></p>}
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
            <h2 className="text-4xl font-black md:text-5xl"><EditableText field="footerHeading">Let&apos;s connect 🤝</EditableText></h2>
            <p className="mt-4 max-w-md text-base text-white/45"><EditableText field="footerText" multiline as="span">Open to new opportunities. Feel free to reach out.</EditableText></p>
            <div className="mt-8 flex flex-wrap gap-3">
              <EditableLink linkField="social.email" href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-7 py-3.5 text-sm font-bold text-[#0a0a0a]">
                <Mail size={15} /> <EditableText field="contactCtaText" as="span">Send a message</EditableText>
              </EditableLink>
              {socialLinks.linkedin && (
                <EditableLink linkField="social.linkedin" href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/60 hover:bg-white/5 transition-colors">
                  <EditableText field="linkedinCtaText" as="span">LinkedIn</EditableText> <ArrowUpRight size={15} />
                </EditableLink>
              )}
            </div>
            <div className="mt-8">
              <SocialLinksBar links={{ ...socialLinks, website: '' }} className="gap-5" iconClassName="text-white/40" textClassName="text-sm text-white/40 hover:text-[#fbbf24] transition-colors" />
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
