'use client'

import type { ResumeData, ResumeLioTemplateId, ResumeLioSocialLinks } from '@/types'
import dynamic from 'next/dynamic'
import { ResumeLioEditProvider, useResumeLioEdit } from './edit/ResumeLioEditContext'

const CasefileTemplate = dynamic(() => import('./templates/CasefileTemplate'))
const SignalTemplate = dynamic(() => import('./templates/SignalTemplate'))
const PearlTechTemplate = dynamic(() => import('./templates/PearlTemplate'))
const JaneTemplate = dynamic(() => import('./templates/JaneTemplate'))
const StelvioTemplate = dynamic(() => import('./templates/StelvioTemplate'))
const VeloraTemplate = dynamic(() => import('./templates/VeloraTemplate'))
const WelvetTemplate = dynamic(() => import('./templates/WelvetTemplate'))
const PortfoliteTemplate = dynamic(() => import('./templates/PortfoliteTemplate'))
const YuyaTemplate = dynamic(() => import('./templates/YuyaTemplate'))

const EMPTY_SOCIAL_LINKS: ResumeLioSocialLinks = {}
const EMPTY_IMAGE_OVERRIDES: Record<string, string> = {}
const noopSave = async () => undefined

const TEMPLATE_DESCRIPTIONS = {
  casefile: "Dark studio portfolio with serif headings, coral accents, custom cursor, marquee ticker, and smooth scroll animations",
  signal: "High-contrast studio folio with oversized editorial typography and case-study tiles",
  pearltech: "Gallery-style personal site with elegant imagery, soft pacing, and premium storytelling",
  jane: "Bold maximalist portfolio with giant uppercase hero, colorful capability cards, animated stats, and yellow energy",
  stelvio: "Dramatic project-case layout with cinematic imagery and sparse high-end portfolio pacing",
  velora: "Warm personal site with Calistoga serif headings, wave dividers, green accent sections, custom cursor, and texture overlays",
  welvet: "Dark minimal portfolio with custom cursor, grain texture, blue accent, grayscale hover effects, and generous typography",
  portfolite: "Service-forward hiring page with rounded portfolio tiles, process-style strengths, and bold CTAs",
  yuya: "Minimal creative folio with custom cursor, copy-email interaction, and restrained show-more sections"
}

interface ResumeLioTemplateRendererProps {
  templateId: ResumeLioTemplateId
  data: ResumeData
  socialLinks?: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
}

function ResumeLioTemplate({ templateId, data, socialLinks = {}, imageOverrides = {} }: ResumeLioTemplateRendererProps) {
  switch (templateId) {
    case 'casefile':
      return <CasefileTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'signal':
      return <SignalTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'pearltech':
      return <PearlTechTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'jane':
      return <JaneTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'stelvio':
      return <StelvioTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'velora':
      return <VeloraTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'welvet':
      return <WelvetTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'portfolite':
      return <PortfoliteTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    case 'yuya':
      return <YuyaTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
    default:
      return <JaneTemplate data={data} socialLinks={socialLinks} imageOverrides={imageOverrides} />
  }
}

export function ResumeLioTemplateRenderer(props: ResumeLioTemplateRendererProps) {
  const existingEditContext = useResumeLioEdit()
  const socialLinks = props.socialLinks ?? EMPTY_SOCIAL_LINKS
  const imageOverrides = props.imageOverrides ?? EMPTY_IMAGE_OVERRIDES
  const resolvedProps = { ...props, socialLinks, imageOverrides }

  if (existingEditContext) {
    return <ResumeLioTemplate {...resolvedProps} />
  }

  return (
    <ResumeLioEditProvider
      initialData={props.data}
      initialSocialLinks={socialLinks}
      initialImageOverrides={imageOverrides}
      editMode={false}
      onSave={noopSave}
    >
      <ResumeLioTemplate {...resolvedProps} />
    </ResumeLioEditProvider>
  )
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
