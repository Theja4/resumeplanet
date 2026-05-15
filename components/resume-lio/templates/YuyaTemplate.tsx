'use client'

import { useEffect, useState } from 'react'
import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { motion, useMotionValue } from 'framer-motion'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import {
  contactHref,
  firstName,
  getExperienceTenure,
  hasAny,
  initials,
  projectDescription,
  projectImage,
  roleLabel,
  skillsFor,
  groupedSkills,
  summaryText,
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

/* ── animation presets matching the framer site ── */
const slideUp = {
  initial: { opacity: 0, y: 160 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as `${number}px` },
  transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
}
const heroSlide = {
  initial: { opacity: 0, y: 175 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const },
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return [parts[0] || 'Your', 'Name']
  return [parts.slice(0, Math.ceil(parts.length / 2)).join(' '), parts.slice(Math.ceil(parts.length / 2)).join(' ')]
}

/* ── custom cursor ──
   White circle with mix-blend-mode: difference (inverts against bg).
   Default: 26px. Hover: grows to 70px. Copy: black with "Copy" text.
   Spring transition: bounce 0.2, duration 0.4. */

type CursorVariant = 'default' | 'hover' | 'copy' | 'copied'

function CustomCursor({ variant }: { variant: CursorVariant }) {
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  useEffect(() => {
    function move(e: PointerEvent) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [mouseX, mouseY])

  const isText = variant === 'copy' || variant === 'copied'
  const size = variant === 'hover' ? 70 : isText ? 'auto' : 26

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:flex items-center justify-center overflow-hidden"
      style={{
        x: mouseX,
        y: mouseY,
        translateX: '-50%',
        translateY: '-50%',
        mixBlendMode: isText ? 'normal' : 'difference',
      }}
      animate={{
        width: size,
        height: variant === 'hover' ? 70 : isText ? 'auto' : 26,
        borderRadius: 80,
        backgroundColor: isText ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
    >
      {isText && (
        <span className="whitespace-nowrap px-[30px] py-[20px] text-[14px] font-semibold text-white">
          {variant === 'copied' ? 'Copied!' : 'Copy'}
        </span>
      )}
    </motion.div>
  )
}

export default function YuyaTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || projectImage(i)
  const [copied, setCopied] = useState(false)
  const [showAllWork, setShowAllWork] = useState(false)
  const [showAllExperience, setShowAllExperience] = useState(false)
  const [cursorVariant, setCursorVariant] = useState<CursorVariant>('default')

  const hoverProps = {
    onMouseEnter: () => setCursorVariant('hover'),
    onMouseLeave: () => setCursorVariant('default'),
  }

  const email = data.email || socialLinks.email || ''
  const [topName, bottomName] = splitName(data.name || 'Your Name')
  const skills = skillsFor(data)
  const skillGroups = groupedSkills(data)
  const tenure = getExperienceTenure(data.experience)
  const visibleProjects = showAllWork ? data.projects : data.projects.slice(0, 4)
  const visibleExperience = showAllExperience ? data.experience : data.experience.slice(0, 3)

  async function copyEmail() {
    if (!email) return
    await navigator.clipboard?.writeText(email).catch(() => undefined)
    setCopied(true)
    setCursorVariant('copied')
    window.setTimeout(() => {
      setCopied(false)
      setCursorVariant('default')
    }, 1400)
  }

  const copyHoverProps = {
    onMouseEnter: () => setCursorVariant('copy'),
    onMouseLeave: () => setCursorVariant('default'),
  }

  return (
    <div
      className="relative min-h-screen cursor-none bg-white text-black [&_*]:cursor-none overflow-x-clip"
      style={{ fontFamily: 'Inter, "Inter Placeholder", sans-serif', fontFeatureSettings: '"cv09" on, "cv03" on, "cv04" on, "cv11" on' }}
    >
      <CustomCursor variant={cursorVariant} />

      {/* ── Nav ── */}
      <nav className="absolute left-0 right-0 top-0 z-10 border-b border-[#f5f5f5]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 md:px-10 lg:px-20">
          <a
            href="#top"
            className="text-[30px] font-bold tracking-[-0.06em] leading-[1.1]"
            {...hoverProps}
          >
            <EditableText field="navName" as="span">{firstName(data).toUpperCase()}</EditableText>
          </a>
          <div className="hidden gap-8 md:flex items-center">
            {['Works', 'About', 'Contact'].map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-[18px] font-medium tracking-[-0.06em] text-black transition-colors duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-[#b3b3b3]"
                {...hoverProps}
              >
                <EditableText field={`navLabel.${link.toLowerCase()}`} as="span">{link}</EditableText>
              </a>
            ))}
            <DownloadResumeButton className="text-[18px] font-medium tracking-[-0.06em] text-black transition-colors duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-[#b3b3b3]" iconSize={16} label="Resume" />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header id="top" className="flex flex-col px-5 pb-20 pt-[140px] md:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Profile row: name + avatar */}
          <div className="flex items-end justify-between gap-8">
            <motion.div {...heroSlide}>
              <h1 className="text-[clamp(76px,12vw,174px)] font-semibold uppercase leading-[1em] tracking-[-0.09em]">
                <EditableText field="name" as="span" className="block whitespace-pre-line">{`${topName}\n${bottomName}`}</EditableText>
              </h1>
            </motion.div>
            {/* Avatar */}
            <motion.div
              {...heroSlide}
              transition={{ ...heroSlide.transition, delay: 0.1 }}
              className="hidden shrink-0 md:block"
            >
              <svg viewBox="0 0 200 200" className="h-[220px] w-[220px] lg:h-[336px] lg:w-[336px]">
                <circle cx="100" cy="100" r="100" fill="#f5f5f5" />
                <text x="100" y="100" textAnchor="middle" dominantBaseline="central" fill="#000" fontSize="64" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="-0.04em">
                  {initials(data.name || '')}
                </text>
              </svg>
            </motion.div>
          </div>

          {/* Bio text */}
          <motion.div {...heroSlide} transition={{ ...heroSlide.transition, delay: 0.15 }} className="mt-10 max-w-[643px]">
            <p className="text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.1em] tracking-[-0.06em]" style={{ textAlign: 'justify' }}>
              <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
            </p>
          </motion.div>
        </div>

        {/* Divider at bottom of hero */}
        <motion.div {...heroSlide} transition={{ ...heroSlide.transition, delay: 0.2 }} className="mx-auto mt-20 md:mt-28 w-full max-w-[1600px]">
          <div className="h-px w-full bg-[#f5f5f5]" />
          <div className="mt-4 flex items-center justify-between">
            {/* Email copy */}
            <button
              type="button"
              onClick={copyEmail}
              disabled={!email}
              className="inline-flex items-center gap-2 text-[16px] font-normal text-black/60 transition-colors hover:text-black disabled:opacity-40"
              {...copyHoverProps}
            >
              <EditableText field="copyEmailText" as="span">{email || 'No email provided'}</EditableText>
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
            </button>
            <div className="flex items-center gap-3 text-[16px] font-normal text-black/60">
              {data.location && <span><EditableText field="location">{data.location}</EditableText></span>}
              {tenure?.isExperienced && (
                <>
                  {data.location && <span className="text-[#f5f5f5]">|</span>}
                  <span><EditableText field="tenure" as="span">{tenure.label}+ years experience</EditableText></span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </header>

      {/* ── Work section ── */}
      {hasAny(data.projects) && (
        <section id="works" className="px-5 pb-20 pt-8 md:px-10 lg:px-20">
          <div className="mx-auto max-w-[1600px]">
            {/* Section header */}
            <motion.div {...slideUp} className="flex items-center justify-between">
              <h2 className="text-[clamp(19px,2.5vw,30px)] font-medium tracking-[-0.03em] leading-[1.2]"><EditableText field="workHeading" as="span">work.</EditableText></h2>
              {data.projects.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllWork(v => !v)}
                  className="bg-[#f5f5f5] px-9 py-5 text-[16px] font-medium tracking-[-0.06em] text-black transition-colors hover:bg-[#ebebeb]"
                  {...hoverProps}
                >
                  <EditableText field={showAllWork ? 'showLessLabel' : 'showMoreLabel'} as="span">{showAllWork ? 'Show Less' : 'Show More'}</EditableText>
                </button>
              )}
            </motion.div>

            {/* Project grid */}
            <motion.div {...slideUp} className="mt-9 grid gap-5 md:grid-cols-2">
              {visibleProjects.map((project, index) => (
                <div key={`${project.name}-${index}`} className="group" {...hoverProps}>
                  <div className="aspect-square w-full overflow-hidden bg-[#f5f5f5]">
                    <EditableImage
                      imageKey={`project_image_${index + 6}`}
                      src={resolvedProjectImg(index + 6)}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-[18px] font-medium tracking-[-0.06em]"><EditableText field={`projects.${index}.name`}>{project.name}</EditableText></h3>
                    {projectDescription(project) && (
                      <p className="mt-1 text-[16px] leading-[1.6] text-[#333]"><EditableText field={`projects.${index}.description`} multiline as="span">{projectDescription(project)}</EditableText></p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── About section ── */}
      <section id="about" className="px-5 py-20 md:px-10 lg:px-20">
        <div className="mx-auto max-w-[1600px]">
          {/* Section header */}
          <motion.div {...slideUp} className="flex items-center justify-between">
            <h2 className="text-[clamp(19px,2.5vw,30px)] font-medium tracking-[-0.03em] leading-[1.2]"><EditableText field="aboutHeading" as="span">about.</EditableText></h2>
            {data.experience.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllExperience(v => !v)}
                className="bg-[#f5f5f5] px-9 py-5 text-[16px] font-medium tracking-[-0.06em] text-black transition-colors hover:bg-[#ebebeb]"
                {...hoverProps}
              >
                <EditableText field={showAllExperience ? 'showLessLabel' : 'showMoreLabel'} as="span">{showAllExperience ? 'Show Less' : 'Show More'}</EditableText>
              </button>
            )}
          </motion.div>

          {/* Skills */}
          {skills.length > 0 && (
            <motion.div {...slideUp} className="mt-10 mb-12">
              <p className="mb-4 text-[16px] font-medium text-[#333]"><EditableText field="skillsHeading" as="span">Skills</EditableText></p>
              {skillGroups.map(group => (
                <div key={group.title} className="mb-4 last:mb-0">
                  {skillGroups.length > 1 && (
                    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#999] mb-2">
                      <EditableText field={group.titleField} as="span">{group.title}</EditableText>
                    </h4>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {group.skills.map((skill, skillIdx) => (
                      <span key={skill} className="bg-[#f5f5f5] px-5 py-3 text-[16px] text-[#333]"><EditableText field={group.skillFields[skillIdx]} as="span">{skill}</EditableText></span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Experience */}
          {hasAny(data.experience) && (
            <motion.div {...slideUp}>
              <p className="mb-6 text-[16px] font-medium text-[#333]"><EditableText field="experienceHeading" as="span">Experience</EditableText></p>
              <div className="divide-y divide-[#f5f5f5]">
                {visibleExperience.map((exp, index) => (
                  <div key={`${exp.company}-${index}`} className="py-6">
                    <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                      <div>
                        <h3 className="text-[18px] font-medium tracking-[-0.06em]"><EditableText field={`experience.${index}.title`}>{exp.title}</EditableText></h3>
                        <p className="text-[16px] text-[#333]"><EditableText field={`experience.${index}.company`}>{exp.company}</EditableText></p>
                      </div>
                      <p className="text-[16px] text-[#b3b3b3]"><EditableText field={`experience.${index}.startDate`}>{exp.startDate}</EditableText> — <EditableText field={`experience.${index}.endDate`}>{exp.endDate || 'Present'}</EditableText></p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-3 space-y-1 text-[15px] leading-[1.6] text-[#333]">
                        {exp.bullets.slice(0, 3).map((bullet, i) => (
                          <li key={i}>— <EditableText field={`experience.${index}.bullets.${i}`} multiline as="span">{bullet}</EditableText></li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Divider */}
          {(hasAny(data.education) || hasAny(data.certifications)) && (
            <div className="my-12 h-px w-full bg-[#f5f5f5]" />
          )}

          {/* Education */}
          {hasAny(data.education) && (
            <motion.div {...slideUp} className="mb-10">
              <p className="mb-4 text-[16px] font-medium text-[#333]"><EditableText field="educationHeading" as="span">Education</EditableText></p>
              <div className="divide-y divide-[#f5f5f5]">
                {data.education.map((edu, index) => (
                  <div key={`${edu.institution}-${index}`} className="py-4">
                    <h3 className="text-[18px] font-medium tracking-[-0.06em]"><EditableText field={`education.${index}.institution`}>{edu.institution}</EditableText></h3>
                    <p className="text-[16px] text-[#333]"><EditableText field={`education.${index}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${index}.field`} as="span">{edu.field}</EditableText></> : ''}</p>
                    {(edu.startDate || edu.endDate) && (
                      <p className="text-[16px] text-[#b3b3b3]"><EditableText field={`education.${index}.startDate`}>{edu.startDate}</EditableText>{edu.endDate ? <> — <EditableText field={`education.${index}.endDate`} as="span">{edu.endDate}</EditableText></> : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Certifications */}
          {hasAny(data.certifications) && (
            <motion.div {...slideUp}>
              <p className="mb-4 text-[16px] font-medium text-[#333]"><EditableText field="certificationsHeading" as="span">Certifications</EditableText></p>
              <div className="divide-y divide-[#f5f5f5]">
                {data.certifications.map((cert, index) => (
                  <div key={`cert-${index}`} className="py-4">
                    <h3 className="text-[16px] font-medium"><EditableText field={`certifications.${index}.name`}>{cert.name}</EditableText></h3>
                    {cert.issuer && <p className="text-[16px] text-[#333]"><EditableText field={`certifications.${index}.issuer`}>{cert.issuer}</EditableText></p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Footer / Contact ── */}
      <footer id="contact" className="relative min-h-screen bg-black px-5 py-16 text-white md:px-10 lg:px-20">
        <div className="mx-auto flex h-full min-h-[calc(100vh-128px)] max-w-[1600px] flex-col justify-between">
          {/* Available badge */}
          <motion.div {...slideUp} className="flex items-center gap-3">
            <span className="relative flex h-[10px] w-[10px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-[10px] w-[10px] rounded-full bg-white" />
            </span>
            <span className="text-[16px] font-normal"><EditableText field="statusBadge" as="span">Available For Work</EditableText></span>
          </motion.div>

          {/* CTA text */}
          <motion.div {...slideUp} className="my-16">
            <p className="max-w-[900px] text-[clamp(32px,4vw,48px)] font-medium leading-[1.1em] tracking-[-0.05em]">
              <EditableText field="footerText" multiline as="span">Interested in working together? Let&apos;s connect and discuss how I can contribute to your team.</EditableText>
            </p>
          </motion.div>

          {/* Bottom row */}
          <div>
            <div className="h-px w-full bg-white/10" />
            <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1fr_1fr]">
              {/* Col 1: CTA button */}
              <motion.div {...slideUp}>
                <EditableLink
                  linkField="social.email"
                  href={contactHref(email)}
                  className="inline-flex items-center gap-3 bg-white px-9 py-5 text-[16px] font-medium text-black transition-colors hover:bg-white/90"
                  {...hoverProps}
                >
                  <EditableText field="contactCtaText" as="span">Get in Touch</EditableText> <ArrowUpRight size={16} />
                </EditableLink>
              </motion.div>

              {/* Col 2: Contact info */}
              <motion.div {...slideUp} className="space-y-2">
                {email && (
                  <EditableLink linkField="social.email" href={`mailto:${email}`} className="block text-[16px] text-white transition-colors duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-[#b3b3b3]" {...hoverProps}>
                    <EditableText field="email" as="span">{email}</EditableText>
                  </EditableLink>
                )}
                {data.phone && (
                  <EditableLink linkField="phone" href={`tel:${data.phone}`} className="block text-[16px] text-white transition-colors duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-[#b3b3b3]" {...hoverProps}>
                    <EditableText field="phone" as="span">{data.phone}</EditableText>
                  </EditableLink>
                )}
                {data.location && (
                  <p className="text-[16px] text-white/60"><EditableText field="location" as="span">{data.location}</EditableText></p>
                )}
              </motion.div>

              {/* Col 3: Social links */}
              <motion.div {...slideUp} className="space-y-2">
                {socialLinks.linkedin && (
                  <EditableLink linkField="social.linkedin" href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer nofollow ugc" className="block text-[16px] text-white transition-colors duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-[#b3b3b3]" {...hoverProps}>
                    <EditableText field="linkedinLabel" as="span">LinkedIn</EditableText>
                  </EditableLink>
                )}
                {socialLinks.github && (
                  <EditableLink linkField="social.github" href={socialLinks.github} target="_blank" rel="noopener noreferrer nofollow ugc" className="block text-[16px] text-white transition-colors duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-[#b3b3b3]" {...hoverProps}>
                    <EditableText field="githubLabel" as="span">GitHub</EditableText>
                  </EditableLink>
                )}
              </motion.div>
            </div>

            {/* Copyright */}
            <div className="mt-16 flex items-center justify-between text-[14px] text-white/40">
              <p>&copy; <EditableText field="copyrightText" as="span">{new Date().getFullYear()} {data.name}</EditableText></p>
              <p><EditableText field="currentRole" as="span">{roleLabel(data)}</EditableText></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
