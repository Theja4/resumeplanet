import { readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const root = process.cwd()
const blogDir = join(root, 'public/blog')
const logoDir = join(blogDir, 'comparison-logos')

const sourceNotes = [
  'Rezoomed logo: local public/auth-login-logo.png',
  'Jobscan logo: https://static.jobscan.co/blog/uploads/Jobscan-Logo-Blue-On-White-300x150_72dpi.png',
  'Resume Worded logo: https://resumeworded.com/assets/images/resume-worded-logo.png',
  'Zety logo: https://cdn-images.zety.com/files/Zety_Brandbook.pdf',
  'Rezi logo: https://cdn.prod.website-files.com/62f0854c1cef28185535ab61/62f0a15cf4eb678703006e9b_rezi.svg',
  'Enhancv logo: https://d1011j0lbv5k1u.cloudfront.net/assets/store-494111/494111-logo-1553769801.jpg',
  'Canva logo: current inline logo from https://www.canva.com/',
]

const rezoomedLogo = join(root, 'public/auth-login-logo.png')

const comparisons = [
  {
    slug: 'rezoomed-vs-jobscan',
    name: 'Jobscan',
    logo: join(logoDir, 'jobscan.png'),
    accent: '#0693D5',
    soft: '#D9EEFF',
    secondary: '#83CAFF',
    theme: 'jobscan',
    heroLogo: { width: 430, height: 210 },
    inlineLogo: { width: 310, height: 150 },
  },
  {
    slug: 'rezoomed-vs-resume-worded',
    name: 'Resume Worded',
    logo: join(logoDir, 'resume-worded.png'),
    accent: '#138A5B',
    soft: '#DCFCE7',
    secondary: '#86EFAC',
    theme: 'resume-worded',
    heroLogo: { width: 500, height: 120 },
    inlineLogo: { width: 350, height: 84 },
    logoWellFill: '#111827',
    logoWellStroke: '#263244',
  },
  {
    slug: 'rezoomed-vs-zety',
    name: 'Zety',
    logo: join(logoDir, 'zety.png'),
    accent: '#2F74F6',
    soft: '#DBEAFE',
    secondary: '#9EC5FF',
    theme: 'zety',
    heroLogo: { width: 360, height: 170 },
    inlineLogo: { width: 260, height: 122 },
  },
  {
    slug: 'rezoomed-vs-rezi',
    name: 'Rezi',
    logo: join(logoDir, 'rezi.svg'),
    accent: '#2C3E50',
    soft: '#E5EEF6',
    secondary: '#A9B8C8',
    theme: 'rezi',
    heroLogo: { width: 420, height: 180 },
    inlineLogo: { width: 300, height: 130 },
  },
  {
    slug: 'rezoomed-vs-enhancv',
    name: 'Enhancv',
    logo: join(logoDir, 'enhancv.jpg'),
    accent: '#25B99B',
    soft: '#D9F8EF',
    secondary: '#9DEEDB',
    theme: 'enhancv',
    heroLogo: { width: 360, height: 220 },
    inlineLogo: { width: 260, height: 160 },
  },
  {
    slug: 'rezoomed-vs-canva',
    name: 'Canva',
    logo: join(logoDir, 'canva.svg'),
    accent: '#7D2AE7',
    soft: '#F0E4FF',
    secondary: '#00C4CC',
    theme: 'canva',
    heroLogo: { width: 420, height: 135 },
    inlineLogo: { width: 300, height: 96 },
  },
]

function mimeFor(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.svg':
      return 'image/svg+xml'
    default:
      throw new Error(`Unsupported logo file type: ${filePath}`)
  }
}

function dataUri(filePath) {
  const data = readFileSync(filePath)
  return `data:${mimeFor(filePath)};base64,${data.toString('base64')}`
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function logoImage(href, x, y, width, height) {
  return `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />`
}

function checkIcon(x, y, size, color) {
  const s = size / 24
  return `<path d="M${x + 4 * s} ${y + 12.5 * s}l5.2 ${5.2 * s}L${x + 20 * s} ${y + 6 * s}" fill="none" stroke="${color}" stroke-width="${3 * s}" stroke-linecap="round" stroke-linejoin="round"/>`
}

function warningIcon(x, y, size, color) {
  const s = size / 24
  return `
    <path d="M${x + 12 * s} ${y + 3 * s}l${9 * s} ${16 * s}H${x + 3 * s}z" fill="${color}" opacity="0.18"/>
    <path d="M${x + 12 * s} ${y + 8 * s}v${5 * s}" stroke="${color}" stroke-width="${2.6 * s}" stroke-linecap="round"/>
    <circle cx="${x + 12 * s}" cy="${y + 16.5 * s}" r="${1.5 * s}" fill="${color}"/>`
}

function sparkIcon(x, y, size, color) {
  const s = size / 24
  return `
    <path d="M${x + 12 * s} ${y + 2.5 * s}l${2.7 * s} ${6.8 * s} ${6.8 * s} ${2.7 * s}-${6.8 * s} ${2.7 * s}-${2.7 * s} ${6.8 * s}-${2.7 * s}-${6.8 * s}-${6.8 * s}-${2.7 * s} ${6.8 * s}-${2.7 * s}z" fill="${color}"/>
    <path d="M${x + 4 * s} ${y + 5 * s}l${1.3 * s} ${3.2 * s} ${3.2 * s} ${1.3 * s}-${3.2 * s} ${1.3 * s}-${1.3 * s} ${3.2 * s}-${1.3 * s}-${3.2 * s}-${3.2 * s}-${1.3 * s} ${3.2 * s}-${1.3 * s}z" fill="${color}" opacity="0.48"/>`
}

function background(width, height, comparison, idPrefix) {
  return `
    <defs>
      <linearGradient id="${idPrefix}-bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FBFFFC"/>
        <stop offset="0.58" stop-color="#F4F9FF"/>
        <stop offset="1" stop-color="${comparison.soft}"/>
      </linearGradient>
      <linearGradient id="${idPrefix}-wash" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
        <stop stop-color="#00A84D" stop-opacity="0.16"/>
        <stop offset="1" stop-color="${comparison.accent}" stop-opacity="0.18"/>
      </linearGradient>
      <filter id="${idPrefix}-shadow" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#0F172A" flood-opacity="0.12"/>
        <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.06"/>
      </filter>
      <pattern id="${idPrefix}-dots" width="34" height="34" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.4" fill="#0F172A" opacity="0.055"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#${idPrefix}-bg)"/>
    <rect width="${width}" height="${height}" fill="url(#${idPrefix}-dots)"/>
    <ellipse cx="${width * 0.24}" cy="${height * 0.18}" rx="${width * 0.34}" ry="${height * 0.24}" fill="#FFFFFF" opacity="0.55"/>
    <ellipse cx="${width * 0.78}" cy="${height * 0.86}" rx="${width * 0.42}" ry="${height * 0.28}" fill="url(#${idPrefix}-wash)" opacity="0.54"/>`
}

function logoPanel({ x, y, width, height, fill = '#FFFFFF', stroke = '#E1E9E4', idPrefix }) {
  return `
    <g filter="url(#${idPrefix}-shadow)">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="42" fill="${fill}"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="42" fill="#FFFFFF" opacity="${fill === '#FFFFFF' ? 0.35 : 0.04}" stroke="${stroke}"/>
    </g>`
}

function renderLogoLockup(comparison, { width, height, mode }) {
  const idPrefix = `${comparison.slug}-${mode}`
  const rezoomedHref = dataUri(rezoomedLogo)
  const competitorHref = dataUri(comparison.logo)
  const isHero = mode === 'hero'
  const panelWidth = isHero ? 540 : 395
  const panelHeight = isHero ? 390 : 270
  const panelY = (height - panelHeight) / 2
  const leftX = isHero ? 150 : 90
  const rightX = width - leftX - panelWidth
  const rezoomedSize = isHero ? 245 : 170
  const logoBox = isHero ? comparison.heroLogo : comparison.inlineLogo
  const competitorFill = comparison.logoWellFill ?? '#FFFFFF'
  const competitorStroke = comparison.logoWellStroke ?? comparison.soft
  const dividerTop = isHero ? 210 : 125
  const dividerHeight = isHero ? 480 : 270
  const centerX = width / 2

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>${escapeXml(`Rezoomed and ${comparison.name} logos`)}</title>
  <desc>${escapeXml(`Logo-only comparison image for Rezoomed and ${comparison.name}. ${sourceNotes.join(' | ')}`)}</desc>
  ${background(width, height, comparison, idPrefix)}
  ${logoPanel({ x: leftX, y: panelY, width: panelWidth, height: panelHeight, fill: '#FFFFFF', stroke: '#D8F9DF', idPrefix })}
  ${logoPanel({ x: rightX, y: panelY, width: panelWidth, height: panelHeight, fill: competitorFill, stroke: competitorStroke, idPrefix })}
  <rect x="${centerX - 3}" y="${dividerTop}" width="6" height="${dividerHeight}" rx="3" fill="#0F172A" opacity="0.10"/>
  <circle cx="${centerX}" cy="${height / 2}" r="${isHero ? 42 : 30}" fill="#FFFFFF" stroke="#DDE7E0" stroke-width="2"/>
  <circle cx="${centerX}" cy="${height / 2}" r="${isHero ? 17 : 12}" fill="#00A84D" opacity="0.82"/>
  <circle cx="${centerX}" cy="${height / 2}" r="${isHero ? 8 : 6}" fill="${comparison.accent}" opacity="0.85"/>
  ${logoImage(rezoomedHref, leftX + panelWidth / 2 - rezoomedSize / 2, panelY + panelHeight / 2 - rezoomedSize / 2, rezoomedSize, rezoomedSize)}
  ${logoImage(competitorHref, rightX + panelWidth / 2 - logoBox.width / 2, panelY + panelHeight / 2 - logoBox.height / 2, logoBox.width, logoBox.height)}
</svg>
`
}

function brandCapsules(comparison, competitorHref, rezoomedHref) {
  const fill = comparison.logoWellFill ?? '#FFFFFF'
  const stroke = comparison.logoWellStroke ?? comparison.soft
  return `
    <g filter="url(#graphic-shadow)">
      <rect x="74" y="52" width="108" height="108" rx="30" fill="#FFFFFF" stroke="#D8F9DF"/>
      ${logoImage(rezoomedHref, 94, 72, 68, 68)}
    </g>
    <g filter="url(#graphic-shadow)">
      <rect x="1018" y="52" width="108" height="108" rx="30" fill="${fill}" stroke="${stroke}"/>
      ${logoImage(competitorHref, 1034, 82, 76, 48)}
    </g>`
}

function structuredResume(x, y, accent) {
  return `
    <g transform="translate(${x} ${y})">
      <rect width="280" height="360" rx="26" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <rect x="34" y="34" width="132" height="12" rx="6" fill="#0F172A" opacity="0.18"/>
      <rect x="34" y="66" width="210" height="8" rx="4" fill="#0F172A" opacity="0.10"/>
      <rect x="34" y="88" width="178" height="8" rx="4" fill="#0F172A" opacity="0.10"/>
      <rect x="34" y="130" width="78" height="10" rx="5" fill="${accent}" opacity="0.48"/>
      <rect x="34" y="158" width="204" height="8" rx="4" fill="#0F172A" opacity="0.11"/>
      <rect x="34" y="180" width="184" height="8" rx="4" fill="#0F172A" opacity="0.11"/>
      <rect x="34" y="202" width="218" height="8" rx="4" fill="#0F172A" opacity="0.11"/>
      <rect x="34" y="254" width="78" height="10" rx="5" fill="${accent}" opacity="0.34"/>
      <rect x="34" y="282" width="196" height="8" rx="4" fill="#0F172A" opacity="0.10"/>
      <rect x="34" y="304" width="154" height="8" rx="4" fill="#0F172A" opacity="0.10"/>
      <circle cx="232" cy="54" r="25" fill="#D8F9DF"/>
      ${checkIcon(218, 40, 30, '#00A84D')}
    </g>`
}

function scanFlow(x, y, accent) {
  return `
    <g transform="translate(${x} ${y})">
      <path d="M0 70C86 8 192 8 278 70" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.22"/>
      <path d="M0 178C86 240 192 240 278 178" stroke="#00A84D" stroke-width="12" stroke-linecap="round" opacity="0.22"/>
      <circle cx="38" cy="70" r="26" fill="#FFFFFF" stroke="#DDE7E0"/>
      <circle cx="139" cy="28" r="26" fill="#FFFFFF" stroke="#DDE7E0"/>
      <circle cx="240" cy="70" r="26" fill="#FFFFFF" stroke="#DDE7E0"/>
      <circle cx="38" cy="178" r="26" fill="#FFFFFF" stroke="#DDE7E0"/>
      <circle cx="139" cy="220" r="26" fill="#FFFFFF" stroke="#DDE7E0"/>
      <circle cx="240" cy="178" r="26" fill="#FFFFFF" stroke="#DDE7E0"/>
      ${checkIcon(27, 59, 22, '#00A84D')}
      ${checkIcon(128, 17, 22, '#00A84D')}
      ${checkIcon(229, 59, 22, '#00A84D')}
      ${checkIcon(27, 167, 22, '#00A84D')}
      ${checkIcon(128, 209, 22, '#00A84D')}
      ${checkIcon(229, 167, 22, '#00A84D')}
    </g>`
}

function keywordGraphic(accent, secondary) {
  return `
    <g transform="translate(680 210)">
      <rect x="0" y="0" width="350" height="260" rx="30" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <circle cx="120" cy="100" r="54" fill="${secondary}" opacity="0.22"/>
      <circle cx="105" cy="85" r="34" fill="none" stroke="${accent}" stroke-width="12"/>
      <path d="M128 110l48 48" stroke="${accent}" stroke-linecap="round" stroke-width="14"/>
      <rect x="210" y="58" width="86" height="20" rx="10" fill="${accent}" opacity="0.42"/>
      <rect x="210" y="96" width="58" height="20" rx="10" fill="#0F172A" opacity="0.12"/>
      <rect x="210" y="134" width="104" height="20" rx="10" fill="${accent}" opacity="0.22"/>
      <rect x="56" y="196" width="238" height="14" rx="7" fill="#0F172A" opacity="0.10"/>
    </g>`
}

function scoreGraphic(accent) {
  return `
    <g transform="translate(690 202)">
      <rect width="330" height="276" rx="32" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <circle cx="105" cy="122" r="64" fill="#DCFCE7"/>
      <path d="M105 58a64 64 0 1 1-57 93" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="105" cy="122" r="30" fill="#FFFFFF"/>
      <rect x="202" y="70" width="78" height="14" rx="7" fill="${accent}" opacity="0.42"/>
      <rect x="202" y="110" width="88" height="12" rx="6" fill="#0F172A" opacity="0.12"/>
      <rect x="202" y="146" width="58" height="12" rx="6" fill="#0F172A" opacity="0.12"/>
      <rect x="54" y="222" width="224" height="12" rx="6" fill="#0F172A" opacity="0.10"/>
    </g>`
}

function builderGraphic(accent, secondary) {
  return `
    <g transform="translate(672 192)">
      <rect width="365" height="298" rx="34" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <g transform="translate(38 38)">
        <rect width="112" height="180" rx="16" fill="#F8FAFC" stroke="#DDE7E0"/>
        <rect x="18" y="22" width="48" height="8" rx="4" fill="${accent}" opacity="0.55"/>
        <rect x="18" y="48" width="76" height="6" rx="3" fill="#0F172A" opacity="0.12"/>
        <rect x="18" y="68" width="58" height="6" rx="3" fill="#0F172A" opacity="0.12"/>
        <rect x="18" y="104" width="70" height="34" rx="8" fill="${secondary}" opacity="0.28"/>
      </g>
      <g transform="translate(172 38)">
        <rect width="112" height="180" rx="16" fill="#F8FAFC" stroke="#DDE7E0"/>
        <rect x="18" y="22" width="48" height="8" rx="4" fill="${accent}" opacity="0.55"/>
        <rect x="18" y="48" width="76" height="6" rx="3" fill="#0F172A" opacity="0.12"/>
        <rect x="18" y="68" width="58" height="6" rx="3" fill="#0F172A" opacity="0.12"/>
        <rect x="18" y="104" width="70" height="34" rx="8" fill="${secondary}" opacity="0.28"/>
      </g>
      <circle cx="304" cy="228" r="35" fill="${accent}" opacity="0.13"/>
      ${warningIcon(286, 210, 36, accent)}
    </g>`
}

function aiGraphic(accent) {
  return `
    <g transform="translate(684 198)">
      <rect width="350" height="292" rx="34" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <rect x="38" y="42" width="148" height="196" rx="18" fill="#F8FAFC" stroke="#DDE7E0"/>
      <rect x="62" y="72" width="82" height="8" rx="4" fill="${accent}" opacity="0.52"/>
      <rect x="62" y="100" width="96" height="6" rx="3" fill="#0F172A" opacity="0.12"/>
      <rect x="62" y="120" width="70" height="6" rx="3" fill="#0F172A" opacity="0.12"/>
      <rect x="62" y="160" width="96" height="36" rx="10" fill="${accent}" opacity="0.12"/>
      ${sparkIcon(218, 70, 72, accent)}
      <path d="M220 190c36-26 70-26 100 0" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.22"/>
      <rect x="224" y="216" width="80" height="14" rx="7" fill="${accent}" opacity="0.34"/>
    </g>`
}

function visualTemplateGraphic(accent, secondary) {
  return `
    <g transform="translate(662 194)">
      <rect width="382" height="304" rx="34" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <rect x="34" y="40" width="132" height="206" rx="18" fill="#F8FAFC" stroke="#DDE7E0"/>
      <rect x="34" y="40" width="42" height="206" rx="18" fill="${secondary}" opacity="0.28"/>
      <rect x="96" y="70" width="46" height="7" rx="3.5" fill="${accent}" opacity="0.55"/>
      <rect x="96" y="96" width="54" height="5" rx="2.5" fill="#0F172A" opacity="0.12"/>
      <rect x="96" y="114" width="38" height="5" rx="2.5" fill="#0F172A" opacity="0.12"/>
      <rect x="212" y="54" width="108" height="72" rx="16" fill="${accent}" opacity="0.16"/>
      <rect x="212" y="148" width="108" height="72" rx="16" fill="${secondary}" opacity="0.28"/>
      <circle cx="298" cy="244" r="34" fill="#FFFFFF" stroke="#DDE7E0"/>
      ${warningIcon(280, 226, 36, accent)}
    </g>`
}

function canvasGraphic(accent, secondary) {
  return `
    <g transform="translate(660 190)">
      <rect width="386" height="308" rx="34" fill="#FFFFFF" stroke="#DDE7E0" filter="url(#graphic-shadow)"/>
      <rect x="34" y="42" width="194" height="220" rx="20" fill="#F8FAFC" stroke="#DDE7E0"/>
      <rect x="62" y="70" width="100" height="24" rx="12" fill="${accent}" opacity="0.34"/>
      <circle cx="92" cy="148" r="34" fill="${secondary}" opacity="0.36"/>
      <circle cx="148" cy="174" r="45" fill="${accent}" opacity="0.18"/>
      <rect x="74" y="222" width="116" height="14" rx="7" fill="#0F172A" opacity="0.10"/>
      <path d="M262 78h70M248 124h92M264 170h56M244 216h96" stroke="#0F172A" stroke-width="12" stroke-linecap="round" opacity="0.12"/>
      ${warningIcon(287, 247, 44, accent)}
    </g>`
}

function competitorGraphic(comparison) {
  if (comparison.theme === 'jobscan') return keywordGraphic(comparison.accent, comparison.secondary)
  if (comparison.theme === 'resume-worded') return scoreGraphic(comparison.accent)
  if (comparison.theme === 'zety') return builderGraphic(comparison.accent, comparison.secondary)
  if (comparison.theme === 'rezi') return aiGraphic(comparison.accent)
  if (comparison.theme === 'enhancv') return visualTemplateGraphic(comparison.accent, comparison.secondary)
  return canvasGraphic(comparison.accent, comparison.secondary)
}

function renderGraphic(comparison) {
  const width = 1200
  const height = 640
  const rezoomedHref = dataUri(rezoomedLogo)
  const competitorHref = dataUri(comparison.logo)

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>${escapeXml(`Rezoomed vs ${comparison.name} visual comparison`)}</title>
  <desc>${escapeXml(`Graphic illustration for the Rezoomed and ${comparison.name} comparison article. ${sourceNotes.join(' | ')}`)}</desc>
  ${background(width, height, comparison, 'graphic')}
  <defs>
    <filter id="graphic-shadow" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.12"/>
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
  </defs>
  ${brandCapsules(comparison, competitorHref, rezoomedHref)}
  ${structuredResume(170, 190, '#00A84D')}
  ${scanFlow(418, 244, comparison.accent)}
  ${competitorGraphic(comparison)}
</svg>
`
}

for (const comparison of comparisons) {
  writeFileSync(join(blogDir, `${comparison.slug}-hero.svg`), renderLogoLockup(comparison, { width: 1600, height: 900, mode: 'hero' }))
  writeFileSync(join(blogDir, `${comparison.slug}-logos.svg`), renderLogoLockup(comparison, { width: 1200, height: 520, mode: 'logos' }))
  writeFileSync(join(blogDir, `${comparison.slug}-graphic.svg`), renderGraphic(comparison))
  console.log(`wrote media for ${comparison.slug}`)
}
