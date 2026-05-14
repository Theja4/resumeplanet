import type { ResumeData, ResumeLioSocialLinks, ResumeLioTemplateId } from '@/types'

const profiles: Record<string, Pick<ResumeData, 'name' | 'currentRole' | 'location' | 'email' | 'phone' | 'linkedin' | 'website' | 'summary'>> = {
  jane: {
    name: 'Maya Collins',
    currentRole: 'Creator Partnerships Strategist',
    location: 'Austin, TX',
    email: 'maya.collins@example.com',
    phone: '+1 (512) 555-0184',
    linkedin: 'https://linkedin.com/in/mayacollins',
    website: 'https://mayacollins.co',
    summary: 'Creator partnerships strategist helping consumer brands turn audience insight into campaigns, launches, and measurable growth.',
  },
  stelvio: {
    name: 'Ethan Brooks',
    currentRole: 'Product Design Lead',
    location: 'New York, NY',
    email: 'ethan.brooks@example.com',
    phone: '+1 (646) 555-0118',
    linkedin: 'https://linkedin.com/in/ethanbrooks',
    website: 'https://ethanbrooks.design',
    summary: 'Product design lead shaping polished digital products from ambiguous briefs, with deep experience in systems, prototypes, and launch storytelling.',
  },
  velora: {
    name: 'Avery Morgan',
    currentRole: 'Brand Systems Designer',
    location: 'Los Angeles, CA',
    email: 'avery.morgan@example.com',
    phone: '+1 (310) 555-0199',
    linkedin: 'https://linkedin.com/in/averymorgan',
    website: 'https://averymorgan.studio',
    summary: 'Brand systems designer building visual identities, launch pages, and content systems for fast-moving creator-led teams.',
  },
  welvet: {
    name: 'Sofia Bennett',
    currentRole: 'Visual Designer',
    location: 'Portland, OR',
    email: 'sofia.bennett@example.com',
    phone: '+1 (503) 555-0136',
    linkedin: 'https://linkedin.com/in/sofiabennett',
    website: 'https://sofiabennett.com',
    summary: 'Visual designer focused on simple interfaces, elegant art direction, and clean systems that make creative work feel effortless.',
  },
  portfolite: {
    name: 'Jordan Hayes',
    currentRole: 'Full-Stack Creative Developer',
    location: 'Seattle, WA',
    email: 'jordan.hayes@example.com',
    phone: '+1 (206) 555-0147',
    linkedin: 'https://linkedin.com/in/jordanhayes',
    website: 'https://jordanhayes.dev',
    summary: 'Full-stack creative developer building high-converting landing pages, portfolio systems, and polished web experiences for creator teams.',
  },
  yuya: {
    name: 'Noah Carter',
    currentRole: 'Minimal Product Designer',
    location: 'San Francisco, CA',
    email: 'noah.carter@example.com',
    phone: '+1 (415) 555-0162',
    linkedin: 'https://linkedin.com/in/noahcarter',
    website: 'https://noahcarter.design',
    summary: 'Minimal product designer helping teams clarify complex products through crisp interfaces, thoughtful systems, and calm interaction design.',
  },
}

export function getResumeLioMockData(templateId: ResumeLioTemplateId): ResumeData {
  const profile = profiles[templateId] ?? profiles.jane

  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    linkedin: profile.linkedin,
    website: profile.website,
    summary: profile.summary,
    currentRole: profile.currentRole,
    experience: [
      {
        company: 'Northstar Collective',
        title: profile.currentRole,
        location: profile.location,
        startDate: 'Jan 2022',
        endDate: 'Present',
        bullets: [
          'Led creator-facing launches from discovery to delivery, improving qualified inbound opportunities by 38%.',
          'Built reusable presentation and portfolio systems that reduced pitch preparation time by 44%.',
          'Partnered with founders, designers, and growth teams to translate messy goals into focused public-facing narratives.',
        ],
      },
      {
        company: 'Brightline Studio',
        title: 'Senior Designer & Strategist',
        location: 'Remote',
        startDate: 'Jun 2019',
        endDate: 'Dec 2021',
        bullets: [
          'Shipped 18 digital experiences for creator-led brands, including portfolios, launch sites, and campaign microsites.',
          'Created research-backed visual systems that improved stakeholder approval speed and reduced revision cycles.',
        ],
      },
      {
        company: 'Atlas Media Lab',
        title: 'Digital Designer',
        location: 'Chicago, IL',
        startDate: 'Aug 2017',
        endDate: 'May 2019',
        bullets: [
          'Designed campaign assets, landing pages, and analytics reports for audience-growth projects across lifestyle and SaaS clients.',
        ],
      },
    ],
    education: [
      {
        institution: 'University of Michigan',
        degree: 'B.A.',
        field: 'Design and Communication',
        startDate: '2013',
        endDate: '2017',
        graduationDate: '2017',
        gpa: '',
      },
    ],
    skills: ['Art Direction', 'Product Strategy', 'Figma', 'Webflow', 'React', 'Brand Systems', 'Copywriting', 'Analytics', 'Stakeholder Management', 'Motion Design'],
    skillSections: [
      { title: 'Creative', skills: ['Art Direction', 'Brand Systems', 'Motion Design', 'Copywriting'] },
      { title: 'Product', skills: ['Product Strategy', 'Figma', 'Analytics', 'Stakeholder Management'] },
      { title: 'Build', skills: ['React', 'Webflow', 'Landing Pages'] },
    ],
    certifications: [
      { name: 'Advanced Product Strategy', issuer: 'Reforge', date: '2023' },
    ],
    projects: [
      {
        name: 'Creator Launch System',
        description: 'A modular launch-page and portfolio framework for creators pitching brand partnerships and retained work.',
        bullets: ['Created reusable content blocks for proof, case studies, services, and contact flows.'],
        technologies: ['Figma', 'React', 'Content Strategy'],
      },
      {
        name: 'Audience Growth Dashboard',
        description: 'A lightweight reporting experience that helped a creator team track sponsorship, campaign, and newsletter performance.',
        bullets: ['Designed the information architecture and shipped a fast interactive prototype.'],
        technologies: ['Analytics', 'Product Design', 'SQL'],
      },
      {
        name: 'Brand Partnership Deck',
        description: 'A polished visual pitch system used to close new collaborations with consumer brands and agencies.',
        bullets: ['Translated fragmented resume proof into a concise story with measurable outcomes.'],
        technologies: ['Art Direction', 'Copywriting', 'Figma'],
      },
      {
        name: 'Personal Hiring Site',
        description: 'A shareable website that turns resume sections into a premium public profile for inbound opportunities.',
        bullets: ['Combined resume data, project proof, social links, and contact actions into one recruiter-friendly experience.'],
        technologies: ['React', 'Design Systems', 'Motion'],
      },
    ],
    languages: ['English'],
    volunteer: [],
    interests: ['Photography', 'Independent media', 'Design history'],
    awards: [
      { title: 'Creator Economy Design Award', issuer: 'Indie Studio Awards', date: '2024' },
    ],
    publications: [
      { title: 'Designing portfolios that get shared', publisher: 'Creator Ops Weekly', date: '2025' },
    ],
    references: [],
    customSections: [],
  }
}

export function getResumeLioMockSocials(templateId: ResumeLioTemplateId): ResumeLioSocialLinks {
  const data = getResumeLioMockData(templateId)
  return {
    linkedin: data.linkedin,
    github: 'https://github.com/example',
    gitlab: '',
    website: data.website,
    email: data.email,
    phone: data.phone,
  }
}
