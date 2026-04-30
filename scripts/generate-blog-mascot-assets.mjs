import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const blogDir = join(root, 'public/blog')

const companySlugs = [
  'how-to-land-a-job-at-openai',
  'how-to-land-a-job-at-anthropic',
  'how-to-land-a-job-at-meta',
  'how-to-land-a-job-at-microsoft',
  'how-to-land-a-job-at-amazon',
  'how-to-land-a-job-at-apple',
  'how-to-land-a-job-at-netflix',
  'how-to-land-a-job-at-stripe',
  'how-to-land-a-job-at-shopify',
  'how-to-land-a-job-at-airbnb',
  'how-to-land-a-job-at-uber',
  'how-to-land-a-job-at-tiktok',
  'how-to-land-a-job-at-nvidia',
  'how-to-land-a-job-at-notion',
  'how-to-land-a-job-at-figma',
  'how-to-land-a-google-job',
]

const googleLogo = {
  title: 'Google',
  brandColor: '#4285F4',
  logoMarkup: `
    <text x="-20" y="42" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" letter-spacing="-2">
      <tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC05">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e</tspan>
    </text>
  `,
}

function extractLogo(slug) {
  if (slug === 'how-to-land-a-google-job') return googleLogo

  const svgPath = join(blogDir, `${slug}-hero.svg`)
  let svg
  try {
    svg = readFileSync(svgPath, 'utf8')
  } catch {
    return { title: slug, brandColor: '#026D32', logoMarkup: '' }
  }

  const title = svg.match(/<title>([^<]+)<\/title>/)?.[1] ?? slug.replace(/^how-to-land-a-job-at-/, '')
  const brandColor = svg.match(/<circle[^>]+fill="(#[0-9A-Fa-f]{6})"/)?.[1] ?? '#026D32'
  const logoGroup = svg.match(/<g fill="white">([\s\S]*?)<\/g>/)?.[1] ?? ''
  const paths = [...logoGroup.matchAll(/<path\b([^>]*)\/?>/g)]
    .map(match => {
      const attrs = match[1]
        .replace(/\sfill="[^"]*"/g, '')
        .replace(/\s*\/\s*$/, '')
      return `<path ${attrs.trim()} fill="white" />`
    })
    .join('\n      ')

  return {
    title,
    brandColor,
    logoMarkup: `<g transform="translate(0 0) scale(4.2)">${paths}</g>`,
  }
}

function escapeText(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function loadBaseImageDataUri() {
  const sourcePath = join(blogDir, 'mascot-application-base.png')
  const raw = readFileSync(sourcePath)
  return `data:image/png;base64,${raw.toString('base64')}`
}

function buildMascotSvg({ title, brandColor, logoMarkup, subTitle = 'APPLICATION' }, baseImageHref) {
  const safeTitle = escapeText(title)

  return `<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>${safeTitle} mascot illustration</title>
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
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.42" />
      <stop offset="100%" stop-color="${brandColor}" stop-opacity="0" />
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
    <g transform="translate(1188 238)">
      ${logoMarkup}
    </g>
    <text x="1245" y="412" font-family="Inter, Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#A3FFB3" text-anchor="middle" letter-spacing="4">${subTitle}</text>
    <text x="1245" y="464" font-family="Inter, Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-1">${safeTitle}</text>

    <g opacity="0.88">
      <rect x="1090" y="522" width="310" height="14" rx="7" fill="white" fill-opacity="0.18" />
      <rect x="1090" y="566" width="252" height="14" rx="7" fill="white" fill-opacity="0.13" />
      <rect x="1090" y="610" width="286" height="14" rx="7" fill="white" fill-opacity="0.13" />
      <rect x="1090" y="654" width="190" height="14" rx="7" fill="white" fill-opacity="0.13" />
    </g>

    <g transform="translate(1110 690)">
      <circle cx="22" cy="22" r="22" fill="#A3FFB3" />
      <path d="M13 23.5L19.3 30L32 15" stroke="#062313" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <text x="62" y="29" font-family="Inter, Arial, Helvetica, sans-serif" font-size="20" font-weight="800" fill="white" fill-opacity="0.86">ready to tailor</text>
    </g>
  </g>
</svg>
`
}

const assets = [
  ...companySlugs.map(slug => ({
    slug,
    ...extractLogo(slug),
  })),
]

const baseImageHref = await loadBaseImageDataUri()

for (const asset of assets) {
  writeFileSync(join(blogDir, `${asset.slug}-mascot.svg`), buildMascotSvg(asset, baseImageHref))
}

console.log(`Generated ${assets.length} mascot blog assets.`)
