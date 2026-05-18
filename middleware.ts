import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that bypass auth (webhooks, public API endpoints)
const publicRoutes = [
  '/api/paddle/webhook',
  '/api/webhooks/paddle',
  '/api/webhooks/razorpay',
  '/api/auth/callback',
]

/**
 * Public marketing routes that don't need a Supabase session refresh on every
 * navigation. Skipping these lets the browser keep them in bfcache (the
 * `Set-Cookie` from `updateSession` forces `Cache-Control: no-store` on
 * the response, which Chrome refuses to bfcache).
 *
 * The trade-off: a logged-in user navigating between marketing pages won't
 * have their session refreshed mid-flight. Supabase sessions live for hours
 * by default, so this is fine — the next visit to a /dashboard or /api
 * route refreshes them.
 */
const PUBLIC_MARKETING_EXACT = new Set([
  '/',
  '/pricing',
  '/blog',
  '/ats-checker',
  '/ats-resume-format',
  '/ats-resume-test',
  '/resume-builder',
  '/resume-scanner',
  '/resume-tailoring',
  '/resume-format',
  '/resume-format-for-job-applications',
  '/us-resume-format',
  '/match-score',
  '/metadata-enhancer',
  '/cover-letter-generator',
  '/amazon-ats-resume-guide',
  '/what-ats-does-amazon-use',
  '/cookie-policy',
  '/privacy-policy',
  '/refund-policy',
  '/terms',
])

const PUBLIC_MARKETING_PREFIXES = [
  '/blog/',
  '/resume-format/',
  '/r/',
]

function isPublicMarketingPath(pathname: string): boolean {
  if (PUBLIC_MARKETING_EXACT.has(pathname)) return true
  return PUBLIC_MARKETING_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bypass auth for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Bypass session refresh for marketing pages so they're bfcache-eligible
  if (isPublicMarketingPath(pathname)) {
    return NextResponse.next()
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[supabase] Missing browser configuration in proxy; skipping session refresh')
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
