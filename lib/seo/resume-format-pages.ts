import type { Metadata } from 'next'

export type SeoLink = {
  label: string
  href: string
  description: string
}

export type ResumeFormatPage = {
  key: string
  path: string
  title: string
  description: string
  /** @deprecated Removed from emitted metadata. Kept optional for back-compat with existing fixtures. */
  keywords?: string[]
  eyebrow: string
  heading: string
  intro: string
  intent: string
  screenshotTitle: string
  screenshotSubtitle: string
  quickWins: string[]
  sectionOrder: string[]
  template: {
    name: string
    summary: string
    skills: string[]
    bullets: string[]
  }
  beforeAfter: Array<{
    before: string
    after: string
  }>
  atsRules: string[]
  faqs: Array<{
    question: string
    answer: string
  }>
  related: SeoLink[]
  roleLinks?: SeoLink[]
}

export const RESUME_FORMAT_ROLE_LINKS: SeoLink[] = [
  {
    label: 'Software engineer resume format',
    href: '/resume-format/software-engineer',
    description: 'A technical resume structure for shipped work, scale, tools, and searchable skills.',
  },
  {
    label: 'Product manager resume format',
    href: '/resume-format/product-manager',
    description: 'A PM format for outcomes, product scope, discovery, execution, and stakeholder proof.',
  },
  {
    label: 'Data analyst resume format',
    href: '/resume-format/data-analyst',
    description: 'A data resume layout that makes SQL, dashboards, metrics, and business impact easy to scan.',
  },
  {
    label: 'Finance resume format',
    href: '/resume-format/finance',
    description: 'A finance format for modeling, reporting, controls, deals, and measurable business support.',
  },
  {
    label: 'Marketing resume format',
    href: '/resume-format/marketing',
    description: 'A marketing format for channels, campaigns, creative testing, pipeline, and revenue impact.',
  },
]

const FORMAT_RELATED_LINKS: SeoLink[] = [
  {
    label: 'ATS resume format',
    href: '/ats-resume-format',
    description: 'Use the ATS-safe version when your resume will go through a large employer portal.',
  },
  {
    label: 'US resume format',
    href: '/us-resume-format',
    description: 'Use the U.S. version for American job applications and recruiter expectations.',
  },
  {
    label: 'ATS checker',
    href: '/ats-checker',
    description: 'Upload your current file and see what the scanner flags before you apply.',
  },
]

export const RESUME_FORMAT_PAGES: Record<string, ResumeFormatPage> = {
  hub: {
    key: 'hub',
    path: '/resume-format',
    title: 'Resume Format Guide: ATS-Safe Templates, Examples, and Rules | Rezoomed',
    description:
      'Choose the right resume format for job applications with ATS-safe rules, before-and-after examples, role templates, and builder-ready resume structure.',
    eyebrow: 'Resume format hub',
    heading: 'The resume format that is easiest for recruiters and ATS tools to read.',
    intro:
      'A strong resume format does not try to impress with decoration. It makes your target role, strongest proof, dates, skills, and outcomes easy to find in the first scan.',
    intent: 'Best for job seekers choosing one clean format before applying.',
    screenshotTitle: 'General ATS-safe resume format',
    screenshotSubtitle: 'One column, predictable sections, proof-first bullets.',
    quickWins: [
      'Use one column unless the employer gives a specific template.',
      'Put name, phone, email, LinkedIn, and location in searchable text.',
      'Lead with role fit and proof, not an objective statement.',
      'Keep headings standard so software and recruiters know where to look.',
    ],
    sectionOrder: ['Contact', 'Summary', 'Skills', 'Experience', 'Projects or Certifications', 'Education'],
    template: {
      name: 'Target-role resume template',
      summary:
        'Role-focused professional with experience in [domain], [core skill], and [business outcome]. Known for [strength] across [scope, customer, product, team, or market].',
      skills: ['Core tools', 'Role keywords', 'Methods', 'Industry context', 'Certifications'],
      bullets: [
        'Improved [business metric] by [result] through [action], [tool], and [scope].',
        'Led [project or process] for [team/customer/system], reducing [problem] by [result].',
        'Partnered with [stakeholders] to deliver [outcome] across [scale].',
      ],
    },
    beforeAfter: [
      {
        before: 'Responsible for reports and daily operations.',
        after:
          'Built weekly operations reports for a 12-person team, reducing manual status updates by 5 hours per week.',
      },
      {
        before: 'Worked on customer issues and team projects.',
        after:
          'Resolved 160+ customer escalations and documented recurring issues that improved handoff speed by 24%.',
      },
    ],
    atsRules: [
      'Avoid image-only resumes, skill bars, and text hidden in icons.',
      'Do not place critical contact details in headers or footers.',
      'Use standard headings: Summary, Skills, Experience, Projects, Education.',
      'Keep bullets short enough for a recruiter to understand in one pass.',
      'Use the same language as the job description only when it is truthful.',
    ],
    faqs: [
      {
        question: 'What is the proper resume format for most jobs?',
        answer:
          'For most jobs, use a one-column reverse-chronological resume with contact information, summary, skills, experience, optional projects or certifications, and education.',
      },
      {
        question: 'Is a two-column resume bad for ATS?',
        answer:
          'A two-column resume can work in some systems, but it creates more parsing risk. A one-column layout is the safer default for online applications.',
      },
      {
        question: 'Should I use PDF or DOCX?',
        answer:
          'Follow the employer instructions. If both are accepted, use a clean text-based PDF or DOCX and avoid scanned or image-only files.',
      },
    ],
    related: FORMAT_RELATED_LINKS,
    roleLinks: RESUME_FORMAT_ROLE_LINKS,
  },
  us: {
    key: 'us',
    path: '/us-resume-format',
    title: 'US Resume Format: Best Practices, Examples, and ATS Rules | Rezoomed',
    description:
      'Use the correct U.S. resume format with section order, header rules, ATS-safe formatting, examples, and a builder-ready template.',
    eyebrow: 'U.S. resume format',
    heading: 'A U.S. resume should be direct, searchable, and proof-heavy.',
    intro:
      'In the U.S. market, the resume should help the recruiter decide fit quickly. Keep personal details limited, make the header searchable, and use bullets that prove impact instead of describing duties.',
    intent: 'Best for applications to U.S.-based employers.',
    screenshotTitle: 'U.S. resume format example',
    screenshotSubtitle: 'No photo, no full street address, no personal demographics.',
    quickWins: [
      'Use city and state, not a full street address.',
      'Do not add a photo, marital status, age, or nationality.',
      'Keep the summary to 2 to 4 lines focused on target-role fit.',
      'Use one page for early career, two pages when the detail earns the space.',
    ],
    sectionOrder: ['Name and contact', 'Summary', 'Core skills', 'Work experience', 'Education', 'Certifications'],
    template: {
      name: 'U.S. resume opening template',
      summary:
        '[Target role] with [X]+ years of experience in [industry or function], [core tool or method], and [measurable outcome]. Strong record of [business impact] across [scope].',
      skills: ['Technical skills', 'Business skills', 'Tools', 'Methods', 'Certifications'],
      bullets: [
        'Delivered [outcome] for [team/customer/product] by improving [process/system/workflow].',
        'Managed [scope] across [stakeholders], increasing [metric] by [result].',
        'Created [asset/report/process] used by [audience] to make [decision/action] faster.',
      ],
    },
    beforeAfter: [
      {
        before: 'Seeking a challenging opportunity where I can grow and learn.',
        after:
          'Operations analyst with 4+ years of experience in workflow reporting, vendor coordination, and process improvement.',
      },
      {
        before: 'Handled many accounts and helped customers.',
        after:
          'Managed 80+ SMB accounts and improved renewal follow-up completion from 71% to 93% in one quarter.',
      },
    ],
    atsRules: [
      'Use a professional email and a LinkedIn URL if the profile is current.',
      'Write dates consistently, such as Jan 2022 to Mar 2025.',
      'Place education after experience unless you are a student or recent graduate.',
      'Do not include references directly on the resume.',
      'Use measurable bullets in the most recent roles first.',
    ],
    faqs: [
      {
        question: 'What should not be included in a U.S. resume?',
        answer:
          'Leave out photos, date of birth, marital status, nationality, full street address, references, and unrelated personal information.',
      },
      {
        question: 'How long should a U.S. resume be?',
        answer:
          'One page is common for students and early-career candidates. Two pages is normal when the experience is relevant and improves the hiring decision.',
      },
      {
        question: 'Should my U.S. resume include a summary?',
        answer:
          'A summary is useful when it is specific. Keep it short and connect your experience to the exact role direction.',
      },
    ],
    related: FORMAT_RELATED_LINKS,
    roleLinks: RESUME_FORMAT_ROLE_LINKS,
  },
  ats: {
    key: 'ats',
    path: '/ats-resume-format',
    title: 'ATS Resume Format: Safe Layout Rules and Examples | Rezoomed',
    description:
      'Build an ATS resume format that parses cleanly with safe headings, searchable text, keyword placement, examples, and a free ATS checker CTA.',
    eyebrow: 'ATS resume format',
    heading: 'The safest ATS resume format is boring in the right places.',
    intro:
      'Applicant tracking systems reward clarity. Keep the structure simple, put every important detail in searchable text, and use job-description language naturally where it matches your real experience.',
    intent: 'Best for online applications through large employer portals.',
    screenshotTitle: 'ATS-safe structure',
    screenshotSubtitle: 'Readable text, normal headings, simple bullets.',
    quickWins: [
      'Use a text-based PDF or DOCX, not a scan or screenshot.',
      'Avoid tables, text boxes, icon-only labels, and skill bars.',
      'Keep section names predictable so parsing stays clean.',
      'Run an ATS check after changing format or keywords.',
    ],
    sectionOrder: ['Contact', 'Summary', 'Skills', 'Experience', 'Projects', 'Education'],
    template: {
      name: 'ATS-friendly bullet formula',
      summary:
        '[Role] with experience in [must-have skill], [tool], and [job responsibility]. Built [proof] across [scope] with measurable impact on [metric].',
      skills: ['Job title keywords', 'Required tools', 'Certifications', 'Methods', 'Industry terms'],
      bullets: [
        'Used [tool/method] to deliver [business outcome] across [scope].',
        'Improved [metric] by [result] after identifying [problem] and implementing [action].',
        'Collaborated with [team] to ship [project], supporting [customer/business goal].',
      ],
    },
    beforeAfter: [
      {
        before: 'Skills: MS Office, Communication, Leadership, Detail-oriented.',
        after:
          'Skills: Excel, SQL reporting, stakeholder communication, vendor coordination, operating metrics.',
      },
      {
        before: 'Designed a beautiful resume with icons for all contact details.',
        after:
          'Placed phone, email, LinkedIn, and city in plain searchable text below the name.',
      },
    ],
    atsRules: [
      'Use standard bullets, not custom symbols that may parse as corrupted characters.',
      'Keep company, title, location, and dates close together.',
      'Group skills by relevance instead of dumping every keyword into one line.',
      'Do not hide keywords in white text or footer text.',
      'Use the ATS checker before and after major resume edits.',
    ],
    faqs: [
      {
        question: 'What is an ATS resume format?',
        answer:
          'It is a resume layout designed to be easy for applicant tracking systems to parse and easy for recruiters to scan.',
      },
      {
        question: 'Can ATS read PDF resumes?',
        answer:
          'Many systems can read text-based PDFs, but employer instructions win. If a posting asks for DOCX, use DOCX.',
      },
      {
        question: 'Do ATS keywords matter more than formatting?',
        answer:
          'Formatting comes first. If the system cannot read the document cleanly, keyword alignment becomes less useful.',
      },
    ],
    related: [
      {
        label: 'Free ATS checker',
        href: '/ats-checker',
        description: 'Scan your current resume for parsing, keyword, and formatting issues.',
      },
      {
        label: 'ATS resume test',
        href: '/ats-resume-test',
        description: 'Use a step-by-step test before sending applications.',
      },
      {
        label: 'Resume scanner',
        href: '/resume-scanner',
        description: 'Check the resume file recruiters and systems will actually read.',
      },
    ],
    roleLinks: RESUME_FORMAT_ROLE_LINKS,
  },
  applications: {
    key: 'applications',
    path: '/resume-format-for-job-applications',
    title: 'Resume Format for Job Applications: Templates, Examples, and ATS Tips | Rezoomed',
    description:
      'Use a cleaner resume format for job applications with ATS rules, role alignment, examples, and a workflow for checking before you submit.',
    eyebrow: 'Job application format',
    heading: 'Format your resume for the application, not just the template preview.',
    intro:
      'The best application resume is the version that survives parsing, answers the job description, and gives the recruiter enough proof to keep reading.',
    intent: 'Best for candidates applying through employer portals and job boards.',
    screenshotTitle: 'Application-ready resume',
    screenshotSubtitle: 'Target role on top, truthful keywords, clean sections.',
    quickWins: [
      'Save a separate resume version for each serious role.',
      'Match the top third to the job description before applying.',
      'Keep the file name professional and specific.',
      'Run a final ATS scan when you change layout or key sections.',
    ],
    sectionOrder: ['Target title', 'Summary', 'Skills matched to posting', 'Recent experience', 'Proof projects', 'Education'],
    template: {
      name: 'Application-specific resume template',
      summary:
        '[Target title] with [X] years of experience relevant to [job requirement]. Experience includes [skill 1], [skill 2], and [outcome].',
      skills: ['Posting keywords', 'Must-have tools', 'Role outcomes', 'Domain terms', 'Credentials'],
      bullets: [
        'Rewrote [process/system] to improve [metric] for [audience].',
        'Applied [job-required skill] in [project/context], producing [result].',
        'Owned [responsibility] across [scope], coordinating with [stakeholders].',
      ],
    },
    beforeAfter: [
      {
        before: 'Used one resume for sales, operations, and account management roles.',
        after:
          'Created separate versions with different summaries, skills emphasis, and first-page proof for each role type.',
      },
      {
        before: 'Applied immediately after seeing an interesting job.',
        after:
          'Checked minimum qualifications, matched truthful keywords, scanned the file, then submitted.',
      },
    ],
    atsRules: [
      'Read the job description before editing the resume.',
      'Use one file per role direction so keywords and proof stay focused.',
      'Keep the first page aligned to the target role.',
      'Do not add skills you cannot explain in an interview.',
      'Check the final file, not a draft in another format.',
    ],
    faqs: [
      {
        question: 'Should I change my resume format for every job application?',
        answer:
          'You do not need a new layout every time, but you should change the summary, skills emphasis, and most relevant bullets for serious applications.',
      },
      {
        question: 'What resume format works best on job boards?',
        answer:
          'A simple reverse-chronological, one-column resume works best for most job boards because it is easier to parse and scan.',
      },
      {
        question: 'How do I know if my application resume is ready?',
        answer:
          'Check that the resume is readable, role-specific, ATS-safe, and backed by real proof before submitting.',
      },
    ],
    related: FORMAT_RELATED_LINKS,
    roleLinks: RESUME_FORMAT_ROLE_LINKS,
  },
}

const ROLE_PAGES: Record<string, ResumeFormatPage> = {
  'software-engineer': {
    key: 'software-engineer',
    path: '/resume-format/software-engineer',
    title: 'Software Engineer Resume Format: ATS-Safe Example and Template | Rezoomed',
    description:
      'Use a software engineer resume format that highlights shipped work, systems, tools, scale, and searchable technical skills.',
    eyebrow: 'Role example',
    heading: 'Format a software engineer resume around shipped work and technical proof.',
    intro:
      'Engineering resumes work best when the first page makes your stack, shipped systems, ownership, and reliability impact obvious.',
    intent: 'Best for software engineering, backend, frontend, full-stack, platform, and infrastructure roles.',
    screenshotTitle: 'Software engineer resume',
    screenshotSubtitle: 'Stack, shipped work, impact, and searchable keywords.',
    quickWins: ['Group skills by language, framework, cloud, data, and testing.', 'Prioritize shipped projects over tool lists.', 'Show scale, reliability, latency, adoption, or cost impact.', 'Link GitHub or portfolio only when it strengthens the application.'],
    sectionOrder: ['Contact and links', 'Engineering summary', 'Technical skills', 'Experience', 'Projects', 'Education'],
    template: {
      name: 'Software engineer resume template',
      summary: 'Software engineer with experience building [type of systems] using [stack]. Shipped [product/system] for [users/team] with impact on [latency, cost, reliability, revenue, or adoption].',
      skills: ['Languages', 'Frameworks', 'Cloud', 'Databases', 'Testing and CI/CD'],
      bullets: ['Built [system/feature] in [stack], improving [metric] by [result].', 'Reduced [latency/cost/error rate] by [result] through [technical action].', 'Designed [service/workflow] used by [users/team] across [scale].'],
    },
    beforeAfter: [{ before: 'Worked on backend APIs and fixed bugs.', after: 'Built Node.js billing APIs handling 1.8M monthly events and reduced checkout errors by 17%.' }],
    atsRules: ['Keep technical skills as text, not badges.', 'Use exact tool names from the job description when true.', 'Put strongest engineering work in recent experience, not only projects.', 'Avoid overloading the first page with every tool you have touched.'],
    faqs: [{ question: 'Should a software engineer resume include projects?', answer: 'Yes, when projects prove role-relevant skill that work history does not fully show. Keep them concise and outcome-focused.' }],
    related: FORMAT_RELATED_LINKS,
  },
  'product-manager': {
    key: 'product-manager',
    path: '/resume-format/product-manager',
    title: 'Product Manager Resume Format: ATS-Safe PM Template and Examples | Rezoomed',
    description:
      'Use a product manager resume format that shows product scope, discovery, metrics, execution, and stakeholder leadership.',
    eyebrow: 'Role example',
    heading: 'Format a product manager resume around outcomes, scope, and decisions.',
    intro:
      'PM resumes should prove that you can choose the right problems, move teams through ambiguity, and improve product or business metrics.',
    intent: 'Best for product manager, associate PM, growth PM, platform PM, and product owner roles.',
    screenshotTitle: 'Product manager resume',
    screenshotSubtitle: 'Product scope, metrics, roadmap, and stakeholder proof.',
    quickWins: ['Lead with product domain and measurable outcomes.', 'Tie bullets to users, revenue, activation, retention, or efficiency.', 'Show discovery and execution, not only roadmap ownership.', 'Name analytics, experimentation, and collaboration methods where relevant.'],
    sectionOrder: ['Contact', 'PM summary', 'Product skills', 'Experience', 'Selected launches', 'Education'],
    template: {
      name: 'Product manager resume template',
      summary: 'Product manager with experience in [domain], [customer segment], and [product motion]. Led [discovery/launch/optimization] that improved [metric] across [scope].',
      skills: ['Roadmapping', 'Discovery', 'Analytics', 'Experimentation', 'Stakeholder leadership'],
      bullets: ['Launched [product/feature] for [users], improving [metric] by [result].', 'Prioritized [roadmap/workstream] using [data/research], reducing [problem] by [result].', 'Aligned [teams] around [decision], shipping [outcome] in [timeframe].'],
    },
    beforeAfter: [{ before: 'Owned roadmap and worked with engineers.', after: 'Led pricing roadmap across design, engineering, and sales, increasing trial-to-paid conversion by 11%.' }],
    atsRules: ['Use PM keywords naturally: roadmap, discovery, experimentation, metrics, users, launch.', 'Do not hide product outcomes behind vague collaboration language.', 'Keep tools secondary to product decisions and measurable impact.'],
    faqs: [{ question: 'What should a PM resume emphasize?', answer: 'Emphasize product outcomes, scope, user or business impact, prioritization decisions, and cross-functional execution.' }],
    related: FORMAT_RELATED_LINKS,
  },
  'data-analyst': {
    key: 'data-analyst',
    path: '/resume-format/data-analyst',
    title: 'Data Analyst Resume Format: ATS-Safe Example and Template | Rezoomed',
    description:
      'Use a data analyst resume format that highlights SQL, dashboards, metrics, business decisions, and measurable analysis impact.',
    eyebrow: 'Role example',
    heading: 'Format a data analyst resume around decisions your analysis improved.',
    intro:
      'A data analyst resume should make tools searchable while proving that your analysis changed decisions, processes, revenue, cost, or customer outcomes.',
    intent: 'Best for data analyst, BI analyst, reporting analyst, product analyst, and operations analyst roles.',
    screenshotTitle: 'Data analyst resume',
    screenshotSubtitle: 'SQL, dashboards, metrics, decisions, and business impact.',
    quickWins: ['Put SQL, BI tools, spreadsheets, and analytics methods in searchable text.', 'Show the business question each analysis answered.', 'Name dashboard audiences and decisions supported.', 'Quantify time saved, revenue influenced, or errors reduced.'],
    sectionOrder: ['Contact', 'Analytics summary', 'Technical skills', 'Experience', 'Projects', 'Education'],
    template: {
      name: 'Data analyst resume template',
      summary: 'Data analyst with experience in [domain], SQL, [BI tool], and metric design. Built reporting and analysis used by [audience] to improve [decision/outcome].',
      skills: ['SQL', 'BI tools', 'Spreadsheets', 'Python/R', 'Experimentation or statistics'],
      bullets: ['Built [dashboard/report] in [tool] for [audience], reducing [manual work/error] by [result].', 'Analyzed [dataset/process] to identify [insight], improving [metric] by [result].', 'Defined [metric/KPI] and automated [workflow] across [scope].'],
    },
    beforeAfter: [{ before: 'Created dashboards for the team.', after: 'Created Tableau churn dashboard used by 18 account managers, cutting renewal-risk review time by 6 hours per week.' }],
    atsRules: ['Keep SQL and BI tools visible near the top.', 'Avoid charts or screenshots as substitutes for written impact.', 'Use metric names that match the target role when truthful.'],
    faqs: [{ question: 'Should a data analyst resume list every tool?', answer: 'No. Lead with tools the job asks for and tools you can discuss confidently in an interview.' }],
    related: FORMAT_RELATED_LINKS,
  },
  finance: {
    key: 'finance',
    path: '/resume-format/finance',
    title: 'Finance Resume Format: ATS-Safe Template for Finance Roles | Rezoomed',
    description:
      'Use a finance resume format that highlights modeling, reporting, controls, analysis, transactions, and measurable business support.',
    eyebrow: 'Role example',
    heading: 'Format a finance resume around analysis, accuracy, and business decisions.',
    intro:
      'Finance resumes should show technical skill, judgment, deadlines, and the decisions your work supported. The format should make modeling, reporting, and measurable impact easy to find.',
    intent: 'Best for financial analyst, FP&A, accounting, investment banking, corporate finance, and asset management roles.',
    screenshotTitle: 'Finance resume',
    screenshotSubtitle: 'Models, reporting, controls, deals, and business support.',
    quickWins: ['Lead with finance function and industry context.', 'Name models, reports, controls, and systems where relevant.', 'Quantify budget size, variance, deal value, time saved, or risk reduced.', 'Keep education and certifications easy to find.'],
    sectionOrder: ['Contact', 'Finance summary', 'Skills', 'Experience', 'Transactions or projects', 'Education and certifications'],
    template: {
      name: 'Finance resume template',
      summary: 'Finance professional with experience in [function], [industry], and [modeling/reporting/control area]. Supported [decision/process] across [budget, portfolio, deal, or operating scope].',
      skills: ['Financial modeling', 'Excel', 'ERP/BI tools', 'Reporting', 'Accounting or valuation'],
      bullets: ['Built [model/report] supporting [decision], improving [metric] by [result].', 'Managed [budget/portfolio/process] of [size], reducing [variance/risk/manual work] by [result].', 'Partnered with [stakeholders] to deliver [forecast/analysis/control] within [deadline].'],
    },
    beforeAfter: [{ before: 'Prepared financial reports every month.', after: 'Automated monthly variance reporting for a $14M budget, reducing close-cycle analysis time by 30%.' }],
    atsRules: ['Use exact finance keywords only when they match real experience.', 'Keep certifications such as CFA, CPA, or FRM visible when relevant.', 'Do not let dense formatting hide deal or budget scope.'],
    faqs: [{ question: 'Should finance resumes be one page?', answer: 'Many finance resumes are one page, especially for early-career and banking roles. Two pages can work when senior experience justifies it.' }],
    related: FORMAT_RELATED_LINKS,
  },
  marketing: {
    key: 'marketing',
    path: '/resume-format/marketing',
    title: 'Marketing Resume Format: ATS-Safe Template and Examples | Rezoomed',
    description:
      'Use a marketing resume format that highlights channels, campaigns, creative testing, pipeline, content, and revenue impact.',
    eyebrow: 'Role example',
    heading: 'Format a marketing resume around channels, experiments, and commercial impact.',
    intro:
      'Marketing resumes should connect creative and channel work to business results. Make campaigns, audiences, tools, and outcomes easy to scan.',
    intent: 'Best for growth marketing, content marketing, demand generation, brand, lifecycle, and social roles.',
    screenshotTitle: 'Marketing resume',
    screenshotSubtitle: 'Channels, campaigns, experiments, pipeline, and revenue impact.',
    quickWins: ['Group skills by channel and tool category.', 'Tie campaign work to pipeline, conversion, retention, traffic, or CAC.', 'Show experiments, audience insight, and creative iteration.', 'Use portfolio links only when they support the role.'],
    sectionOrder: ['Contact', 'Marketing summary', 'Channel skills', 'Experience', 'Campaign highlights', 'Education'],
    template: {
      name: 'Marketing resume template',
      summary: 'Marketing professional with experience in [channel], [audience], and [growth/content/brand motion]. Improved [metric] through [campaign, experiment, or program].',
      skills: ['Channels', 'Analytics tools', 'CRM or automation', 'Content or creative', 'Experimentation'],
      bullets: ['Launched [campaign/program] for [audience], increasing [metric] by [result].', 'Tested [creative/channel/message] and improved [conversion/CAC/pipeline] by [result].', 'Built [content/workflow/reporting] used by [team] to scale [outcome].'],
    },
    beforeAfter: [{ before: 'Managed social media and email campaigns.', after: 'Ran lifecycle email tests for 120K subscribers, improving trial activation by 9.4% in six weeks.' }],
    atsRules: ['Keep tool names searchable: GA4, HubSpot, Marketo, Salesforce, Meta Ads, Google Ads.', 'Do not rely on portfolio screenshots without written results.', 'Prioritize metrics that match the target marketing role.'],
    faqs: [{ question: 'Should a marketing resume include portfolio links?', answer: 'Yes, if the portfolio is polished and directly relevant. Keep the resume itself strong enough to stand alone.' }],
    related: FORMAT_RELATED_LINKS,
  },
}

export const RESUME_FORMAT_ROLE_SLUGS = Object.keys(ROLE_PAGES)

export function getResumeFormatPage(key: keyof typeof RESUME_FORMAT_PAGES) {
  return RESUME_FORMAT_PAGES[key]
}

export function getResumeFormatRolePage(slug: string) {
  return ROLE_PAGES[slug] ?? null
}

export function getAllResumeFormatStaticPaths() {
  return [
    ...Object.values(RESUME_FORMAT_PAGES).map(page => page.path),
    ...Object.values(ROLE_PAGES).map(page => page.path),
  ]
}

function stripBrandSuffix(title: string) {
  let cleaned = title.trim()
  const suffix = ' | Rezoomed'
  while (cleaned.toLowerCase().endsWith(suffix.toLowerCase())) {
    cleaned = cleaned.slice(0, -suffix.length).trim()
  }
  return cleaned
}

export function buildResumeFormatMetadata(page: ResumeFormatPage): Metadata {
  const cleanTitle = stripBrandSuffix(page.title)
  const brandedTitle = `${cleanTitle} | Rezoomed`
  return {
    title: { absolute: brandedTitle },
    description: page.description,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      type: 'website',
      title: brandedTitle,
      description: page.description,
      url: page.path,
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description: page.description,
      images: ['/opengraph-image'],
    },
  }
}
