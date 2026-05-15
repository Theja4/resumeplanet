'use client'

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, MapPin, Mail, Phone, GraduationCap, Award } from 'lucide-react'
import { contactHref, editableTextValue, fadeUp, popIn, staggerContainer, getExperienceTenure, hasAny, initials, projectDescription, projectImage, proofStats, roleLabel, groupedSkills, summaryText } from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { EditableImage } from '@/components/resume-lio/edit/EditableImage'
import { EditableLink } from '@/components/resume-lio/edit/EditableLink'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
}

const fadeUpStagger = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

export default function PortfoliteTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || projectImage(i)
  const skillGroups = groupedSkills(data)
  const stats = proofStats(data)
  const statsGridClass = stats.length === 1 ? 'grid-cols-1' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
  const tenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen bg-[#111] text-white overflow-x-hidden">
      <nav className="sticky top-0 z-50 px-5 py-4 bg-[#111]/90 backdrop-blur-xl border-b border-white/8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="#top" className="font-bold text-xl tracking-tight"><EditableText field="name" as="span">{data.name || 'Resume'}</EditableText></a>
          <div className="hidden gap-8 text-sm font-medium text-white/50 md:flex">
            <a href="#about" className="hover:text-white transition-colors"><EditableText field="navLabel.about" as="span">About</EditableText></a>
            <a href="#experience" className="hover:text-white transition-colors"><EditableText field="navLabel.experience" as="span">Experience</EditableText></a>
            <a href="#projects" className="hover:text-white transition-colors"><EditableText field="navLabel.projects" as="span">Projects</EditableText></a>
            <a href="#contact" className="hover:text-white transition-colors"><EditableText field="navLabel.contact" as="span">Contact</EditableText></a>
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
                    <MapPin size={13} /> <EditableText field="location" as="span">{data.location}</EditableText>
                  </p>
                )}
                <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em]">
                  <EditableText field="name">{data.name || 'Your Name'}</EditableText>
                </h1>
                <p className="mt-4 text-2xl font-medium text-white/60"><EditableText field="currentRole" as="span">{roleLabel(data)}</EditableText></p>
              </motion.div>
              <motion.p {...fadeUp} className="text-lg leading-relaxed text-white/45 max-w-xl">
                <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
              </motion.p>
              <motion.div {...fadeUp} className="flex flex-wrap gap-3">
                <EditableLink
                  linkField="social.email"
                  href={contactHref(data.email || socialLinks.email)}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-7 py-3.5 text-sm font-semibold hover:bg-white/90 transition-all"
                >
                  <EditableText field="heroCtaText" as="span">Get in touch</EditableText> <ArrowUpRight size={15} />
                </EditableLink>
                {socialLinks.linkedin && (
                  <EditableLink
                    linkField="social.linkedin"
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium hover:border-white/40 transition-all"
                  >
                    <EditableText field="linkedinCtaText" as="span">View LinkedIn</EditableText>
                  </EditableLink>
                )}
              </motion.div>
            </div>
            <motion.div {...popIn} className="flex justify-center">
              <div className="relative">
                <div className="h-56 w-56 rounded-3xl border border-white/10 bg-white/5 grid place-items-center md:h-72 md:w-72">
                  <span className="text-7xl font-bold text-white/15 md:text-8xl"><EditableText field="initials" as="span">{initials(data.name || '')}</EditableText></span>
                </div>
                {tenure && (
                  <div className="absolute -bottom-3 -right-3 rounded-xl bg-white text-black p-4">
                    <p className="text-2xl font-bold"><EditableText field="experienceTenureValue" as="span">{editableTextValue(data, 'experienceTenureValue', `${tenure.label}+`)}</EditableText></p>
                    <p className="text-xs text-black/50 font-medium"><EditableText field="experienceTenureLabel" as="span">{editableTextValue(data, 'experienceTenureLabel', 'Years Exp.')}</EditableText></p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3"><EditableText field="aboutKicker" as="span">{editableTextValue(data, 'aboutKicker', 'About')}</EditableText></p>
                <h2 className="text-3xl font-bold tracking-tight"><EditableText field="aboutHeading" as="span">{editableTextValue(data, 'aboutHeading', 'Professional Summary')}</EditableText></h2>
              </div>
              <p className="text-lg leading-relaxed text-white/55"><EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText></p>
              {data.location && (
                <p className="text-white/40 text-sm"><EditableText field="basedInPrefix" as="span">Based in</EditableText> <EditableText field="location" as="span">{data.location}</EditableText></p>
              )}
            </motion.div>
            <motion.div {...fadeUp} className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-4"><EditableText field="skillsHeading" as="span">{editableTextValue(data, 'skillsHeading', 'Core Skills')}</EditableText></h3>
                {skillGroups.map(group => (
                  <div key={group.title} className="mb-4 last:mb-0">
                    {skillGroups.length > 1 && (
                      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35 mb-2">
                        <EditableText field={group.titleField} as="span">{group.title}</EditableText>
                      </h4>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {group.skills.slice(0, 12).map((skill, skillIdx) => (
                        <span key={skill} className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-white/60"><EditableText field={group.skillFields[skillIdx]} as="span">{skill}</EditableText></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-4"><EditableText field="overviewHeading" as="span">Overview</EditableText></h3>
                <div className={`grid gap-3 ${statsGridClass}`}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-2xl font-bold"><EditableText field={stat.valueField} as="span">{stat.value}</EditableText></p>
                      <p className="text-xs text-white/35 mt-1"><EditableText field={stat.labelField} as="span">{stat.label}</EditableText></p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3"><EditableText field="experienceKicker" as="span">Career</EditableText></p>
              <h2 className="text-3xl font-bold tracking-tight"><EditableText field="experienceHeading" as="span">Work Experience</EditableText></h2>
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
                        <h3 className="text-xl font-bold"><EditableText field={`experience.${index}.title`}>{exp.title}</EditableText></h3>
                        <p className="text-white/55"><EditableText field={`experience.${index}.company`}>{exp.company}</EditableText></p>
                      </div>
                      <p className="text-sm text-white/35 shrink-0"><EditableText field={`experience.${index}.startDate`}>{exp.startDate}</EditableText> — <EditableText field={`experience.${index}.endDate`}>{exp.endDate || 'Present'}</EditableText></p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-1.5 text-sm text-white/45 leading-relaxed">
                        {exp.bullets.slice(0, 4).map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-2 h-1 w-1 rounded-full bg-white/25 shrink-0" />
                            <EditableText field={`experience.${index}.bullets.${i}`} multiline as="span">{bullet}</EditableText>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3"><EditableText field="projectsKicker" as="span">Portfolio</EditableText></p>
              <h2 className="text-3xl font-bold tracking-tight"><EditableText field="projectsHeading" as="span">Projects</EditableText></h2>
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
                    <EditableImage
                      imageKey={`project_image_${index}`}
                      src={resolvedProjectImg(index)}
                      className="h-full w-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-lg font-bold"><EditableText field={`projects.${index}.name`}>{project.name}</EditableText></h3>
                    {projectDescription(project) && <p className="text-white/40 text-sm leading-relaxed"><EditableText field={`projects.${index}.description`} multiline as="span">{projectDescription(project)}</EditableText></p>}
                    {project.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies.slice(0, 3).map((tech, techIndex) => (
                          <span key={tech} className="text-xs text-white/30 bg-white/5 rounded px-2 py-0.5"><EditableText field={`projects.${index}.technologies.${techIndex}`} as="span">{tech}</EditableText></span>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3"><EditableText field="educationKicker" as="span">Background</EditableText></p>
              <h2 className="text-3xl font-bold tracking-tight"><EditableText field="educationHeading" as="span">Education</EditableText></h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.education.map((edu, index) => (
                <motion.div
                  key={`${edu.institution}-${index}`}
                  {...fadeUp}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
                >
                  <GraduationCap size={18} className="text-white/25 mb-3" />
                  <h3 className="text-lg font-bold"><EditableText field={`education.${index}.institution`}>{edu.institution}</EditableText></h3>
                  <p className="text-white/50 mt-1"><EditableText field={`education.${index}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${index}.field`} as="span">{edu.field}</EditableText></> : ''}</p>
                  <p className="text-sm text-white/30 mt-1"><EditableText field={`education.${index}.startDate`}>{edu.startDate}</EditableText> — <EditableText field={`education.${index}.endDate`}>{edu.endDate || 'Present'}</EditableText></p>
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
              <h2 className="text-2xl font-bold tracking-tight mb-4"><EditableText field="certificationsHeading" as="span">Certifications</EditableText></h2>
              <div className="grid gap-3 md:grid-cols-2">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <Award size={16} className="text-white/25 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm"><EditableText field={`certifications.${index}.name`}>{cert.name}</EditableText></p>
                      {cert.issuer && <p className="text-xs text-white/35 mt-0.5"><EditableText field={`certifications.${index}.issuer`}>{cert.issuer}</EditableText></p>}
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-3"><EditableText field="contactKicker" as="span">Contact</EditableText></p>
              <h2 className="text-3xl font-bold tracking-tight"><EditableText field="contactHeading" as="span">Get in Touch</EditableText></h2>
              <p className="text-lg text-white/45 mt-4 max-w-md">
                <EditableText field="footerText" multiline as="span">Open to new opportunities and collaborations. Let&apos;s connect.</EditableText>
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {(data.email || socialLinks.email) && (
                  <EditableLink linkField="social.email" href={`mailto:${data.email || socialLinks.email}`} className="inline-flex items-center gap-2.5 text-white/60 hover:text-white transition-colors">
                    <Mail size={17} className="text-white/30" />
                    <EditableText field="contactEmailText" as="span">{data.email || socialLinks.email}</EditableText>
                  </EditableLink>
                )}
                {data.phone && (
                  <EditableLink linkField="phone" href={`tel:${data.phone}`} className="inline-flex items-center gap-2.5 text-white/60 hover:text-white transition-colors">
                    <Phone size={17} className="text-white/30" />
                    <EditableText field="phone" as="span">{data.phone}</EditableText>
                  </EditableLink>
                )}
                {data.location && (
                  <span className="inline-flex items-center gap-2.5 text-white/60">
                    <MapPin size={17} className="text-white/30" />
                    <EditableText field="location" as="span">{data.location}</EditableText>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-end gap-5">
              <SocialLinksBar links={{ ...socialLinks, website: '' }} className="gap-5" iconClassName="text-white/40 hover:text-white/70" textClassName="text-sm text-white/40 hover:text-white/70" />
              <EditableLink
                linkField="social.email"
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-7 py-3.5 text-sm font-semibold hover:bg-white/90 transition-all mt-2"
              >
                <EditableText field="contactCtaText" as="span">Send a message</EditableText> <ArrowUpRight size={15} />
              </EditableLink>
            </div>
          </motion.div>
          <div className="mt-12 pt-6 border-t border-white/8 text-center">
            <p className="text-white/20 text-sm">&copy; <EditableText field="copyrightText" as="span">{new Date().getFullYear()} {data.name}</EditableText></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
