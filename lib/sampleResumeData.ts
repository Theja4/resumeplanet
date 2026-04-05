import type { ResumeData } from '@/types'

export const SAMPLE_RESUME: ResumeData = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  phone: '+1 (555) 000-1234',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexjohnson',
  website: 'alexjohnson.dev',
  summary: 'Product manager with 6 years of experience leading cross-functional teams to ship consumer and enterprise software. Proven track record of driving growth through data-informed decisions.',
  currentRole: 'Senior Product Manager',
  experience: [
    {
      company: 'Acme Corp',
      title: 'Senior Product Manager',
      location: 'San Francisco, CA',
      startDate: 'Jan 2021',
      endDate: 'Present',
      bullets: [
        'Led roadmap for a $12M ARR product, growing MAU by 40% in 12 months',
        'Managed a cross-functional team of 8 engineers, 2 designers, and 3 data analysts',
        'Launched 3 major features that increased retention by 22%',
      ],
    },
    {
      company: 'StartupXYZ',
      title: 'Product Manager',
      location: 'New York, NY',
      startDate: 'Jun 2018',
      endDate: 'Dec 2020',
      bullets: [
        'Defined and shipped the core onboarding flow reducing time-to-value by 35%',
        'Coordinated with 5 enterprise clients to shape the product vision',
      ],
    },
  ],
  education: [
    {
      institution: 'Stanford University',
      degree: 'B.S.',
      field: 'Computer Science',
      graduationDate: 'May 2018',
      gpa: '3.8',
    },
  ],
  skills: [
    'Product Strategy', 'Roadmapping', 'SQL', 'A/B Testing',
    'Figma', 'JIRA', 'Python', 'Stakeholder Management',
  ],
  certifications: [],
  projects: [],
  languages: ['English (Native)', 'Spanish (Conversational)'],
  volunteer: [],
  interests: [],
  awards: [],
  publications: [],
  references: [],
  customSections: [],
}
