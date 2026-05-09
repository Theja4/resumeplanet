import type { Metadata } from 'next'
import type { SeoLink } from '@/lib/seo/resume-format-pages'

export type AtsTestingPage = {
  key: string
  path: string
  title: string
  description: string
  keywords: string[]
  eyebrow: string
  heading: string
  intro: string
  showChecker: boolean
  checks: Array<{
    title: string
    description: string
  }>
  workflow: string[]
  example: {
    before: string
    after: string
  }
  faqs: Array<{
    question: string
    answer: string
  }>
  related: SeoLink[]
  sourceLinks?: SeoLink[]
}

const ATS_TOOL_RELATED_LINKS: SeoLink[] = [
  {
    label: 'ATS checker',
    href: '/ats-checker',
    description: 'Run the live Rezoomed ATS checker on a PDF or DOCX resume.',
  },
  {
    label: 'ATS resume format',
    href: '/ats-resume-format',
    description: 'Fix formatting before you scan again.',
  },
  {
    label: 'Resume builder',
    href: '/resume-builder',
    description: 'Rebuild weak sections in a cleaner format.',
  },
]

export const ATS_TESTING_PAGES: Record<string, AtsTestingPage> = {
  scanner: {
    key: 'scanner',
    path: '/resume-scanner',
    title: 'Resume Scanner: Scan Your Resume for ATS and Recruiter Issues | Rezoomed',
    description:
      'Use the Rezoomed resume scanner to check parsing, formatting, keywords, and recruiter readability before you apply.',
    keywords: [
      'resume scanner',
      'resume scan',
      'scan resume',
      'resume checker',
      'ats resume scanner',
      'resume testing',
    ],
    eyebrow: 'Resume scanner',
    heading: 'Scan the resume file before employers scan it for you.',
    intro:
      'A resume scanner should help you find fixable issues before an employer portal, recruiter search, or ATS workflow judges the document.',
    showChecker: true,
    checks: [
      {
        title: 'Parsing risk',
        description: 'Checks whether contact details, section headings, dates, roles, and skills can be read cleanly.',
      },
      {
        title: 'Formatting friction',
        description: 'Flags layout choices that can make a polished resume harder for systems or recruiters to interpret.',
      },
      {
        title: 'Keyword coverage',
        description: 'Shows whether the resume has truthful role language instead of generic descriptions.',
      },
      {
        title: 'Recruiter readability',
        description: 'Looks for vague bullets, missing proof, and weak first-page positioning.',
      },
    ],
    workflow: [
      'Upload the exact PDF or DOCX you plan to send.',
      'Review parsing and formatting warnings before changing keywords.',
      'Fix weak sections in the builder or your existing document.',
      'Run one final scan after the file is exported.',
    ],
    example: {
      before: 'Managed tasks, reports, and projects for multiple teams.',
      after:
        'Built weekly reporting workflow for 4 operations teams, reducing manual status updates by 6 hours per week.',
    },
    faqs: [
      {
        question: 'Is a resume scanner the same as an ATS checker?',
        answer:
          'They overlap. A resume scanner usually checks the file broadly, while an ATS checker focuses on parsing, keywords, formatting, and applicant-tracking-system readiness.',
      },
      {
        question: 'Should I scan every resume?',
        answer:
          'Scan serious applications, especially after changing layout, summary, skills, or recent experience bullets.',
      },
      {
        question: 'Can a resume scanner guarantee interviews?',
        answer:
          'No. It can reduce preventable resume problems, but interviews still depend on fit, competition, timing, referrals, and recruiter judgment.',
      },
    ],
    related: ATS_TOOL_RELATED_LINKS,
  },
  test: {
    key: 'test',
    path: '/ats-resume-test',
    title: 'ATS Resume Test: Check If Your Resume Is ATS-Friendly | Rezoomed',
    description:
      'Run an ATS resume test to check parsing, formatting, keywords, and role alignment before submitting job applications.',
    keywords: [
      'ats resume test',
      'ats testing',
      'resume testing',
      'ats resume checker',
      'ats test resume',
      'resume ats test',
    ],
    eyebrow: 'ATS resume test',
    heading: 'Test whether your resume is ATS-friendly before you submit it.',
    intro:
      'An ATS resume test is a practical checklist: can the file be parsed, searched, matched to the role, and understood by a recruiter in one fast scan?',
    showChecker: true,
    checks: [
      {
        title: 'File readability',
        description: 'Confirms the resume uses searchable text instead of scanned images or design-only elements.',
      },
      {
        title: 'Section structure',
        description: 'Checks whether standard headings and job dates are easy to identify.',
      },
      {
        title: 'Role keywords',
        description: 'Looks for real skills, tools, and responsibilities that match the target job.',
      },
      {
        title: 'Evidence quality',
        description: 'Separates strong achievement bullets from generic responsibility statements.',
      },
    ],
    workflow: [
      'Start with a one-column, text-based resume.',
      'Run the ATS test before adding more keywords.',
      'Fix layout and section issues first.',
      'Tailor keywords only where they match your real experience.',
    ],
    example: {
      before: 'Responsible for software projects and team collaboration.',
      after:
        'Shipped React onboarding flow used by 48K monthly users, improving activation by 13% with design and data partners.',
    },
    faqs: [
      {
        question: 'What is an ATS resume test?',
        answer:
          'It is a check that helps you see whether your resume can be parsed, searched, and matched by applicant tracking systems.',
      },
      {
        question: 'What score should I aim for?',
        answer:
          'Treat the score as a diagnostic. A strong resume is readable, truthful, role-specific, and easy for a recruiter to understand.',
      },
      {
        question: 'What should I fix first?',
        answer:
          'Fix parsing and formatting first. Keyword edits matter less if the system cannot read the resume cleanly.',
      },
    ],
    related: ATS_TOOL_RELATED_LINKS,
  },
  amazonGuide: {
    key: 'amazonGuide',
    path: '/amazon-ats-resume-guide',
    title: 'Amazon ATS Resume Guide: Format, Keywords, and Application Strategy | Rezoomed',
    description:
      'Prepare an Amazon-ready resume with ATS-safe formatting, role keywords, leadership-principle proof, and an honest scan workflow before applying.',
    keywords: [
      'amazon ats resume',
      'amazon resume guide',
      'amazon resume format',
      'amazon job application resume',
      'amazon ats resume checker',
    ],
    eyebrow: 'Amazon ATS resume guide',
    heading: 'Build an Amazon resume for the job description, not a generic ATS rumor.',
    intro:
      'Amazon applications should start with the exact role requirements, then translate your experience into searchable skills, measurable proof, and examples you can defend in interviews.',
    showChecker: false,
    checks: [
      {
        title: 'Role requirements',
        description: 'Map your resume to the minimum and preferred qualifications in the Amazon posting.',
      },
      {
        title: 'Leadership-principle proof',
        description: 'Use bullets that can become interview stories around ownership, customer impact, bias for action, and measurable results.',
      },
      {
        title: 'ATS-safe format',
        description: 'Keep the resume searchable with plain headings, text-based bullets, and clean dates.',
      },
      {
        title: 'Relevant work samples',
        description: 'Amazon says samples such as writing, code, or design can be useful when they are relevant to the role.',
      },
    ],
    workflow: [
      'Choose one Amazon role and read the requirements closely.',
      'Rewrite the summary around that role family.',
      'Bring forward metrics, scope, customer impact, and ownership.',
      'Run an ATS scan before submitting the resume.',
    ],
    example: {
      before: 'Worked with teams to improve processes and customer experience.',
      after:
        'Reduced customer support handoffs by 22% by redesigning escalation workflow across operations, product, and frontline teams.',
    },
    faqs: [
      {
        question: 'Should my Amazon resume mention leadership principles?',
        answer:
          'Do not stuff principle names into every bullet. Use proof that naturally supports the principles, then prepare deeper stories for interviews.',
      },
      {
        question: 'Can I apply without a resume or CV?',
        answer:
          'Amazon has application FAQ guidance for candidates without a resume or CV, but a focused resume is still useful for most professional roles.',
      },
      {
        question: 'Should I send work samples?',
        answer:
          'Send samples only when they are relevant and polished. For technical, writing, design, or product roles, strong samples can support the resume.',
      },
    ],
    related: [
      {
        label: 'What ATS does Amazon use?',
        href: '/what-ats-does-amazon-use',
        description: 'Read the honest answer before optimizing for a rumored vendor.',
      },
      ...ATS_TOOL_RELATED_LINKS,
    ],
    sourceLinks: [
      {
        label: 'Amazon Jobs application FAQ',
        href: 'https://amazon.jobs/content/en/faq/application',
        description: 'Official Amazon guidance on applications, status, profiles, resumes, and samples.',
      },
      {
        label: 'Amazon Jobs FAQ',
        href: 'https://www.amazon.jobs/content/en/faq',
        description: 'Official Amazon jobs FAQ hub for application, assessment, interview, and technical support topics.',
      },
    ],
  },
  amazonSystem: {
    key: 'amazonSystem',
    path: '/what-ats-does-amazon-use',
    title: 'What ATS Does Amazon Use? Honest Answer for Job Seekers | Rezoomed',
    description:
      'Amazon does not publicly reduce hiring to one ATS vendor. Learn what to do instead: optimize resume format, keywords, proof, and application readiness.',
    keywords: [
      'what ats does amazon use',
      'what ats does amazon use resume',
      'amazon applicant tracking system',
      'amazon ats',
      'amazon resume ats',
    ],
    eyebrow: 'Amazon ATS answer',
    heading: 'Do not build your Amazon resume around a guessed ATS vendor.',
    intro:
      'The useful answer is not a vendor name. Amazon hiring can involve application profiles, assessments, recruiters, role teams, and job-specific requirements. Optimize for the parts you control.',
    showChecker: false,
    checks: [
      {
        title: 'No single public vendor answer',
        description: 'Amazon does not publish one universal ATS name for every candidate, role, and region on its public application FAQ.',
      },
      {
        title: 'The job description matters more',
        description: 'Requirements, responsibilities, tools, and evidence in the posting are the best resume inputs.',
      },
      {
        title: 'Parsing still matters',
        description: 'A clean, searchable resume is safer than a highly designed file no matter which system reads it.',
      },
      {
        title: 'Interview proof matters after the scan',
        description: 'Every major claim should be easy to turn into a specific interview story.',
      },
    ],
    workflow: [
      'Ignore unverified lists of ATS vendors.',
      'Use Amazon Jobs and the exact posting as your source of truth.',
      'Make the resume easy to parse and search.',
      'Scan the resume, then prepare stories behind each claim.',
    ],
    example: {
      before: 'Optimized resume only for a rumored Amazon ATS keyword list.',
      after:
        'Matched the exact Amazon role requirements with truthful skills, measurable ownership, and clean ATS-safe formatting.',
    },
    faqs: [
      {
        question: 'What ATS does Amazon use?',
        answer:
          'Amazon does not publicly state one single ATS for all roles and regions on its application FAQ. Treat vendor claims as unverified unless Amazon publishes them for your flow.',
      },
      {
        question: 'Should I keyword-stuff my Amazon resume?',
        answer:
          'No. Use the posting language when it truthfully matches your work, then support it with measurable bullets and interview-ready examples.',
      },
      {
        question: 'How should I test an Amazon resume?',
        answer:
          'Use an ATS resume test for parsing, formatting, and keyword coverage, then read it as a recruiter would for role fit and proof.',
      },
    ],
    related: [
      {
        label: 'Amazon ATS resume guide',
        href: '/amazon-ats-resume-guide',
        description: 'Build a role-specific Amazon resume with cleaner proof and formatting.',
      },
      ...ATS_TOOL_RELATED_LINKS,
    ],
    sourceLinks: [
      {
        label: 'Amazon Jobs application FAQ',
        href: 'https://amazon.jobs/content/en/faq/application',
        description: 'Official Amazon guidance on application profile, resume/CV, status, referrals, and work samples.',
      },
      {
        label: 'Amazon Jobs FAQ',
        href: 'https://www.amazon.jobs/content/en/faq',
        description: 'Official Amazon careers FAQ hub.',
      },
    ],
  },
}

export function getAtsTestingPage(key: keyof typeof ATS_TESTING_PAGES) {
  return ATS_TESTING_PAGES[key]
}

export function getAllAtsTestingStaticPaths() {
  return Object.values(ATS_TESTING_PAGES).map(page => page.path)
}

export function buildAtsTestingMetadata(page: AtsTestingPage): Metadata {
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      type: 'website',
      title: page.title,
      description: page.description,
      url: page.path,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  }
}
