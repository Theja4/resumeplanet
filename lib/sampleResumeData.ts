import type { ResumeData } from '@/types'

const SAMPLE_RESUME: ResumeData = {
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  linkedin: 'https://linkedin.com/in/alexjohnson',
  website: 'https://alexjohnson.dev',
  summary:
    'Senior Software Engineer with 6 years building scalable web applications. Led teams of 8+ engineers and shipped products used by 2M+ users.',
  experience: [
    {
      company: 'Stripe',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      bullets: [
        'Led redesign of payment API reducing merchant integration time by 40%',
        'Mentored 4 junior engineers through weekly 1:1s and code reviews',
        'Reduced API latency by 35% by implementing Redis caching',
      ],
    },
    {
      company: 'Airbnb',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jun 2020',
      endDate: 'Dec 2021',
      bullets: [
        'Built real-time pricing engine processing 1M+ requests per day',
        'Migrated legacy monolith to microservices, improving deploys 3x',
      ],
    },
  ],
  education: [
    {
      institution: 'UC Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationDate: 'May 2018',
      gpa: '3.8',
    },
  ],
  skills: [
    'TypeScript',
    'Python',
    'Go',
    'React',
    'Next.js',
    'Node.js',
    'PostgreSQL',
    'Redis',
    'AWS',
    'Docker',
    'Kubernetes',
    'GraphQL',
    'REST APIs',
  ],
  certifications: [
    { name: 'AWS Solutions Architect', issuer: 'AWS', date: '2023' },
  ],
  projects: [
    {
      name: 'OpenMetrics',
      description: 'Open-source observability platform, 2K GitHub stars',
      technologies: ['Go', 'Prometheus', 'React'],
    },
  ],
  languages: ['English (Native)', 'Spanish (Conversational)'],
  volunteer: [],
  interests: [],
  awards: [],
  publications: [],
  references: [],
}

export default SAMPLE_RESUME
