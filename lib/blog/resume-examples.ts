import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import type { BuilderVisibility, ResumeData, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY } from '@/types'

export interface BlogResumeExample {
  id: string
  blogSlug: string
  title: string
  sourceLabel: string
  sourceUrl: string
  sourceNote: string
  analysisPoints: string[]
  resumeData: ResumeData
  templateConfig: UniversalConfig
  visibility: BuilderVisibility
}

export interface BlogResumeExampleSeedRow {
  id: string
  blog_slug: string
  title: string
  source_label: string
  source_url: string
  source_note: string
  analysis_points: string[]
  resume_data: ResumeData
  template_config: UniversalConfig
  builder_visibility: BuilderVisibility
  is_active: boolean
}

const GOOGLE_TEAM_LEADER_RESUME: ResumeData = {
  name: 'Peter Fernando',
  email: 'hello@kickresume.com',
  phone: '9999 999 999',
  location: 'Birmingham, UK',
  linkedin: '',
  website: '',
  summary:
    'Digital marketing leader with 16+ years of experience building growth programs, mentoring teams, and turning training, content, and performance marketing into measurable business outcomes. Led Google Digital Garage programming in Birmingham, partnered with local organizations, and scaled community reach through practical digital-skills education.',
  currentRole: 'Team Leader',
  experience: [
    {
      company: 'Google Digital Garage',
      title: 'Team Leader',
      location: 'Birmingham, UK',
      startDate: 'Jun 2017',
      endDate: 'Present',
      bullets: [
        'Managed and mentored a 16-person team, coordinating workshops, coaching sessions, and local partnership programs across Birmingham.',
        'Delivered 7 digital marketing courses to audiences ranging from 1:1 mentoring to 500 attendees, helping businesses and job seekers build practical skills.',
        'Opened new training channels with organizations including Birmingham Job Centre, Birmingham Chamber of Commerce, and Business First Network.',
        'Trained and onboarded 5 team members on new course delivery and audience-support workflows.',
        'Worked with management to target new geographic areas, increasing Digital Garage footfall by 35%+.',
      ],
    },
    {
      company: 'UBT (EU) Ltd.',
      title: 'Senior Digital Marketing Manager',
      location: 'Birmingham, UK',
      startDate: 'Nov 2015',
      endDate: 'Dec 2016',
      bullets: [
        'Built a digital sales pipeline worth GBP 450K+ within 7 months while leading SEO, PPC, email, content, and web-delivery work.',
        'Grew email lists by 53%+ within 6 months while launching 3 new websites and marketing automation workflows.',
        'Increased website conversion value by GBP 620K within 6 months for the Providore brand, finishing 27% above target.',
        'Unified 30 fragmented databases into a master marketing dataset and delivered social media training to 60+ participants.',
      ],
    },
    {
      company: 'Enquiniti',
      title: 'Campaign Manager',
      location: 'Birmingham, UK',
      startDate: 'Mar 2017',
      endDate: 'Jun 2017',
      bullets: [
        'Advised the internal marketing team on communication strategy and customer-journey optimization for savings and investment plan experiences.',
        'Developed a website engagement strategy that increased average visitor duration by more than 8 minutes.',
        'Prototyped a mobile-compatible account-management concept to improve customer usability.',
      ],
    },
  ],
  education: [
    {
      institution: 'Aston University',
      degree: 'BSc',
      field: 'Computing for Business',
      startDate: '',
      endDate: '',
      graduationDate: '',
      gpa: '',
    },
  ],
  skills: [
    'Team Leadership',
    'Workshop Facilitation',
    'Stakeholder Management',
    'Partnership Development',
    'SEO',
    'PPC',
    'Email Marketing',
    'Content Marketing',
    'Marketing Automation',
    'Lead Nurturing',
    'CRM Integration',
    'Conversion Optimization',
    'Shopify',
    'Magento',
    'WooCommerce',
    'HubSpot',
    'Mailchimp',
    'Balsamiq',
    'HTML/CSS',
  ],
  skillSections: [
    {
      title: 'Leadership & Delivery',
      skills: ['Team Leadership', 'Workshop Facilitation', 'Stakeholder Management', 'Partnership Development'],
    },
    {
      title: 'Growth & Marketing',
      skills: ['SEO', 'PPC', 'Email Marketing', 'Content Marketing', 'Marketing Automation', 'Lead Nurturing', 'CRM Integration', 'Conversion Optimization'],
    },
    {
      title: 'Platforms & Tools',
      skills: ['Shopify', 'Magento', 'WooCommerce', 'HubSpot', 'Mailchimp', 'Balsamiq', 'HTML/CSS'],
    },
  ],
  certifications: [],
  projects: [],
  languages: [],
  volunteer: [],
  interests: [],
  awards: [],
  publications: [],
  references: [],
  customSections: [],
}

const GOOGLE_TEAM_LEADER_VISIBILITY: BuilderVisibility = {
  ...DEFAULT_VISIBILITY,
  sections: {
    ...DEFAULT_VISIBILITY.sections,
    contact: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    languages: false,
    projects: false,
    certifications: false,
    volunteer: false,
    interests: false,
    awards: false,
    publications: false,
    references: false,
  },
  items: {
    ...DEFAULT_VISIBILITY.items,
    experience: [true, true, true],
    education: [true],
  },
  sectionOrder: ['summary', 'experience', 'education'],
  sidebarSectionOrder: ['skills'],
  density: 'compressed',
}

const GOOGLE_TEAM_LEADER_TEMPLATE = sanitizeUniversalConfig({
  accentColor: '#0F6B3A',
  fontFamily: 'Helvetica, Arial, sans-serif',
  headerStyle: 'classic',
  bulletStyle: 'plain',
  skillsStyle: 'inline',
  sectionHeadingStyle: 'rule',
  contactStyle: 'inline',
  dateLayout: 'right',
  nameSize: 'large',
  density: 'compressed',
})

const BLOG_RESUME_EXAMPLES: BlogResumeExample[] = [
  {
    id: 'google-team-leader',
    blogSlug: 'how-to-land-a-google-job',
    title: 'Google Team Leader Resume Example',
    sourceLabel: 'Kickresume',
    sourceUrl: 'https://www.kickresume.com/en/help-center/google-team-leader-resume-sample/',
    sourceNote:
      'Adapted from a public Google-hired resume sample shared by Kickresume. The layout was tightened for readability inside Rezoomed, while the underlying role history, scope, and outcomes stay aligned with the published example.',
    analysisPoints: [
      'The role target is obvious in the first screen, so the recruiter does not need to infer what the candidate wants.',
      'The bullets prove scope with numbers: 16 staff, audiences up to 500, 35%+ footfall growth, GBP 450K+ pipeline, and GBP 620K conversion lift.',
      'The experience reads like ownership and outcomes, not a job-description dump.',
      'Skills are grouped by function, which is cleaner for both recruiter scanning and ATS parsing.',
    ],
    resumeData: GOOGLE_TEAM_LEADER_RESUME,
    templateConfig: GOOGLE_TEAM_LEADER_TEMPLATE,
    visibility: GOOGLE_TEAM_LEADER_VISIBILITY,
  },
]

export function getBlogResumeExampleById(id: string | null | undefined) {
  if (!id) return null
  return BLOG_RESUME_EXAMPLES.find(example => example.id === id) ?? null
}

export function getBlogResumeExampleForSlug(slug: string) {
  return BLOG_RESUME_EXAMPLES.find(example => example.blogSlug === slug) ?? null
}

export function getBlogResumeExampleSeedRows(): BlogResumeExampleSeedRow[] {
  return BLOG_RESUME_EXAMPLES.map(example => ({
    id: example.id,
    blog_slug: example.blogSlug,
    title: example.title,
    source_label: example.sourceLabel,
    source_url: example.sourceUrl,
    source_note: example.sourceNote,
    analysis_points: example.analysisPoints,
    resume_data: example.resumeData,
    template_config: example.templateConfig,
    builder_visibility: example.visibility,
    is_active: true,
  }))
}
