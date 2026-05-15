'use client'

/* eslint-disable @next/next/no-img-element */

import type { ResumeData, ResumeLioSocialLinks } from '@/types'
import { SocialLinksBar } from '../SocialLinksBar'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail } from 'lucide-react'
import {
  contactHref,
  firstName,
  hasAny,
  projectDescription,
  proofStats,
  roleLabel,
  skillsFor,
  groupedSkills,
  summaryText,
  capabilityCards,
  editableTextStoredValue,
} from './resumeLioTemplateUtils'
import { DownloadResumeButton } from '../DownloadResumeButton'
import { EditableText } from '@/components/resume-lio/edit/EditableText'
import { EditableImage } from '@/components/resume-lio/edit/EditableImage'
import { EditableLink } from '@/components/resume-lio/edit/EditableLink'
import { useResumeLioEdit } from '@/components/resume-lio/edit/ResumeLioEditContext'

/* ─── Jane Color Tokens (exact from site) ─── */
const C = {
  warmWhite: '#f7f5f0',
  white: '#ffffff',
  nearBlack: '#0a0a0a',
  dark: '#171717',
  darkCard: '#262626',
  mutedDark: '#404040',
  body: '#525252',
  muted: '#737373',
  light: '#a3a3a3',
  border: '#d4d4d4',
  borderLight: '#e5e5e5',
  bg: '#f5f5f5',
  blue: '#3e8bc2',
  blueLight: 'rgba(62, 139, 194, 0.15)',
  blueBg: 'rgb(208, 234, 252)',
  green: 'rgb(84, 209, 134)',
  greenDark: 'rgb(37, 92, 59)',
  greenBg: 'rgba(84, 209, 134, 0.15)',
} as const

/* ─── Jane Image Assets ─── */
const IMG = {
  heroProfile: 'https://framerusercontent.com/images/Ahf31PdoOE5wdPLGFBaErxSXGRI.png?scale-down-to=1024',
  heroDecoration: 'https://framerusercontent.com/images/0jOWWUeXOAD2Ly8C8jKy1u9zk.png?scale-down-to=512',
  cameraEmoji: 'https://framerusercontent.com/images/7G06z5b3CfomCLCTqAkkxl7RzJ0.png',
  texture: 'https://framerusercontent.com/images/c0EZxtMucSR6UOSZk2TBnWsqr4.svg',
  aboutPhoto: 'https://framerusercontent.com/images/CeygraPKxvSAPNHc6TzJXIJlh6g.jpg',
  projects: [
    'https://framerusercontent.com/images/nKyGkw2dbvTRfklyVe4cCjAxJU.png?scale-down-to=512',
    'https://framerusercontent.com/images/OTViKz88pqVWnOwYPThue9tPk.png?scale-down-to=512',
    'https://framerusercontent.com/images/bCF2G4thrEwopDrouV6EnDmwdw.png?scale-down-to=512',
    'https://framerusercontent.com/images/HF9Ty9YsNAjM6e7yY5pqi7RYZeU.png?scale-down-to=512',
  ],
  testimonialAvatar1: 'https://framerusercontent.com/images/4TlPvqlWCKX8OwHYnwPzlSyPM9w.jpg?scale-down-to=512',
  testimonialAvatar2: 'https://framerusercontent.com/images/QvaNrPJZMKP1kMbxE9nfjhcJOBM.jpg?scale-down-to=1024',
  scrollIndicator: 'https://framerusercontent.com/images/0HPA7HsGThSHYoTxUo9TsFY.png',
} as const

/* ─── Animation ─── */
const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as `${number}px` },
  transition: { duration: 0.7, ease },
}

const staggerParent = {
  initial: 'hidden' as const,
  whileInView: 'visible' as const,
  viewport: { once: true, margin: '-60px' as `${number}px` },
  variants: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
}

const staggerChild = {
  variants: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  },
}

/* ─── Wave SVG Dividers (exact from Jane) ─── */
function WaveDivider({ flip, color = C.warmWhite, bg = 'transparent' }: { flip?: boolean; color?: string; bg?: string }) {
  return (
    <div className="w-full overflow-hidden leading-[0] -mb-px" style={{ background: bg, transform: flip ? 'scaleY(-1)' : undefined, marginTop: flip ? '-1px' : undefined }}>
      <svg viewBox="0 0 128 32" preserveAspectRatio="none" className="block w-full" style={{ height: '60px' }}>
        <path
          d="M 43.872 7.28 C 26.324 20.46 7.312 23.76 0 23.76 L 0 32 L 128 32 L 128 23.76 C 120.688 23.76 101.676 20.464 84.128 7.28 C 77.208 2.08 70.3 0.04 64 0 C 57.7 0.04 50.788 2.08 43.872 7.28 Z"
          fill={color}
        />
      </svg>
    </div>
  )
}

/* ─── Texture Overlay ─── */
function Texture({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 print:hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
        opacity,
      }}
    />
  )
}

/* ─── Custom Cursor (cartoon arrow → pointer hand on hover) ─── */
/* SVG arrow cursor (thick outlined, white fill with dark stroke) */
const CURSOR_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='32' viewBox='0 0 28 32'%3E%3Cpath d='M2 2L2 27L8.5 20.5L14 30L18.5 28L13 18.5L22 18.5Z' fill='white' stroke='%23222' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E") 2 2, auto`
/* SVG pointer hand cursor (thick outlined, white fill with dark stroke) */
const CURSOR_POINTER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M11 18V7.5C11 6.12 12.12 5 13.5 5S16 6.12 16 7.5V15' fill='white' stroke='%23222' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M16 13.5C16 12.12 17.12 11 18.5 11S21 12.12 21 13.5V15' fill='white' stroke='%23222' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M21 14.5C21 13.12 22.12 12 23.5 12S26 13.12 26 14.5V15' fill='white' stroke='%23222' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M26 15.5C26 14.12 27.12 13 28.5 13S31 14.12 31 15.5' fill='white' stroke='%23222' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M31 15.5V22C31 26.42 27.42 30 23 30H19C16.24 30 13.73 28.68 12.17 26.6L6.5 19C5.84 18.12 6 16.88 6.88 16.22C7.76 15.56 9 15.72 9.66 16.6L11 18.5' fill='white' stroke='%23222' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 14 4, auto`

function CursorStyles() {
  return (
    <style jsx global>{`
      @media (pointer: fine) {
        .velora-cursor { cursor: ${CURSOR_ARROW}; }
        .velora-cursor a,
        .velora-cursor button,
        .velora-cursor [data-hover],
        .velora-cursor [role="button"] { cursor: ${CURSOR_POINTER}; }
      }
      @media print { .velora-cursor { cursor: auto !important; } }
    `}</style>
  )
}

/* ─── Scroll Indicator ─── */
function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
      className="flex flex-col items-center gap-2 mt-12"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="h-8 w-5 rounded-full border-2 flex items-start justify-center pt-1"
        style={{ borderColor: C.border }}
      >
        <motion.div className="h-1.5 w-1.5 rounded-full" style={{ background: C.blue }} />
      </motion.div>
      <span className="text-xs" style={{ color: C.muted, fontFamily: "'Fragment Mono', monospace" }}><EditableText field="scrollLabel" as="span">Scroll</EditableText></span>
    </motion.div>
  )
}

/* ─── Stat Card (Jane style with icon + divider) ─── */
function StatCard({ value, label, valueField, labelField, icon, isLast }: { value: string; label: string; valueField: string; labelField: string; icon: React.ReactNode; isLast?: boolean }) {
  return (
    <div className="flex items-center gap-4 flex-1">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ color: C.blue, backgroundColor: C.blueLight }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm" style={{ color: C.muted, fontFamily: "'Montserrat', sans-serif" }}><EditableText field={labelField} as="span">{label}</EditableText></p>
        <p className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.02em' }}><EditableText field={valueField} as="span">{value}</EditableText></p>
      </div>
      {!isLast && <div className="hidden md:block h-12 w-px ml-auto" style={{ background: C.borderLight }} />}
    </div>
  )
}

/* ─── Service Card (Jane offer card style) ─── */
function ServiceCard({ title, description, icon, index, showDescription }: { title: string; description: string; icon: React.ReactNode; index: number; showDescription: boolean }) {
  const bgColors = [C.blueLight, C.greenBg, 'rgba(224, 212, 81, 0.15)', 'rgba(194, 62, 62, 0.15)']
  const iconColors = [C.blue, C.greenDark, '#b5a630', '#c23e3e']
  return (
    <motion.div
      {...staggerChild}
      className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
      style={{ background: C.white, border: `1px solid ${C.borderLight}` }}
    >
      <div
        className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: bgColors[index % bgColors.length], color: iconColors[index % iconColors.length] }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: C.dark }}><EditableText field={`capabilityTitle.${index}`} as="span">{title}</EditableText></h3>
      {showDescription && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: C.body }}>
          <EditableText field={`capabilityDesc.${index}`} multiline as="span" placeholder="Add supporting detail">{description}</EditableText>
        </p>
      )}
    </motion.div>
  )
}

/* ─── Testimonial Card ─── */
function TestimonialCard({ quote, name, role, avatar, quoteField, nameField, roleField }: { quote: string; name: string; role: string; avatar: string; quoteField: string; nameField: string; roleField: string }) {
  return (
    <motion.div
      {...fadeUp}
      className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
      style={{ background: C.warmWhite, border: `1px solid ${C.borderLight}` }}
    >
      <Texture opacity={0.04} />
      <div className="relative z-20">
        <p className="text-lg leading-relaxed md:text-xl" style={{ color: C.dark, fontFamily: "'Montserrat', sans-serif" }}>
          &ldquo;<EditableText field={quoteField} multiline as="span">{quote}</EditableText>&rdquo;
        </p>
        <div className="mt-6 flex items-center gap-3">
          <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="text-sm font-bold" style={{ color: C.dark, fontFamily: "'Montserrat', sans-serif" }}><EditableText field={nameField} as="span">{name}</EditableText></p>
            <p className="text-sm" style={{ color: C.muted }}><EditableText field={roleField} as="span">{role}</EditableText></p>
          </div>
        </div>
      </div>
    </motion.div>
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

export default function VeloraTemplate({ data, socialLinks, imageOverrides = {} }: TemplateProps) {
  const editContext = useResumeLioEdit()
  const isEditing = !!editContext?.editMode
  const name = data.name || 'Your Name'
  const resolvedProjectImg = (i: number) => imageOverrides[`project_image_${i}`] || IMG.projects[i % IMG.projects.length]
  const skills = skillsFor(data)
  const skillGroups = groupedSkills(data)
  const stats = proofStats(data)
  const capabilities = capabilityCards(data)
  const role = roleLabel(data)

  const statIcons = [
    <svg key="0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
    <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>,
    <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  ]

  const serviceIcons = [
    <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>,
    <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>,
    <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
  ]

  return (
    <div className="min-h-screen overflow-x-hidden velora-cursor" style={{ background: C.warmWhite, color: C.dark, fontFamily: "'Montserrat', 'Inter', sans-serif" }}>
      <CursorStyles />

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl px-6 py-4" style={{ background: 'rgba(247, 245, 240, 0.9)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a href="#top" className="text-base font-bold tracking-tight" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }} data-hover><EditableText field="name" as="span">{name}</EditableText></a>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {['Experience', 'Projects', 'About', 'Contact'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="transition-colors duration-300" style={{ color: C.muted }} data-hover
                onMouseEnter={e => (e.currentTarget.style.color = C.dark)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
              ><EditableText field={`navLabel.${link.toLowerCase()}`} as="span">{link}</EditableText></a>
            ))}
            <DownloadResumeButton
              className="rounded-[80px] px-5 py-2.5 text-sm font-semibold"
              style={{ background: C.dark, color: C.warmWhite }}
            />
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-5xl" style={{ borderBottom: `1px solid ${C.border}` }} />
      </nav>

      {/* ═══ HERO ═══ */}
      <header id="top" className="relative px-6" style={{ padding: '128px 24px 48px' }}>
        <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-[1.2fr_0.8fr] items-center">
          <motion.div {...fadeUp}>
            <p className="text-lg" style={{ color: C.muted }}><EditableText field="heroGreeting" as="span">Hey, I&apos;m</EditableText></p>
            <h1
              className="mt-2 text-[clamp(2.8rem,7vw,3.75rem)] font-bold leading-[1.05]"
              style={{ fontFamily: "'Calistoga', 'Georgia', serif", letterSpacing: '-0.02em', color: C.nearBlack }}
            >
              <EditableText field="name" as="span">{name}</EditableText> <span className="inline-block">👋</span>
            </h1>
            <p className="mt-5 text-xl leading-relaxed md:text-2xl" style={{ color: C.body }}>
              <EditableText field="heroTaglinePrefix" as="span">Your go-to</EditableText>{' '}
              <EditableText field="currentRole" as="span" className="" style={{ color: C.blue }}>{role.toLowerCase()}</EditableText>{' '}
              <EditableText field="heroTaglineSuffix" as="span">🌴 professional.</EditableText>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <EditableLink
                linkField="social.email"
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center gap-2 rounded-[80px] px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:brightness-105"
                style={{ background: C.dark, color: C.warmWhite }}
              >
                <EditableText field="heroCtaText" as="span">Get in touch</EditableText> <ArrowUpRight size={15} />
              </EditableLink>
              {socialLinks.linkedin && (
                <EditableLink
                  linkField="social.linkedin"
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-2 rounded-[80px] px-6 py-3.5 text-sm font-medium transition-all duration-300"
                  style={{ border: `1px solid ${C.border}`, color: C.mutedDark }}
                >
                  <EditableText field="linkedinCtaText" as="span">LinkedIn</EditableText> <ArrowUpRight size={15} />
                </EditableLink>
              )}
            </div>
            <ScrollIndicator />
          </motion.div>

          {/* Profile Photo */}
          <motion.div {...fadeUp} className="flex justify-center relative">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden" style={{ border: `4px solid ${C.borderLight}` }}>
                <EditableImage imageKey="velora_hero_profile" src={imageOverrides['velora_hero_profile'] || IMG.heroProfile} className="w-full h-full object-cover" />
              </div>
              {/* Camera emoji decoration */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -bottom-2 -right-2 w-14 h-14 rounded-2xl grid place-items-center shadow-lg"
                style={{ background: C.white }}
              >
                <span className="text-2xl">📸</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ═══ STATS ═══ */}
      <section className="px-6" style={{ padding: '48px 24px' }}>
        <div className="mx-auto max-w-5xl">
          <motion.p {...fadeUp} className="mb-6 text-sm" style={{ color: C.muted }}>
            <EditableText field="statsIntro" as="span">My success is measured by results, see by yourself:</EditableText>
          </motion.p>
          <motion.div {...fadeUp} className="flex flex-col md:flex-row md:justify-center gap-6 md:gap-4">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} valueField={stat.valueField} labelField={stat.labelField} icon={statIcons[i % statIcons.length]} isLast={i === stats.length - 1} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ WAVE → GREEN SECTION (Services / Capabilities) ═══ */}
      <WaveDivider color={C.greenDark} />
      {capabilities.length > 0 && (
        <section className="relative px-6" style={{ background: C.greenDark, padding: '64px 24px 48px' }}>
          <Texture />
          <div className="relative z-20 mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-12 text-center">
              <h2
                className="text-3xl font-bold leading-tight md:text-4xl"
                style={{ fontFamily: "'Calistoga', 'Georgia', serif", color: C.warmWhite }}
              >
                <EditableText field="capabilitiesHeadingPrefix" as="span">Helping with</EditableText>{' '}
                <EditableText field="currentRole" as="span" style={{ color: C.green }}>{role.toLowerCase()}</EditableText>{' '}
                <EditableText field="capabilitiesHeadingSuffix" as="span">and delivery</EditableText>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(247, 245, 240, 0.65)' }}>
                <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
              </p>
            </motion.div>
            <motion.div {...staggerParent} className="grid gap-4 md:grid-cols-2">
              {capabilities.slice(0, 4).map((cap, i) => {
                const description = editableTextStoredValue(data, `capabilityDesc.${i}`) ?? cap.description

                return (
                  <ServiceCard
                    key={cap.title}
                    title={cap.title}
                    description={description}
                    icon={serviceIcons[i % serviceIcons.length]}
                    index={i}
                    showDescription={isEditing || Boolean(description)}
                  />
                )
              })}
            </motion.div>
            <motion.div {...fadeUp} className="mt-10 text-center">
              <a
                href="#experience"
                className="inline-flex items-center gap-2 rounded-[80px] px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:brightness-105"
                style={{ background: C.warmWhite, color: C.dark }}
                data-hover
              >
                <EditableText field="experienceCtaText" as="span">My Experience</EditableText> <ArrowUpRight size={15} />
              </a>
            </motion.div>
          </div>
        </section>
      )}
      <WaveDivider flip color={C.greenDark} />

      {/* ═══ TESTIMONIAL (Jane break-even style) ═══ */}
      {hasAny(data.experience) && (
        <section className="px-6" style={{ padding: '80px 24px' }}>
          <div className="mx-auto max-w-3xl">
            <TestimonialCard
              quote={data.experience[0]?.bullets?.[0] || `${firstName(data)} delivered beyond expectations with outstanding results and invaluable insights throughout the process.`}
              name={data.experience[0]?.company || 'Industry Professional'}
              role={data.experience[0]?.title || 'Colleague'}
              avatar={IMG.testimonialAvatar1}
              quoteField="testimonialQuote.0"
              nameField="testimonialName.0"
              roleField="testimonialRole.0"
            />
          </div>
        </section>
      )}

      {/* ═══ EXPERIENCE ═══ */}
      {hasAny(data.experience) && (
        <section id="experience" className="px-6" style={{ padding: '64px 24px' }}>
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}><EditableText field="experienceHeading" as="span">Work Experience</EditableText></h2>
              <p className="mt-2" style={{ color: C.muted }}><EditableText field="experienceSubheading" as="span">My professional background and key accomplishments.</EditableText></p>
            </motion.div>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <motion.div key={`${exp.company}-${i}`} {...fadeUp} className="rounded-3xl p-6" style={{ background: C.white, border: `1px solid ${C.borderLight}` }}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}><EditableText field={`experience.${i}.title`}>{exp.title}</EditableText></h3>
                      <p className="text-sm" style={{ color: C.blue }}><EditableText field={`experience.${i}.company`}>{exp.company}</EditableText></p>
                    </div>
                    <span className="rounded-[80px] px-3 py-1 text-xs font-medium whitespace-nowrap" style={{ background: C.bg, color: C.body }}>
                      <EditableText field={`experience.${i}.startDate`}>{exp.startDate}</EditableText> — <EditableText field={`experience.${i}.endDate`}>{exp.endDate || 'Present'}</EditableText>
                    </span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed" style={{ color: C.body }}>
                      {exp.bullets.slice(0, 4).map((bullet, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: C.blue }} />
                          <EditableText field={`experience.${i}.bullets.${j}`} multiline as="span">{bullet}</EditableText>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ WAVE → DARK SECTION (About) ═══ */}
      <WaveDivider color={C.dark} />
      <section id="about" className="relative px-6" style={{ background: C.dark, padding: '64px 24px 80px', color: C.warmWhite }}>
        <Texture />
        <div className="relative z-20 mx-auto max-w-5xl grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}>
              <EditableText field="aboutHeading" as="span">But who am I?</EditableText>
            </h2>
            <h2 className="mt-1 text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Calistoga', 'Georgia', serif", color: C.muted }}>
              <EditableText field="aboutHeadingShadow" as="span">But who am I?</EditableText>
            </h2>
            <p className="mt-6 text-lg leading-8" style={{ color: C.light }}>
              <EditableText field="summary" multiline as="span">{summaryText(data)}</EditableText>
            </p>
            <a
              href="#projects"
              className="mt-6 inline-flex items-center gap-2 rounded-[80px] px-6 py-3 text-sm font-semibold"
              style={{ background: C.warmWhite, color: C.dark }}
              data-hover
            >
              <EditableText field="aboutCtaText" as="span">My Projects</EditableText> <ArrowUpRight size={15} />
            </a>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-5">
            {/* Quote card */}
            <div className="rounded-3xl p-6" style={{ border: `1px solid ${C.darkCard}` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.muted }}><EditableText field="quoteKicker" as="span">My Fav Quote</EditableText></p>
              <p className="text-sm leading-relaxed" style={{ color: C.border }}>
                &quot;<EditableText field="favoriteQuote" multiline as="span">{data.experience?.[0]?.bullets?.[0] || 'Great work speaks for itself — just make it easy to find.'}</EditableText>&quot;
              </p>
            </div>
            {/* Location card */}
            {data.location && (
              <div className="rounded-3xl p-6" style={{ border: `1px solid ${C.darkCard}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.muted }}><EditableText field="basedInKicker" as="span">Based in</EditableText></p>
                <p className="text-lg font-bold" style={{ color: C.warmWhite }}><EditableText field="location" as="span">{data.location}</EditableText> 📍</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
      <WaveDivider flip color={C.dark} />

      {/* ═══ PROJECTS ═══ */}
      {hasAny(data.projects) && (
        <section id="projects" className="px-6" style={{ padding: '64px 24px' }}>
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}><EditableText field="projectsHeading" as="span">My Projects</EditableText></h2>
            </motion.div>
            <motion.div {...staggerParent} className="grid gap-5 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project, i) => (
                <motion.article key={`${project.name}-${i}`} {...staggerChild} className="group overflow-hidden rounded-3xl" style={{ background: C.white, border: `1px solid ${C.borderLight}` }}>
                  <div className="overflow-hidden">
                    <EditableImage imageKey={`project_image_${i}`} src={resolvedProjectImg(i)} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}><EditableText field={`projects.${i}.name`}>{project.name}</EditableText></h3>
                    {projectDescription(project) && <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.body }}><EditableText field={`projects.${i}.description`} multiline as="span">{projectDescription(project)}</EditableText></p>}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map((tech, techIndex) => (
                          <span key={tech} className="rounded-[80px] px-2.5 py-1 text-xs font-medium" style={{ background: C.bg, color: C.body }}><EditableText field={`projects.${i}.technologies.${techIndex}`} as="span">{tech}</EditableText></span>
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

      {/* ═══ SKILLS ═══ */}
      {skills.length > 0 && (
        <section className="px-6" style={{ padding: '48px 24px' }}>
          <div className="mx-auto max-w-5xl">
            <motion.div {...fadeUp} className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}><EditableText field="skillsHeading" as="span">Skills &amp; Tools</EditableText></h2>
            </motion.div>
            <motion.div {...fadeUp}>
              {skillGroups.map(group => (
                <div key={group.title} className="mb-5 last:mb-0">
                  {skillGroups.length > 1 && (
                    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: C.muted }}>
                      <EditableText field={group.titleField} as="span">{group.title}</EditableText>
                    </h4>
                  )}
                  <div className="flex flex-wrap gap-2.5">
                    {group.skills.map((skill, si) => (
                      <span
                        key={skill}
                        className="rounded-[80px] px-4 py-2.5 text-sm transition-all duration-300"
                        style={{ background: C.white, color: C.body, border: `1px solid ${C.borderLight}` }}
                        data-hover
                        onMouseEnter={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = C.blue }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.body; e.currentTarget.style.borderColor = C.borderLight }}
                      >
                        <EditableText field={group.skillFields[si]} as="span">{skill}</EditableText>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ EDUCATION & CERTS ═══ */}
      {(hasAny(data.education) || hasAny(data.certifications)) && (
        <section className="px-6" style={{ padding: '48px 24px' }}>
          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2">
            {hasAny(data.education) && (
              <motion.div {...fadeUp}>
                <h3 className="mb-4 text-lg font-bold" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}><EditableText field="educationHeading" as="span">Education</EditableText></h3>
                <div className="space-y-3">
                  {data.education.map((edu, i) => (
                    <div key={`edu-${i}`} className="rounded-3xl p-5" style={{ background: C.white, border: `1px solid ${C.borderLight}` }}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ color: C.blue, backgroundColor: C.blueLight }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm"><EditableText field={`education.${i}.institution`}>{edu.institution}</EditableText></h4>
                          <p className="text-sm" style={{ color: C.body }}><EditableText field={`education.${i}.degree`}>{edu.degree}</EditableText>{edu.field ? <>, <EditableText field={`education.${i}.field`} as="span">{edu.field}</EditableText></> : ''}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.light }}><EditableText field={`education.${i}.startDate`} as="span">{edu.startDate || ''}</EditableText>{(edu.startDate || edu.endDate) && ' — '}<EditableText field={`education.${i}.endDate`} as="span">{edu.endDate || ''}</EditableText></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {hasAny(data.certifications) && (
              <motion.div {...fadeUp}>
                <h3 className="mb-4 text-lg font-bold" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}><EditableText field="certificationsHeading" as="span">Certifications</EditableText></h3>
                <div className="space-y-3">
                  {data.certifications.map((cert, i) => (
                    <div key={`cert-${i}`} className="flex items-start gap-3 rounded-3xl p-5" style={{ background: C.white, border: `1px solid ${C.borderLight}` }}>
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ color: C.greenDark, backgroundColor: C.greenBg }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>
                      </div>
                      <div>
                        <p className="font-bold text-sm"><EditableText field={`certifications.${i}.name`}>{cert.name}</EditableText></p>
                        {cert.issuer && <p className="text-xs" style={{ color: C.light }}><EditableText field={`certifications.${i}.issuer`}>{cert.issuer}</EditableText></p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ═══ WAVE → BLUE NEWSLETTER-STYLE CTA ═══ */}
      <WaveDivider color={C.blueBg} />
      <section className="relative px-6" style={{ background: `linear-gradient(90deg, ${C.blueBg} 0%, rgb(187, 219, 242) 100%)`, padding: '64px 24px' }}>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "'Calistoga', 'Georgia', serif", color: C.dark }}>
              <EditableText field="footerHeading">Interested in working together? 🌊</EditableText>
            </h2>
            <p className="mt-3 text-base" style={{ color: C.body }}>
              <EditableText field="footerText" multiline as="span">Let&apos;s connect and discuss how I can contribute to your team or project.</EditableText>
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <EditableLink
                linkField="social.email"
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center gap-2 rounded-[80px] px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:brightness-105"
                style={{ background: C.dark, color: C.warmWhite }}
              >
                <Mail size={15} /> <EditableText field="footerCtaText" as="span">Send a message</EditableText>
              </EditableLink>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECOND TESTIMONIAL ═══ */}
      {data.experience.length > 1 && (
        <section className="px-6" style={{ padding: '80px 24px' }}>
          <div className="mx-auto max-w-3xl">
            <TestimonialCard
              quote={data.experience[1]?.bullets?.[0] || `Working with ${firstName(data)} was a game changer. They quickly understood the vision and delivered outstanding results.`}
              name={data.experience[1]?.company || 'Team Lead'}
              role={data.experience[1]?.title || 'Manager'}
              avatar={IMG.testimonialAvatar2}
              quoteField="testimonialQuote.1"
              nameField="testimonialName.1"
              roleField="testimonialRole.1"
            />
          </div>
        </section>
      )}

      {/* ═══ CONTACT FOOTER ═══ */}
      <WaveDivider color={C.dark} />
      <footer id="contact" className="relative px-6" style={{ background: C.dark, padding: '64px 24px 48px', color: C.warmWhite }}>
        <Texture />
        <div className="relative z-20 mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Calistoga', 'Georgia', serif" }}>
              <EditableText field="contactHeading">Let&apos;s work together 🤝</EditableText>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base" style={{ color: C.muted }}>
              <EditableText field="contactText" multiline as="span">Open to new opportunities. Feel free to reach out and let&apos;s create something great.</EditableText>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <EditableLink
                linkField="social.email"
                href={contactHref(data.email || socialLinks.email)}
                className="inline-flex items-center gap-2 rounded-[80px] px-7 py-3.5 text-sm font-semibold"
                style={{ background: C.warmWhite, color: C.dark }}
              >
                <Mail size={15} /> <EditableText field="contactCtaText" as="span">Send a message</EditableText>
              </EditableLink>
              {socialLinks.linkedin && (
                <EditableLink
                  linkField="social.linkedin"
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-2 rounded-[80px] px-6 py-3.5 text-sm font-medium transition-colors"
                  style={{ border: `1px solid ${C.mutedDark}`, color: C.light }}
                >
                  <EditableText field="contactLinkedinText" as="span">LinkedIn</EditableText> <ArrowUpRight size={15} />
                </EditableLink>
              )}
            </div>
            <div className="mt-8">
              <SocialLinksBar links={{ ...socialLinks, website: '' }} className="justify-center gap-5" iconClassName="" textClassName="text-sm transition-colors duration-300" style={{ color: C.body }} />
            </div>
          </motion.div>
          <div className="mx-auto mt-14 flex max-w-5xl flex-wrap items-center justify-center gap-6 pt-8 text-sm" style={{ borderTop: `1px solid ${C.darkCard}`, color: C.body }}>
            <a href="#experience" className="transition-colors" data-hover onMouseEnter={e => (e.currentTarget.style.color = C.warmWhite)} onMouseLeave={e => (e.currentTarget.style.color = C.body)}><EditableText field="footerLabel.experience" as="span">Experience</EditableText></a>
            <a href="#projects" className="transition-colors" data-hover onMouseEnter={e => (e.currentTarget.style.color = C.warmWhite)} onMouseLeave={e => (e.currentTarget.style.color = C.body)}><EditableText field="footerLabel.projects" as="span">Projects</EditableText></a>
            <a href="#about" className="transition-colors" data-hover onMouseEnter={e => (e.currentTarget.style.color = C.warmWhite)} onMouseLeave={e => (e.currentTarget.style.color = C.body)}><EditableText field="footerLabel.about" as="span">About</EditableText></a>
            <a href="#contact" className="transition-colors" data-hover onMouseEnter={e => (e.currentTarget.style.color = C.warmWhite)} onMouseLeave={e => (e.currentTarget.style.color = C.body)}><EditableText field="footerLabel.contact" as="span">Contact</EditableText></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
