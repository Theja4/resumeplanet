import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const root = process.cwd()
const blogDir = join(root, 'public/blog')
const simpleIconDir = join(root, 'node_modules/simple-icons/icons')
const logoSourceDir = join(root, 'scripts/finance-logo-sources')

const companies = [
  {
    slug: 'how-to-land-a-job-at-jpmorgan-chase',
    displayName: 'JPMorgan Chase',
    color: '#005EB8',
    logo: {
      source: join(logoSourceDir, 'jpmorgan-chase.svg'),
      forceWhite: true,
      hero: { width: 360, height: 70 },
      mascot: { width: 270, height: 56 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-goldman-sachs',
    displayName: 'Goldman Sachs',
    color: '#7399C6',
    logo: {
      source: join(logoSourceDir, 'goldman-sachs.svg'),
      forceWhite: true,
      hero: { width: 220, height: 92 },
      mascot: { width: 178, height: 76 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-morgan-stanley',
    displayName: 'Morgan Stanley',
    color: '#0072CE',
    logo: {
      source: join(logoSourceDir, 'morgan-stanley.svg'),
      forceWhite: true,
      hero: { width: 360, height: 72 },
      mascot: { width: 282, height: 60 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-blackrock',
    displayName: 'BlackRock',
    color: '#111827',
    logo: {
      source: join(logoSourceDir, 'blackrock.svg'),
      forceWhite: true,
      hero: { width: 260, height: 70 },
      mascot: { width: 230, height: 62 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-bank-of-america',
    displayName: 'Bank of America',
    color: '#D4001A',
    logo: {
      source: join(simpleIconDir, 'bankofamerica.svg'),
      forceWhite: true,
      hero: { width: 132, height: 132 },
      mascot: { width: 100, height: 100 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-citi',
    displayName: 'Citi',
    color: '#004B93',
    logo: {
      source: join(logoSourceDir, 'citi.svg'),
      forceWhite: false,
      tile: true,
      hero: { width: 180, height: 106 },
      mascot: { width: 150, height: 90 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-barclays',
    displayName: 'Barclays',
    color: '#00AEEF',
    logo: {
      source: join(simpleIconDir, 'barclays.svg'),
      forceWhite: true,
      hero: { width: 124, height: 124 },
      mascot: { width: 98, height: 98 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-ubs',
    displayName: 'UBS',
    color: '#E60000',
    logo: {
      source: join(logoSourceDir, 'ubs.png'),
      tile: true,
      hero: { width: 220, height: 84 },
      mascot: { width: 176, height: 66 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-deutsche-bank',
    displayName: 'Deutsche Bank',
    color: '#0018A8',
    logo: {
      source: join(simpleIconDir, 'deutschebank.svg'),
      forceWhite: true,
      hero: { width: 122, height: 122 },
      mascot: { width: 96, height: 96 },
    },
  },
  {
    slug: 'how-to-land-a-job-at-hsbc',
    displayName: 'HSBC',
    color: '#DB0011',
    logo: {
      source: join(simpleIconDir, 'hsbc.svg'),
      forceWhite: true,
      hero: { width: 132, height: 132 },
      mascot: { width: 102, height: 102 },
    },
  },
]

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function displayTextSize(value) {
  return Math.max(34, Math.min(48, Math.floor(560 / Math.max(value.length, 1))))
}

function getSvgViewBox(svg) {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/i)?.[1]
  if (viewBox) return viewBox

  const width = Number(svg.match(/\bwidth=["']?([\d.]+)/i)?.[1] ?? 24)
  const height = Number(svg.match(/\bheight=["']?([\d.]+)/i)?.[1] ?? 24)
  return `0 0 ${width} ${height}`
}

function stripSvgShell(svg) {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc>[\s\S]*?<\/desc>/gi, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>/gi, '')
    .trim()
}

function forceLogoToWhite(svgBody) {
  return svgBody
    .replace(/\sfill=["'](?!none\b)[^"']*["']/gi, ' fill="currentColor"')
    .replace(/fill:\s*(?!none\b)[^;"']+/gi, 'fill:currentColor')
    .replace(/\sstroke=["'](?!none\b)[^"']*["']/gi, ' stroke="currentColor"')
    .replace(/stroke:\s*(?!none\b)[^;"']+/gi, 'stroke:currentColor')
}

function loadLogoMarkup(logo) {
  const ext = extname(logo.source).toLowerCase()
  const raw = readFileSync(logo.source)

  if (ext === '.png') {
    return {
      type: 'image',
      href: `data:image/png;base64,${raw.toString('base64')}`,
    }
  }

  const svg = raw.toString('utf8')
  const viewBox = getSvgViewBox(svg)
  const body = logo.forceWhite ? forceLogoToWhite(stripSvgShell(svg)) : stripSvgShell(svg)

  return {
    type: 'svg',
    viewBox,
    body,
    forceWhite: logo.forceWhite,
  }
}

function renderLogo(company, variant, centerX, centerY) {
  const logo = company.logo
  const dimensions = logo[variant]
  const x = centerX - dimensions.width / 2
  const y = centerY - dimensions.height / 2
  const loaded = loadLogoMarkup(logo)
  const tile = logo.tile
    ? `<rect x="${x - 22}" y="${y - 18}" width="${dimensions.width + 44}" height="${dimensions.height + 36}" rx="24" fill="white" fill-opacity="0.96" />`
    : ''

  if (loaded.type === 'image') {
    return `${tile}
    <image href="${loaded.href}" x="${x}" y="${y}" width="${dimensions.width}" height="${dimensions.height}" preserveAspectRatio="xMidYMid meet" />`
  }

  return `${tile}
    <svg x="${x}" y="${y}" width="${dimensions.width}" height="${dimensions.height}" viewBox="${loaded.viewBox}" preserveAspectRatio="xMidYMid meet" overflow="visible">
      <g color="white" fill="${loaded.forceWhite ? 'currentColor' : 'inherit'}">
        ${loaded.body}
      </g>
    </svg>`
}

function buildGuideSvg(company) {
  const title = escapeXml(company.displayName)
  const displaySize = displayTextSize(company.displayName)
  const topText = company.displayName.length > 14 ? 26 : 28
  const logoMarkup = renderLogo(company, 'hero', 800, 420)

  return `<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>${title} career guide illustration</title>
  <rect width="1600" height="900" fill="#0A0A0A" />

  <ellipse cx="400" cy="150" rx="600" ry="400" fill="url(#brandGlow1)" opacity="0.15" />
  <ellipse cx="1200" cy="750" rx="700" ry="500" fill="url(#brandGlow2)" opacity="0.1" />

  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1600" height="900" fill="url(#grid)" />

  <rect x="500" y="250" width="600" height="400" rx="40" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
  <circle cx="800" cy="450" r="112" fill="${company.color}" opacity="0.15" filter="url(#glow)"/>
  <g>
    ${logoMarkup}
    <text x="800" y="548" font-family="'Inter', Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="white" fill-opacity="0.62" text-anchor="middle" letter-spacing="5">FINANCE CAREERS</text>
  </g>

  <text x="800" y="750" font-family="'Inter', -apple-system, sans-serif" font-size="${topText}" font-weight="600" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="4">HOW TO LAND A JOB AT</text>
  <text x="800" y="810" font-family="'Inter', -apple-system, sans-serif" font-size="${displaySize}" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1">${title}</text>

  <defs>
    <radialGradient id="brandGlow1" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${company.color}" />
      <stop offset="100%" stop-color="${company.color}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="brandGlow2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${company.color}" />
      <stop offset="100%" stop-color="${company.color}" stop-opacity="0" />
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" result="blur" />
    </filter>
  </defs>
</svg>
`
}

function loadBaseImageDataUri() {
  const sourcePath = join(blogDir, 'mascot-application-base.png')
  const raw = readFileSync(sourcePath)
  return `data:image/png;base64,${raw.toString('base64')}`
}

function buildMascotSvg(company, baseImageHref) {
  const title = escapeXml(company.displayName)
  const displaySize = Math.max(30, Math.min(44, Math.floor(520 / Math.max(company.displayName.length, 1))))
  const logoMarkup = renderLogo(company, 'mascot', 1245, 268)

  return `<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>${title} resume guide mascot illustration</title>
  <defs>
    <linearGradient id="edgeShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="100%" stop-color="#07110B" stop-opacity="0.28" />
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07110B" />
      <stop offset="58%" stop-color="#0B1D13" />
      <stop offset="100%" stop-color="#10261A" />
    </linearGradient>
    <radialGradient id="brandGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${company.color}" stop-opacity="0.42" />
      <stop offset="100%" stop-color="${company.color}" stop-opacity="0" />
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="26" flood-color="#07110B" flood-opacity="0.22"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="#EEF5EF" />
  <image href="${baseImageHref}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" />
  <rect width="1600" height="900" fill="url(#edgeShade)" />

  <g filter="url(#softShadow)">
    <rect x="1030" y="145" width="430" height="610" rx="44" fill="url(#card)" />
    <rect x="1031" y="146" width="428" height="608" rx="43" stroke="white" stroke-opacity="0.12" stroke-width="2" />
    <ellipse cx="1245" cy="260" rx="215" ry="170" fill="url(#brandGlow)" />
    <rect x="1082" y="202" width="326" height="154" rx="30" fill="white" fill-opacity="0.07" stroke="white" stroke-opacity="0.10" />
    ${logoMarkup}
    <text x="1245" y="412" font-family="'Inter', Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#A3FFB3" text-anchor="middle" letter-spacing="4">APPLICATION</text>
    <text x="1245" y="464" font-family="'Inter', Arial, Helvetica, sans-serif" font-size="${displaySize}" font-weight="900" fill="white" text-anchor="middle">${title}</text>

    <g opacity="0.88">
      <rect x="1090" y="522" width="310" height="14" rx="7" fill="white" fill-opacity="0.18" />
      <rect x="1090" y="566" width="252" height="14" rx="7" fill="white" fill-opacity="0.13" />
      <rect x="1090" y="610" width="286" height="14" rx="7" fill="white" fill-opacity="0.13" />
      <rect x="1090" y="654" width="190" height="14" rx="7" fill="white" fill-opacity="0.13" />
    </g>

    <g transform="translate(1110 690)">
      <circle cx="22" cy="22" r="22" fill="#A3FFB3" />
      <path d="M13 23.5L19.3 30L32 15" stroke="#062313" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <text x="62" y="29" font-family="'Inter', Arial, Helvetica, sans-serif" font-size="20" font-weight="800" fill="white" fill-opacity="0.86">resume proof ready</text>
    </g>
  </g>
</svg>
`
}

mkdirSync(blogDir, { recursive: true })

const baseImageHref = loadBaseImageDataUri()

for (const company of companies) {
  const guideSvg = buildGuideSvg(company)
  writeFileSync(join(blogDir, `${company.slug}-hero.svg`), guideSvg)
  writeFileSync(join(blogDir, `${company.slug}-inline.svg`), guideSvg)
  writeFileSync(join(blogDir, `${company.slug}-mascot.svg`), buildMascotSvg(company, baseImageHref))
}

console.log(`Generated ${companies.length * 3} finance blog assets.`)
