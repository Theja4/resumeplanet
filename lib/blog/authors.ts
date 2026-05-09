export type Author = {
  name: string
  title: string
  bio: string
}

export const AUTHORS: Record<string, Author> = {
  'Sarah Chen': {
    name: 'Sarah Chen',
    title: 'Senior Career Strategist',
    bio: 'Sarah has 8 years of experience in talent acquisition and career coaching, with prior roles at Google and LinkedIn where she reviewed over 4,000 resumes. She specialises in ATS optimisation, resume positioning, and modern job search strategy for mid-level to senior professionals.',
  },
  'Marcus Williams': {
    name: 'Marcus Williams',
    title: 'Technical Recruiting Lead',
    bio: 'Marcus spent 10 years leading technical recruiting at Meta, Stripe, and Shopify, where he built and managed ATS workflows for high-volume engineering hiring. He now advises job seekers on navigating applicant tracking systems and standing out in competitive tech pipelines.',
  },
  'Priya Nair': {
    name: 'Priya Nair',
    title: 'Career Development Expert & Resume Coach',
    bio: 'Priya is a Certified Professional Resume Writer (CPRW) with 7 years as an HR Director across the tech industry. She has coached over 2,000 professionals on resume positioning, cover letters, and job search strategy, with a focus on product, design, and general management roles.',
  },
  'James Okafor': {
    name: 'James Okafor',
    title: 'Finance & Investment Banking Career Specialist',
    bio: 'James spent 6 years in VP-level recruiting at Goldman Sachs and Morgan Stanley before transitioning to independent career consulting. He specialises in finance sector hiring, front-office resume positioning, and interview preparation for investment banking, asset management, and capital markets roles.',
  },
}

const FINANCE_COMPANIES = new Set([
  'jpmorgan-chase',
  'goldman-sachs',
  'morgan-stanley',
  'blackrock',
  'bank-of-america',
  'citi',
  'barclays',
  'ubs',
  'deutsche-bank',
  'hsbc',
])

const TECH_COMPANIES = new Set([
  'openai',
  'anthropic',
  'meta',
  'microsoft',
  'amazon',
  'apple',
  'netflix',
  'stripe',
  'shopify',
  'airbnb',
  'uber',
  'tiktok',
  'nvidia',
  'notion',
  'figma',
])

const SLUG_AUTHOR_MAP: Record<string, string> = {
  // ATS & resume technical content — Sarah Chen
  'ats-resume-checker-what-it-tests-and-why-it-matters': 'Sarah Chen',
  'us-resume-format-best-practices-examples': 'Sarah Chen',
  'job-description-match-score-explained': 'Sarah Chen',
  'how-to-tailor-your-resume-for-each-job-without-starting-over': 'Sarah Chen',
  'best-resume-keywords-to-match-a-job-description': 'Sarah Chen',
  'resume-metadata-checklist-before-you-apply': 'Sarah Chen',
  'how-to-fix-pdf-resume-title-author-and-keywords': 'Sarah Chen',
  'how-resume-metadata-affects-job-applications': 'Sarah Chen',
  'best-ai-resume-builder-for-job-seekers': 'Sarah Chen',
  'resume-builder-vs-template-which-is-better': 'Sarah Chen',
  'how-to-tailor-your-resume-for-software-engineer-jobs': 'Sarah Chen',
  'how-to-tailor-your-resume-for-data-analyst-jobs': 'Sarah Chen',
  // Career advice & coaching — Priya Nair
  '10-job-search-tips-strategies-for-2026': 'Priya Nair',
  'how-to-follow-up-on-a-job-application-templates-guide': 'Priya Nair',
  'top-20-us-jobs-workers-have-more-school-than-roles-require': 'Priya Nair',
  'how-to-tailor-your-resume-for-product-manager-jobs': 'Priya Nair',
  'how-to-write-a-cover-letter-for-a-job-you-really-want': 'Priya Nair',
  'ai-cover-letter-generator-what-good-output-looks-like': 'Priya Nair',
  'how-to-land-a-google-job': 'Priya Nair',
}

export function getAuthorForSlug(slug: string): Author {
  // Direct slug mapping
  if (SLUG_AUTHOR_MAP[slug]) {
    return AUTHORS[SLUG_AUTHOR_MAP[slug]]
  }

  // Company job guide pattern
  const companyMatch = slug.match(/^how-to-land-a-job-at-(.+)$/)
  if (companyMatch) {
    const company = companyMatch[1]
    if (FINANCE_COMPANIES.has(company)) return AUTHORS['James Okafor']
    if (TECH_COMPANIES.has(company)) return AUTHORS['Marcus Williams']
  }

  // Default fallback
  return AUTHORS['Sarah Chen']
}
