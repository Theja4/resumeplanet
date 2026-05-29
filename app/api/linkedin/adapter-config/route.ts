import { NextResponse } from 'next/server'
import {
  CURRENT_ADAPTER_CONFIG,
  CURRENT_ADAPTER_CONFIG_VERSION,
} from '@/lib/linkedin/adapterConfig'

export const runtime = 'edge'
export const dynamic = 'force-static'

// Serves the DECLARATIVE selector config the LinkedIn extension uses to
// extract profile fields. Response is intentionally inert JSON — no
// executable code, ever. The extension validates the shape, caches it for
// the TTL embedded in the payload, and falls back to its bundled defaults
// on any failure.
//
// Bumping CURRENT_ADAPTER_CONFIG_VERSION + editing the data ships a
// hot-fix to all installed extensions without a Chrome Web Store
// re-review. Cache headers let the CDN absorb the load.
export async function GET() {
  return NextResponse.json(CURRENT_ADAPTER_CONFIG, {
    headers: {
      // Cache aggressively at the edge but allow quick rollouts via
      // stale-while-revalidate. Browsers see a short max-age so they
      // check back within the day; CDNs hold longer.
      'Cache-Control':
        'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
      'X-Adapter-Config-Version': CURRENT_ADAPTER_CONFIG_VERSION,
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  })
}
