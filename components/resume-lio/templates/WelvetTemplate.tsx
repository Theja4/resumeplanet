'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Plus, Minus } from 'lucide-react'
import {
  contactHref, firstName, hasAny,
  editableTextValue, projectDescription, roleLabel, skillsFor, groupedSkills, summaryText, proofStats,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'
import { useEffect, useState } from 'react'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { EditableImage } from '@/components/resume-lio/edit/EditableImage'
import { EditableLink } from '@/components/resume-lio/edit/EditableLink'

/* ─── Proxio Color Tokens (exact) ─── */
const C = {
  black: '#000000',
  surface: '#0e0e0e',
  card: '#1e1e1e',
  border: '#333333',
  muted: '#999999',
  white: '#ffffff',
  accent: '#0099ff',
  white5: '#ffffff0d',   // 5% white
  white25: '#ffffff40',  // 25% white
  white50: '#ffffff80',  // 50% white
  black85: '#000000d9',  // 85% black
  black75: '#000000bf',  // 75% black
} as const

/* ─── Proxio Image Assets ─── */
const IMAGES = {
  metallicFlower: 'https://framerusercontent.com/images/PNuQI9DRcL2AUdDWdNTx1C6Sroo.png?scale-down-to=512&width=2048&height=2048',
  aboutPhoto: 'https://framerusercontent.com/images/YqFORO8QGMNaFi1u8DzLnYSeyM.png?scale-down-to=1024&width=835&height=1121',
  heroShowcase: 'https://framerusercontent.com/images/63o2VcfSXaOuqMKYDolL0wuFk.png?scale-down-to=1024&width=1456&height=816',
  heroBg: 'https://framerusercontent.com/images/9H5LUdvDqPbTAh13RpvRnA99w6g.jpg',
  grain: 'https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png?width=256&height=256',
  portfolio: [
    'https://framerusercontent.com/images/54rbUw01VIeEKaPEu2AqdjskmE.jpg?width=544&height=340',
    'https://framerusercontent.com/images/8hwnXGrE24RbFLPjVYz7bGts.jpg?width=544&height=340',
    'https://framerusercontent.com/images/9esUMSdNPOhpssb9NMLUzX3mVk.jpg?width=544&height=340',
    'https://framerusercontent.com/images/CpjOMZxInjh2m35pUmzl69IfVY.jpg?width=544&height=340',
    'https://framerusercontent.com/images/EPKQqQop2QRMKlamU4K27ZSiiuQ.jpg?width=544&height=340',
    'https://framerusercontent.com/images/ifKbCyFraWFKnuz8LDUZExylV3Q.jpg?width=544&height=340',
  ],
  testimonialAvatars: [
    'https://framerusercontent.com/images/QV7NZlTtakhzkwDZl90LqsFaK4.jpg?width=500&height=500',
    'https://framerusercontent.com/images/XYsUHyL9NXAjhVQfctW8TN7c8o.jpg?width=500&height=500',
  ],
  decorativeSvg: 'https://framerusercontent.com/images/iRjKsumlllAOUFQjF7j1DcasTU.svg?width=320&height=320',
  logoSvg: 'https://framerusercontent.com/images/5tYK2rgTTHscCjvYBZW3LPp4DKk.svg?width=284&height=220',
} as const

/* ─── Animation ─── */
const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as `${number}px` },
  transition: { duration: 0.8, ease },
}

const staggerParent = {
  initial: 'hidden' as const,
  whileInView: 'visible' as const,
  viewport: { once: true, margin: '-60px' as `${number}px` },
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  },
}

const staggerChild = {
  variants: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
  },
}

/* ─── Custom Cursor (Proxio-style) ─── */
function CustomCursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { damping: 25, stiffness: 300 })
  const springY = useSpring(y, { damping: 25, stiffness: 300 })
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    const enter = () => setHovered(true)
    const leave = () => setHovered(false)
    window.addEventListener('mousemove', move)
    const els = document.querySelectorAll('a, button, [data-hover]')
    els.forEach(el => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave) })
    return () => {
      window.removeEventListener('mousemove', move)
      els.forEach(el => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave) })
    }
  }, [x, y])

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block print:hidden"
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
    >
      <motion.div
        animate={{ width: hovered ? 64 : 20, height: hovered ? 64 : 20, opacity: hovered ? 0.15 : 0.5 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ borderRadius: '50%', background: C.white, mixBlendMode: 'difference' }}
      />
    </motion.div>
  )
}

/* ─── Grain Overlay (Proxio exact) ─── */
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.04] print:hidden"
      style={{
        backgroundImage: `url("${IMAGES.grain}")`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'left top',
      }}
    />
  )
}

/* ─── Section Label (Fragment Mono) ─── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-sm uppercase tracking-[0.2em]"
      style={{ color: C.muted, fontFamily: "'Fragment Mono', 'SF Mono', 'Fira Code', monospace" }}
    >
      {children}
    </span>
  )
}

/* ─── Portfolio Card (grayscale → color hover, dark overlay, hover arrow) ─── */
function PortfolioCard({ title, description, image, fieldIdx }: { title: string; description: string; image: string; fieldIdx: number }) {
  return (
    <motion.div {...staggerChild} className="group relative" data-hover>
      <div className="overflow-hidden rounded-2xl relative" style={{ border: `1px solid ${C.border}` }}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <EditableImage imageKey={`project_image_${fieldIdx}`} src={image} alt={title} className="h-full w-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105" />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 65%, black 100%)' }} />
          {/* Hover arrow icon */}
          <div
            className="absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
            style={{ background: C.accent }}
          >
            <ArrowUpRight size={18} color={C.white} />
          </div>
          {/* Title over image */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
            <h3 className="text-lg font-medium" style={{ color: C.white }}><EditableText field={`projects.${fieldIdx}.name`}>{title}</EditableText></h3>
            {description && <p className="mt-1 text-sm line-clamp-1" style={{ color: C.white50 }}><EditableText field={`projects.${fieldIdx}.description`} multiline>{description}</EditableText></p>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Career Item ─── */
function CareerItem({ year, title, company, description, fieldIdx }: { year: string; title: string; company: string; description: string; fieldIdx: number }) {
  return (
    <motion.div
      {...fadeUp}
      className="grid gap-4 md:grid-cols-[160px_1fr] py-8"
      style={{ borderTop: `1px solid ${C.border}` }}
    >
      <div>
        <span
          className="text-sm"
          style={{ color: C.muted, fontFamily: "'Fragment Mono', 'SF Mono', monospace" }}
        >
          <EditableText field={`experience.${fieldIdx}.startDate`}>{year}</EditableText>
        </span>
      </div>
      <div>
        <h3 className="text-xl font-medium" style={{ color: C.white }}><EditableText field={`experience.${fieldIdx}.title`}>{title}</EditableText></h3>
        <p className="mt-1 text-sm font-medium" style={{ color: C.accent }}><EditableText field={`experience.${fieldIdx}.company`}>{company}</EditableText></p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: C.muted }}><EditableText field={`experience.${fieldIdx}.bullets.0`} multiline>{description}</EditableText></p>
      </div>
    </motion.div>
  )
}

/* ─── FAQ Item (accordion) ─── */
function FaqItem({ question, answer, questionField, answerField }: { question: string; answer: string; questionField: string; answerField: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-6 text-left"
        style={{ color: C.white }}
        data-hover
      >
        <span className="text-base font-medium pr-4"><EditableText field={questionField} as="span">{question}</EditableText></span>
        <span className="shrink-0" style={{ color: C.muted }}>
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-sm leading-relaxed" style={{ color: C.muted }}><EditableText field={answerField} multiline as="span">{answer}</EditableText></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Testimonial Card ─── */
function TestimonialCard({ quote, name, role, avatar, index }: { quote: string; name: string; role: string; avatar: string; index: number }) {
  return (
    <motion.div
      {...staggerChild}
      className="rounded-2xl p-6 md:p-8"
      style={{
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.card} 100%)`,
        border: `1px solid ${C.border}`,
        boxShadow: '0 16px 64px #000',
      }}
    >
      <p className="text-sm leading-relaxed md:text-base" style={{ color: C.white }}>&ldquo;<EditableText field={`testimonialQuote.${index}`} multiline as="span">{quote}</EditableText>&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-sm font-medium" style={{ color: C.white }}><EditableText field={`testimonialName.${index}`} as="span">{name}</EditableText></p>
          <p className="text-xs" style={{ color: C.muted }}><EditableText field={`testimonialRole.${index}`} as="span">{role}</EditableText></p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Service Marquee (Proxio logo marquee style) ─── */
function ServiceMarquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items, ...items]
  return (
    <div
      className="relative overflow-hidden py-8"
      style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}
    >
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ['0%', '-33.33%'] }}
        transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-12">
            <span className="text-sm font-medium uppercase tracking-[0.15em]" style={{ color: C.white50 }}>{item}</span>
            <span style={{ color: C.border }}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN TEMPLATE
   ═══════════════════════════════════════════ */

interface TemplateProps {
  data: ResumeData
  socialLinks: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
}

export default function WelvetTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const skills = skillsFor(data)
  const skillGroups = groupedSkills(data)
  const stats = proofStats(data)
  const name = data.name || 'Your Name'
  const role = roleLabel(data)
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || IMAGES.portfolio[i % IMAGES.portfolio.length]

  /* Build testimonials from experience/references data */
  const testimonials = [
    {
      quote: data.experience[0]?.bullets?.[0] || `${firstName(data)} delivered beyond expectations. Not only did they create outstanding results, but they also provided invaluable insights throughout the process.`,
      name: data.experience[0]?.company || 'Industry Professional',
      role: data.experience[0]?.title || 'Colleague',
      avatar: IMAGES.testimonialAvatars[0],
    },
    {
      quote: data.experience[1]?.bullets?.[0] || `Working with ${firstName(data)} was a game changer. They quickly understood the vision and translated it into excellent, polished work.`,
      name: data.experience[1]?.company || 'Team Lead',
      role: data.experience[1]?.title || 'Manager',
      avatar: IMAGES.testimonialAvatars[1],
    },
  ]

  /* Build FAQ from resume data */
  const faqs = [
    { q: `What is ${firstName(data)}'s professional background?`, a: summaryText(data) },
    { q: 'What key skills and technologies are you proficient in?', a: skills.length > 0 ? `I'm proficient in ${skills.slice(0, 8).join(', ')}${skills.length > 8 ? ' and more' : ''}.` : 'I have expertise across multiple technologies and methodologies.' },
    { q: 'Are you open to new opportunities?', a: `Yes, I'm open to discussing new opportunities and collaborations. Feel free to reach out via email${data.email ? ` at ${data.email}` : ''}.` },
    { q: 'Can you walk me through your experience?', a: data.experience[0] ? `Most recently, I worked as ${data.experience[0].title} at ${data.experience[0].company}. ${data.experience[0].bullets?.[0] || ''}` : 'I have a diverse professional background with experience across multiple roles and industries.' },
  ]

  /* Build "Why me" / benefit items */
  const benefits = [
    { title: 'Efficient Workflow', description: 'Streamlined process for rapid delivery, meeting tight deadlines without compromising quality or detail.', icon: '⚡' },
    { title: 'Collaborative Process', description: 'I work closely with teams, integrating feedback to create results that exceed expectations.', icon: '🤝' },
    { title: 'Attention to Detail', description: 'Meticulous attention to every element, ensuring a polished and cohesive final product that impresses.', icon: '🎯' },
    { title: 'Strategic Thinking', description: 'I approach every challenge with a strategic mindset, aligning solutions with long-term goals and objectives.', icon: '💡' },
  ]

  return (
    <div
      className="min-h-screen relative"
      style={{ background: C.black, color: C.white, fontFamily: "'Inter', sans-serif", cursor: 'none' }}
    >
      <CustomCursor />
      <GrainOverlay />

      {/* ═══ NAVIGATION ═══ */}
      <nav className="relative z-10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <a href="#top" className="text-base font-medium" style={{ color: C.white }} data-hover>
            <EditableText field="navName" as="span">{editableTextValue(data, 'navName', firstName(data))}</EditableText>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Portfolio', href: '#portfolio' },
              { label: 'About', href: '#about' },
              { label: 'Contact', href: '#contact' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-300 hover:!text-white"
                style={{ color: C.muted }}
                data-hover
              >
                <EditableText field={`navLabel.${link.label.toLowerCase()}`} as="span">{link.label}</EditableText>
              </a>
            ))}
            <DownloadResumeButton
              label="Download CV"
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:opacity-90"
              style={{ background: C.white, color: C.black }}
            />
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION (Proxio exact layout) ═══ */}
      <section id="top" className="relative overflow-hidden px-6 md:px-10" style={{ padding: '140px 40px 0' }}>
        {/* Background glow circle */}
        <div
          className="absolute inset-0 m-auto rounded-full pointer-events-none"
          style={{
            width: '500px',
            height: '500px',
            background: C.white,
            filter: 'blur(64px)',
            opacity: 0.1,
          }}
        />

        <div className="relative mx-auto max-w-[1120px] flex flex-col items-center text-center" style={{ gap: '40px' }}>
          <motion.div {...fadeUp} className="flex flex-col items-center" style={{ gap: '24px' }}>
            <h1
              className="text-[clamp(2.5rem,8vw,5rem)] font-normal leading-[1.1]"
              style={{ letterSpacing: '-0.03em', color: C.white }}
            >
              <EditableText field="heroGreetingPrefix" as="span">{editableTextValue(data, 'heroGreetingPrefix', "Hello, I'm")}</EditableText>{' '}
              <EditableText field="name">{firstName(data)}</EditableText> 👋
            </h1>
            <p className="text-lg md:text-xl" style={{ color: C.muted }}>
              <span style={{ color: C.accent }}><EditableText field="currentRole">{role}</EditableText></span>
              {' '}<EditableText field="heroTaglineSuffix" as="span">{editableTextValue(data, 'heroTaglineSuffix', 'crafting clean & modern solutions')}</EditableText>
            </p>
          </motion.div>

          <motion.div {...fadeUp}>
            <EditableLink
              linkField="social.email"
              href={contactHref(data.email || socialLinks.email)}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 hover:brightness-110"
              style={{ background: C.white, color: C.black }}
            >
              <EditableText field="heroCtaText" as="span">{editableTextValue(data, 'heroCtaText', 'Get in touch')}</EditableText> <ArrowUpRight size={16} />
            </EditableLink>
          </motion.div>

          {/* Hero Showcase Image with metallic flower */}
          <motion.div {...fadeUp} className="relative w-full max-w-[1120px] mt-8">
            <div className="relative">
              <EditableImage imageKey="welvet_hero_showcase" src={IMAGES.heroShowcase} alt="Showcase" className="w-full rounded-2xl" style={{ boxShadow: '0 16px 64px #000' }} />
              {/* Dark gradient fade at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[400px] rounded-b-2xl"
                style={{ background: `linear-gradient(180deg, transparent 0%, ${C.black} 100%)` }}
              />
            </div>
            {/* Metallic Flower decoration (positioned right) */}
            <div className="absolute -right-16 -top-16 w-48 h-48 md:w-64 md:h-64 pointer-events-none">
              <img
                src={IMAGES.metallicFlower}
                alt=""
                className="w-full h-full object-contain"
                style={{ filter: `drop-shadow(0px 16px 27px ${C.black})` }}
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══ STATS ROW ═══ */}
      <section className="px-6 md:px-10" style={{ padding: '60px 40px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <motion.div {...fadeUp} className="mx-auto max-w-[1120px] flex items-center justify-center gap-12 md:gap-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-5xl font-normal" style={{ color: C.white, letterSpacing: '-0.03em' }}>
                <EditableText field={stat.valueField} as="span">{stat.value}</EditableText><span style={{ color: C.accent }}>+</span>
              </div>
              <p className="text-xs mt-2 uppercase tracking-[0.15em]" style={{ color: C.muted }}><EditableText field={stat.labelField} as="span">{stat.label}</EditableText></p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══ SERVICES MARQUEE ═══ */}
      {skills.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <ServiceMarquee items={skills.slice(0, 10)} />
        </div>
      )}

      {/* ═══ PORTFOLIO / PROJECTS ═══ */}
      {hasAny(data.projects) && (
        <section id="portfolio" className="px-6 md:px-10" style={{ padding: '120px 40px 100px' }}>
          <div className="mx-auto max-w-[1120px] flex flex-col items-center" style={{ gap: '48px' }}>
            <motion.div {...fadeUp} className="flex flex-col items-center text-center" style={{ gap: '24px' }}>
              <Label><EditableText field="portfolioKicker" as="span">{editableTextValue(data, 'portfolioKicker', 'Portfolio')}</EditableText></Label>
              <h2 className="text-3xl font-normal md:text-[48px] leading-[1.2]" style={{ letterSpacing: '-0.03em', color: C.white }}>
                <EditableText field="portfolioHeading" multiline as="span" className="whitespace-pre-line">
                  {editableTextValue(data, 'portfolioHeading', 'My Latest\nProjects')}
                </EditableText>
              </h2>
            </motion.div>

            <motion.div
              {...staggerParent}
              className="w-full"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(50px, 1fr))', gap: '32px' }}
            >
              {data.projects.slice(0, 6).map((project, i) => (
                <PortfolioCard
                  key={`${project.name}-${i}`}
                  title={project.name}
                  description={projectDescription(project)}
                  image={resolvedProjectImg(i)}
                  fieldIdx={i}
                />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ ABOUT PARAGRAPH (large text) ═══ */}
      <section className="px-6 md:px-10" style={{ padding: '100px 40px' }}>
        <motion.div {...fadeUp} className="mx-auto flex justify-center">
          <p
            className="text-xl md:text-[28px] leading-relaxed md:leading-[40px] text-center max-w-[1120px]"
            style={{ color: C.white, letterSpacing: '-0.02em' }}
          >
            <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>{' '}
            <span style={{ color: C.muted }}>
              {data.location
                ? <EditableText field="aboutParagraphSuffix" as="span">{editableTextValue(data, 'aboutParagraphSuffix', `Based in ${data.location}, I bring a results-driven approach to every challenge.`)}</EditableText>
                : <EditableText field="aboutParagraphSuffix" as="span">{editableTextValue(data, 'aboutParagraphSuffix', 'I bring a results-driven approach to every challenge, creating solutions that look amazing and deliver real value.')}</EditableText>
              }
            </span>
          </p>
        </motion.div>
      </section>

      {/* ═══ ABOUT SECTION (image left + content right) ═══ */}
      <section id="about" className="px-6 md:px-10" style={{ padding: '100px 40px' }}>
        <div className="mx-auto max-w-[1120px] flex flex-col md:flex-row items-stretch" style={{ gap: '48px' }}>
          {/* Left: About Image */}
          <motion.div {...fadeUp} className="flex-1 relative rounded-3xl overflow-hidden" style={{ minHeight: '560px' }}>
            <EditableImage imageKey="welvet_about" src={IMAGES.aboutPhoto} alt="About" className="absolute inset-0 w-full h-full object-cover object-top" />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, ${C.black} 100%)` }} />
            {/* Name tag overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full" style={{ background: C.accent }} />
                <span className="text-sm uppercase tracking-[0.2em]" style={{ color: C.white50 }}><EditableText field="statusBadge" as="span">Available for opportunities</EditableText></span>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <div className="flex-1 flex flex-col justify-center" style={{ gap: '40px' }}>
            <motion.div {...fadeUp} className="flex flex-col" style={{ gap: '24px' }}>
              <Label><EditableText field="aboutKicker" as="span">{editableTextValue(data, 'aboutKicker', 'About')}</EditableText></Label>
              <h2
                className="text-3xl font-normal md:text-[40px] leading-[1.15]"
                style={{ letterSpacing: '-0.03em', color: C.white }}
              >
                <EditableText field="name">{firstName(data)}</EditableText>{' '}
                <EditableText field="aboutRolePrefix" as="span">{editableTextValue(data, 'aboutRolePrefix', `is a${/^[aeiou]/i.test(role) ? 'n' : ''}`)}</EditableText>{' '}
                <span style={{ color: C.accent }}><EditableText field="currentRole">{role}</EditableText></span>{' '}
                <EditableText field="aboutRoleSuffix" as="span">{editableTextValue(data, 'aboutRoleSuffix', 'who delivers results')}</EditableText>
              </h2>
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>
                <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
              </p>
            </motion.div>

            {/* Benefit Grid 2x2 — styled cards instead of emojis */}
            <motion.div
              {...staggerParent}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(50px, 1fr))', gap: '16px' }}
            >
              {benefits.slice(0, 4).map((b, i) => (
                <motion.div
                  key={b.title}
                  {...staggerChild}
                  className="rounded-2xl p-5 relative overflow-hidden group"
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                  }}
                  data-hover
                >
                  {/* Accent line top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: C.accent }}
                  />
                  <div className="flex flex-col gap-3">
                    {/* Number indicator instead of emoji */}
                    <span
                      className="text-xs font-medium uppercase tracking-[0.2em]"
                      style={{ color: C.accent, fontFamily: "'Fragment Mono', monospace" }}
                    >
                      <EditableText field={`benefitNumber.${i}`} as="span">0{i + 1}</EditableText>
                    </span>
                    <h4 className="text-sm font-medium" style={{ color: C.white }}><EditableText field={`benefitTitle.${i}`} as="span">{b.title}</EditableText></h4>
                    <p className="text-xs leading-relaxed" style={{ color: C.muted }}><EditableText field={`benefitDesc.${i}`} multiline as="span">{b.description}</EditableText></p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══ CAREER / EXPERIENCE ═══ */}
      {hasAny(data.experience) && (
        <section className="px-6 md:px-10" style={{ padding: '100px 40px' }}>
          <div className="mx-auto max-w-[1120px] flex flex-col items-center" style={{ gap: '80px' }}>
            <motion.div {...fadeUp} className="flex flex-col items-center text-center" style={{ gap: '24px' }}>
              <Label><EditableText field="careerKicker" as="span">{editableTextValue(data, 'careerKicker', 'Career')}</EditableText></Label>
              <h2
                className="text-3xl font-normal md:text-[48px] leading-[1.2]"
                style={{ letterSpacing: '-0.03em', color: C.white }}
              >
                <EditableText field="careerHeading" multiline as="span" className="whitespace-pre-line">
                  {editableTextValue(data, 'careerHeading', 'And This Is\nMy Career')}
                </EditableText>
              </h2>
            </motion.div>

            <div className="w-full max-w-[1120px]">
              {data.experience.map((exp, i) => (
                <CareerItem
                  key={`${exp.company}-${i}`}
                  year={exp.startDate?.match(/\d{4}/)?.[0] || ''}
                  title={exp.title}
                  company={exp.company}
                  description={exp.bullets?.[0] || `Contributed as ${exp.title} at ${exp.company}.`}
                  fieldIdx={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ EDUCATION & SKILLS ═══ */}
      {(hasAny(data.education) || hasAny(data.certifications) || skills.length > 0) && (
        <section className="px-6 md:px-10" style={{ padding: '100px 40px' }}>
          <div className="mx-auto max-w-[1120px] grid gap-12 md:grid-cols-2">
            {/* Education */}
            <div>
              {hasAny(data.education) && (
                <motion.div {...fadeUp}>
                  <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: C.muted, fontFamily: "'Fragment Mono', monospace" }}>
                    <EditableText field="educationHeading" as="span">{editableTextValue(data, 'educationHeading', 'Education')}</EditableText>
                  </h3>
                  <div className="space-y-3">
                    {data.education.map((edu, i) => (
                      <div
                        key={`edu-${i}`}
                        className="rounded-2xl p-5"
                        style={{ background: C.card, border: `1px solid ${C.border}` }}
                      >
                        <h4 className="text-sm font-medium" style={{ color: C.white }}><EditableText field={`education.${i}.institution`}>{edu.institution}</EditableText></h4>
                        <p className="text-sm mt-1" style={{ color: C.muted }}>
                          <EditableText field={`education.${i}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${i}.field`} as="span">{edu.field}</EditableText></> : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {hasAny(data.certifications) && (
                <motion.div {...fadeUp} className="mt-8">
                  <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: C.muted, fontFamily: "'Fragment Mono', monospace" }}>
                    <EditableText field="certificationsHeading" as="span">{editableTextValue(data, 'certificationsHeading', 'Certifications')}</EditableText>
                  </h3>
                  <div className="space-y-3">
                    {data.certifications.map((cert, i) => (
                      <div
                        key={`cert-${i}`}
                        className="rounded-2xl p-4"
                        style={{ background: C.card, border: `1px solid ${C.border}` }}
                      >
                        <p className="text-sm font-medium" style={{ color: C.white }}><EditableText field={`certifications.${i}.name`}>{cert.name}</EditableText></p>
                        {cert.issuer && <p className="text-xs mt-1" style={{ color: C.muted }}><EditableText field={`certifications.${i}.issuer`}>{cert.issuer}</EditableText></p>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Skills + Languages */}
            <div>
              {skills.length > 0 && (
                <motion.div {...fadeUp}>
                  <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: C.muted, fontFamily: "'Fragment Mono', monospace" }}>
                    <EditableText field="skillsHeading" as="span">{editableTextValue(data, 'skillsHeading', 'Skills')}</EditableText>
                  </h3>
                  {skillGroups.map(group => (
                    <div key={group.title} className="mb-4 last:mb-0">
                      {skillGroups.length > 1 && (
                        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: C.muted }}>
                          <EditableText field={group.titleField} as="span">{group.title}</EditableText>
                        </h4>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {group.skills.map((skill, si) => (
                          <span
                            key={skill}
                            className="rounded-full px-4 py-2 text-sm transition-all duration-300"
                            style={{ background: C.white5, color: C.muted, border: `1px solid ${C.border}` }}
                            data-hover
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.white }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
                          >
                            <EditableText field={group.skillFields[si]} as="span">{skill}</EditableText>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {hasAny(data.languages) && (
                <motion.div {...fadeUp} className="mt-8">
                  <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4" style={{ color: C.muted, fontFamily: "'Fragment Mono', monospace" }}>
                    <EditableText field="languagesHeading" as="span">{editableTextValue(data, 'languagesHeading', 'Languages')}</EditableText>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.languages.map((lang, i) => (
                      <span
                        key={i}
                        className="rounded-full px-4 py-2 text-sm"
                        style={{ background: C.white5, color: C.muted, border: `1px solid ${C.border}` }}
                      >
                        <EditableText field={`languages.${i}`}>{lang}</EditableText>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ WHY ME — large text + capability cards ═══ */}
      <section className="px-6 md:px-10" style={{ padding: '100px 40px', background: C.surface }}>
        <div className="mx-auto max-w-[1120px] flex flex-col" style={{ gap: '64px' }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: '24px' }}>
            <motion.div {...fadeUp} className="flex flex-col" style={{ gap: '16px' }}>
              <Label><EditableText field="whyMeKicker" as="span">{editableTextValue(data, 'whyMeKicker', 'Why me?')}</EditableText></Label>
              <h2
                className="text-3xl font-normal md:text-[48px] leading-[1.15]"
                style={{ letterSpacing: '-0.03em', color: C.white }}
              >
                <EditableText field="whyMeHeading" multiline as="span" className="whitespace-pre-line">
                  {editableTextValue(data, 'whyMeHeading', 'What I bring\nto the table')}
                </EditableText>
              </h2>
            </motion.div>
            <motion.div {...fadeUp}>
              <p className="text-base max-w-md" style={{ color: C.muted }}>
                <EditableText field="whyMeText" multiline as="span">
                  {editableTextValue(
                    data,
                    'whyMeText',
                    data.location
                      ? `Based in ${data.location}, combining deep expertise with a collaborative, results-driven approach.`
                      : 'Combining deep expertise with a collaborative, results-driven approach to every challenge.',
                  )}
                </EditableText>
              </p>
            </motion.div>
          </div>

          {/* Capability strips — horizontal rows with number, title, description */}
          <motion.div {...staggerParent} className="w-full">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                {...staggerChild}
                className="flex items-start gap-6 md:gap-10 py-8 group"
                style={{ borderTop: `1px solid ${C.border}` }}
                data-hover
              >
                <span
                  className="text-sm shrink-0 mt-1"
                  style={{ color: C.accent, fontFamily: "'Fragment Mono', monospace" }}
                >
                  <EditableText field={`faqNumber.${i}`} as="span">0{i + 1}</EditableText>
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-start md:gap-12">
                  <h3
                    className="text-xl md:text-2xl font-normal md:w-64 shrink-0 group-hover:translate-x-1 transition-transform duration-300"
                    style={{ color: C.white, letterSpacing: '-0.02em' }}
                  >
                    <EditableText field={`capabilityTitle.${i}`} as="span">{b.title}</EditableText>
                  </h3>
                  <p className="text-sm leading-relaxed mt-2 md:mt-1" style={{ color: C.muted }}>
                    <EditableText field={`capabilityDesc.${i}`} multiline as="span">{b.description}</EditableText>
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-6 md:px-10" style={{ padding: '100px 40px' }}>
        <div className="mx-auto max-w-[1120px] flex flex-col items-center" style={{ gap: '48px' }}>
          <motion.div {...fadeUp} className="flex flex-col items-center text-center" style={{ gap: '24px' }}>
            <Label><EditableText field="testimonialsKicker" as="span">{editableTextValue(data, 'testimonialsKicker', 'Testimonials')}</EditableText></Label>
            <h2
              className="text-3xl font-normal md:text-[40px] leading-[1.2]"
              style={{ letterSpacing: '-0.03em', color: C.white }}
            >
              <EditableText field="testimonialsHeading" as="span">{editableTextValue(data, 'testimonialsHeading', 'What others say')}</EditableText>
            </h2>
          </motion.div>

          <motion.div {...staggerParent} className="grid gap-6 md:grid-cols-2 w-full">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} quote={t.quote} name={t.name} role={t.role} avatar={t.avatar} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FAQs ═══ */}
      <section className="px-6 md:px-10" style={{ padding: '100px 40px', background: C.surface }}>
        <div className="mx-auto max-w-[1120px] flex flex-col items-center" style={{ gap: '48px' }}>
          <motion.div {...fadeUp} className="flex flex-col items-center text-center" style={{ gap: '24px' }}>
            <Label><EditableText field="faqKicker" as="span">{editableTextValue(data, 'faqKicker', 'Frequently Asked')}</EditableText></Label>
            <h2
              className="text-3xl font-normal md:text-[40px] leading-[1.2]"
              style={{ letterSpacing: '-0.03em', color: C.white }}
            >
              <EditableText field="faqHeading" as="span">{editableTextValue(data, 'faqHeading', 'Questions')}</EditableText>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="w-full max-w-3xl" style={{ borderTop: `1px solid ${C.border}` }}>
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} questionField={`faqQuestion.${i}`} answerField={`faqAnswer.${i}`} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CONTACT CTA (Proxio "Let's Get in Touch") ═══ */}
      <footer id="contact" className="relative px-6 md:px-10" style={{ padding: '160px 40px' }}>
        <div className="mx-auto max-w-[1120px] text-center flex flex-col items-center" style={{ gap: '24px' }}>
          <motion.div {...fadeUp}>
            <h2
              className="text-5xl font-normal md:text-[80px] leading-[1.1]"
              style={{ letterSpacing: '-0.03em' }}
            >
              <EditableText field="footerHeading"><span style={{ color: C.white }}>Let&apos;s Get in</span>
              <br />
              <span style={{ color: C.accent }}>Touch</span></EditableText>
            </h2>
          </motion.div>
          <motion.div {...fadeUp}>
            <p className="text-base max-w-md" style={{ color: C.muted }}>
              <EditableText field="footerText" multiline as="span">Let&apos;s connect and start working together on something great.</EditableText>
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="mt-4">
            <EditableLink
              linkField="social.email"
              href={contactHref(data.email || socialLinks.email)}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 hover:brightness-110"
              style={{ background: C.white, color: C.black }}
            >
              <EditableText field="contactCtaText" as="span">{editableTextValue(data, 'contactCtaText', 'Get in touch')}</EditableText> <ArrowUpRight size={16} />
            </EditableLink>
          </motion.div>
        </div>
      </footer>

      {/* ═══ FOOTER (Proxio-style with gradient name) ═══ */}
      <div className="px-6 md:px-10 py-10" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Large gradient name */}
          <span
            className="text-4xl font-normal md:text-5xl"
            style={{
              letterSpacing: '-0.04em',
              background: `linear-gradient(270deg, ${C.muted} 0%, ${C.border} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {name}
          </span>

          <div className="flex flex-col items-center gap-4 md:items-end">
            <SocialLinksBar
              links={{ ...socialLinks, website: '' }}
              className="gap-5"
              iconClassName=""
              textClassName="text-sm transition-colors duration-300"
              style={{ color: C.muted }}
            />
            <p className="text-xs" style={{ color: C.border }}>
              &copy; <EditableText field="copyrightPrefix" as="span">{new Date().getFullYear()} {name}.</EditableText> <EditableText field="copyrightText" as="span">{editableTextValue(data, 'copyrightText', 'All rights reserved.')}</EditableText>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
