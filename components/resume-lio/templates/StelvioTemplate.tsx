'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, GraduationCap, Award } from 'lucide-react'
import { contactHref, fadeUp, firstName, getExperienceTenure, hasAny, initials, projectDescription, projectImage, roleLabel, skillsFor, groupedSkills, summaryText, educationLabel } from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { EditableImage } from '@/components/resume-lio/edit/EditableImage'
import { EditableLink } from '@/components/resume-lio/edit/EditableLink'

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
}

export default function StelvioTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || projectImage(i)
  const skills = skillsFor(data)
  const skillGroups = groupedSkills(data)
  const tenure = getExperienceTenure(data.experience)

  return (
    <div className="min-h-screen bg-[#080808] text-[#f4f0e8]">
      <nav className="sticky top-0 z-50 px-5 py-5 bg-[#080808]/90 backdrop-blur-xl border-b border-white/6">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm font-medium">
          <a href="#top" className="text-white/90"><EditableText field="name" as="span">{data.name || 'Profile'}</EditableText></a>
          <div className="hidden gap-7 text-white/40 md:flex">
            <a href="#experience" className="hover:text-white transition-colors"><EditableText field="navLabel.experience" as="span">Experience</EditableText></a>
            <a href="#projects" className="hover:text-white transition-colors"><EditableText field="navLabel.projects" as="span">Projects</EditableText></a>
            <a href="#contact" className="hover:text-white transition-colors"><EditableText field="navLabel.contact" as="span">Contact</EditableText></a>
          </div>
          <DownloadResumeButton className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 hover:bg-white hover:text-black transition-all" />
        </div>
      </nav>

      <header id="top" className="px-5 pb-16 pt-20 md:pt-28">
        <div className="mx-auto max-w-6xl">
          <motion.p {...fadeUp} className="text-sm uppercase tracking-[0.24em] text-white/35"><EditableText field="currentRole" as="span">{roleLabel(data)}</EditableText></motion.p>
          <motion.h1 {...fadeUp} className="mt-4 max-w-5xl text-[clamp(3.5rem,11vw,9rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
            <EditableText field="name">{data.name || 'Your Name'}</EditableText>
          </motion.h1>
          <motion.div {...fadeUp} className="mt-8 grid gap-6 md:grid-cols-[1fr_0.7fr]">
            <p className="max-w-2xl text-xl leading-9 text-white/55"><EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText></p>
            <div className="space-y-3 text-sm text-white/40">
              {tenure?.isExperienced && <p className="border-t border-white/10 pt-3"><EditableText field="experienceTenure" as="span">{tenure.label}+ years experience</EditableText></p>}
              {data.location && <p className="border-t border-white/10 pt-3"><EditableText field="location">{data.location}</EditableText></p>}
              {skills.length > 0 && <p className="border-t border-white/10 pt-3"><EditableText field="heroSkillsSummary" as="span">{skills.slice(0, 4).join(' / ')}</EditableText></p>}
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="mt-8 flex flex-wrap gap-3">
            <EditableLink linkField="social.email" href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white hover:bg-white hover:text-black transition-all">
              <EditableText field="heroCtaText" as="span">Get in touch</EditableText> <ArrowUpRight size={15} />
            </EditableLink>
            {socialLinks.linkedin && (
              <EditableLink linkField="social.linkedin" href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-white/50 hover:border-white/25 transition-all">
                <EditableText field="linkedinCtaText" as="span">LinkedIn</EditableText>
              </EditableLink>
            )}
          </motion.div>
        </div>
      </header>

      {hasAny(data.experience) && (
        <section id="experience" className="px-5 py-16 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/30 mb-2"><EditableText field="experienceKicker" as="span">Career</EditableText></p>
              <h2 className="text-4xl font-semibold tracking-tight"><EditableText field="experienceHeading" as="span">Experience</EditableText></h2>
            </motion.div>
            <div className="space-y-1">
              {data.experience.map((exp, index) => (
                <motion.article key={`${exp.company}-${index}`} {...fadeUp} className="group border-t border-white/8 py-6">
                  <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
                    <div>
                      <p className="text-xs text-white/30"><EditableText field={`experience.${index}.startDate`}>{exp.startDate}</EditableText> — <EditableText field={`experience.${index}.endDate`}>{exp.endDate || 'Present'}</EditableText></p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight"><EditableText field={`experience.${index}.title`}>{exp.title}</EditableText></h3>
                      <p className="mt-1 text-sm text-white/45"><EditableText field={`experience.${index}.company`}>{exp.company}</EditableText></p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-1.5 text-sm leading-relaxed text-white/40">
                        {exp.bullets.slice(0, 3).map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-2 h-1 w-1 rounded-full bg-white/20 shrink-0" />
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

      {skills.length > 0 && (
        <section className="px-5 py-14 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight"><EditableText field="skillsHeading" as="span">Skills</EditableText></h2>
            </motion.div>
            <motion.div {...fadeUp}>
              {skillGroups.map(group => (
                <div key={group.title} className="mb-4 last:mb-0">
                  {skillGroups.length > 1 && (
                    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">
                      <EditableText field={group.titleField} as="span">{group.title}</EditableText>
                    </h4>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill, skillIdx) => (
                      <span key={skill} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50"><EditableText field={group.skillFields[skillIdx]} as="span">{skill}</EditableText></span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {hasAny(data.projects) && (
        <section id="projects" className="px-5 py-16 border-t border-white/6">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/30 mb-2"><EditableText field="projectsKicker" as="span">Portfolio</EditableText></p>
              <h2 className="text-4xl font-semibold tracking-tight"><EditableText field="projectsHeading" as="span">Projects</EditableText></h2>
            </motion.div>
            <div className="grid gap-5">
              {data.projects.slice(0, 6).map((item, index) => (
                <motion.article key={`${item.name}-${index}`} {...fadeUp} className="group grid gap-5 border-t border-white/8 py-6 md:grid-cols-[0.5fr_1.5fr]">
                  <div>
                    <p className="text-sm text-white/25"><EditableText field={`projectNumber.${index}`} as="span">0{index + 1}</EditableText></p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight"><EditableText field={`projects.${index}.name`}>{item.name}</EditableText></h3>
                  </div>
                  <div className="overflow-hidden rounded-[1.5rem] bg-white/5">
                    <EditableImage imageKey={`project_image_${index + 3}`} src={resolvedProjectImg(index + 3)} className="aspect-[16/9] w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
                    <div className="p-5">
                      {projectDescription(item) && <p className="text-sm leading-relaxed text-white/45"><EditableText field={`projects.${index}.description`} multiline as="span">{projectDescription(item)}</EditableText></p>}
                      {item.technologies?.length > 0 && <p className="mt-3 text-xs uppercase tracking-[0.15em] text-white/25"><EditableText field={`projectTechnologies.${index}`} as="span">{item.technologies.slice(0, 4).join(' / ')}</EditableText></p>}
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
              <h2 className="text-2xl font-semibold tracking-tight"><EditableText field="educationHeading" as="span">Education</EditableText></h2>
            </motion.div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.education.map((edu, index) => (
                <motion.div key={`${edu.institution}-${index}`} {...fadeUp} className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                  <GraduationCap size={17} className="text-white/20 mb-2" />
                  <h3 className="font-semibold"><EditableText field={`education.${index}.institution`}>{edu.institution}</EditableText></h3>
                  <p className="text-sm text-white/45 mt-0.5"><EditableText field={`education.${index}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${index}.field`} as="span">{edu.field}</EditableText></> : ''}</p>
                  <p className="text-xs text-white/25 mt-1"><EditableText field={`education.${index}.startDate`}>{edu.startDate}</EditableText> — <EditableText field={`education.${index}.endDate`}>{edu.endDate || 'Present'}</EditableText></p>
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
              <h2 className="text-xl font-semibold tracking-tight mb-4"><EditableText field="certificationsHeading" as="span">Certifications</EditableText></h2>
              <div className="grid gap-2 md:grid-cols-2">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-white/[0.02] p-3.5">
                    <Award size={14} className="text-white/20 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm"><EditableText field={`certifications.${index}.name`}>{cert.name}</EditableText></p>
                      {cert.issuer && <p className="text-xs text-white/30"><EditableText field={`certifications.${index}.issuer`}>{cert.issuer}</EditableText></p>}
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
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl"><EditableText field="footerHeading">Open to new opportunities.</EditableText></h2>
            <p className="mt-3 text-white/40 max-w-md"><EditableText field="footerText" as="span">Let&apos;s discuss how I can contribute to your team.</EditableText></p>
          </div>
          <div className="space-y-4">
            <EditableLink linkField="social.email" href={contactHref(data.email || socialLinks.email)} className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-all">
              <EditableText field="contactCtaText" as="span">Contact me</EditableText> <ArrowUpRight size={15} />
            </EditableLink>
            <SocialLinksBar links={{ ...socialLinks, website: '' }} className="gap-5" iconClassName="text-white/40" textClassName="text-sm text-white/45 hover:text-white" />
          </div>
        </div>
      </footer>
    </div>
  )
}
