import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const blogDir = join(root, 'public/blog')
const fallbackMascotBase = join(blogDir, 'mascot-application-base.png')
const mascotSceneDir = join(blogDir, 'mascot-scenes')

const posts = [
  {
    slug: 'best-ai-resume-builder-for-job-seekers',
    eyebrow: 'Resume Builder',
    title: 'AI Resume Builder Workflow',
    accent: '#30C06B',
    icon: 'spark',
    chips: ['ATS-safe draft', 'Bullet rewrite', 'Export-ready'],
    steps: ['Upload resume', 'Choose target role', 'Rewrite with proof', 'Check before sending'],
  },
  {
    slug: 'resume-builder-vs-template-which-is-better',
    eyebrow: 'Resume Advice',
    title: 'Builder vs Template',
    accent: '#6D5DFB',
    icon: 'compare',
    chips: ['Reusable system', 'Static file', 'Version control'],
    steps: ['Template gets the page started', 'Builder keeps edits structured', 'Checker catches weak fit', 'Export the clean version'],
  },
  {
    slug: 'resume-metadata-checklist-before-you-apply',
    eyebrow: 'PDF Metadata',
    title: 'Resume Metadata Checklist',
    accent: '#168A4A',
    icon: 'document',
    chips: ['Title', 'Author', 'Keywords'],
    steps: ['Check hidden fields', 'Fix file title', 'Set author correctly', 'Export final PDF'],
  },
  {
    slug: 'how-to-fix-pdf-resume-title-author-and-keywords',
    eyebrow: 'PDF Cleanup',
    title: 'Fix PDF Resume Fields',
    accent: '#1F8F6A',
    icon: 'document',
    chips: ['PDF title', 'Author field', 'Search terms'],
    steps: ['Audit PDF metadata', 'Remove template leftovers', 'Add role context', 'Download clean file'],
  },
  {
    slug: 'how-to-tailor-your-resume-for-software-engineer-jobs',
    eyebrow: 'Software Engineer',
    title: 'Tailor for Engineering Roles',
    accent: '#2F80ED',
    icon: 'code',
    chips: ['Systems', 'APIs', 'Impact'],
    steps: ['Map tech stack', 'Prioritize shipped work', 'Show scale and reliability', 'Keep skills searchable'],
  },
  {
    slug: 'how-to-tailor-your-resume-for-product-manager-jobs',
    eyebrow: 'Product Manager',
    title: 'Tailor for Product Roles',
    accent: '#F59E0B',
    icon: 'roadmap',
    chips: ['Discovery', 'Launches', 'Metrics'],
    steps: ['Name the product surface', 'Show customer evidence', 'Connect roadmap to outcomes', 'Cut vague strategy lines'],
  },
  {
    slug: 'how-to-tailor-your-resume-for-data-analyst-jobs',
    eyebrow: 'Data Analyst',
    title: 'Tailor for Data Roles',
    accent: '#7C3AED',
    icon: 'chart',
    chips: ['SQL', 'Dashboards', 'Insights'],
    steps: ['Match tools honestly', 'Show decision impact', 'Quantify reporting scale', 'Add clean project proof'],
  },
  {
    slug: 'how-resume-metadata-affects-job-applications',
    eyebrow: 'Hidden Resume Data',
    title: 'Metadata Affects Applications',
    accent: '#0EA5E9',
    icon: 'document',
    chips: ['Searchability', 'File context', 'Recruiter handoff'],
    steps: ['Set the resume title', 'Use your real author name', 'Add focused keywords', 'Review before upload'],
  },
  {
    slug: 'how-to-tailor-your-resume-for-each-job-without-starting-over',
    eyebrow: 'Resume Tailoring',
    title: 'Tailor Without Rewriting',
    accent: '#16A34A',
    icon: 'target',
    chips: ['Base resume', 'Role copy', 'Versioning'],
    steps: ['Keep a master resume', 'Clone only strong-fit roles', 'Rewrite the top third', 'Track every version'],
  },
  {
    slug: 'best-resume-keywords-to-match-a-job-description',
    eyebrow: 'Resume Keywords',
    title: 'Match the Job Description',
    accent: '#2563EB',
    icon: 'keywords',
    chips: ['Skills', 'Tools', 'Responsibilities'],
    steps: ['Extract repeated terms', 'Group by proof', 'Use keywords in bullets', 'Remove anything you cannot defend'],
  },
  {
    slug: 'ai-cover-letter-generator-what-good-output-looks-like',
    eyebrow: 'Cover Letter AI',
    title: 'Good AI Output vs Generic',
    accent: '#D946EF',
    icon: 'letter',
    chips: ['Specific role', 'Resume proof', 'Human edit'],
    steps: ['Give the job description', 'Use real resume facts', 'Cut generic praise', 'Edit for voice'],
  },
  {
    slug: 'how-to-write-a-cover-letter-for-a-job-you-really-want',
    eyebrow: 'Cover Letter',
    title: 'Write for the Job You Want',
    accent: '#EC4899',
    icon: 'letter',
    chips: ['Opening hook', 'Proof paragraph', 'Close'],
    steps: ['Name the role', 'Choose one strong story', 'Connect proof to need', 'Keep it short'],
  },
  {
    slug: 'job-description-match-score-explained',
    eyebrow: 'Match Score',
    title: 'Resume to Job Fit',
    accent: '#22C55E',
    icon: 'score',
    chips: ['Role fit', 'Skill gaps', 'Priority fixes'],
    steps: ['Paste the job description', 'Compare the resume', 'Fix missing proof', 'Re-score before applying'],
  },
  {
    slug: 'top-20-us-jobs-workers-have-more-school-than-roles-require',
    eyebrow: 'Career Trends',
    title: 'Education Mismatch Strategy',
    accent: '#F97316',
    icon: 'ladder',
    chips: ['Transferable skills', 'Bridge roles', 'Better positioning'],
    steps: ['Separate title from capability', 'Highlight upward work', 'Target adjacent roles', 'Prove the next level'],
  },
  {
    slug: 'us-resume-format-best-practices-examples',
    eyebrow: 'US Resume Format',
    title: 'ATS-Safe Resume Layout',
    accent: '#0F766E',
    icon: 'layout',
    chips: ['One column', 'Clear headings', 'No photo'],
    steps: ['Start with contact info', 'Use standard sections', 'Write outcome bullets', 'Keep formatting calm'],
  },
  {
    slug: 'how-to-follow-up-on-a-job-application-templates-guide',
    eyebrow: 'Follow-Up Templates',
    title: 'Follow Up Without Overdoing It',
    accent: '#14B8A6',
    icon: 'mail',
    chips: ['10-14 days', 'Short note', 'One fit point'],
    steps: ['Check the posted timeline', 'Write one concise message', 'Mention the role', 'Stop after the final follow-up'],
  },
  {
    slug: '10-job-search-tips-strategies-for-2026',
    eyebrow: 'Job Search 2026',
    title: 'A Smarter Search System',
    accent: '#84CC16',
    icon: 'roadmap',
    chips: ['Target list', 'Resume versions', 'Weekly review'],
    steps: ['Pick fewer better roles', 'Tailor the top third', 'Track applications', 'Improve from response data'],
  },
]

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapWords(value, maxLineLength, maxLines) {
  const words = value.split(/\s+/)
  const lines = []

  for (const word of words) {
    const last = lines[lines.length - 1]

    if (!last || `${last} ${word}`.length > maxLineLength) {
      lines.push(word)
    } else {
      lines[lines.length - 1] = `${last} ${word}`
    }
  }

  if (lines.length <= maxLines) {
    return lines
  }

  return [
    ...lines.slice(0, maxLines - 1),
    lines.slice(maxLines - 1).join(' '),
  ]
}

function iconMarkup(icon, accent) {
  const stroke = escapeXml(accent)
  const common = `fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`

  switch (icon) {
    case 'chart':
      return `<path ${common} d="M38 136V82M88 136V48M138 136V104" /><path ${common} d="M28 140H154" />`
    case 'code':
      return `<path ${common} d="M70 58L34 92L70 126M112 58L148 92L112 126" /><path ${common} d="M96 48L84 136" />`
    case 'compare':
      return `<rect x="32" y="42" width="52" height="92" rx="14" fill="${stroke}" opacity=".18" /><rect x="98" y="42" width="52" height="92" rx="14" fill="${stroke}" opacity=".32" /><path ${common} d="M52 74H74M52 102H68M118 74H140M118 102H132" />`
    case 'document':
      return `<path ${common} d="M50 32H112L142 62V148H50Z" /><path ${common} d="M110 34V64H140M70 88H122M70 112H122M70 136H102" />`
    case 'keywords':
      return `<rect x="28" y="48" width="128" height="36" rx="18" fill="${stroke}" opacity=".18" /><rect x="46" y="98" width="92" height="36" rx="18" fill="${stroke}" opacity=".32" /><path ${common} d="M56 66H126M74 116H110" />`
    case 'ladder':
      return `<path ${common} d="M54 148V42M126 148V42M54 70H126M54 100H126M54 130H126" />`
    case 'layout':
      return `<rect x="34" y="36" width="124" height="112" rx="18" fill="${stroke}" opacity=".14" /><path ${common} d="M58 64H134M58 88H134M58 112H96M58 136H120" />`
    case 'letter':
      return `<rect x="30" y="52" width="132" height="88" rx="16" fill="${stroke}" opacity=".14" /><path ${common} d="M34 60L96 106L158 60M58 124H134" />`
    case 'mail':
      return `<rect x="30" y="56" width="132" height="84" rx="16" fill="${stroke}" opacity=".16" /><path ${common} d="M38 64L96 104L154 64M56 126H100" />`
    case 'roadmap':
      return `<path ${common} d="M46 132C68 76 122 120 144 58" /><circle cx="46" cy="132" r="14" fill="${stroke}" opacity=".8" /><circle cx="96" cy="96" r="14" fill="${stroke}" opacity=".45" /><circle cx="144" cy="58" r="14" fill="${stroke}" opacity=".8" />`
    case 'score':
      return `<path ${common} d="M44 122A56 56 0 0 1 148 86" /><path ${common} d="M96 100L136 68" /><circle cx="96" cy="122" r="10" fill="${stroke}" />`
    case 'target':
      return `<circle cx="96" cy="96" r="58" fill="${stroke}" opacity=".10" /><circle cx="96" cy="96" r="34" fill="${stroke}" opacity=".18" /><circle cx="96" cy="96" r="12" fill="${stroke}" /><path ${common} d="M132 60L152 40M132 60H154M132 60V38" />`
    default:
      return `<path ${common} d="M96 30L108 76L154 88L108 100L96 146L84 100L38 88L84 76Z" />`
  }
}

function heroOverlay(post) {
  const titleLines = wrapWords(post.title, 20, 2)
  const titleMarkup = titleLines.map((line, index) => `
  <text x="1042" y="${246 + index * 48}" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="950" fill="white">${escapeXml(line)}</text>`).join('')
  const descriptionY = 302 + (titleLines.length - 1) * 48
  const chips = post.chips.map((chip, index) => {
    const x = 900 + (index % 2) * 250
    const y = 570 + Math.floor(index / 2) * 76
    return `
      <rect x="${x}" y="${y}" width="220" height="48" rx="24" fill="white" fill-opacity="0.12" stroke="white" stroke-opacity="0.16" />
      <text x="${x + 110}" y="${y + 30}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="white" fill-opacity="0.88">${escapeXml(chip)}</text>`
  }).join('')

  return Buffer.from(`<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="heroShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#03150B" stop-opacity="0.04" />
      <stop offset="40%" stop-color="#03150B" stop-opacity="0.10" />
      <stop offset="68%" stop-color="#03150B" stop-opacity="0.58" />
      <stop offset="100%" stop-color="#03150B" stop-opacity="0.88" />
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.36" r="0.42">
      <stop offset="0%" stop-color="${escapeXml(post.accent)}" stop-opacity="0.42" />
      <stop offset="100%" stop-color="${escapeXml(post.accent)}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#heroShade)" />
  <rect width="1600" height="900" fill="url(#glow)" />
  <rect x="830" y="112" width="650" height="660" rx="54" fill="#07110B" fill-opacity="0.74" stroke="white" stroke-opacity="0.14" />
  <rect x="884" y="164" width="116" height="116" rx="34" fill="white" fill-opacity="0.94" />
  <svg x="846" y="126" width="192" height="192" viewBox="0 0 192 192">${iconMarkup(post.icon, post.accent)}</svg>
  <text x="1042" y="194" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900" fill="${escapeXml(post.accent)}" letter-spacing="4">${escapeXml(post.eyebrow.toUpperCase())}</text>
  ${titleMarkup}
  <text x="1042" y="${descriptionY}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="white" fill-opacity="0.68">A practical Rezoomed guide.</text>
  <rect x="884" y="362" width="540" height="150" rx="32" fill="white" fill-opacity="0.10" stroke="white" stroke-opacity="0.12" />
  <text x="918" y="410" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" fill="white">What to fix first</text>
  <text x="918" y="456" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="white" fill-opacity="0.72">${escapeXml(post.steps[0])}</text>
  <text x="918" y="492" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="white" fill-opacity="0.72">${escapeXml(post.steps[1])}</text>
  ${chips}
  <text x="884" y="726" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="white" fill-opacity="0.52" letter-spacing="4">REZOOMED CAREER SYSTEM</text>
</svg>`)
}

function inlineOverlay(post) {
  const titleLines = wrapWords(post.title, 24, 2)
  const titleFontSize = titleLines.length > 1 ? 32 : 38
  const headerHeight = titleLines.length > 1 ? 150 : 118
  const rowsStart = titleLines.length > 1 ? 342 : 308
  const titleMarkup = titleLines.map((line, index) => `
  <text x="952" y="${224 + index * 40}" font-family="Inter, Arial, sans-serif" font-size="${titleFontSize}" font-weight="950" fill="white">${escapeXml(line)}</text>`).join('')
  const rows = post.steps.map((step, index) => {
    const y = rowsStart + index * 98
    return `
      <rect x="940" y="${y}" width="540" height="70" rx="24" fill="white" fill-opacity="${index === 0 ? '0.98' : '0.94'}" />
      <circle cx="978" cy="${y + 35}" r="18" fill="${escapeXml(post.accent)}" fill-opacity="${index === 0 ? '1' : '0.78'}" />
      <text x="978" y="${y + 42}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="950" fill="white">${index + 1}</text>
      <text x="1018" y="${y + 43}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="900" fill="#102118">${escapeXml(step)}</text>`
  }).join('')

  return Buffer.from(`<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rightShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F4FFF6" stop-opacity="0" />
      <stop offset="35%" stop-color="#F4FFF6" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#07110B" stop-opacity="0.58" />
    </linearGradient>
    <radialGradient id="inlineGlow" cx="0.78" cy="0.30" r="0.56">
      <stop offset="0%" stop-color="${escapeXml(post.accent)}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${escapeXml(post.accent)}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="900" y="0" width="700" height="900" fill="url(#rightShade)" />
  <rect x="900" y="0" width="700" height="900" fill="url(#inlineGlow)" />
  <rect x="880" y="90" width="675" height="710" rx="48" fill="#07110B" fill-opacity="0.52" stroke="white" stroke-opacity="0.62" />
  <rect x="920" y="136" width="600" height="${headerHeight}" rx="34" fill="#07110B" fill-opacity="0.92" />
  <text x="952" y="186" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="950" fill="${escapeXml(post.accent)}" letter-spacing="4">${escapeXml(post.eyebrow.toUpperCase())}</text>
  ${titleMarkup}
  ${rows}
  <svg x="1328" y="662" width="128" height="128" viewBox="0 0 192 192">${iconMarkup(post.icon, post.accent)}</svg>
</svg>`)
}

async function renderAsset(post, variant) {
  const overlay = variant === 'hero' ? heroOverlay(post) : inlineOverlay(post)
  const output = join(blogDir, `${post.slug}-${variant}.jpg`)
  const sceneSource = join(mascotSceneDir, `${post.slug}.jpg`)
  const base = sharp(existsSync(sceneSource) ? sceneSource : fallbackMascotBase)
    .resize(1600, 900, { fit: 'cover' })
    .jpeg({ quality: 90 })

  const image = variant === 'inline'
    ? base.modulate({ saturation: 1.02, brightness: 1 })
    : base.modulate({ saturation: 1, brightness: 1 })

  await image
    .composite([{ input: overlay, left: 0, top: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(output)
}

for (const post of posts) {
  await renderAsset(post, 'hero')
  await renderAsset(post, 'inline')
}

console.log(`Generated ${posts.length * 2} mascot blog images.`)
