import type { CompanyJobGuide } from '@/lib/blog/company-job-guides'

type FinanceGuideConfig = {
  slug: string
  companyName: string
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
  roleTitle: string
  resumeTitle: string
  badgeLabel: string
  candidateName: string
  location: string
  currentRole: string
  summary: string
  experience: CompanyJobGuide['resumeExample']['experience']
  skillSections: CompanyJobGuide['resumeExample']['skillSections']
  analysisPoints: string[]
  accentColor: string
}

const financeSharedEducation = {
  institution: 'State University',
  degree: 'B.S.',
  field: 'Finance and Data Analytics',
  graduationDate: '2021',
}

function financeExampleSourceNote(companyName: string, targetRole: string) {
  return `A Rezoomed-built example resume tailored for ${companyName} ${targetRole} applications. It is not a claim that the candidate worked at ${companyName}; use it to study positioning, evidence density, and ATS-safe structure.`
}

function buildFinanceGuide(config: FinanceGuideConfig): CompanyJobGuide {
  return {
    slug: config.slug,
    companyName: config.companyName,
    title: `How to Get a Job at ${config.companyName}: Resume Example, Application Strategy, and Interview Prep`,
    excerpt: config.excerpt,
    opening: config.opening,
    strategyNote: config.strategyNote,
    lanes: config.lanes,
    resumeSignals: config.resumeSignals,
    beforeAfterRows: config.beforeAfterRows,
    checklistItems: config.checklistItems,
    proofItems: config.proofItems,
    interviewPrepItems: config.interviewPrepItems,
    faqItems: config.faqItems,
    sourceLinks: config.sourceLinks,
    resumeExample: {
      id: `${config.slug.replace(/^how-to-land-a-job-at-/, '')}-finance-example`,
      title: config.resumeTitle,
      badgeLabel: config.badgeLabel,
      sourceLabel: 'Rezoomed example',
      sourceUrl: config.sourceLinks[0]?.href ?? 'https://rezoomed.com',
      sourceNote: financeExampleSourceNote(config.companyName, config.roleTitle),
      candidateName: config.candidateName,
      email: `${config.candidateName.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.+|\.+$/g, '')}@example.com`,
      phone: '+1 212 555 0198',
      location: config.location,
      currentRole: config.currentRole,
      summary: config.summary,
      experience: config.experience,
      education: financeSharedEducation,
      skillSections: config.skillSections,
      analysisPoints: config.analysisPoints,
      accentColor: config.accentColor,
    },
  }
}

export const FINANCE_COMPANY_JOB_GUIDES: CompanyJobGuide[] = [
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-jpmorgan-chase',
    companyName: 'JPMorgan Chase',
    excerpt:
      'How to get a job at JPMorgan Chase in 2026: role targeting, resume strategy, banking proof, a JPMorgan Chase-ready resume example, and interview prep.',
    opening:
      'JPMorgan Chase applications need more than finance interest. The stronger signal is a resume that maps your evidence to one business area, explains your judgment, and proves you can operate in a regulated, client-heavy environment.',
    strategyNote:
      'Choose one path before editing: investment banking, markets, payments, wealth management, risk, operations, or technology. JPMorgan Chase is too broad for a one-size-fits-all finance resume.',
    lanes: ['Investment banking and corporate banking', 'Markets, sales, trading, and research', 'Payments and commercial banking', 'Asset and wealth management', 'Risk, operations, compliance, and technology'],
    resumeSignals: ['transaction, portfolio, or market analysis with measurable output', 'client service and stakeholder communication', 'financial modeling or data analysis under deadlines', 'risk awareness and controls thinking', 'leadership in teams where accuracy mattered'],
    beforeAfterRows: [
      ['Worked on valuation models for class projects.', 'Built DCF, precedent transaction, and football-field valuation model for a $1.2B consumer deal case, reconciling 3 revenue scenarios and presenting downside risk to a 5-person finance panel.'],
      ['Supported client reporting.', 'Automated weekly client portfolio reporting for 28 accounts, cutting manual reconciliation time by 41% and reducing late corrections.'],
      ['Interested in investment banking.', 'Prepared 12 company profiles, 4 merger rationale memos, and 3 debt capacity analyses for middle-market healthcare and fintech coverage practice.'],
    ],
    checklistItems: ['pick one JPMorgan Chase business area before you apply', 'rewrite bullets around deal, client, risk, or technology outcomes', 'include financial analysis tools only when tied to real work', 'show accuracy, deadline discipline, and ownership', 'prepare concise stories for explore, apply, interview, and decision stages'],
    proofItems: ['valuation models with assumptions explained', 'market or portfolio memos', 'risk and control improvements', 'client-facing work examples', 'technology projects that improved banking workflows'],
    interviewPrepItems: ['1 market story and why it matters to your target group', '2 resume stories with numbers and tradeoffs', '1 teamwork story with conflict or pressure', '1 technical answer for valuation, markets, or risk basics', '1 clear reason for JPMorgan Chase and the specific business area'],
    faqItems: [
      {
        question: 'Can I apply to JPMorgan Chase without a finance major?',
        answer: 'Yes, but the resume needs finance proof. Use modeling projects, accounting coursework, transaction research, market analysis, fintech work, or banking-adjacent internships to make the pivot credible.',
      },
      {
        question: 'What should I emphasize for a JPMorgan Chase internship?',
        answer: 'Show role fit, measurable academic or internship work, leadership, teamwork, and evidence that you understand the business area you selected.',
      },
      {
        question: 'Should I mention multiple JPMorgan Chase divisions?',
        answer: 'Research multiple divisions, but tailor each application to one. A focused resume usually beats a generic banking resume.',
      },
    ],
    sourceLinks: [
      { label: 'JPMorgan Chase Careers', href: 'https://www.jpmorganchase.com/careers' },
      { label: 'JPMorgan Chase How We Hire', href: 'https://www.jpmorganchase.com/careers/how-we-hire' },
      { label: 'JPMorgan Chase Application Tips', href: 'https://careers.jpmorgan.com/global/en/how-we-hire/prepare-an-application' },
    ],
    roleTitle: 'investment banking technology associate',
    resumeTitle: 'JPMorgan Chase Investment Banking Technology Resume Example',
    badgeLabel: 'JPMorgan-ready sample',
    candidateName: 'Avery Collins',
    location: 'New York, NY',
    currentRole: 'Investment Banking Technology Analyst',
    summary:
      'Finance and analytics candidate with 4+ years supporting valuation, client reporting, and banking workflow automation. Strong in financial modeling, data quality, stakeholder communication, and deadline-driven execution.',
    experience: [
      {
        company: 'Harbor Street Advisors',
        title: 'Investment Banking Technology Analyst',
        location: 'New York, NY',
        startDate: 'Aug 2022',
        endDate: 'Present',
        bullets: [
          'Built Python workflow that reconciled 18 weekly banker pipeline reports, reducing manual review time by 41%.',
          'Prepared valuation support for 9 healthcare and fintech pitches, including comparable company screens and sensitivity tables.',
          'Partnered with associates to QA 120+ client deck pages, catching data-source and formatting issues before final review.',
          'Created dashboard for deal team capacity, helping staffers identify 14 deadline conflicts before weekly allocation meetings.',
        ],
      },
      {
        company: 'NorthBridge Capital Club',
        title: 'Equity Research Lead',
        location: 'Boston, MA',
        startDate: 'Sep 2020',
        endDate: 'May 2022',
        bullets: [
          'Led 7-person student team covering payments and consumer finance, publishing 11 investment memos with downside cases.',
          'Presented $850M acquisition rationale case using DCF, public comps, and synergy assumptions to alumni finance judges.',
          'Standardized model templates that reduced formula errors during weekly stock pitch preparation.',
        ],
      },
    ],
    skillSections: [
      { title: 'Finance', skills: ['DCF Modeling', 'Comparable Companies', 'Transaction Analysis', 'Debt Capacity'] },
      { title: 'Banking Execution', skills: ['Client Deck QA', 'Pipeline Reporting', 'Market Research', 'Stakeholder Updates'] },
      { title: 'Tools', skills: ['Excel', 'PowerPoint', 'Python', 'SQL', 'Tableau'] },
    ],
    analysisPoints: [
      'The resume ties banking interest to specific modeling and client-delivery evidence.',
      'The bullets show accuracy and deadline ownership, which matter in analyst and associate-track roles.',
      'Technology work is framed as banking execution support rather than a generic automation project.',
      'The skills section keeps finance, execution, and tools separated for fast recruiter scanning.',
    ],
    accentColor: '#005EB8',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-goldman-sachs',
    companyName: 'Goldman Sachs',
    excerpt:
      'How to get a job at Goldman Sachs in 2026: application timing, resume positioning, deal and markets proof, a Goldman Sachs-ready resume example, and interview prep.',
    opening:
      'Goldman Sachs screens for excellence, judgment, and evidence that you can learn quickly in an apprenticeship-style environment. Your resume should make your analytical standard obvious before the interview starts.',
    strategyNote:
      'Start with the division, not the brand. Investment banking, global markets, asset management, engineering, risk, and operations each reward different proof.',
    lanes: ['Investment banking', 'Global markets and securities', 'Asset and wealth management', 'Engineering and data', 'Operations, risk, compliance, and controllers'],
    resumeSignals: ['high standards under pressure', 'structured thinking in ambiguous business problems', 'client or stakeholder trust', 'quantitative analysis with clean assumptions', 'learning agility and apprenticeship mindset'],
    beforeAfterRows: [
      ['Made pitch books for a finance club.', 'Built 34-page industrials pitch book with buyer universe, valuation bridge, synergy logic, and 3 downside cases for alumni judging panel.'],
      ['Analyzed markets.', 'Published weekly rates and FX brief summarizing 5 macro drivers, trade implications, and risk scenarios for a 180-member student investment fund.'],
      ['Worked with senior leaders.', 'Prepared executive KPI packet for CFO review, resolving 23 data inconsistencies across revenue, expense, and headcount sources.'],
    ],
    checklistItems: ['choose a Goldman Sachs division and region before tailoring', 'show excellence with numbers, rankings, selectivity, or high-stakes outcomes', 'make technical tools support a business decision', 'prepare a crisp answer for why Goldman Sachs', 'keep every resume bullet specific enough to defend in a Superday'],
    proofItems: ['deal or stock-pitch materials', 'markets commentary', 'portfolio performance analysis', 'technical projects that improved financial workflows', 'examples of high-accountability teamwork'],
    interviewPrepItems: ['1 why Goldman Sachs answer tied to a division', '2 leadership stories with measurable stakes', '1 technical walk-through for your target role', '1 market or transaction you can discuss clearly', '1 example of feedback improving your work'],
    faqItems: [
      {
        question: 'Does Goldman Sachs require a finance background?',
        answer: 'No, but applicants need proof that their skills map to the division. Engineering, risk, operations, and analytics paths can be strong if the resume explains the business impact.',
      },
      {
        question: 'What makes a Goldman Sachs resume stronger?',
        answer: 'Clear selectivity, high standards, quantified outcomes, and bullets that show judgment rather than just task completion.',
      },
      {
        question: 'Should I include leadership activities?',
        answer: 'Yes, when they show ownership, standards, teamwork, or client-style communication. Avoid generic club membership unless the outcome is specific.',
      },
    ],
    sourceLinks: [
      { label: 'Goldman Sachs Careers', href: 'https://www.goldmansachs.com/careers' },
      { label: 'Goldman Sachs Students', href: 'https://www.goldmansachs.com/careers/students' },
      { label: 'Goldman Sachs Prepare', href: 'https://www.goldmansachs.com/careers/students/prepare' },
    ],
    roleTitle: 'asset management analyst',
    resumeTitle: 'Goldman Sachs Asset Management Resume Example',
    badgeLabel: 'Goldman-ready sample',
    candidateName: 'Jordan Lee',
    location: 'Dallas, TX',
    currentRole: 'Asset Management Analyst',
    summary:
      'Asset management analyst with 4+ years of portfolio research, manager reporting, and market analysis experience. Strong in investment memo writing, performance attribution, stakeholder updates, and Excel-based modeling.',
    experience: [
      {
        company: 'Cedar Ridge Investments',
        title: 'Asset Management Analyst',
        location: 'Dallas, TX',
        startDate: 'Jul 2022',
        endDate: 'Present',
        bullets: [
          'Covered 42 public equities across financials and industrials, producing monthly portfolio notes for $380M strategy.',
          'Built attribution dashboard that separated sector, selection, and currency effects, reducing monthly close questions by 31%.',
          'Prepared 16 manager updates with market context, portfolio actions, and forward-looking risk commentary.',
          'Partnered with compliance to update 9 client materials after benchmark and disclosure changes.',
        ],
      },
      {
        company: 'Lone Star Investment Fund',
        title: 'Student Portfolio Manager',
        location: 'Austin, TX',
        startDate: 'Sep 2019',
        endDate: 'May 2022',
        bullets: [
          'Led 6 analysts managing a $220K student fund sleeve, outperforming benchmark by 280 bps over 2 semesters.',
          'Created investment memo template adopted across 4 sector teams to standardize thesis, valuation, and risk cases.',
          'Presented 3 long and 2 short recommendations to alumni committee using consensus revisions and margin bridge analysis.',
        ],
      },
    ],
    skillSections: [
      { title: 'Investing', skills: ['Equity Research', 'Performance Attribution', 'Portfolio Reporting', 'Risk Commentary'] },
      { title: 'Communication', skills: ['Investment Memos', 'Client Updates', 'Executive Summaries', 'Presentation QA'] },
      { title: 'Tools', skills: ['Excel', 'FactSet', 'Bloomberg', 'PowerPoint', 'SQL'] },
    ],
    analysisPoints: [
      'The resume makes excellence visible through portfolio scale, performance, and adopted templates.',
      'Each bullet connects analysis to a decision, report, or stakeholder outcome.',
      'The candidate shows both investment judgment and process discipline.',
      'The skills section mirrors asset management language without keyword stuffing.',
    ],
    accentColor: '#7399C6',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-morgan-stanley',
    companyName: 'Morgan Stanley',
    excerpt:
      'How to get a job at Morgan Stanley in 2026: resume targeting, interview preparation, wealth and investment banking proof, a resume example, and application strategy.',
    opening:
      'Morgan Stanley wants candidates who can explain their story, understand the business they are applying to, and show relevant skills without over-rehearsing. The resume should give interviewers a clear set of proof points to test.',
    strategyNote:
      'Build the application around one Morgan Stanley lane: investment banking, wealth management, sales and trading, research, technology, operations, or risk.',
    lanes: ['Investment banking and capital markets', 'Wealth management', 'Sales, trading, and research', 'Investment management', 'Technology, operations, and risk'],
    resumeSignals: ['credible understanding of the target business', 'client judgment and communication', 'financial analysis with clear assumptions', 'personal brand supported by evidence', 'teamwork in competitive or high-pressure settings'],
    beforeAfterRows: [
      ['Prepared for finance interviews.', 'Completed 40 technical banking drills, 8 mock interviews, and 6 deal discussions; improved LBO and accretion/dilution answer accuracy from 64% to 91%.'],
      ['Helped financial advisors.', 'Segmented 310 client households by liquidity needs and risk profile, helping advisors prioritize 47 planning reviews.'],
      ['Did research on public companies.', 'Wrote 9 equity notes covering revenue drivers, margin risk, valuation range, and catalysts for software and payments companies.'],
    ],
    checklistItems: ['know every resume line well enough to defend it', 'prepare stories that connect motivation, role fit, and evidence', 'research the division and current market context', 'show both technical preparation and client maturity', 'avoid generic prestige-driven answers'],
    proofItems: ['investment memos or deal notes', 'client segmentation or advisory support work', 'market updates with a view', 'technical finance practice records', 'leadership examples that reveal your personal brand'],
    interviewPrepItems: ['2 stories that explain who you are and what motivates you', '1 market or deal discussion relevant to the division', '1 technical walk-through for valuation, portfolio, or risk basics', '1 example of concise client communication', '1 question that shows you researched the team'],
    faqItems: [
      {
        question: 'What does Morgan Stanley interview prep focus on?',
        answer: 'Expect a mix of motivation, resume knowledge, business understanding, behavioral stories, and technical questions depending on the role.',
      },
      {
        question: 'How should I stand out for Morgan Stanley wealth management?',
        answer: 'Show client service, planning judgment, trust-building, analytical accuracy, and the ability to communicate financial ideas clearly.',
      },
      {
        question: 'Is networking important for Morgan Stanley?',
        answer: 'Yes. Use networking to understand the division and sharpen your role fit, not as a substitute for a strong resume.',
      },
    ],
    sourceLinks: [
      { label: 'Morgan Stanley Careers', href: 'https://www.morganstanley.com/about/careers' },
      { label: 'Morgan Stanley Students and Graduates', href: 'https://www.morganstanley.com/people-opportunities/students-graduates/' },
      { label: 'Morgan Stanley Interview Preparation', href: 'https://www.morganstanley.com/people-opportunities/students-graduates/resources/interview-preparation/' },
    ],
    roleTitle: 'investment banking analyst',
    resumeTitle: 'Morgan Stanley Investment Banking Resume Example',
    badgeLabel: 'Morgan Stanley-ready sample',
    candidateName: 'Priya Raman',
    location: 'New York, NY',
    currentRole: 'Investment Banking Analyst',
    summary:
      'Investment banking analyst with experience in valuation, market research, and client-ready materials for technology and healthcare coverage. Strong in financial modeling, technical interview preparation, and executive communication.',
    experience: [
      {
        company: 'East River Partners',
        title: 'Investment Banking Analyst',
        location: 'New York, NY',
        startDate: 'Jul 2022',
        endDate: 'Present',
        bullets: [
          'Supported 11 sell-side and financing pitches with buyer screening, valuation outputs, and public-company benchmarking.',
          'Built merger model sensitivity table for $740M strategic acquisition case, identifying EPS impact across 4 synergy ranges.',
          'Prepared management meeting materials for healthcare services client, summarizing 6 acquisition targets and integration risks.',
          'Owned final-page QA for 22 client decks, reducing late-stage corrections by 29% across analyst team.',
        ],
      },
      {
        company: 'University Investment Banking Workshop',
        title: 'Training Lead',
        location: 'Ann Arbor, MI',
        startDate: 'Sep 2019',
        endDate: 'May 2022',
        bullets: [
          'Coached 18 students through accounting, valuation, and behavioral interview preparation for banking recruiting.',
          'Created 60-question technical drill set that increased mock interview pass rate from 58% to 83%.',
          'Published weekly deal brief covering rationale, valuation, financing, and regulatory risk for active M&A transactions.',
        ],
      },
    ],
    skillSections: [
      { title: 'Banking', skills: ['M&A Analysis', 'DCF Modeling', 'Merger Models', 'Buyer Screening'] },
      { title: 'Interview Readiness', skills: ['Technical Drills', 'Deal Discussion', 'Behavioral Stories', 'Market Awareness'] },
      { title: 'Tools', skills: ['Excel', 'PowerPoint', 'FactSet', 'CapIQ', 'PitchBook'] },
    ],
    analysisPoints: [
      'The resume gives interviewers concrete deal, valuation, and client-material points to test.',
      'The candidate shows preparation discipline, which fits Morgan Stanley interview expectations.',
      'The bullets balance technical evidence with communication and QA ownership.',
      'The skills section is narrow enough for banking ATS scans and human review.',
    ],
    accentColor: '#0072CE',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-blackrock',
    companyName: 'BlackRock',
    excerpt:
      'How to get a job at BlackRock in 2026: asset management targeting, Aladdin and portfolio proof, a BlackRock-ready resume example, and interview prep.',
    opening:
      'BlackRock applications should show that you understand asset management, fiduciary responsibility, and the mix of investment, risk, technology, and client work behind the firm. Generic finance interest is not enough.',
    strategyNote:
      'Decide whether your story is investment, Aladdin/technology, risk, client service, operations, or early careers. Each route needs a different resume emphasis.',
    lanes: ['Portfolio management and investments', 'Aladdin and financial technology', 'Risk and quantitative analytics', 'Client service and relationship management', 'Operations, compliance, and business management'],
    resumeSignals: ['fiduciary mindset and client-first judgment', 'portfolio, risk, or market analysis', 'technology applied to investment workflows', 'collaboration across teams', 'clear examples of ownership and accountability'],
    beforeAfterRows: [
      ['Built dashboards for investments.', 'Built portfolio risk dashboard covering 160 holdings, surfacing factor, sector, and liquidity exposure shifts before weekly PM review.'],
      ['Interested in asset management.', 'Wrote 14 investment memos with thesis, risk, valuation, and catalyst sections for equities and fixed income holdings.'],
      ['Worked on a fintech project.', 'Designed reconciliation workflow for trade exceptions that reduced unresolved breaks by 36% across mock portfolio operations cycle.'],
    ],
    checklistItems: ['connect your work to clients, portfolios, risk, or financial technology', 'show how you handled investment data quality and assumptions', 'make Aladdin or technology references specific if relevant', 'prepare stories that demonstrate ownership', 'avoid making the resume only about markets without client impact'],
    proofItems: ['portfolio risk analysis', 'investment memos', 'Aladdin or fintech workflow projects', 'client reporting improvements', 'examples of cross-functional ownership'],
    interviewPrepItems: ['1 explanation of asset management and fiduciary responsibility', '2 examples of analytical judgment under uncertainty', '1 market view with risks and alternatives', '1 technology or process improvement story', '1 answer for why BlackRock and why this function'],
    faqItems: [
      {
        question: 'Is BlackRock only for investment roles?',
        answer: 'No. BlackRock also hires across Aladdin technology, risk, operations, client service, compliance, and business management.',
      },
      {
        question: 'What should a BlackRock resume emphasize?',
        answer: 'Show client-first thinking, portfolio or risk analysis, collaboration, accountability, and measurable improvements to investment or financial technology workflows.',
      },
      {
        question: 'How do I prepare for BlackRock interviews?',
        answer: 'Prepare examples tied to BlackRock principles, your experience, function-specific capabilities, and market or investment judgment.',
      },
    ],
    sourceLinks: [
      { label: 'BlackRock Careers', href: 'https://careers.blackrock.com/' },
      { label: 'BlackRock Students and Graduates', href: 'https://careers.blackrock.com/en/early-careers' },
      { label: 'BlackRock Job Search', href: 'https://careers.blackrock.com/en/search-jobs' },
    ],
    roleTitle: 'Aladdin product analyst',
    resumeTitle: 'BlackRock Aladdin Product Resume Example',
    badgeLabel: 'BlackRock-ready sample',
    candidateName: 'Noah Martinez',
    location: 'San Francisco, CA',
    currentRole: 'Investment Technology Analyst',
    summary:
      'Investment technology analyst with experience building portfolio analytics, risk reporting, and trade exception workflows. Strong in SQL, Python, dashboard design, and translating portfolio questions into usable tools.',
    experience: [
      {
        company: 'Northstar Asset Management',
        title: 'Investment Technology Analyst',
        location: 'San Francisco, CA',
        startDate: 'Jun 2022',
        endDate: 'Present',
        bullets: [
          'Built portfolio risk dashboard covering 160 holdings, highlighting factor, sector, and liquidity exposure changes before PM review.',
          'Reduced trade exception aging by 36% by mapping break reasons, ownership handoffs, and recurring data quality issues.',
          'Partnered with risk team to automate daily VaR input checks across 5 strategies, preventing 18 stale-data incidents in 2 quarters.',
          'Translated PM requests into 12 dashboard updates, improving weekly portfolio meeting preparation time by 27%.',
        ],
      },
      {
        company: 'Bay Area Student Investment Fund',
        title: 'Quant Research Analyst',
        location: 'Berkeley, CA',
        startDate: 'Sep 2019',
        endDate: 'May 2022',
        bullets: [
          'Designed factor-screening model for 380 equities using quality, momentum, and valuation metrics.',
          'Wrote 8 investment memos pairing quantitative screens with fundamental thesis and downside cases.',
          'Presented monthly risk review that helped committee reduce unintended sector concentration by 9 percentage points.',
        ],
      },
    ],
    skillSections: [
      { title: 'Asset Management', skills: ['Portfolio Analytics', 'Risk Reporting', 'Investment Memos', 'Trade Operations'] },
      { title: 'Technology', skills: ['Workflow Mapping', 'Dashboard Design', 'Data Quality', 'Stakeholder Discovery'] },
      { title: 'Tools', skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Bloomberg'] },
    ],
    analysisPoints: [
      'The resume positions technology as a direct enabler of portfolio and risk decisions.',
      'The bullets show a fiduciary-aware mindset through data quality, risk, and client-style reporting.',
      'The candidate has both investment and product workflow evidence.',
      'The skills section connects BlackRock-relevant asset management language with technical capability.',
    ],
    accentColor: '#111827',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-bank-of-america',
    companyName: 'Bank of America',
    excerpt:
      'How to get a job at Bank of America in 2026: student and professional application strategy, banking resume proof, a Bank of America-ready resume example, and interview prep.',
    opening:
      'Bank of America applications reward candidates who can connect teamwork, integrity, client interest, and practical business understanding. Your resume should show why the specific role fits your skills and how you have delivered in team settings.',
    strategyNote:
      'Target one Bank of America career area: banking, markets, wealth management, technology, operations, corporate functions, or risk.',
    lanes: ['Banking, markets, and finance', 'Wealth management and client service', 'Technology and operations', 'Risk, audit, and compliance', 'Corporate functions and strategy'],
    resumeSignals: ['genuine interest in the business area', 'teamwork and leadership with measurable outcomes', 'financial or operational analysis', 'client-first communication', 'integrity and attention to detail'],
    beforeAfterRows: [
      ['Worked with a team on finance tasks.', 'Led 5-person team building capital markets case, assigning valuation, financing, and risk sections and delivering final deck 2 days early.'],
      ['Created reports.', 'Built monthly treasury report consolidating liquidity, expense, and variance data across 6 sources, reducing correction requests by 34%.'],
      ['Good communicator.', 'Prepared client-ready summary of 21 loan covenant exceptions, helping relationship manager prioritize 8 urgent borrower conversations.'],
    ],
    checklistItems: ['read the job description for technical or language requirements', 'show teamwork, integrity, and business interest in the first half of the resume', 'quantify reporting, analysis, or client-support work', 'prepare for phone, video, or office interviews depending on role', 'keep applying to roles that genuinely match your skills'],
    proofItems: ['capital markets or credit analysis', 'client service examples', 'team leadership under deadlines', 'process improvements in operations or reporting', 'risk or control work'],
    interviewPrepItems: ['2 behavioral stories about teamwork and integrity', '1 client or stakeholder communication story', '1 technical answer for credit, markets, or operations basics', '1 reason for Bank of America and the target business', '1 example of learning from feedback'],
    faqItems: [
      {
        question: 'What does Bank of America look for in students?',
        answer: 'Role requirements vary, but strong applications usually show business interest, teamwork, leadership, integrity, academic strength, and relevant technical or communication skills.',
      },
      {
        question: 'Can I apply to Bank of America with operations experience?',
        answer: 'Yes. Operations, technology, audit, and risk experience can be strong if you show accuracy, controls, process improvement, and stakeholder impact.',
      },
      {
        question: 'How should I prepare for Bank of America interviews?',
        answer: 'Prepare behavioral examples, business-area knowledge, technical basics for the role, and concise explanations of your teamwork and leadership outcomes.',
      },
    ],
    sourceLinks: [
      { label: 'Bank of America Careers', href: 'https://careers.bankofamerica.com/' },
      { label: 'Bank of America Hiring Process', href: 'https://careers.bankofamerica.com/content/enterprise/careers/us/en/careers/hiring-process.html' },
      { label: 'Bank of America Student Application Process', href: 'https://careers.bankofamerica.com/en-us/students/application-process' },
    ],
    roleTitle: 'banking, markets, and finance analyst',
    resumeTitle: 'Bank of America Banking and Markets Resume Example',
    badgeLabel: 'BofA-ready sample',
    candidateName: 'Elena Brooks',
    location: 'Charlotte, NC',
    currentRole: 'Treasury and Markets Analyst',
    summary:
      'Banking and markets analyst with experience in liquidity reporting, capital markets cases, and client-ready credit summaries. Strong in teamwork, controls, Excel modeling, and concise stakeholder communication.',
    experience: [
      {
        company: 'Carolina Regional Bank',
        title: 'Treasury and Markets Analyst',
        location: 'Charlotte, NC',
        startDate: 'Jul 2022',
        endDate: 'Present',
        bullets: [
          'Built monthly treasury report consolidating liquidity, expense, and variance data across 6 sources, cutting correction requests by 34%.',
          'Prepared 21 covenant exception summaries for relationship managers, helping prioritize 8 urgent borrower conversations.',
          'Created peer bank deposit beta tracker used in weekly ALCO preparation for pricing and funding discussions.',
          'Coordinated control checklist across 4 teams, reducing missed evidence items during quarterly audit review.',
        ],
      },
      {
        company: 'Queen City Finance Lab',
        title: 'Capital Markets Team Lead',
        location: 'Charlotte, NC',
        startDate: 'Sep 2019',
        endDate: 'May 2022',
        bullets: [
          'Led 5-person team building capital markets case with valuation, financing, and risk sections delivered 2 days early.',
          'Modeled debt refinancing alternatives for $600M industrial borrower using coverage ratios and interest-rate scenarios.',
          'Presented market update to 80-student finance association, explaining yield curve moves and bank profitability impact.',
        ],
      },
    ],
    skillSections: [
      { title: 'Banking', skills: ['Treasury Reporting', 'Credit Summaries', 'Capital Markets', 'Liquidity Analysis'] },
      { title: 'Execution', skills: ['Team Leadership', 'Control Checklists', 'Client-Ready Writing', 'Audit Evidence'] },
      { title: 'Tools', skills: ['Excel', 'PowerPoint', 'SQL', 'Tableau', 'Bloomberg'] },
    ],
    analysisPoints: [
      'The resume balances business interest with teamwork, control discipline, and measurable reporting impact.',
      'The candidate shows Bank of America-relevant exposure to treasury, credit, markets, and relationship support.',
      'The bullets make integrity and attention to detail concrete through audit and correction metrics.',
      'The skills section is practical and recruiter-friendly.',
    ],
    accentColor: '#D4001A',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-citi',
    companyName: 'Citi',
    excerpt:
      'How to get a job at Citi in 2026: early career process, markets and banking resume targeting, a Citi-ready resume example, and interview prep.',
    opening:
      'Citi applications should show global business awareness, analytical clarity, and readiness for interviews that can include behavioral, technical, and case-style work depending on the program.',
    strategyNote:
      'Start by matching your resume to a Citi business or function: banking, markets, services, wealth, risk, operations, technology, or corporate functions.',
    lanes: ['Banking and capital markets', 'Markets and securities services', 'Wealth and private bank', 'Risk, controls, and compliance', 'Operations, technology, and corporate functions'],
    resumeSignals: ['global mindset and business curiosity', 'analytical decisions under time pressure', 'case-style problem solving', 'leadership standards and stakeholder communication', 'technical or product understanding for the target function'],
    beforeAfterRows: [
      ['Did case competitions.', 'Won 2nd place in global payments case by modeling interchange, fraud loss, and merchant adoption scenarios across 3 markets.'],
      ['Worked in operations.', 'Reduced unresolved trade breaks by 32% by categorizing root causes and creating daily exception owner report.'],
      ['Prepared for interviews.', 'Completed 10 case drills and 6 technical mock interviews focused on markets, risk, and leadership standards.'],
    ],
    checklistItems: ['use Citi career areas and functions to pick the right lane', 'show global or cross-market thinking where real', 'prepare behavioral, technical, and case examples', 'include resume bullets that connect analysis to decisions', 'track application status and follow each program process carefully'],
    proofItems: ['payments, markets, or services case work', 'trade operations or risk improvements', 'client or stakeholder communication', 'data analysis tied to recommendations', 'leadership examples aligned to standards'],
    interviewPrepItems: ['1 concise why Citi answer', '2 leadership stories with measurable outcomes', '1 case-style business recommendation', '1 technical market or banking answer', '1 example of operating across cultures or stakeholders'],
    faqItems: [
      {
        question: 'What is Citi early career interviewing like?',
        answer: 'For many programs, candidates can see first-round interviews, Superday-style interviews, and sometimes case exercises. The exact process depends on location and program.',
      },
      {
        question: 'What should a Citi resume emphasize?',
        answer: 'Show the business function, global context, analytical work, leadership, and measurable outcomes. Avoid making the resume only a list of finance coursework.',
      },
      {
        question: 'Is Citi good for non-banking roles?',
        answer: 'Yes. Citi has major hiring paths in services, risk, technology, operations, wealth, and corporate functions.',
      },
    ],
    sourceLinks: [
      { label: 'Citi Careers', href: 'https://www.careers.citigroup.com/' },
      { label: 'Citi Early Careers', href: 'https://jobs.citi.com/students-graduates' },
      { label: 'Citi Application Process', href: 'https://www.careers.citigroup.com/students-and-graduates/application-process.html' },
    ],
    roleTitle: 'markets analyst',
    resumeTitle: 'Citi Markets Analyst Resume Example',
    badgeLabel: 'Citi-ready sample',
    candidateName: 'Marcus Chen',
    location: 'New York, NY',
    currentRole: 'Markets Operations Analyst',
    summary:
      'Markets operations analyst with experience in trade exception management, payments strategy cases, and risk reporting. Strong in case-style analysis, cross-market research, SQL, and clear stakeholder updates.',
    experience: [
      {
        company: 'Hudson Clearing Services',
        title: 'Markets Operations Analyst',
        location: 'New York, NY',
        startDate: 'Jul 2022',
        endDate: 'Present',
        bullets: [
          'Reduced unresolved trade breaks by 32% by categorizing root causes and creating daily exception owner report.',
          'Prepared weekly risk pack for 3 trading operations teams, summarizing aging, failed settlement, and counterparty themes.',
          'Built SQL checks for recurring reference-data issues, preventing 46 duplicate exception tickets in one quarter.',
          'Presented remediation plan to operations leadership, aligning technology and control owners on 5 recurring break types.',
        ],
      },
      {
        company: 'Global Finance Case League',
        title: 'Payments Strategy Captain',
        location: 'New York, NY',
        startDate: 'Sep 2019',
        endDate: 'May 2022',
        bullets: [
          'Won 2nd place in payments case by modeling interchange, fraud loss, and merchant adoption scenarios across 3 markets.',
          'Led 4-person team through customer segmentation and go-to-market analysis for digital wallet expansion.',
          'Prepared 12-minute recommendation deck with revenue, risk, and execution tradeoffs for judging panel.',
        ],
      },
    ],
    skillSections: [
      { title: 'Markets & Services', skills: ['Trade Exceptions', 'Settlement Risk', 'Payments Strategy', 'Counterparty Reporting'] },
      { title: 'Analysis', skills: ['Case Studies', 'Root-Cause Analysis', 'Recommendation Memos', 'Leadership Stories'] },
      { title: 'Tools', skills: ['SQL', 'Excel', 'PowerPoint', 'Tableau', 'Python'] },
    ],
    analysisPoints: [
      'The resume connects operations detail to market risk and business recommendations.',
      'The candidate has Citi-relevant proof across services, payments, markets, and controls.',
      'The case competition example supports interview readiness without overstating work experience.',
      'The skills section makes global markets and services keywords easy to scan.',
    ],
    accentColor: '#004B93',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-barclays',
    companyName: 'Barclays',
    excerpt:
      'How to get a job at Barclays in 2026: graduate application process, assessment prep, banking resume strategy, a Barclays-ready resume example, and interview prep.',
    opening:
      'Barclays applications need clear role fit and evidence that your strengths, behavior, and technical skills match the program. The strongest resumes prepare the reader for assessments and interview stories.',
    strategyNote:
      'Choose a Barclays path first: investment banking, capital markets, sales and trading, technology, risk, operations, or an early careers graduate program.',
    lanes: ['Investment banking and capital markets', 'Sales, trading, and structuring', 'Technology and cyber', 'Operations and transaction banking', 'Risk, compliance, and analytics'],
    resumeSignals: ['strengths and behaviors tied to the target role', 'technical skills with applied examples', 'assessment-ready problem solving', 'teamwork and values alignment', 'commercial awareness and client impact'],
    beforeAfterRows: [
      ['Did a banking internship.', 'Built acquisition screening model across 42 UK software targets, scoring revenue growth, margin profile, leverage capacity, and strategic fit.'],
      ['Worked on technology project.', 'Developed cyber risk dashboard that reduced overdue control remediation items by 24% across 3 application teams.'],
      ['Good at problem solving.', 'Completed 7 case-style exercises, structuring recommendations with issue tree, data assumptions, and implementation risks.'],
    ],
    checklistItems: ['apply to the strongest-fit Barclays role because early career limits may apply', 'prepare for interactive assessments and assessment centre formats', 'show strengths and behavior through evidence', 'include commercial awareness for client-facing tracks', 'do not use AI tools during interviews unless Barclays explicitly permits an accommodation'],
    proofItems: ['transaction screening models', 'technical assessment projects', 'cyber or operations improvements', 'case-style recommendations', 'commercial awareness examples'],
    interviewPrepItems: ['2 strengths-based stories', '1 commercial awareness example', '1 technical or case exercise walk-through', '1 teamwork story tied to values', '1 concise why Barclays answer'],
    faqItems: [
      {
        question: 'What is the Barclays early careers process like?',
        answer: 'For many internship and graduate roles, Barclays describes an application, initial assessments, and an assessment centre. Details can vary by program.',
      },
      {
        question: 'Can I apply to more than one Barclays graduate role?',
        answer: 'Barclays states that candidates can only apply to one full-time graduate or internship role globally each year, so research fit before applying.',
      },
      {
        question: 'What should I prepare for Barclays interviews?',
        answer: 'Prepare strengths-based examples, commercial awareness, technical role knowledge, and concise stories that show how you work in teams.',
      },
    ],
    sourceLinks: [
      { label: 'Barclays Careers', href: 'https://search.jobs.barclays/' },
      { label: 'Barclays Early Careers', href: 'https://search.jobs.barclays/early-careers' },
      { label: 'Barclays Application Process', href: 'https://search.jobs.barclays/internship-graduate-application' },
    ],
    roleTitle: 'investment banking analyst',
    resumeTitle: 'Barclays Investment Banking Resume Example',
    badgeLabel: 'Barclays-ready sample',
    candidateName: 'Sofia Patel',
    location: 'London, UK',
    currentRole: 'Corporate Banking Analyst',
    summary:
      'Corporate banking analyst with experience in acquisition screening, credit memo writing, and client portfolio monitoring. Strong in commercial awareness, case-style analysis, and concise recommendations.',
    experience: [
      {
        company: 'Thames Corporate Finance',
        title: 'Corporate Banking Analyst',
        location: 'London, UK',
        startDate: 'Sep 2022',
        endDate: 'Present',
        bullets: [
          'Built acquisition screening model across 42 UK software targets, scoring revenue growth, margin profile, leverage capacity, and strategic fit.',
          'Prepared credit memo sections for 13 mid-market borrowers, summarizing covenant headroom, cash conversion, and downside risks.',
          'Created weekly portfolio monitor that flagged 9 clients with EBITDA variance greater than 12% against lender case.',
          'Supported relationship directors with 18 client briefing packs covering market conditions and financing options.',
        ],
      },
      {
        company: 'London Finance Society',
        title: 'Case Competition Lead',
        location: 'London, UK',
        startDate: 'Oct 2019',
        endDate: 'Jun 2022',
        bullets: [
          'Led 4-person team through 7 case-style exercises using issue trees, data assumptions, and implementation risk sections.',
          'Won regional corporate banking case with recommendation for working capital facility and FX risk mitigation plan.',
          'Hosted assessment centre practice sessions for 26 students preparing for banking graduate programs.',
        ],
      },
    ],
    skillSections: [
      { title: 'Banking', skills: ['Acquisition Screening', 'Credit Memos', 'Covenant Analysis', 'Client Briefings'] },
      { title: 'Assessment Prep', skills: ['Case Exercises', 'Commercial Awareness', 'Strengths Interviews', 'Issue Trees'] },
      { title: 'Tools', skills: ['Excel', 'PowerPoint', 'Capital IQ', 'Tableau', 'SQL'] },
    ],
    analysisPoints: [
      'The resume fits Barclays early career expectations by linking evidence to assessments, strengths, and business fit.',
      'The candidate shows commercial banking and investment banking-adjacent analysis.',
      'The bullets are concrete enough for assessment centre interview follow-up.',
      'The skills section includes commercial awareness and case prep without sounding generic.',
    ],
    accentColor: '#00AEEF',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-ubs',
    companyName: 'UBS',
    excerpt:
      'How to get a job at UBS in 2026: early careers targeting, wealth and investment banking resume proof, a UBS-ready resume example, and interview prep.',
    opening:
      'UBS applications should show where you fit across wealth management, investment banking, asset management, technology, risk, or group functions. Strong resumes let the CV do the talking with clear evidence.',
    strategyNote:
      'UBS spans global wealth management, investment bank, asset management, technology, and group functions. Tailor the resume to one of those lanes before applying.',
    lanes: ['Global wealth management', 'Investment bank', 'Asset management', 'Technology and AI-enabled banking', 'Risk, operations, and group functions'],
    resumeSignals: ['client advisory and trust-building', 'investment analysis and market awareness', 'technical training readiness', 'curiosity and learning agility', 'global collaboration and professional communication'],
    beforeAfterRows: [
      ['Helped with wealth management clients.', 'Prepared planning summaries for 38 client households, mapping liquidity needs, concentrated stock exposure, and tax-sensitive next steps.'],
      ['Interested in investment banking.', 'Built 3-statement model and valuation range for Swiss industrials case, explaining FX, margin, and capital structure assumptions.'],
      ['Worked on AI project.', 'Created prompt evaluation sheet for advisor note summaries, reducing missing action items from 19% to 6% during pilot review.'],
    ],
    checklistItems: ['select wealth, investment bank, asset management, technology, or group functions before editing', 'let the CV prove hobbies, interests, academics, work experience, and learning', 'show client and market judgment where relevant', 'include global or cross-cultural collaboration if real', 'prepare for process differences by region and program'],
    proofItems: ['client planning summaries', 'investment or valuation models', 'market notes', 'technology projects for financial workflows', 'training or mentorship examples'],
    interviewPrepItems: ['1 why UBS answer tied to a business area', '2 examples of client or stakeholder judgment', '1 market or portfolio view', '1 technical story for your role', '1 learning-agility example'],
    faqItems: [
      {
        question: 'Does UBS require cover letters?',
        answer: 'UBS says cover letters are not requested in most regions for early careers, so the CV/resume needs to carry the story clearly.',
      },
      {
        question: 'What should I emphasize for UBS wealth management?',
        answer: 'Show client trust, planning judgment, market awareness, confidentiality, and the ability to explain financial ideas clearly.',
      },
      {
        question: 'Can technology candidates apply to UBS?',
        answer: 'Yes. UBS has technology and AI-enabled banking roles, but the resume should connect technical work to banking, risk, client, or operational outcomes.',
      },
    ],
    sourceLinks: [
      { label: 'UBS Careers', href: 'https://www.ubs.com/global/en/careers.html' },
      { label: 'UBS Early Careers', href: 'https://www.ubs.com/global/en/careers/early-careers.html' },
      { label: 'UBS Early Careers Process', href: 'https://www.ubs.com/global/en/careers/early-careers/opportunities/jumpstart-talent-program.html' },
    ],
    roleTitle: 'wealth management analyst',
    resumeTitle: 'UBS Wealth Management Resume Example',
    badgeLabel: 'UBS-ready sample',
    candidateName: 'Lucas Meyer',
    location: 'Zurich, Switzerland',
    currentRole: 'Wealth Management Analyst',
    summary:
      'Wealth management analyst with experience in client planning summaries, portfolio exposure reviews, and advisor workflow improvements. Strong in client-ready writing, market awareness, confidentiality, and financial analysis.',
    experience: [
      {
        company: 'Alpine Advisory Group',
        title: 'Wealth Management Analyst',
        location: 'Zurich, Switzerland',
        startDate: 'Aug 2022',
        endDate: 'Present',
        bullets: [
          'Prepared planning summaries for 38 client households, mapping liquidity needs, concentrated stock exposure, and tax-sensitive next steps.',
          'Built portfolio exposure review across 112 accounts, identifying 17 households with unintended sector concentration.',
          'Created advisor note summary workflow that reduced missing follow-up actions from 19% to 6% during pilot review.',
          'Drafted quarterly market note for relationship managers covering rates, currency exposure, and equity risk scenarios.',
        ],
      },
      {
        company: 'European Student Investment Forum',
        title: 'Portfolio Analyst',
        location: 'Zurich, Switzerland',
        startDate: 'Sep 2019',
        endDate: 'Jun 2022',
        bullets: [
          'Built 3-statement model and valuation range for Swiss industrials case, explaining FX, margin, and capital structure assumptions.',
          'Presented portfolio rebalance recommendation that reduced single-sector exposure by 11 percentage points.',
          'Mentored 9 junior analysts on investment memo structure and market update preparation.',
        ],
      },
    ],
    skillSections: [
      { title: 'Wealth Management', skills: ['Client Planning', 'Portfolio Exposure', 'Market Notes', 'Advisor Support'] },
      { title: 'Investment Analysis', skills: ['3-Statement Modeling', 'Valuation Ranges', 'Risk Scenarios', 'Rebalance Memos'] },
      { title: 'Tools', skills: ['Excel', 'PowerPoint', 'Bloomberg', 'Tableau', 'SQL'] },
    ],
    analysisPoints: [
      'The resume makes client trust and planning judgment tangible.',
      'The candidate balances wealth management, portfolio analysis, and financial technology workflow proof.',
      'The bullets are compatible with UBS CV-first application guidance.',
      'The skills section highlights market awareness without overloading the page.',
    ],
    accentColor: '#E60000',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-deutsche-bank',
    companyName: 'Deutsche Bank',
    excerpt:
      'How to get a job at Deutsche Bank in 2026: student and graduate targeting, CV strategy, banking and technology proof, a Deutsche Bank-ready resume example, and interview prep.',
    opening:
      'Deutsche Bank applications should connect your skills to a specific programme or business area. Strong CVs show employability, technical capability, and a practical understanding of banking roles.',
    strategyNote:
      'Pick a route first: investment bank, corporate bank, asset management, private bank, technology/data/innovation, risk, operations, or control functions.',
    lanes: ['Investment bank', 'Corporate bank and transaction banking', 'Technology, data, and innovation', 'Risk, compliance, and controls', 'Asset management and private bank'],
    resumeSignals: ['employability and role understanding', 'technical or analytical work tied to banking outcomes', 'data and innovation evidence', 'control mindset and risk awareness', 'international collaboration and communication'],
    beforeAfterRows: [
      ['Worked on data project.', 'Built payments anomaly dashboard identifying 22 high-risk exception patterns and reducing manual triage time by 29%.'],
      ['Interested in corporate banking.', 'Prepared cash-management case for multinational client, mapping liquidity pooling, FX exposure, and operational risk across 4 regions.'],
      ['Wrote a CV for banking.', 'Rebuilt CV around target programme, moving transaction banking project and Python controls work into top 6 bullets.'],
    ],
    checklistItems: ['study the programme and business area before editing your CV', 'show banking role understanding, not just finance interest', 'connect data or technology projects to risk, payments, markets, or client outcomes', 'prepare examples of employability skills', 'use source links to understand divisions and skills required'],
    proofItems: ['cash management or transaction banking cases', 'payments data projects', 'risk and controls improvements', 'market or valuation analysis', 'technology projects that support banking processes'],
    interviewPrepItems: ['1 explanation of your selected Deutsche Bank area', '2 employability stories with measurable outcomes', '1 technical or analytical project walk-through', '1 risk or controls example', '1 current banking topic relevant to the role'],
    faqItems: [
      {
        question: 'What should a Deutsche Bank CV focus on?',
        answer: 'Focus on the programme, division, applied skills, employability evidence, and banking role understanding.',
      },
      {
        question: 'Is Deutsche Bank only for finance majors?',
        answer: 'No. Technology, data, innovation, risk, and operations paths can fit non-finance candidates when the resume shows banking impact.',
      },
      {
        question: 'How do I stand out for Deutsche Bank graduate roles?',
        answer: 'Make your target programme obvious, quantify technical and teamwork outcomes, and prepare role-specific examples for interviews.',
      },
    ],
    sourceLinks: [
      { label: 'Deutsche Bank Careers', href: 'https://careers.db.com/' },
      { label: 'Deutsche Bank Students and Graduates', href: 'https://careers.db.com/students-graduates/' },
      { label: 'Deutsche Bank Employability Hub', href: 'https://careers.db.com/students-graduates/' },
    ],
    roleTitle: 'technology, data, and innovation analyst',
    resumeTitle: 'Deutsche Bank Technology and Data Resume Example',
    badgeLabel: 'Deutsche Bank-ready sample',
    candidateName: 'Maya Schneider',
    location: 'Frankfurt, Germany',
    currentRole: 'Banking Data Analyst',
    summary:
      'Banking data analyst with experience in payments anomaly detection, transaction banking cases, and control dashboards. Strong in Python, SQL, risk awareness, and translating data work into banking outcomes.',
    experience: [
      {
        company: 'Rhine Payments Network',
        title: 'Banking Data Analyst',
        location: 'Frankfurt, Germany',
        startDate: 'Aug 2022',
        endDate: 'Present',
        bullets: [
          'Built payments anomaly dashboard identifying 22 high-risk exception patterns and reducing manual triage time by 29%.',
          'Mapped transaction monitoring data across 5 source systems, improving daily control completeness from 91% to 98%.',
          'Prepared cash-management case for multinational client, covering liquidity pooling, FX exposure, and operational risk across 4 regions.',
          'Created Python QA checks that prevented 63 duplicate records from entering monthly risk report.',
        ],
      },
      {
        company: 'Berlin FinTech Lab',
        title: 'Student Product Analyst',
        location: 'Berlin, Germany',
        startDate: 'Oct 2019',
        endDate: 'Jul 2022',
        bullets: [
          'Designed onboarding funnel analysis for SME banking prototype, increasing completed sandbox applications by 18%.',
          'Wrote transaction banking explainer used by 30 student analysts to compare cash management, trade finance, and lending.',
          'Presented data privacy and model risk checklist during prototype review with faculty advisors.',
        ],
      },
    ],
    skillSections: [
      { title: 'Banking Data', skills: ['Payments Analytics', 'Transaction Monitoring', 'Control Dashboards', 'Cash Management'] },
      { title: 'Risk & Delivery', skills: ['Data QA', 'Operational Risk', 'Programme Targeting', 'Stakeholder Updates'] },
      { title: 'Tools', skills: ['Python', 'SQL', 'Excel', 'Power BI', 'Tableau'] },
    ],
    analysisPoints: [
      'The resume makes technology and data relevant to banking operations and controls.',
      'The candidate shows employability through measurable delivery and clear programme fit.',
      'The bullets balance technical depth with risk awareness.',
      'The skills section fits Deutsche Bank technology, data, and innovation paths.',
    ],
    accentColor: '#0018A8',
  }),
  buildFinanceGuide({
    slug: 'how-to-land-a-job-at-hsbc',
    companyName: 'HSBC',
    excerpt:
      'How to get a job at HSBC in 2026: application guide, assessment prep, global banking resume strategy, a HSBC-ready resume example, and interview prep.',
    opening:
      'HSBC applications should show behavioral and cognitive strengths, international awareness, and a clear reason for the programme you selected. The resume should prepare you for assessments, interviews, and role-specific exercises.',
    strategyNote:
      'Choose a HSBC path before tailoring: global banking, markets, wealth, commercial banking, technology, cyber, relationship management, or operations.',
    lanes: ['Global banking and investment banking', 'Markets and securities services', 'Commercial banking and relationship management', 'Technology, engineering, and cyber', 'Risk, operations, and corporate functions'],
    resumeSignals: ['behavioral strengths supported by evidence', 'global and client awareness', 'assessment-ready analytical work', 'relationship management and communication', 'risk, controls, or technology judgment'],
    beforeAfterRows: [
      ['Interested in global banking.', 'Built emerging markets financing case comparing FX risk, debt capacity, and regulatory constraints for 3 infrastructure borrowers.'],
      ['Prepared for assessments.', 'Completed 9 timed data exercises and 5 mock video responses, improving recommendation clarity and completion rate.'],
      ['Worked with clients.', 'Created onboarding checklist for 24 SME clients, reducing missing KYC document follow-ups by 38%.'],
    ],
    checklistItems: ['pick one HSBC programme because multiple applications may be restricted', 'prepare for online application, online assessment, and assessment centre or interview stages', 'show behavioral and cognitive evidence through outcomes', 'use global examples where your work crosses markets or clients', 'request adjustments early if needed'],
    proofItems: ['global banking case analysis', 'commercial banking client work', 'KYC or controls improvements', 'timed assessment practice', 'technology or cyber projects for banking outcomes'],
    interviewPrepItems: ['1 why HSBC and why this programme answer', '2 behavioral stories with measurable results', '1 assessment-style data recommendation', '1 client or relationship management example', '1 question for the team you want to join'],
    faqItems: [
      {
        question: 'What is the HSBC student application process?',
        answer: 'HSBC describes an online application, online assessment, and assessment centre or interview stage for many student and graduate programmes.',
      },
      {
        question: 'Can I apply to multiple HSBC programmes?',
        answer: 'HSBC says candidates generally cannot apply to more than one internship or graduate programme, so choose the best-fit programme carefully.',
      },
      {
        question: 'What should a HSBC resume emphasize?',
        answer: 'Show behavioral strengths, analytical judgment, global awareness, client or relationship evidence, and role-specific skills.',
      },
    ],
    sourceLinks: [
      { label: 'HSBC Careers', href: 'https://www.hsbc.com/careers' },
      { label: 'HSBC Students and Graduates', href: 'https://www.hsbc.com/careers/students-and-graduates/university-students-and-graduates' },
      { label: 'HSBC Application Guide', href: 'https://www.hsbc.com/careers/students-and-graduates/application-guide' },
    ],
    roleTitle: 'global banking analyst',
    resumeTitle: 'HSBC Global Banking Resume Example',
    badgeLabel: 'HSBC-ready sample',
    candidateName: 'Amara Wilson',
    location: 'London, UK',
    currentRole: 'Commercial Banking Analyst',
    summary:
      'Commercial banking analyst with experience in SME onboarding, emerging markets financing cases, and assessment-style data recommendations. Strong in client communication, KYC controls, and global banking analysis.',
    experience: [
      {
        company: 'City Commercial Bank',
        title: 'Commercial Banking Analyst',
        location: 'London, UK',
        startDate: 'Sep 2022',
        endDate: 'Present',
        bullets: [
          'Created onboarding checklist for 24 SME clients, reducing missing KYC document follow-ups by 38%.',
          'Prepared borrower summaries for relationship managers covering liquidity, working capital, and covenant risk.',
          'Built emerging markets financing case comparing FX risk, debt capacity, and regulatory constraints for 3 infrastructure borrowers.',
          'Partnered with operations to shorten client document review cycle from 6.2 days to 4.1 days.',
        ],
      },
      {
        company: 'Global Banking Association',
        title: 'Assessment Prep Lead',
        location: 'London, UK',
        startDate: 'Oct 2019',
        endDate: 'Jun 2022',
        bullets: [
          'Designed 9 timed data exercises and 5 mock video response drills for students applying to banking graduate programmes.',
          'Led team to final round of infrastructure finance case with recommendation covering FX risk and social impact metrics.',
          'Organized speaker series with 6 alumni across commercial banking, markets, cyber, and relationship management.',
        ],
      },
    ],
    skillSections: [
      { title: 'Banking', skills: ['Commercial Banking', 'Global Banking Cases', 'KYC Controls', 'Borrower Summaries'] },
      { title: 'Assessment Prep', skills: ['Timed Data Exercises', 'Video Responses', 'Behavioral Stories', 'Client Questions'] },
      { title: 'Tools', skills: ['Excel', 'PowerPoint', 'SQL', 'Tableau', 'Salesforce'] },
    ],
    analysisPoints: [
      'The resume mirrors HSBC process language with assessment, behavioral, and programme-fit evidence.',
      'The candidate shows global banking awareness through emerging markets financing and FX risk work.',
      'The client onboarding bullets make relationship management and controls concrete.',
      'The skills section supports both commercial banking and graduate programme screening.',
    ],
    accentColor: '#DB0011',
  }),
]
