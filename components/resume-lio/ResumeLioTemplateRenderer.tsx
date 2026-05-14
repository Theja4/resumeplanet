'use client'

import type { ResumeData, ResumeLioTemplateId, ResumeLioSocialLinks } from '@/types'
import dynamic from 'next/dynamic'

const CasefileTemplate = dynamic(() => import('./templates/CasefileTemplate'))
const SignalTemplate = dynamic(() => import('./templates/SignalTemplate'))
const PearlTechTemplate = dynamic(() => import('./templates/PearlTemplate'))
const JaneTemplate = dynamic(() => import('./templates/JaneTemplate'))
const StelvioTemplate = dynamic(() => import('./templates/StelvioTemplate'))
const VeloraTemplate = dynamic(() => import('./templates/VeloraTemplate'))
const WelvetTemplate = dynamic(() => import('./templates/WelvetTemplate'))
const PortfoliteTemplate = dynamic(() => import('./templates/PortfoliteTemplate'))
const YuyaTemplate = dynamic(() => import('./templates/YuyaTemplate'))

const TEMPLATE_DESCRIPTIONS = {
  casefile: "Dark studio portfolio with serif headings, coral accents, custom cursor, marquee ticker, and smooth scroll animations",
  signal: "High-contrast studio folio with oversized editorial typography and case-study tiles",
  pearltech: "Gallery-style personal site with elegant imagery, soft pacing, and premium storytelling",
  jane: "Bold maximalist portfolio with giant uppercase hero, colorful capability cards, animated stats, and yellow energy",
  stelvio: "Dramatic project-case layout with cinematic imagery and sparse high-end portfolio pacing",
  velora: "Maximalist personal site with blue-green accents, dark alternating sections, stat cards, and bold friendly typography",
  welvet: "Quiet premium portfolio with sculptural imagery, large type, and refined resume chronology",
  portfolite: "Service-forward hiring page with rounded portfolio tiles, process-style strengths, and bold CTAs",
  yuya: "Minimal creative folio with custom cursor, copy-email interaction, and restrained show-more sections"
}

interface ResumeLioTemplateRendererProps {
  templateId: ResumeLioTemplateId
  data: ResumeData
  socialLinks?: ResumeLioSocialLinks
}

export function ResumeLioTemplateRenderer({ templateId, data, socialLinks = {} }: ResumeLioTemplateRendererProps) {
  switch (templateId) {
    case 'casefile':
      return <CasefileTemplate data={data} socialLinks={socialLinks} />
    case 'signal':
      return <SignalTemplate data={data} socialLinks={socialLinks} />
    case 'pearltech':
      return <PearlTechTemplate data={data} socialLinks={socialLinks} />
    case 'jane':
      return <JaneTemplate data={data} socialLinks={socialLinks} />
    case 'stelvio':
      return <StelvioTemplate data={data} socialLinks={socialLinks} />
    case 'velora':
      return <VeloraTemplate data={data} socialLinks={socialLinks} />
    case 'welvet':
      return <WelvetTemplate data={data} socialLinks={socialLinks} />
    case 'portfolite':
      return <PortfoliteTemplate data={data} socialLinks={socialLinks} />
    case 'yuya':
      return <YuyaTemplate data={data} socialLinks={socialLinks} />
    default:
      return <JaneTemplate data={data} socialLinks={socialLinks} />
  }
}

export const TEMPLATE_INFO = {
  casefile: { name: "Launchpad", description: TEMPLATE_DESCRIPTIONS.casefile },
  signal: { name: "Field Notes", description: TEMPLATE_DESCRIPTIONS.signal },
  pearltech: { name: "Gallery", description: TEMPLATE_DESCRIPTIONS.pearltech },
  jane: { name: "Jane", description: TEMPLATE_DESCRIPTIONS.jane },
  stelvio: { name: "Stelvio", description: TEMPLATE_DESCRIPTIONS.stelvio },
  velora: { name: "Velora", description: TEMPLATE_DESCRIPTIONS.velora },
  welvet: { name: "Welvet", description: TEMPLATE_DESCRIPTIONS.welvet },
  portfolite: { name: "Portfolite", description: TEMPLATE_DESCRIPTIONS.portfolite },
  yuya: { name: "Minimal", description: TEMPLATE_DESCRIPTIONS.yuya }
}
