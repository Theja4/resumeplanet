// Source-specific funnel landing pages — one per AI assistant platform we
// publish to. Each page acknowledges where the visitor came from, positions
// Rezoomed against that platform's native capabilities, and routes the user
// into the highest-converting entry point (/ats-checker) with UTM tracking.

export type FunnelPlatform = {
  slug: string
  platformName: string
  platformShort: string
  // Hero
  eyebrow: string
  heading: string
  subheading: string
  // Why-us framing — what this platform can/can't do well, what Rezoomed adds
  thePlatformDoes: string
  whatRezoomedAdds: string
  // 3 bullets that differentiate Rezoomed from the AI tool the visitor just left
  bullets: string[]
  // Quote/social proof — keeps it specific to this audience
  proofLine: string
  // Primary CTA target — always /ats-checker with funnel UTM
  primaryCtaLabel: string
  // Secondary CTA — usually pricing or builder
  secondaryCtaLabel: string
  secondaryCtaHref: string
}

export const FUNNEL_PAGES: Record<string, FunnelPlatform> = {
  chatgpt: {
    slug: 'chatgpt',
    platformName: 'ChatGPT',
    platformShort: 'GPT',
    eyebrow: 'From the Rezoomed GPT',
    heading: 'You ran the GPT — now run the real workflow.',
    subheading:
      'The ATS Checker GPT gives you fast feedback. Rezoomed runs the full pipeline on your actual file: parsing, keyword coverage, formatting traps, and rewrite suggestions you can ship.',
    thePlatformDoes:
      'A custom GPT is great for quick conversational feedback on a pasted resume.',
    whatRezoomedAdds:
      'Rezoomed parses your real PDF or DOCX the way a recruiter ATS does, scores it against actual job descriptions, and tracks the version history so you can compare what worked.',
    bullets: [
      'Parses your real PDF / DOCX file (not just pasted text) so you catch formatting traps a GPT cannot see.',
      'Scores your resume against a specific job description and tells you which evidence is weak, missing, or buried.',
      'Saves multiple targeted resume versions per role so you never lose your strongest variant.',
    ],
    proofLine: 'Over 1,000,000 resumes optimized — by people who came in through the same workflow.',
    primaryCtaLabel: 'Run a free ATS scan on my real file',
    secondaryCtaLabel: 'See Free vs Pro pricing',
    secondaryCtaHref: '/pricing',
  },
  gemini: {
    slug: 'gemini',
    platformName: 'Gemini',
    platformShort: 'Gem',
    eyebrow: 'From the Rezoomed Gem',
    heading: 'Used the Gem? Run the deep version on your real file.',
    subheading:
      'The Gem gives you Gemini-powered quick feedback. Rezoomed runs the full multi-model ATS pipeline on your actual PDF, with job-description match scoring and version history.',
    thePlatformDoes:
      'A Gem is great for fast conversational analysis of resume text inside Gemini.',
    whatRezoomedAdds:
      'Rezoomed handles the real file parsing, runs the ATS-scoring pass that recruiter software performs, and lets you iterate without losing earlier versions.',
    bullets: [
      'Runs on your real PDF / DOCX, the way a real ATS parses it — not just on pasted text.',
      'Compares your resume to a specific job description and surfaces exactly where the fit is weak.',
      'Keeps role-specific resume versions organized so you stop overwriting your strongest one.',
    ],
    proofLine: 'Over 1,000,000 resumes optimized — across every device and region.',
    primaryCtaLabel: 'Run a free ATS scan on my real file',
    secondaryCtaLabel: 'Explore the resume builder',
    secondaryCtaHref: '/resume-builder',
  },
  claude: {
    slug: 'claude',
    platformName: 'Claude',
    platformShort: 'Artifact',
    eyebrow: 'From the Rezoomed artifact',
    heading: 'Liked the artifact? Take it deeper.',
    subheading:
      'A Claude artifact is a great preview. Rezoomed is the full workflow: real PDF parsing, ATS scoring against any job description, and rewrites that ship.',
    thePlatformDoes:
      'An artifact is a fast, shareable preview built around one snippet of your resume.',
    whatRezoomedAdds:
      'Rezoomed processes your real PDF / DOCX end-to-end, runs the same parsing pass a recruiter ATS does, and helps you iterate without losing earlier versions.',
    bullets: [
      'Reads your actual resume file — every section, every page — the way the ATS will.',
      'Scores fit against a real job description and points to the exact bullets that need work.',
      'Keeps your resume versions organized so you can A/B different positioning across roles.',
    ],
    proofLine: 'Over 1,000,000 resumes optimized — most of them on the free tier.',
    primaryCtaLabel: 'Run a free ATS scan on my real file',
    secondaryCtaLabel: 'See Free vs Pro pricing',
    secondaryCtaHref: '/pricing',
  },
  perplexity: {
    slug: 'perplexity',
    platformName: 'Perplexity',
    platformShort: 'search',
    eyebrow: 'From Perplexity search',
    heading: 'Found via Perplexity? Run the actual scan.',
    subheading:
      'Perplexity surfaces the right tools fast. Rezoomed is the resume ATS pipeline that came up — and the free scan only takes 30 seconds.',
    thePlatformDoes:
      'Perplexity is great at finding the right tool for a job-search task.',
    whatRezoomedAdds:
      'Rezoomed parses your real PDF / DOCX the way a recruiter ATS does, scores it against any job description, and points out which bullets to rewrite.',
    bullets: [
      'Reads your real file — PDF or DOCX — the way the ATS does.',
      'Scores resume-to-job fit and tells you which evidence is weak or missing.',
      'No signup needed for the first scan — find out where you stand in 30 seconds.',
    ],
    proofLine: 'Over 1,000,000 resumes optimized — try the free scan before signup.',
    primaryCtaLabel: 'Run a free ATS scan on my real file',
    secondaryCtaLabel: 'Browse the blog playbooks',
    secondaryCtaHref: '/blog',
  },
} as const

export function getFunnelPlatform(slug: string): FunnelPlatform | undefined {
  return FUNNEL_PAGES[slug]
}

export function getAllFunnelPlatformSlugs(): string[] {
  return Object.keys(FUNNEL_PAGES)
}

export function buildFunnelCtaHref(
  platform: FunnelPlatform,
  destination: string = '/ats-checker'
) {
  const url = new URL(destination, 'https://placeholder.local')
  url.searchParams.set('utm_source', platform.slug)
  url.searchParams.set('utm_medium', platform.platformShort.toLowerCase())
  url.searchParams.set('utm_campaign', 'funnel')
  return url.pathname + url.search
}
