import type { ExperienceItem, SkillSection } from '@/types'

export interface CompanyResumeExampleConfig {
  id: string
  title: string
  badgeLabel: string
  sourceLabel: string
  sourceUrl: string
  sourceNote: string
  candidateName: string
  email: string
  phone: string
  location: string
  currentRole: string
  summary: string
  experience: ExperienceItem[]
  education: {
    institution: string
    degree: string
    field: string
    graduationDate?: string
  }
  skillSections: SkillSection[]
  analysisPoints: string[]
  accentColor: string
}

export interface CompanyJobGuide {
  slug: string
  companyName: string
  title: string
  excerpt: string
  opening: string
  strategyNote: string
  lanes: string[]
  resumeSignals: string[]
  beforeAfterRows: Array<[string, string]>
  checklistItems: string[]
  proofItems: string[]
  interviewPrepItems: string[]
  faqItems: Array<{ question: string; answer: string }>
  sourceLinks: Array<{ label: string; href: string }>
  resumeExample: CompanyResumeExampleConfig
}

const sharedEducation = {
  institution: 'State University',
  degree: 'B.S.',
  field: 'Computer Science',
  graduationDate: '2018',
}

function exampleSourceNote(companyName: string, targetRole: string) {
  return `A Rezoomed-built example resume tailored for ${companyName} ${targetRole} applications. It is not a claim that the candidate worked at ${companyName}; use it to study positioning, evidence density, and ATS-safe structure.`
}

export const COMPANY_JOB_GUIDES: CompanyJobGuide[] = [
  {
    slug: 'how-to-land-a-job-at-openai',
    companyName: 'OpenAI',
    title: 'How to Get a Job at OpenAI: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at OpenAI in 2026: role targeting, resume strategy, proof that matters, an OpenAI-ready resume example, and interview prep for high-standard AI teams.',
    opening:
      'OpenAI applications are not won by sounding excited about AI. The stronger signal is proof that you can reason clearly, ship in ambiguity, and work around complex AI systems without inflating your experience.',
    strategyNote:
      'Treat every OpenAI application as a specific bet on one team, one level, and one problem space. A broad AI resume usually hides the strongest evidence.',
    lanes: ['Research and applied AI', 'Product and product operations', 'Infrastructure and platform engineering', 'Safety, policy, and trust', 'Go-to-market and partnerships'],
    resumeSignals: ['technical depth that is easy to verify', 'high-agency execution in ambiguous environments', 'clear writing and decision-making', 'product or research judgment', 'evidence of responsible AI-adjacent work'],
    beforeAfterRows: [
      ['Worked on LLM product features.', 'Shipped retrieval-based support workflows that resolved 62% of tier-one questions, using eval sets and weekly error analysis to reduce hallucinated answers.'],
      ['Helped engineering prioritize roadmap items.', 'Prioritized 18 model-quality and latency fixes by combining customer transcripts, failure taxonomy, and engineering effort estimates.'],
      ['Built internal AI demos.', 'Built 4 internal AI prototypes from workflow maps to pilot launch, turning 2 into production tools used by 120+ operators.'],
    ],
    checklistItems: ['choose one role family before editing', 'show AI work only where it is real and specific', 'include evals, latency, safety, or product metrics when relevant', 'link to technical writing, demos, or portfolio proof', 'remove generic AI enthusiasm and keep the resume evidence-first'],
    proofItems: ['research papers or technical notes', 'production AI systems', 'model evaluation or safety workflows', 'open-source work', 'product launches involving AI behavior, reliability, or deployment'],
    interviewPrepItems: ['2 stories about ambiguous problem solving', '2 examples of technical tradeoffs', '2 examples of responsible AI or quality judgment', '1 failure story with a concrete learning loop', '1 short explanation of why this OpenAI team fits your actual work'],
    faqItems: [
      {
        question: 'Do I need frontier AI experience to apply to OpenAI?',
        answer: 'Not for every role. You do need exact evidence for the role you choose. Product, operations, policy, design, infrastructure, and go-to-market roles can value different proof than research roles.',
      },
      {
        question: 'Should my OpenAI resume mention every AI tool I have used?',
        answer: 'No. Mention tools only when they connect to real work, shipped systems, evaluation, customer impact, or technical depth.',
      },
      {
        question: 'What should I attach beyond the resume?',
        answer: 'Use the strongest role-specific proof you have: technical writing, shipped projects, papers, demos, case studies, or a clean portfolio.',
      },
    ],
    sourceLinks: [
      { label: 'OpenAI Careers', href: 'https://openai.com/careers' },
      { label: 'OpenAI Preparedness', href: 'https://openai.com/safety/' },
    ],
    resumeExample: {
      id: 'openai-applied-ai-product',
      title: 'OpenAI Applied AI Product Resume Example',
      badgeLabel: 'OpenAI-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://openai.com/careers',
      sourceNote: exampleSourceNote('OpenAI', 'applied AI product manager'),
      candidateName: 'Maya Chen',
      email: 'maya.chen@example.com',
      phone: '+1 415 555 0198',
      location: 'San Francisco, CA',
      currentRole: 'Applied AI Product Lead',
      summary:
        'Applied AI product lead with 6+ years turning ambiguous support, search, and workflow problems into production AI systems. Owns discovery, eval design, launch planning, and quality loops across engineering, research, operations, and customer-facing teams.',
      experience: [
        {
          company: 'NeuralForge',
          title: 'Applied AI Product Lead',
          location: 'San Francisco, CA',
          startDate: 'Jan 2022',
          endDate: 'Present',
          bullets: [
            'Shipped a retrieval-based support assistant that resolved 62% of tier-one questions while reducing average first response time from 11 minutes to 4 minutes.',
            'Built an eval workflow across 1,800 labeled conversations, partnering with ML and support teams to cut incorrect answer rate by 31%.',
            'Prioritized roadmap using customer transcripts, latency metrics, and model-failure taxonomy, converting 18 quality gaps into shipped fixes.',
            'Led weekly review loops with engineering, legal, and operations to improve answer quality without expanding unsupported claims.',
          ],
        },
        {
          company: 'CloudWare',
          title: 'Product Manager, Automation',
          location: 'Austin, TX',
          startDate: 'Aug 2018',
          endDate: 'Dec 2021',
          bullets: [
            'Launched 4 workflow automation pilots for enterprise support teams, with 2 pilots adopted into production by 120+ operators.',
            'Reduced manual triage effort by 38% by mapping high-volume issue classes and designing routing rules with engineering and operations.',
            'Authored PRDs, launch plans, and risk reviews for customer-facing automation features across regulated accounts.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'AI Product', skills: ['LLM Workflows', 'RAG', 'Evaluation Design', 'Prompt Systems', 'AI Safety Reviews'] },
        { title: 'Product Delivery', skills: ['PRDs', 'Roadmaps', 'Experimentation', 'Launch Planning', 'Stakeholder Management'] },
        { title: 'Data & Tools', skills: ['SQL', 'Python', 'Amplitude', 'Postman', 'Jira'] },
      ],
      analysisPoints: [
        'The target lane is narrow: applied AI product work, not generic AI interest.',
        'The bullets show evals, quality loops, latency, and adoption, which are more credible than broad claims about innovation.',
        'The resume gives engineering, legal, and operations context so the candidate looks ready for cross-functional AI deployment.',
        'Skills are grouped around AI product delivery instead of dumped into one long keyword list.',
      ],
      accentColor: '#111827',
    },
  },
  {
    slug: 'how-to-land-a-job-at-anthropic',
    companyName: 'Anthropic',
    title: 'How to Get a Job at Anthropic: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Anthropic in 2026: targeted resume strategy, safety and systems proof, an Anthropic-ready resume example, and interview prep for careful AI teams.',
    opening:
      'Anthropic applications reward careful thinking. The resume has to show judgment, technical or operational rigor, and a habit of making complex systems safer, clearer, or more reliable.',
    strategyNote:
      'Do not write an AI fan resume. Write a role-specific document that shows how you reason, what you measured, and what changed because of your work.',
    lanes: ['AI safety and evaluations', 'Research engineering', 'Product and applied AI', 'Infrastructure reliability', 'Policy, trust, and operations'],
    resumeSignals: ['careful reasoning under uncertainty', 'evaluation or reliability work', 'clear technical writing', 'responsible deployment judgment', 'evidence that you improve systems rather than just use them'],
    beforeAfterRows: [
      ['Worked on model quality testing.', 'Built a 1,200-case evaluation set for customer-support model failures, raising regression detection before launch from 54% to 87%.'],
      ['Helped make AI outputs better.', 'Created a failure taxonomy for unsafe or unsupported answers and drove 23 prompt, retrieval, and policy updates across 3 releases.'],
      ['Collaborated with researchers and engineers.', 'Partnered with research, product, and policy teams to turn ambiguous quality issues into measurable launch criteria.'],
    ],
    checklistItems: ['make the target Anthropic lane obvious', 'show evaluation, safety, reliability, or reasoning depth where relevant', 'include links to writing or technical work if strong', 'remove vague claims about ethical AI unless backed by real work', 'keep bullets direct, measured, and defensible'],
    proofItems: ['evaluation harnesses', 'research notes or technical writing', 'model behavior analysis', 'safety or reliability reviews', 'production AI launches with quality metrics'],
    interviewPrepItems: ['2 stories about careful tradeoffs', '2 examples of measuring ambiguous quality', '1 story about pushing back responsibly', '1 failure story with a changed process', '1 concise explanation of your fit for Anthropic mission and role'],
    faqItems: [
      {
        question: 'Does Anthropic only hire researchers?',
        answer: 'No. Anthropic hires across technical, product, policy, operations, and business roles. Your resume should still show rigorous thinking and role-specific evidence.',
      },
      {
        question: 'Should I emphasize AI safety on every Anthropic resume?',
        answer: 'Only where it is relevant and truthful. A stronger resume shows concrete safety, reliability, evaluation, or product-quality work instead of generic mission language.',
      },
      {
        question: 'What kind of portfolio helps for Anthropic?',
        answer: 'Technical writing, eval work, research notes, responsible AI projects, system design, or case studies can help when they map directly to the role.',
      },
    ],
    sourceLinks: [
      { label: 'Anthropic Careers', href: 'https://www.anthropic.com/careers' },
      { label: 'Anthropic Responsible Scaling Policy', href: 'https://www.anthropic.com/responsible-scaling-policy' },
    ],
    resumeExample: {
      id: 'anthropic-evaluation-systems',
      title: 'Anthropic Evaluation Systems Resume Example',
      badgeLabel: 'Anthropic-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.anthropic.com/careers',
      sourceNote: exampleSourceNote('Anthropic', 'AI evaluation systems'),
      candidateName: 'Ethan Brooks',
      email: 'ethan.brooks@example.com',
      phone: '+1 646 555 0184',
      location: 'New York, NY',
      currentRole: 'AI Evaluation Systems Lead',
      summary:
        'Evaluation systems lead with 5+ years building quality, safety, and reliability workflows for AI-enabled products. Turns ambiguous model behavior issues into measurable tests, launch criteria, and product improvements.',
      experience: [
        {
          company: 'SafeModel Labs',
          title: 'AI Evaluation Systems Lead',
          location: 'New York, NY',
          startDate: 'Feb 2022',
          endDate: 'Present',
          bullets: [
            'Built a 1,200-case evaluation suite for unsupported AI answers, improving pre-launch regression detection from 54% to 87%.',
            'Created a model-failure taxonomy across safety, retrieval, instruction-following, and refusal-quality issues for 3 product teams.',
            'Partnered with policy, research, and product leads to define launch gates for high-risk answer categories.',
            'Reduced severe post-launch quality incidents by 29% through weekly eval review and targeted prompt, retrieval, and UI changes.',
          ],
        },
        {
          company: 'Reliant Cloud',
          title: 'Product Analyst, Reliability',
          location: 'Boston, MA',
          startDate: 'Jul 2019',
          endDate: 'Jan 2022',
          bullets: [
            'Designed incident-review dashboards used by 40+ engineers to identify recurring reliability patterns across customer workflows.',
            'Translated customer tickets into product quality themes, influencing 11 roadmap fixes across search, alerting, and permissions.',
            'Wrote weekly quality memos for product and engineering leadership, improving prioritization clarity for ambiguous failures.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'AI Quality', skills: ['Evaluation Design', 'Failure Taxonomy', 'Safety Reviews', 'Model Behavior Analysis'] },
        { title: 'Data', skills: ['SQL', 'Python', 'Looker', 'Experiment Analysis'] },
        { title: 'Delivery', skills: ['Technical Writing', 'Launch Criteria', 'Incident Reviews', 'Cross-functional Planning'] },
      ],
      analysisPoints: [
        'The resume proves careful reasoning through eval suites, taxonomies, launch gates, and incident reductions.',
        'The candidate does not overclaim research depth; the positioning is evaluation systems and product quality.',
        'Metrics show quality improvement without making unverifiable claims about model performance.',
        'The skills section matches Anthropic-relevant work: evaluation, safety reviews, writing, and analysis.',
      ],
      accentColor: '#6B4E2E',
    },
  },
  {
    slug: 'how-to-land-a-job-at-meta',
    companyName: 'Meta',
    title: 'How to Get a Job at Meta: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Meta in 2026: resume strategy for scale, product impact, experimentation, an example Meta-ready resume, and interview prep.',
    opening:
      'Meta resumes need to make scale and impact obvious fast. The strongest applications show what shipped, how it moved a metric, and how the candidate operated across product, engineering, data, and design.',
    strategyNote:
      'Pick the Meta lane first: growth, ads, infrastructure, creator, AI, privacy, product, design, data, or operations. Then remove anything that does not support that lane.',
    lanes: ['Product and growth', 'Software engineering and infrastructure', 'Data science and analytics', 'Design and research', 'Business, ads, and operations'],
    resumeSignals: ['large-scale product or systems work', 'experimentation discipline', 'measurable growth or efficiency', 'cross-functional execution', 'speed without losing quality'],
    beforeAfterRows: [
      ['Worked on growth experiments.', 'Ran 14 onboarding experiments across 3 surfaces, improving activation by 9.8% and reducing first-session drop-off by 12%.'],
      ['Managed product analytics.', 'Built dashboards for a 6-person product group that cut weekly metric review time by 5 hours and surfaced 4 launch blockers.'],
      ['Partnered with engineering and design.', 'Led product, design, data, and engineering rituals for a creator monetization launch reaching 1.4M monthly users.'],
    ],
    checklistItems: ['lead with scale, product area, and measurable impact', 'show experiment quality, not only experiment count', 'name the surfaces, user groups, or systems you affected', 'separate consumer, ads, infra, and business versions of your resume', 'keep every bullet tied to speed, scope, or outcome'],
    proofItems: ['experiment results', 'product launches', 'growth metrics', 'large-scale systems work', 'creator, ads, or social domain experience'],
    interviewPrepItems: ['3 metric-backed product or systems stories', '2 examples of fast execution under ambiguity', '2 cross-functional influence stories', '1 failure or rollback story', '1 explanation of why this Meta team fits your work'],
    faqItems: [
      {
        question: 'What matters most on a Meta resume?',
        answer: 'Scope and outcomes. Meta recruiters need to see the scale of the product, system, user group, or business problem and what changed because of your work.',
      },
      {
        question: 'Should I tailor differently for Meta product and Meta engineering roles?',
        answer: 'Yes. Product resumes should emphasize user problems, prioritization, experiments, and launch impact. Engineering resumes should emphasize systems, technical complexity, reliability, and shipped code.',
      },
      {
        question: 'Do Meta resumes need metrics?',
        answer: 'Metrics help a lot. If exact business metrics are confidential, use scale indicators such as users, latency, volume, experiment count, launch size, or team scope.',
      },
    ],
    sourceLinks: [
      { label: 'Meta Careers', href: 'https://www.metacareers.com/' },
      { label: 'Meta Interviewing', href: 'https://www.metacareers.com/careerprograms/pathways/interviewing' },
    ],
    resumeExample: {
      id: 'meta-growth-product',
      title: 'Meta Growth Product Resume Example',
      badgeLabel: 'Meta-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.metacareers.com/',
      sourceNote: exampleSourceNote('Meta', 'growth product manager'),
      candidateName: 'Nina Patel',
      email: 'nina.patel@example.com',
      phone: '+1 650 555 0127',
      location: 'Menlo Park, CA',
      currentRole: 'Growth Product Manager',
      summary:
        'Growth product manager with 7+ years improving activation, retention, and creator monetization across consumer and marketplace products. Strong in experimentation, product analytics, and cross-functional launch execution.',
      experience: [
        {
          company: 'LoopSocial',
          title: 'Growth Product Manager',
          location: 'Menlo Park, CA',
          startDate: 'Mar 2021',
          endDate: 'Present',
          bullets: [
            'Ran 14 onboarding experiments across 3 surfaces, improving activation by 9.8% and reducing first-session drop-off by 12%.',
            'Launched a creator earnings dashboard used by 38K monthly creators, increasing weekly monetization feature adoption by 21%.',
            'Built product health dashboards for a 6-person product group, cutting weekly metric review time by 5 hours.',
            'Partnered with data science to redesign experiment guardrails after a false-positive launch, reducing inconclusive test decisions by 34%.',
          ],
        },
        {
          company: 'Marketly',
          title: 'Product Analyst',
          location: 'San Jose, CA',
          startDate: 'Jun 2018',
          endDate: 'Feb 2021',
          bullets: [
            'Analyzed marketplace conversion funnels across 2.3M monthly sessions and identified checkout friction that drove a 6.1% lift after redesign.',
            'Created retention cohorts and lifecycle reports used by product and CRM teams to prioritize 9 customer reactivation experiments.',
            'Improved analytics instrumentation quality by auditing 120 events and removing duplicate or low-trust metrics from launch reporting.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Growth', skills: ['Activation', 'Retention', 'Experimentation', 'Creator Monetization', 'Lifecycle Strategy'] },
        { title: 'Analytics', skills: ['SQL', 'Amplitude', 'Looker', 'A/B Testing', 'Cohort Analysis'] },
        { title: 'Product', skills: ['Roadmaps', 'PRDs', 'Launch Planning', 'Cross-functional Leadership'] },
      ],
      analysisPoints: [
        'The resume makes scale visible through users, creators, experiments, and product surfaces.',
        'The strongest bullets combine metric movement with product context.',
        'The candidate shows speed and learning loops without relying on vague startup language.',
        'Skills match Meta-style growth and product analytics work.',
      ],
      accentColor: '#0668E1',
    },
  },
  {
    slug: 'how-to-land-a-job-at-microsoft',
    companyName: 'Microsoft',
    title: 'How to Get a Job at Microsoft: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Microsoft in 2026: resume targeting for cloud, enterprise, product, and engineering roles, plus a Microsoft-ready resume example.',
    opening:
      'Microsoft applications work best when the resume shows structured execution, customer empathy, and platform-scale thinking. The document should feel clear, reliable, and easy to map to the target org.',
    strategyNote:
      'Microsoft is too broad for one generic resume. A resume for Azure, Security, Copilot, Gaming, or Business Applications should lead with different proof.',
    lanes: ['Cloud and infrastructure', 'Security and identity', 'Product and program management', 'AI and developer tools', 'Sales, customer success, and operations'],
    resumeSignals: ['enterprise customer impact', 'platform or cloud context', 'cross-functional execution', 'reliability and supportability', 'measurable adoption or efficiency'],
    beforeAfterRows: [
      ['Worked with enterprise customers on cloud issues.', 'Led migration readiness for 22 enterprise accounts, reducing launch blockers by 41% through dependency mapping and weekly risk reviews.'],
      ['Managed roadmap and engineering work.', 'Prioritized 16 Azure admin workflow improvements by combining support tickets, customer interviews, and telemetry from 80K monthly users.'],
      ['Improved internal processes.', 'Automated release-readiness reporting for 5 product squads, saving 9 hours per week and improving executive status accuracy.'],
    ],
    checklistItems: ['target one Microsoft org or product area', 'show customer, platform, or enterprise context', 'connect bullets to adoption, reliability, security, or productivity', 'use standard headings and clean formatting', 'include technical depth only where it supports the role'],
    proofItems: ['cloud migrations', 'enterprise customer outcomes', 'developer tooling', 'security or reliability improvements', 'product adoption metrics'],
    interviewPrepItems: ['2 customer-impact stories', '2 cross-functional execution stories', '2 technical or platform tradeoffs', '1 story about learning from feedback', '1 explanation of why this Microsoft org fits your background'],
    faqItems: [
      {
        question: 'Should I make a different resume for each Microsoft product group?',
        answer: 'For serious applications, yes. Azure, Security, Copilot, Gaming, and Business Applications can require different evidence and keywords.',
      },
      {
        question: 'What does Microsoft value in non-engineering resumes?',
        answer: 'Show structured execution, customer context, measurable outcomes, and collaboration across technical and business stakeholders.',
      },
      {
        question: 'Is a one-page resume enough for Microsoft?',
        answer: 'For many candidates, yes. Senior candidates can use two pages if every section adds role-relevant proof.',
      },
    ],
    sourceLinks: [
      { label: 'Microsoft Careers', href: 'https://careers.microsoft.com/' },
      { label: 'Microsoft Interview Tips', href: 'https://careers.microsoft.com/v2/global/en/hiring-tips' },
    ],
    resumeExample: {
      id: 'microsoft-cloud-program',
      title: 'Microsoft Cloud Program Manager Resume Example',
      badgeLabel: 'Microsoft-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://careers.microsoft.com/',
      sourceNote: exampleSourceNote('Microsoft', 'cloud program manager'),
      candidateName: 'Daniel Kim',
      email: 'daniel.kim@example.com',
      phone: '+1 425 555 0110',
      location: 'Seattle, WA',
      currentRole: 'Cloud Program Manager',
      summary:
        'Cloud program manager with 8 years of experience improving enterprise admin workflows, migration readiness, and product adoption across SaaS and infrastructure platforms. Strong in customer telemetry, release planning, and cross-functional delivery.',
      experience: [
        {
          company: 'Northstar Cloud',
          title: 'Cloud Program Manager',
          location: 'Seattle, WA',
          startDate: 'Apr 2020',
          endDate: 'Present',
          bullets: [
            'Led migration readiness for 22 enterprise accounts, reducing launch blockers by 41% through dependency mapping and weekly risk reviews.',
            'Prioritized 16 admin workflow improvements using support tickets, customer interviews, and telemetry from 80K monthly users.',
            'Automated release-readiness reporting for 5 product squads, saving 9 hours per week and improving executive status accuracy.',
            'Partnered with engineering, support, and security teams to define rollout criteria for identity and permissions features.',
          ],
        },
        {
          company: 'DataBridge Systems',
          title: 'Technical Product Analyst',
          location: 'Denver, CO',
          startDate: 'Jul 2017',
          endDate: 'Mar 2020',
          bullets: [
            'Built SQL and Power BI dashboards that reduced enterprise customer health review prep from 3 hours to 40 minutes.',
            'Mapped recurring integration failures across 14 accounts and influenced 6 API reliability fixes.',
            'Created customer-facing migration notes and internal runbooks adopted by 30+ implementation managers.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Cloud & Enterprise', skills: ['Cloud Migration', 'Identity Workflows', 'Admin UX', 'Enterprise Rollouts'] },
        { title: 'Program Management', skills: ['Roadmaps', 'Release Planning', 'Risk Reviews', 'Customer Telemetry'] },
        { title: 'Tools', skills: ['SQL', 'Power BI', 'Azure DevOps', 'Jira', 'Postman'] },
      ],
      analysisPoints: [
        'The resume is aligned to cloud and enterprise workflow work rather than generic product management.',
        'It shows customer scale, telemetry, launch readiness, and supportability.',
        'The bullets translate program management into measurable time saved and blockers removed.',
        'Skills are grouped in a way Microsoft recruiters can scan quickly.',
      ],
      accentColor: '#107C10',
    },
  },
  {
    slug: 'how-to-land-a-job-at-amazon',
    companyName: 'Amazon',
    title: 'How to Get a Job at Amazon: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Amazon in 2026: ownership-focused resume strategy, metrics, operations proof, an Amazon-ready resume example, and interview prep.',
    opening:
      'Amazon resumes need to show ownership, scale, and measurable customer impact. If the resume reads like a list of tasks, it will not match the way Amazon evaluates execution.',
    strategyNote:
      'Build the resume around outcomes you owned. Then prepare interview stories that can support the same claims with context, tradeoffs, and numbers.',
    lanes: ['Operations and supply chain', 'Product and program management', 'Software engineering', 'AWS and infrastructure', 'Retail, marketplace, and advertising'],
    resumeSignals: ['ownership of measurable outcomes', 'customer or operational impact', 'process improvement', 'scale and complexity', 'clear decision-making under constraints'],
    beforeAfterRows: [
      ['Managed operations reports.', 'Built a daily exception dashboard for 14 fulfillment workflows, reducing escalations by 27% and saving 11 analyst hours per week.'],
      ['Improved onboarding process.', 'Redesigned seller onboarding steps and cut median activation time from 12 days to 7 days across 1,900 monthly sellers.'],
      ['Worked with cross-functional teams.', 'Led product, ops, and engineering reviews to resolve 23 launch blockers before peak-season rollout.'],
    ],
    checklistItems: ['write bullets as ownership plus result', 'use numbers for cost, time, defects, throughput, or customer impact', 'make scale visible', 'prepare story-bank proof for each major bullet', 'avoid passive language like assisted or helped when you owned the work'],
    proofItems: ['cost savings', 'defect reduction', 'automation wins', 'customer experience metrics', 'supply chain, AWS, or marketplace scale'],
    interviewPrepItems: ['5 ownership stories with metrics', '3 tradeoff stories', '2 examples of acting with incomplete data', '2 failure stories with changed mechanisms', '1 concise reason this Amazon team fits your background'],
    faqItems: [
      {
        question: 'Should my Amazon resume mention leadership principles?',
        answer: 'Do not stuff the principles into the resume. Show them through evidence: ownership, customer impact, frugality, bias for action, and measurable results.',
      },
      {
        question: 'What metrics work best for Amazon applications?',
        answer: 'Use metrics tied to customer impact, cost, speed, defects, automation, reliability, throughput, or operational scale.',
      },
      {
        question: 'How should I prepare after applying to Amazon?',
        answer: 'Build a story bank from the resume. Every strong bullet should have a deeper STAR-style story behind it.',
      },
    ],
    sourceLinks: [
      { label: 'Amazon Jobs', href: 'https://www.amazon.jobs/' },
      { label: 'Amazon Interviewing', href: 'https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon' },
    ],
    resumeExample: {
      id: 'amazon-operations-product',
      title: 'Amazon Operations Product Resume Example',
      badgeLabel: 'Amazon-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.amazon.jobs/',
      sourceNote: exampleSourceNote('Amazon', 'operations product manager'),
      candidateName: 'Priya Raman',
      email: 'priya.raman@example.com',
      phone: '+1 206 555 0182',
      location: 'Bellevue, WA',
      currentRole: 'Operations Product Manager',
      summary:
        'Operations product manager with 7+ years improving marketplace onboarding, workflow automation, and defect reduction. Builds mechanisms that turn messy operational problems into measurable customer and business outcomes.',
      experience: [
        {
          company: 'Fulfillly',
          title: 'Operations Product Manager',
          location: 'Bellevue, WA',
          startDate: 'May 2020',
          endDate: 'Present',
          bullets: [
            'Redesigned seller onboarding steps and cut median activation time from 12 days to 7 days across 1,900 monthly sellers.',
            'Built a daily exception dashboard for 14 fulfillment workflows, reducing escalations by 27% and saving 11 analyst hours per week.',
            'Led product, operations, and engineering reviews to resolve 23 launch blockers before peak-season rollout.',
            'Reduced payment reconciliation defects by 32% by mapping root causes and prioritizing 9 automation fixes.',
          ],
        },
        {
          company: 'RouteStack',
          title: 'Business Operations Analyst',
          location: 'Chicago, IL',
          startDate: 'Aug 2017',
          endDate: 'Apr 2020',
          bullets: [
            'Created SQL dashboards for regional operations leaders, improving weekly throughput visibility across 6 markets.',
            'Identified carrier handoff delays that drove a 14% SLA improvement after process redesign.',
            'Documented standard operating procedures adopted by 45 field managers during a national rollout.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Operations', skills: ['Process Improvement', 'Defect Reduction', 'Marketplace Onboarding', 'SOP Design'] },
        { title: 'Product', skills: ['Roadmaps', 'PRDs', 'Launch Readiness', 'Stakeholder Reviews'] },
        { title: 'Analytics', skills: ['SQL', 'Tableau', 'Excel', 'Root Cause Analysis'] },
      ],
      analysisPoints: [
        'The resume reads like ownership: each bullet names a mechanism and a result.',
        'Metrics cover time, defects, escalation rate, analyst hours, and seller scale.',
        'The candidate can defend the resume in behavioral interviews because the bullets imply deeper stories.',
        'The skills section supports operations and product execution without keyword stuffing.',
      ],
      accentColor: '#FF9900',
    },
  },
  {
    slug: 'how-to-land-a-job-at-apple',
    companyName: 'Apple',
    title: 'How to Get a Job at Apple: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Apple in 2026: resume strategy for craft, product quality, operations, hardware, software, and an Apple-ready resume example.',
    opening:
      'Apple applications should feel controlled and high quality. The resume needs to show craft, judgment, and evidence that you can improve products or experiences without adding noise.',
    strategyNote:
      'Apple is not one hiring bar. Hardware, retail, operations, product, design, services, and software roles need different proof. Your resume should make the discipline unmistakable.',
    lanes: ['Product operations', 'Hardware and manufacturing', 'Software and services', 'Design and research', 'Retail, marketing, and customer experience'],
    resumeSignals: ['attention to detail', 'quality and launch discipline', 'customer or product intuition', 'cross-functional delivery', 'measurable operational or user impact'],
    beforeAfterRows: [
      ['Worked on product launch coordination.', 'Coordinated launch readiness across 5 hardware accessory programs, reducing late-stage packaging defects by 24%.'],
      ['Improved customer experience.', 'Analyzed 18K support contacts and prioritized 6 setup-flow fixes that cut first-week support tickets by 17%.'],
      ['Managed vendor communication.', 'Built supplier issue review cadence that reduced unresolved component exceptions from 43 to 12 before release freeze.'],
    ],
    checklistItems: ['keep layout clean and restrained', 'show quality, launch readiness, or customer experience proof', 'avoid exaggerated adjectives', 'separate retail, hardware, software, and product resumes', 'make every bullet precise and edited'],
    proofItems: ['launch readiness work', 'quality improvements', 'customer experience metrics', 'hardware or software delivery', 'premium product or service outcomes'],
    interviewPrepItems: ['3 examples of improving quality', '2 stories about cross-functional launch tradeoffs', '2 customer-experience stories', '1 example of reducing complexity', '1 reason this Apple discipline fits your strengths'],
    faqItems: [
      {
        question: 'Should an Apple resume be visually creative?',
        answer: 'Usually no. Clean, precise, and readable is safer. Let the evidence show taste and quality instead of relying on decorative formatting.',
      },
      {
        question: 'What proof helps for Apple operations roles?',
        answer: 'Launch readiness, vendor coordination, defect reduction, customer experience improvements, and quality metrics are stronger than generic operations language.',
      },
      {
        question: 'Should I use a different resume for Apple retail and corporate roles?',
        answer: 'Yes. Retail, product, hardware, software, and operations roles evaluate different evidence.',
      },
    ],
    sourceLinks: [
      { label: 'Apple Jobs', href: 'https://jobs.apple.com/' },
      { label: 'Apple Teams', href: 'https://www.apple.com/careers/us/teams.html' },
    ],
    resumeExample: {
      id: 'apple-product-operations',
      title: 'Apple Product Operations Resume Example',
      badgeLabel: 'Apple-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://jobs.apple.com/',
      sourceNote: exampleSourceNote('Apple', 'product operations manager'),
      candidateName: 'Sofia Martinez',
      email: 'sofia.martinez@example.com',
      phone: '+1 408 555 0159',
      location: 'Cupertino, CA',
      currentRole: 'Product Operations Manager',
      summary:
        'Product operations manager with 8 years improving launch readiness, supplier coordination, and customer experience for hardware-adjacent products. Known for precise execution, defect reduction, and cross-functional operating rhythms.',
      experience: [
        {
          company: 'Luma Devices',
          title: 'Product Operations Manager',
          location: 'Cupertino, CA',
          startDate: 'Feb 2020',
          endDate: 'Present',
          bullets: [
            'Coordinated launch readiness across 5 hardware accessory programs, reducing late-stage packaging defects by 24%.',
            'Analyzed 18K support contacts and prioritized 6 setup-flow fixes that cut first-week support tickets by 17%.',
            'Built supplier issue review cadence that reduced unresolved component exceptions from 43 to 12 before release freeze.',
            'Created executive launch dashboards used by product, quality, and operations leaders across 3 release cycles.',
          ],
        },
        {
          company: 'BrightHome',
          title: 'Customer Experience Analyst',
          location: 'San Diego, CA',
          startDate: 'Jun 2017',
          endDate: 'Jan 2020',
          bullets: [
            'Mapped onboarding friction across connected-home devices and influenced 4 setup changes that improved completion by 13%.',
            'Built defect reporting workflow connecting support tags to quality engineering investigations.',
            'Wrote customer insight briefs that informed packaging, setup, and troubleshooting updates.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Operations', skills: ['Launch Readiness', 'Supplier Coordination', 'Defect Reduction', 'Quality Reviews'] },
        { title: 'Customer Experience', skills: ['Support Analysis', 'Setup Flows', 'Journey Mapping', 'Insight Briefs'] },
        { title: 'Tools', skills: ['SQL', 'Tableau', 'Excel', 'Jira', 'Confluence'] },
      ],
      analysisPoints: [
        'The resume is tightly aligned to product operations and quality, which fits Apple-style execution.',
        'The bullets avoid flashy language and focus on launch, defects, support contacts, and supplier issues.',
        'The candidate shows customer experience and operations in one coherent story.',
        'The formatting supports a restrained, high-signal read.',
      ],
      accentColor: '#111111',
    },
  },
  {
    slug: 'how-to-land-a-job-at-netflix',
    companyName: 'Netflix',
    title: 'How to Get a Job at Netflix: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Netflix in 2026: resume strategy for judgment, ownership, product impact, content platforms, and a Netflix-ready resume example.',
    opening:
      'Netflix resumes need to sound like trusted execution. The strongest candidates show judgment, independence, and measurable outcomes without filler.',
    strategyNote:
      'Do not write for entertainment as a category. Write for the specific Netflix function: streaming platform, content operations, product, data, engineering, ads, games, or business operations.',
    lanes: ['Streaming product and platform', 'Content operations', 'Engineering and data', 'Ads and growth', 'Games and consumer experience'],
    resumeSignals: ['trusted independent ownership', 'high-impact launches', 'judgment under tradeoffs', 'clear metrics', 'concise communication'],
    beforeAfterRows: [
      ['Supported content platform launches.', 'Led rollout planning for a localization workflow used by 90+ content operators, cutting handoff errors by 28%.'],
      ['Managed product decisions.', 'Prioritized 12 playback-quality fixes using QoE metrics, reducing high-severity streaming complaints by 16%.'],
      ['Worked with multiple teams.', 'Aligned product, content ops, data, and engineering teams around launch criteria for 7 regional releases.'],
    ],
    checklistItems: ['make judgment visible through tradeoffs', 'write short high-signal bullets', 'show the business or viewer impact of your work', 'avoid team-only claims with no personal ownership', 'target one Netflix function at a time'],
    proofItems: ['major launches', 'viewer or customer experience metrics', 'platform reliability', 'content workflow improvements', 'business impact with concise context'],
    interviewPrepItems: ['3 stories about independent judgment', '2 tradeoff decisions with imperfect information', '2 launch or quality stories', '1 example of simplifying a process', '1 reason Netflix is a fit beyond entertainment interest'],
    faqItems: [
      {
        question: 'What kind of resume works best for Netflix?',
        answer: 'A concise resume with clear ownership, judgment, and outcomes. Netflix-style applications should not hide behind dense paragraphs or generic team claims.',
      },
      {
        question: 'Do I need entertainment experience for Netflix?',
        answer: 'Not always. Product, engineering, data, ads, operations, and platform roles can value relevant functional depth even outside entertainment.',
      },
      {
        question: 'Should I include a long cover letter for Netflix?',
        answer: 'Only if it adds specific role fit. The resume should already make your function, impact, and judgment clear.',
      },
    ],
    sourceLinks: [
      { label: 'Netflix Jobs', href: 'https://jobs.netflix.com/' },
      { label: 'Netflix Culture', href: 'https://jobs.netflix.com/culture' },
    ],
    resumeExample: {
      id: 'netflix-content-platform',
      title: 'Netflix Content Platform Resume Example',
      badgeLabel: 'Netflix-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://jobs.netflix.com/',
      sourceNote: exampleSourceNote('Netflix', 'content platform product manager'),
      candidateName: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      phone: '+1 323 555 0133',
      location: 'Los Angeles, CA',
      currentRole: 'Content Platform Product Manager',
      summary:
        'Product manager with 7+ years improving content operations, streaming quality workflows, and regional launch readiness. Strong in judgment-heavy prioritization, concise communication, and cross-functional platform delivery.',
      experience: [
        {
          company: 'Streamline Media',
          title: 'Content Platform Product Manager',
          location: 'Los Angeles, CA',
          startDate: 'Jan 2021',
          endDate: 'Present',
          bullets: [
            'Led rollout planning for a localization workflow used by 90+ content operators, cutting handoff errors by 28%.',
            'Prioritized 12 playback-quality fixes using QoE metrics, reducing high-severity streaming complaints by 16%.',
            'Aligned product, content operations, data, and engineering teams around launch criteria for 7 regional releases.',
            'Retired 3 low-value manual review steps after data analysis showed no measurable quality lift, saving 220 operator hours per quarter.',
          ],
        },
        {
          company: 'Viewly',
          title: 'Product Operations Lead',
          location: 'New York, NY',
          startDate: 'Sep 2017',
          endDate: 'Dec 2020',
          bullets: [
            'Built release-readiness process for video publishing tools used by 300+ internal users.',
            'Reduced escalations by 19% by standardizing incident severity definitions and owner handoffs.',
            'Wrote weekly decision memos that clarified launch risks for product and engineering leadership.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Product', skills: ['Platform Products', 'Prioritization', 'Launch Criteria', 'Decision Memos'] },
        { title: 'Media Operations', skills: ['Localization Workflows', 'Content Operations', 'Quality Reviews', 'Regional Launches'] },
        { title: 'Data', skills: ['SQL', 'Looker', 'QoE Metrics', 'Incident Analysis'] },
      ],
      analysisPoints: [
        'The resume shows independent judgment through prioritization, launch criteria, and retiring low-value work.',
        'The bullets are concise but still carry scale, metrics, and business context.',
        'The sample connects content operations with platform product delivery.',
        'The skills section supports Netflix-relevant platform and media workflows.',
      ],
      accentColor: '#E50914',
    },
  },
  {
    slug: 'how-to-land-a-job-at-stripe',
    companyName: 'Stripe',
    title: 'How to Get a Job at Stripe: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Stripe in 2026: resume strategy for payments, APIs, infrastructure, risk, product, operations, and a Stripe-ready resume example.',
    opening:
      'Stripe applications reward clear thinking. A strong resume explains the problem, the system, the customer impact, and the result without buzzwords.',
    strategyNote:
      'Payments, APIs, risk, infrastructure, operations, and go-to-market roles each need different evidence. The best Stripe resume is concise and technically legible.',
    lanes: ['Payments product', 'API and infrastructure engineering', 'Risk and fraud', 'Operations and support', 'Sales, solutions, and partnerships'],
    resumeSignals: ['systems thinking', 'customer or developer empathy', 'payments or platform relevance', 'clear writing', 'measurable reliability, conversion, or risk impact'],
    beforeAfterRows: [
      ['Worked on payment workflows.', 'Redesigned payment retry rules for 18K monthly invoices, lifting successful recovery by 8.4% without increasing dispute rate.'],
      ['Improved API docs.', 'Rewrote API onboarding docs and sample flows, reducing developer setup tickets by 31% in 2 quarters.'],
      ['Handled fraud issues.', 'Prioritized 7 risk-rule changes that cut false-positive reviews by 22% while holding chargeback rate flat.'],
    ],
    checklistItems: ['make the problem and system clear', 'show payment, API, risk, or infrastructure relevance when real', 'keep prose concise and specific', 'include developer or customer impact', 'avoid generic startup cliches'],
    proofItems: ['API products', 'payment flows', 'risk or fraud metrics', 'developer experience improvements', 'reliability or conversion wins'],
    interviewPrepItems: ['2 examples of simplifying complex systems', '2 customer or developer empathy stories', '2 technical tradeoff stories', '1 writing sample or clear case study', '1 explanation of why this Stripe role fits your work'],
    faqItems: [
      {
        question: 'Do I need payments experience to work at Stripe?',
        answer: 'Not always, but payments, API, developer tooling, risk, infrastructure, or financial workflow relevance should appear if you have it.',
      },
      {
        question: 'What does Stripe look for in resume writing?',
        answer: 'Clarity. Use precise bullets that make the problem, system, action, and result easy to understand.',
      },
      {
        question: 'Should I include technical detail for non-engineering Stripe roles?',
        answer: 'Include enough technical or systems context to show judgment, but keep it tied to customer, business, or operational outcomes.',
      },
    ],
    sourceLinks: [
      { label: 'Stripe Jobs', href: 'https://stripe.com/jobs' },
      { label: 'Stripe Life', href: 'https://stripe.com/life' },
    ],
    resumeExample: {
      id: 'stripe-payments-product',
      title: 'Stripe Payments Product Resume Example',
      badgeLabel: 'Stripe-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://stripe.com/jobs',
      sourceNote: exampleSourceNote('Stripe', 'payments product manager'),
      candidateName: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      phone: '+1 212 555 0144',
      location: 'New York, NY',
      currentRole: 'Payments Product Manager',
      summary:
        'Payments product manager with 6+ years improving billing workflows, API onboarding, and risk operations for B2B platforms. Strong in systems thinking, developer empathy, and measurable payment recovery outcomes.',
      experience: [
        {
          company: 'InvoiceKit',
          title: 'Payments Product Manager',
          location: 'New York, NY',
          startDate: 'Jun 2020',
          endDate: 'Present',
          bullets: [
            'Redesigned payment retry rules for 18K monthly invoices, lifting successful recovery by 8.4% without increasing dispute rate.',
            'Rewrote API onboarding docs and sample flows, reducing developer setup tickets by 31% in 2 quarters.',
            'Prioritized 7 risk-rule changes that cut false-positive reviews by 22% while holding chargeback rate flat.',
            'Partnered with engineering and support to build payment failure taxonomy used in weekly roadmap reviews.',
          ],
        },
        {
          company: 'Ledgerly',
          title: 'Product Analyst',
          location: 'Boston, MA',
          startDate: 'Aug 2018',
          endDate: 'May 2020',
          bullets: [
            'Analyzed billing funnel events and identified ACH verification drop-off that drove a 5.6% activation lift after UX changes.',
            'Built SQL dashboards for failed payments, disputes, and refund timing across 4 product lines.',
            'Documented edge cases for subscription billing and tax calculation used by product and QA teams.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Payments', skills: ['Payment Recovery', 'Disputes', 'Billing Flows', 'Risk Rules', 'ACH'] },
        { title: 'Product', skills: ['API Onboarding', 'Developer Experience', 'PRDs', 'Roadmaps'] },
        { title: 'Analytics', skills: ['SQL', 'Looker', 'Funnel Analysis', 'Experimentation'] },
      ],
      analysisPoints: [
        'The resume is concise and payment-specific, which fits Stripe better than generic fintech language.',
        'The bullets show systems thinking across retries, risk rules, API onboarding, and failure taxonomy.',
        'Developer and customer impact are measurable through setup tickets, recovery rate, and disputes.',
        'The skills section keeps financial workflow terms searchable without overloading the page.',
      ],
      accentColor: '#635BFF',
    },
  },
  {
    slug: 'how-to-land-a-job-at-shopify',
    companyName: 'Shopify',
    title: 'How to Get a Job at Shopify: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Shopify in 2026: resume strategy for merchant impact, product, engineering, support, commerce operations, and a Shopify-ready resume example.',
    opening:
      'Shopify resumes should show practical merchant impact. The strongest applications prove that you can help businesses sell, operate, support customers, or build better commerce workflows.',
    strategyNote:
      'Do not write a generic e-commerce resume. Show the exact merchant, product, platform, support, or engineering problem you can solve.',
    lanes: ['Merchant product', 'Commerce engineering', 'Support and merchant success', 'Operations and risk', 'Growth and partnerships'],
    resumeSignals: ['merchant or customer outcomes', 'autonomy and practical execution', 'commerce workflow understanding', 'product judgment', 'clear written communication'],
    beforeAfterRows: [
      ['Helped merchants onboard.', 'Redesigned merchant setup checklist, increasing first-store activation by 14% across 8K monthly signups.'],
      ['Worked on support content.', 'Rebuilt help-center flows for shipping and tax setup, reducing related support contacts by 18%.'],
      ['Managed product improvements.', 'Prioritized 11 checkout and catalog fixes based on merchant interviews and funnel data, lifting publish completion by 9%.'],
    ],
    checklistItems: ['lead with merchant impact', 'show commerce workflows and practical outcomes', 'prove autonomy with shipped work', 'use clear writing and simple structure', 'avoid abstract strategy language without merchant proof'],
    proofItems: ['merchant activation', 'checkout or catalog improvements', 'support reduction', 'commerce platform work', 'growth or retention outcomes'],
    interviewPrepItems: ['3 merchant-impact stories', '2 examples of independent execution', '2 product judgment stories', '1 story about simplifying a workflow', '1 concise explanation of why Shopify merchants fit your experience'],
    faqItems: [
      {
        question: 'What should a Shopify resume emphasize?',
        answer: 'Merchant outcomes. Show how your work improved setup, selling, checkout, support, retention, or business operations.',
      },
      {
        question: 'Do I need e-commerce experience for Shopify?',
        answer: 'It helps, but adjacent marketplace, SaaS, support, product, and platform work can also be relevant if you connect it to merchant value.',
      },
      {
        question: 'How technical should a Shopify resume be?',
        answer: 'Match the role. Engineering resumes need technical depth; product, success, and operations resumes need enough systems detail to prove practical judgment.',
      },
    ],
    sourceLinks: [
      { label: 'Shopify Careers', href: 'https://www.shopify.com/careers' },
      { label: 'Shopify Engineering', href: 'https://shopify.engineering/' },
    ],
    resumeExample: {
      id: 'shopify-merchant-product',
      title: 'Shopify Merchant Product Resume Example',
      badgeLabel: 'Shopify-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.shopify.com/careers',
      sourceNote: exampleSourceNote('Shopify', 'merchant product manager'),
      candidateName: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '+1 613 555 0191',
      location: 'Toronto, Canada',
      currentRole: 'Merchant Product Manager',
      summary:
        'Commerce product manager with 6+ years improving merchant onboarding, checkout readiness, and support deflection for SaaS platforms. Strong in practical workflow design, merchant interviews, and activation metrics.',
      experience: [
        {
          company: 'CartPilot',
          title: 'Merchant Product Manager',
          location: 'Toronto, Canada',
          startDate: 'Jan 2021',
          endDate: 'Present',
          bullets: [
            'Redesigned merchant setup checklist, increasing first-store activation by 14% across 8K monthly signups.',
            'Rebuilt help-center flows for shipping and tax setup, reducing related support contacts by 18%.',
            'Prioritized 11 checkout and catalog fixes based on merchant interviews and funnel data, lifting publish completion by 9%.',
            'Created merchant feedback loop with support and success teams, turning 400 monthly tickets into roadmap themes.',
          ],
        },
        {
          company: 'RetailOS',
          title: 'Product Operations Analyst',
          location: 'Ottawa, Canada',
          startDate: 'Jul 2018',
          endDate: 'Dec 2020',
          bullets: [
            'Built activation dashboards for onboarding, payments, shipping, and catalog completion across 12K merchants.',
            'Reduced duplicate support escalations by 23% by documenting setup edge cases and owner handoffs.',
            'Supported launch of self-serve discount tooling adopted by 2,100 merchants in the first quarter.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Commerce', skills: ['Merchant Onboarding', 'Checkout Flows', 'Catalog Setup', 'Support Deflection'] },
        { title: 'Product', skills: ['Roadmaps', 'Merchant Interviews', 'Activation Metrics', 'Workflow Design'] },
        { title: 'Tools', skills: ['SQL', 'Amplitude', 'Zendesk', 'Figma', 'Jira'] },
      ],
      analysisPoints: [
        'The resume keeps merchant outcomes at the center, which is the right Shopify framing.',
        'The bullets prove activation, support reduction, and checkout readiness with numbers.',
        'The candidate shows practical workflow improvement rather than abstract strategy.',
        'Skills are grouped around commerce, product, and tooling for quick recruiter scanning.',
      ],
      accentColor: '#008060',
    },
  },
  {
    slug: 'how-to-land-a-job-at-airbnb',
    companyName: 'Airbnb',
    title: 'How to Get a Job at Airbnb: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Airbnb in 2026: resume strategy for marketplace, guest, host, trust, product, operations, and an Airbnb-ready resume example.',
    opening:
      'Airbnb resumes should connect your work to real people and marketplace quality. Strong applications show guest, host, trust, operational, or product outcomes with clear evidence.',
    strategyNote:
      'A generic travel or tech resume is too soft. Target the exact Airbnb problem: marketplace growth, trust, service quality, product experience, design, data, or operations.',
    lanes: ['Marketplace product', 'Trust and safety', 'Host and guest operations', 'Design and research', 'Data, growth, and platform engineering'],
    resumeSignals: ['customer and marketplace impact', 'trust or quality outcomes', 'operations at scale', 'product intuition', 'clear cross-functional communication'],
    beforeAfterRows: [
      ['Improved customer support workflows.', 'Redesigned guest issue routing and reduced average resolution time by 22% across 40K monthly support cases.'],
      ['Worked on marketplace quality.', 'Built host quality dashboards that identified 9 recurring listing issues and improved review response rate by 15%.'],
      ['Helped product teams make decisions.', 'Synthesized guest and host feedback into 6 booking-flow improvements, lifting completed reservations by 4.8%.'],
    ],
    checklistItems: ['show guest, host, trust, or marketplace impact', 'include scale and quality metrics', 'make empathy concrete through workflows and outcomes', 'target one role family', 'avoid broad hospitality language without product or operations proof'],
    proofItems: ['marketplace conversion', 'trust and safety improvements', 'guest or host support outcomes', 'quality dashboards', 'booking or retention metrics'],
    interviewPrepItems: ['3 customer-impact stories', '2 marketplace or operations tradeoffs', '2 trust or quality examples', '1 story about improving a broken journey', '1 reason Airbnb users or marketplace problems fit your work'],
    faqItems: [
      {
        question: 'What should an Airbnb resume show?',
        answer: 'Guest, host, marketplace, trust, or experience impact. Make the user outcome visible instead of only describing internal tasks.',
      },
      {
        question: 'Do I need travel industry experience for Airbnb?',
        answer: 'Not always. Marketplace, consumer product, operations, trust and safety, support, design, and data experience can transfer when the resume explains the connection.',
      },
      {
        question: 'How do I tailor for Airbnb trust and safety roles?',
        answer: 'Show policy operations, risk signals, user protection, quality workflows, incident response, or measurable safety outcomes.',
      },
    ],
    sourceLinks: [
      { label: 'Airbnb Careers', href: 'https://careers.airbnb.com/' },
      { label: 'Airbnb News', href: 'https://news.airbnb.com/' },
    ],
    resumeExample: {
      id: 'airbnb-marketplace-ops',
      title: 'Airbnb Marketplace Operations Resume Example',
      badgeLabel: 'Airbnb-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://careers.airbnb.com/',
      sourceNote: exampleSourceNote('Airbnb', 'marketplace operations manager'),
      candidateName: 'Lena Garcia',
      email: 'lena.garcia@example.com',
      phone: '+1 415 555 0166',
      location: 'San Francisco, CA',
      currentRole: 'Marketplace Operations Manager',
      summary:
        'Marketplace operations manager with 7+ years improving guest support, host quality, and booking conversion for consumer platforms. Strong in journey analysis, trust workflows, and cross-functional marketplace improvements.',
      experience: [
        {
          company: 'StayLoop',
          title: 'Marketplace Operations Manager',
          location: 'San Francisco, CA',
          startDate: 'Feb 2020',
          endDate: 'Present',
          bullets: [
            'Redesigned guest issue routing and reduced average resolution time by 22% across 40K monthly support cases.',
            'Built host quality dashboards that identified 9 recurring listing issues and improved review response rate by 15%.',
            'Synthesized guest and host feedback into 6 booking-flow improvements, lifting completed reservations by 4.8%.',
            'Partnered with trust, product, and support teams to reduce repeat safety escalations by 19%.',
          ],
        },
        {
          company: 'TripNest',
          title: 'Customer Experience Analyst',
          location: 'Austin, TX',
          startDate: 'Jun 2017',
          endDate: 'Jan 2020',
          bullets: [
            'Mapped cancellation and refund friction across 11 markets, reducing manual review backlog by 26%.',
            'Created support QA scorecards used by 70+ agents to improve guest communication consistency.',
            'Analyzed booking funnel drop-off and influenced mobile copy changes that lifted completion by 3.9%.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Marketplace', skills: ['Guest Experience', 'Host Quality', 'Booking Funnel', 'Trust Workflows'] },
        { title: 'Operations', skills: ['Support Routing', 'QA Scorecards', 'Escalation Reduction', 'Journey Mapping'] },
        { title: 'Data & Tools', skills: ['SQL', 'Looker', 'Zendesk', 'Amplitude', 'Figma'] },
      ],
      analysisPoints: [
        'The resume ties every section to guest, host, trust, or marketplace outcomes.',
        'The metrics show support speed, quality, booking conversion, and escalation reduction.',
        'The candidate shows empathy through operational systems rather than generic customer-first language.',
        'The skills map cleanly to Airbnb marketplace and trust-adjacent roles.',
      ],
      accentColor: '#FF5A5F',
    },
  },
  {
    slug: 'how-to-land-a-job-at-uber',
    companyName: 'Uber',
    title: 'How to Get a Job at Uber: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Uber in 2026: resume strategy for marketplace operations, mobility, delivery, product, engineering, and an Uber-ready resume example.',
    opening:
      'Uber resumes need to show comfort with speed, ambiguity, and operational complexity. The strongest applications connect work to marketplace health, reliability, growth, or cost.',
    strategyNote:
      'Target the exact Uber surface: rides, delivery, freight, ads, marketplace, payments, safety, engineering, or operations. The resume should make the pace and metric ownership obvious.',
    lanes: ['Marketplace operations', 'Mobility and delivery product', 'Engineering and data', 'Safety and risk', 'Growth, ads, and business operations'],
    resumeSignals: ['marketplace thinking', 'operational complexity', 'fast execution', 'cost, speed, reliability, or conversion metrics', 'cross-functional ownership'],
    beforeAfterRows: [
      ['Managed city operations reports.', 'Built city health dashboard across 12 markets, reducing weekly issue diagnosis time by 46% for operations leaders.'],
      ['Improved driver onboarding.', 'Redesigned courier onboarding funnel and increased first-delivery completion by 11% across 35K monthly signups.'],
      ['Worked on reliability issues.', 'Led incident review for ETA accuracy gaps and shipped 5 fixes that reduced late-arrival complaints by 13%.'],
    ],
    checklistItems: ['show marketplace or operations complexity', 'use speed, cost, reliability, conversion, or supply metrics', 'make ownership clear', 'tailor separately for product, ops, data, and engineering', 'avoid vague fast-paced environment claims'],
    proofItems: ['marketplace health metrics', 'city or regional operations', 'driver, courier, rider, or eater outcomes', 'reliability improvements', 'growth or conversion wins'],
    interviewPrepItems: ['3 fast-execution stories', '2 marketplace tradeoff examples', '2 operational problem-solving stories', '1 failure story with a changed mechanism', '1 explanation of why this Uber business line fits you'],
    faqItems: [
      {
        question: 'What metrics matter for Uber applications?',
        answer: 'Speed, reliability, cost, conversion, marketplace health, completion rate, defect rate, and customer experience metrics are useful when tied to your actual work.',
      },
      {
        question: 'Do I need mobility experience for Uber?',
        answer: 'Not always. Marketplace, logistics, consumer product, operations, payments, risk, growth, or infrastructure work can transfer if the resume explains the connection.',
      },
      {
        question: 'How should I write Uber operations bullets?',
        answer: 'Show the market, workflow, volume, action, and measurable change. Avoid bullets that only say coordinated or supported.',
      },
    ],
    sourceLinks: [
      { label: 'Uber Careers', href: 'https://www.uber.com/us/en/careers/' },
      { label: 'Uber Engineering', href: 'https://www.uber.com/blog/engineering/' },
    ],
    resumeExample: {
      id: 'uber-marketplace-operations',
      title: 'Uber Marketplace Operations Resume Example',
      badgeLabel: 'Uber-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.uber.com/us/en/careers/',
      sourceNote: exampleSourceNote('Uber', 'marketplace operations manager'),
      candidateName: 'Marcus Johnson',
      email: 'marcus.johnson@example.com',
      phone: '+1 312 555 0172',
      location: 'Chicago, IL',
      currentRole: 'Marketplace Operations Manager',
      summary:
        'Marketplace operations manager with 6+ years improving city health, courier onboarding, and reliability metrics for high-volume consumer platforms. Strong in fast execution, SQL analysis, and cross-functional marketplace problem solving.',
      experience: [
        {
          company: 'MoveNow',
          title: 'Marketplace Operations Manager',
          location: 'Chicago, IL',
          startDate: 'Mar 2020',
          endDate: 'Present',
          bullets: [
            'Built city health dashboard across 12 markets, reducing weekly issue diagnosis time by 46% for operations leaders.',
            'Redesigned courier onboarding funnel and increased first-delivery completion by 11% across 35K monthly signups.',
            'Led incident review for ETA accuracy gaps and shipped 5 fixes that reduced late-arrival complaints by 13%.',
            'Created market playbooks for supply shortages, cutting peak-hour cancellation rate by 8% in pilot cities.',
          ],
        },
        {
          company: 'Fleetly',
          title: 'Operations Analyst',
          location: 'Dallas, TX',
          startDate: 'Jul 2018',
          endDate: 'Feb 2020',
          bullets: [
            'Analyzed route completion, driver availability, and support escalations across 9 regional delivery markets.',
            'Automated weekly performance reports in SQL and Tableau, saving 7 hours per week.',
            'Partnered with support teams to reduce duplicate escalation categories by 21%.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Marketplace', skills: ['City Health', 'Supply-Demand Balance', 'Courier Onboarding', 'Reliability Metrics'] },
        { title: 'Operations', skills: ['Incident Reviews', 'Playbooks', 'Escalation Reduction', 'Process Improvement'] },
        { title: 'Analytics', skills: ['SQL', 'Tableau', 'Experiment Analysis', 'Forecasting'] },
      ],
      analysisPoints: [
        'The resume makes speed, marketplace complexity, and operations ownership visible quickly.',
        'The bullets cover diagnosis time, completion rate, ETA complaints, and cancellations.',
        'The candidate shows market-level thinking rather than only back-office coordination.',
        'Skills map to Uber marketplace operations and product-adjacent roles.',
      ],
      accentColor: '#000000',
    },
  },
  {
    slug: 'how-to-land-a-job-at-tiktok',
    companyName: 'TikTok',
    title: 'How to Get a Job at TikTok: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at TikTok in 2026: resume strategy for creator, ads, growth, trust and safety, operations, product, and a TikTok-ready resume example.',
    opening:
      'TikTok applications need to show speed, user understanding, and measurable impact. The strongest resumes are specific about creator, content, ads, growth, safety, or platform outcomes.',
    strategyNote:
      'Avoid trend-heavy language. Recruiters need proof that you can improve a fast-moving consumer product, creator ecosystem, ads system, or trust workflow.',
    lanes: ['Creator and consumer product', 'Ads and monetization', 'Trust and safety', 'Growth and operations', 'Engineering and data'],
    resumeSignals: ['consumer product intuition', 'growth or engagement metrics', 'creator or ads relevance', 'trust and safety depth', 'fast launch execution'],
    beforeAfterRows: [
      ['Managed trust and safety workflows.', 'Redesigned policy escalation workflow for creator reports, reducing median review time by 34% across 60K monthly cases.'],
      ['Worked on creator growth.', 'Launched creator onboarding experiments that increased second-post completion by 10.5% in 2 regions.'],
      ['Analyzed content performance.', 'Built engagement dashboard for 18 creator segments and influenced 7 lifecycle campaigns.'],
    ],
    checklistItems: ['name the product surface or user group', 'show growth, engagement, safety, or ads outcomes', 'avoid vague social media enthusiasm', 'include speed and launch cadence where real', 'target one TikTok business area per resume'],
    proofItems: ['creator growth', 'content moderation quality', 'ads or monetization outcomes', 'consumer engagement', 'regional operations or lifecycle campaigns'],
    interviewPrepItems: ['3 fast-moving product or operations stories', '2 user or creator insight examples', '2 trust, ads, or growth metric stories', '1 failure story with learning', '1 explanation of why TikTok product dynamics fit your work'],
    faqItems: [
      {
        question: 'What should a TikTok resume emphasize?',
        answer: 'Consumer product impact, creator or ads relevance, growth metrics, trust and safety depth, or operational speed depending on the role.',
      },
      {
        question: 'Should I mention personal social media experience?',
        answer: 'Only if it proves relevant business, creator, content, or growth skill. Personal platform familiarity is not enough by itself.',
      },
      {
        question: 'How do I tailor for TikTok trust and safety roles?',
        answer: 'Show policy workflows, case volume, review quality, escalation speed, tooling, risk analysis, and measurable safety or quality outcomes.',
      },
    ],
    sourceLinks: [
      { label: 'TikTok Careers', href: 'https://careers.tiktok.com/' },
      { label: 'TikTok Newsroom', href: 'https://newsroom.tiktok.com/' },
    ],
    resumeExample: {
      id: 'tiktok-trust-product',
      title: 'TikTok Trust Product Resume Example',
      badgeLabel: 'TikTok-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://careers.tiktok.com/',
      sourceNote: exampleSourceNote('TikTok', 'trust and safety product manager'),
      candidateName: 'Ava Chen',
      email: 'ava.chen@example.com',
      phone: '+1 310 555 0194',
      location: 'Los Angeles, CA',
      currentRole: 'Trust and Safety Product Manager',
      summary:
        'Trust and safety product manager with 6+ years improving creator reporting, review quality, and lifecycle workflows for consumer platforms. Strong in policy operations, product analytics, and fast cross-functional delivery.',
      experience: [
        {
          company: 'Cliply',
          title: 'Trust and Safety Product Manager',
          location: 'Los Angeles, CA',
          startDate: 'Apr 2020',
          endDate: 'Present',
          bullets: [
            'Redesigned policy escalation workflow for creator reports, reducing median review time by 34% across 60K monthly cases.',
            'Launched creator onboarding experiments that increased second-post completion by 10.5% in 2 regions.',
            'Built engagement dashboard for 18 creator segments and influenced 7 lifecycle campaigns.',
            'Partnered with policy, data, and operations teams to reduce duplicate review queues by 26%.',
          ],
        },
        {
          company: 'SocialNest',
          title: 'Product Operations Analyst',
          location: 'Seattle, WA',
          startDate: 'Jul 2018',
          endDate: 'Mar 2020',
          bullets: [
            'Analyzed content review queues and identified 5 case types causing 39% of SLA misses.',
            'Created weekly creator health reports used by product and community teams.',
            'Improved moderation QA sampling process, increasing reviewer feedback coverage from 12% to 28%.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Trust & Safety', skills: ['Policy Operations', 'Escalation Workflows', 'Moderation QA', 'Risk Signals'] },
        { title: 'Consumer Product', skills: ['Creator Onboarding', 'Engagement Metrics', 'Lifecycle Campaigns', 'Experimentation'] },
        { title: 'Tools', skills: ['SQL', 'Looker', 'Amplitude', 'Jira', 'Zendesk'] },
      ],
      analysisPoints: [
        'The resume focuses on trust, creator, and consumer-product outcomes instead of generic social media interest.',
        'The metrics show speed, case volume, creator completion, and queue reduction.',
        'The candidate demonstrates cross-functional work with policy, data, and operations.',
        'Skills are relevant to TikTok trust and safety product roles.',
      ],
      accentColor: '#111827',
    },
  },
  {
    slug: 'how-to-land-a-job-at-nvidia',
    companyName: 'NVIDIA',
    title: 'How to Get a Job at NVIDIA: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at NVIDIA in 2026: resume strategy for AI infrastructure, hardware, software, developer platforms, and an NVIDIA-ready resume example.',
    opening:
      'NVIDIA resumes need technical substance. Whether the role is hardware, software, AI infrastructure, product, or developer ecosystem, the first screen should show real systems depth.',
    strategyNote:
      'Avoid generic AI enthusiasm. Show concrete systems, platforms, performance work, developer workflows, hardware context, or ML infrastructure evidence.',
    lanes: ['AI infrastructure and GPUs', 'Software and systems engineering', 'Hardware and silicon', 'Developer platforms', 'Product, solutions, and ecosystem roles'],
    resumeSignals: ['technical depth', 'systems or performance context', 'AI infrastructure relevance', 'developer or platform impact', 'measurable engineering or product outcomes'],
    beforeAfterRows: [
      ['Worked on ML infrastructure.', 'Improved GPU job scheduling for 1,400 weekly training runs, raising utilization from 61% to 74% across shared clusters.'],
      ['Built developer tools.', 'Launched model deployment CLI used by 320 internal developers, reducing setup time from 2 hours to 22 minutes.'],
      ['Supported AI platform customers.', 'Resolved 48 high-priority inference latency issues by building diagnostics for batch size, memory, and model-serving config.'],
    ],
    checklistItems: ['lead with technical domain and systems scale', 'show performance, utilization, latency, or developer productivity metrics', 'include relevant stack without turning skills into noise', 'link to papers, repos, or technical writing when strong', 'separate hardware, software, AI platform, and product resumes'],
    proofItems: ['GPU or ML infrastructure', 'performance optimization', 'developer tools', 'systems engineering', 'AI platform or hardware-adjacent launches'],
    interviewPrepItems: ['3 technical deep-dive stories', '2 performance or systems tradeoffs', '2 examples of developer or customer impact', '1 failure story with root cause analysis', '1 explanation of why NVIDIA domain fits your work'],
    faqItems: [
      {
        question: 'Do I need GPU experience for NVIDIA?',
        answer: 'Not for every role, but technical relevance matters. AI infrastructure, systems, hardware, developer tooling, product, or ecosystem work should be made explicit.',
      },
      {
        question: 'How technical should an NVIDIA resume be?',
        answer: 'Technical enough for the role. Include stack, systems, metrics, and performance context, but keep bullets readable for recruiters and hiring managers.',
      },
      {
        question: 'What portfolio helps for NVIDIA?',
        answer: 'Technical writing, GitHub projects, papers, benchmarks, systems design work, or product case studies can help when they map to the role.',
      },
    ],
    sourceLinks: [
      { label: 'NVIDIA Careers', href: 'https://www.nvidia.com/en-us/about-nvidia/careers/' },
      { label: 'NVIDIA Developer', href: 'https://developer.nvidia.com/' },
    ],
    resumeExample: {
      id: 'nvidia-ai-platform',
      title: 'NVIDIA AI Platform Resume Example',
      badgeLabel: 'NVIDIA-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.nvidia.com/en-us/about-nvidia/careers/',
      sourceNote: exampleSourceNote('NVIDIA', 'AI platform product manager'),
      candidateName: 'Ravi Shah',
      email: 'ravi.shah@example.com',
      phone: '+1 408 555 0178',
      location: 'Santa Clara, CA',
      currentRole: 'AI Platform Product Manager',
      summary:
        'AI platform product manager with 7+ years improving ML infrastructure, developer workflows, and inference reliability. Strong in GPU utilization metrics, platform roadmaps, and translating systems constraints into product decisions.',
      experience: [
        {
          company: 'TensorGrid',
          title: 'AI Platform Product Manager',
          location: 'Santa Clara, CA',
          startDate: 'Jan 2021',
          endDate: 'Present',
          bullets: [
            'Improved GPU job scheduling for 1,400 weekly training runs, raising utilization from 61% to 74% across shared clusters.',
            'Launched model deployment CLI used by 320 internal developers, reducing setup time from 2 hours to 22 minutes.',
            'Resolved 48 high-priority inference latency issues by building diagnostics for batch size, memory, and model-serving config.',
            'Prioritized platform roadmap using developer feedback, queue wait time, GPU utilization, and model-serving incident data.',
          ],
        },
        {
          company: 'ScaleCompute',
          title: 'Technical Product Analyst',
          location: 'Raleigh, NC',
          startDate: 'Aug 2018',
          endDate: 'Dec 2020',
          bullets: [
            'Built dashboards for training job cost, queue time, and failed runs across 6 ML teams.',
            'Documented deployment patterns that reduced repeated support questions by 30%.',
            'Partnered with infrastructure engineers to evaluate autoscaling behavior for batch inference workloads.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'AI Infrastructure', skills: ['GPU Utilization', 'Model Serving', 'Inference Latency', 'Training Workloads'] },
        { title: 'Product', skills: ['Platform Roadmaps', 'Developer Experience', 'Diagnostics', 'Launch Planning'] },
        { title: 'Technical', skills: ['Python', 'SQL', 'Kubernetes', 'Docker', 'Prometheus'] },
      ],
      analysisPoints: [
        'The resume proves AI infrastructure relevance with utilization, inference latency, and developer tooling metrics.',
        'The candidate shows technical product judgment without pretending to be a research scientist.',
        'The bullets include systems scale and platform tradeoffs, which are important for NVIDIA-adjacent roles.',
        'Skills are grouped by infrastructure, product, and technical stack for fast scanning.',
      ],
      accentColor: '#76B900',
    },
  },
  {
    slug: 'how-to-land-a-job-at-notion',
    companyName: 'Notion',
    title: 'How to Get a Job at Notion: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Notion in 2026: resume strategy for product craft, workflow thinking, collaboration, growth, engineering, and a Notion-ready resume example.',
    opening:
      'Notion applications should show clean thinking. The strongest resumes connect product craft, workflow design, user empathy, and measurable outcomes without clutter.',
    strategyNote:
      'Notion is a product-led company, so generic SaaS language is weak. Show how you improved workflows, collaboration, adoption, templates, docs, or team productivity.',
    lanes: ['Product and growth', 'Design and research', 'Engineering and platform', 'Customer experience and operations', 'Marketing and community'],
    resumeSignals: ['workflow design', 'clear writing', 'product taste', 'user empathy', 'adoption, retention, or efficiency outcomes'],
    beforeAfterRows: [
      ['Improved internal workflows.', 'Redesigned team workspace templates for 4 customer segments, increasing activation checklist completion by 18%.'],
      ['Worked on product onboarding.', 'Launched lifecycle emails and in-product prompts that lifted second-week retention by 7.2%.'],
      ['Created documentation.', 'Built customer-facing setup guides that reduced workspace configuration tickets by 24%.'],
    ],
    checklistItems: ['show workflow and product thinking', 'use clean structure and concise writing', 'include adoption, retention, or productivity metrics', 'link to product, docs, or portfolio proof when relevant', 'avoid clutter and over-explaining'],
    proofItems: ['workflow redesign', 'template or docs impact', 'activation and retention metrics', 'product-led growth', 'collaboration or productivity improvements'],
    interviewPrepItems: ['3 product or workflow stories', '2 examples of clear writing changing outcomes', '2 user empathy stories', '1 example of simplifying complexity', '1 reason Notion product problems fit your background'],
    faqItems: [
      {
        question: 'What should a Notion resume emphasize?',
        answer: 'Product craft, workflow thinking, clear communication, user empathy, and outcomes like adoption, retention, support reduction, or productivity.',
      },
      {
        question: 'Should I include Notion usage on my resume?',
        answer: 'Only if it connects to real work such as workspace design, documentation, team operations, templates, or product-led growth.',
      },
      {
        question: 'How do I tailor for Notion design or product roles?',
        answer: 'Show shipped product work, user insight, workflow improvements, writing quality, and measurable adoption or experience outcomes.',
      },
    ],
    sourceLinks: [
      { label: 'Notion Careers', href: 'https://www.notion.com/careers' },
      { label: 'Notion Blog', href: 'https://www.notion.com/blog' },
    ],
    resumeExample: {
      id: 'notion-product-operations',
      title: 'Notion Product Operations Resume Example',
      badgeLabel: 'Notion-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.notion.com/careers',
      sourceNote: exampleSourceNote('Notion', 'product operations lead'),
      candidateName: 'Clara Nguyen',
      email: 'clara.nguyen@example.com',
      phone: '+1 415 555 0138',
      location: 'San Francisco, CA',
      currentRole: 'Product Operations Lead',
      summary:
        'Product operations lead with 6+ years improving workspace onboarding, documentation, lifecycle messaging, and customer workflow adoption. Strong in clear writing, product-led growth, and operational systems that help teams work better.',
      experience: [
        {
          company: 'WorkCanvas',
          title: 'Product Operations Lead',
          location: 'San Francisco, CA',
          startDate: 'Jan 2021',
          endDate: 'Present',
          bullets: [
            'Redesigned team workspace templates for 4 customer segments, increasing activation checklist completion by 18%.',
            'Launched lifecycle emails and in-product prompts that lifted second-week retention by 7.2%.',
            'Built customer-facing setup guides that reduced workspace configuration tickets by 24%.',
            'Created product feedback rituals connecting 600 monthly support notes to roadmap themes and release follow-up.',
          ],
        },
        {
          company: 'CollabHQ',
          title: 'Customer Success Operations Analyst',
          location: 'Portland, OR',
          startDate: 'Aug 2018',
          endDate: 'Dec 2020',
          bullets: [
            'Built onboarding playbooks used by 45 success managers across SMB and mid-market accounts.',
            'Improved admin setup completion by 12% by simplifying permission guidance and workspace examples.',
            'Created health-score dashboards that identified at-risk accounts 3 weeks earlier than manual reviews.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Workflow Design', skills: ['Workspace Onboarding', 'Templates', 'Documentation', 'Permission Flows'] },
        { title: 'Product Operations', skills: ['Feedback Loops', 'Lifecycle Messaging', 'Roadmap Inputs', 'Release Follow-up'] },
        { title: 'Tools', skills: ['SQL', 'Notion', 'Amplitude', 'Intercom', 'Figma'] },
      ],
      analysisPoints: [
        'The resume feels Notion-aligned because it focuses on workflows, templates, docs, and team productivity.',
        'The bullets show clear writing as a business lever, not just a soft skill.',
        'The candidate proves adoption and retention impact with metrics.',
        'The skills are organized around workflow and product operations rather than a generic SaaS stack.',
      ],
      accentColor: '#111111',
    },
  },
  {
    slug: 'how-to-land-a-job-at-figma',
    companyName: 'Figma',
    title: 'How to Get a Job at Figma: Resume Example, Application Strategy, and Interview Prep',
    excerpt:
      'How to get a job at Figma in 2026: resume strategy for design craft, collaboration, product systems, engineering, and a Figma-ready resume example.',
    opening:
      'Figma applications should show craft and collaboration in evidence, not adjectives. Whether you are in design, product, engineering, or community, the resume needs shipped work and product judgment.',
    strategyNote:
      'Pair the resume with portfolio or product proof when relevant. The resume should summarize scope, systems, users, and outcomes; the portfolio can show depth.',
    lanes: ['Product design and research', 'Design systems', 'Product management', 'Engineering and platform', 'Community and go-to-market'],
    resumeSignals: ['product craft', 'design systems thinking', 'collaboration quality', 'shipped work', 'user or team productivity impact'],
    beforeAfterRows: [
      ['Worked on design systems.', 'Led design-system adoption across 11 product squads, reducing duplicate components by 37% and accelerating prototype handoff.'],
      ['Improved collaboration with engineers.', 'Created design-to-code review workflow that cut UI implementation rework by 22% across 3 releases.'],
      ['Helped with product research.', 'Synthesized 46 customer interviews into 5 editor workflow changes that lifted feature adoption by 12%.'],
    ],
    checklistItems: ['show shipped design, product, or platform work', 'include portfolio proof when relevant', 'use metrics for adoption, rework, speed, or user outcomes', 'make collaboration specific', 'keep the resume visually clean and ATS-readable'],
    proofItems: ['portfolio case studies', 'design system adoption', 'editor or collaboration workflows', 'prototype-to-production improvements', 'user research outcomes'],
    interviewPrepItems: ['3 shipped product or craft stories', '2 collaboration tradeoffs with engineering or product', '2 user research or adoption stories', '1 critique or failure story', '1 reason Figma product problems fit your work'],
    faqItems: [
      {
        question: 'Do I need a portfolio for Figma?',
        answer: 'For design roles, yes. For product, engineering, and operations roles, portfolio-style case studies can still help if they show product thinking or shipped work.',
      },
      {
        question: 'What should a Figma resume emphasize?',
        answer: 'Craft, collaboration, systems thinking, shipped outcomes, user impact, and strong product judgment.',
      },
      {
        question: 'Should I design a highly visual resume for Figma?',
        answer: 'Keep the resume clean and readable. Let your portfolio show visual depth; the resume should remain ATS-safe and easy to scan.',
      },
    ],
    sourceLinks: [
      { label: 'Figma Careers', href: 'https://www.figma.com/careers/' },
      { label: 'Figma Blog', href: 'https://www.figma.com/blog/' },
    ],
    resumeExample: {
      id: 'figma-design-systems-product',
      title: 'Figma Design Systems Resume Example',
      badgeLabel: 'Figma-ready sample',
      sourceLabel: 'Rezoomed example',
      sourceUrl: 'https://www.figma.com/careers/',
      sourceNote: exampleSourceNote('Figma', 'design systems product manager'),
      candidateName: 'Mia Thompson',
      email: 'mia.thompson@example.com',
      phone: '+1 415 555 0109',
      location: 'San Francisco, CA',
      currentRole: 'Design Systems Product Manager',
      summary:
        'Design systems product manager with 7+ years improving collaborative product workflows, component adoption, and design-to-engineering handoff. Strong in product craft, user research synthesis, and measurable team productivity outcomes.',
      experience: [
        {
          company: 'CanvasLab',
          title: 'Design Systems Product Manager',
          location: 'San Francisco, CA',
          startDate: 'Feb 2020',
          endDate: 'Present',
          bullets: [
            'Led design-system adoption across 11 product squads, reducing duplicate components by 37% and accelerating prototype handoff.',
            'Created design-to-code review workflow that cut UI implementation rework by 22% across 3 releases.',
            'Synthesized 46 customer interviews into 5 editor workflow changes that lifted feature adoption by 12%.',
            'Built roadmap rituals between design, engineering, and research that improved component release predictability.',
          ],
        },
        {
          company: 'PrototypeHQ',
          title: 'Product Designer',
          location: 'Los Angeles, CA',
          startDate: 'Jul 2017',
          endDate: 'Jan 2020',
          bullets: [
            'Designed collaboration workflows for a B2B prototyping tool used by 8K monthly teams.',
            'Reduced prototype-sharing friction by 18% through usability tests, interaction updates, and clearer permission copy.',
            'Created component documentation adopted by 6 designers and 14 front-end engineers.',
          ],
        },
      ],
      education: sharedEducation,
      skillSections: [
        { title: 'Product Craft', skills: ['Design Systems', 'Editor Workflows', 'Component Adoption', 'Design QA'] },
        { title: 'Research & Delivery', skills: ['Customer Interviews', 'Usability Testing', 'Roadmaps', 'Launch Planning'] },
        { title: 'Tools', skills: ['Figma', 'FigJam', 'Jira', 'Amplitude', 'SQL'] },
      ],
      analysisPoints: [
        'The resume connects craft with measurable team and product outcomes.',
        'The bullets show design systems impact through component reduction, rework reduction, and adoption.',
        'The candidate has both product and design proof, which fits Figma-style collaboration.',
        'The skills section is relevant without turning into a visual-design keyword dump.',
      ],
      accentColor: '#A259FF',
    },
  },
]

const COMPANY_JOB_GUIDE_BY_SLUG = new Map(COMPANY_JOB_GUIDES.map(guide => [guide.slug, guide]))

export const COMPANY_JOB_GUIDE_SLUGS = new Set(COMPANY_JOB_GUIDES.map(guide => guide.slug))

export function getCompanyJobGuideBySlug(slug: string) {
  return COMPANY_JOB_GUIDE_BY_SLUG.get(slug) ?? null
}
