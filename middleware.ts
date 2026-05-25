import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that bypass auth (webhooks, public API endpoints).
//
// The extension API routes (/api/extension/me, /resumes, /consistency, /scan
// and /api/linkedin/generate) authenticate via a bearer JWT in the
// Authorization header — they never read Supabase cookies. Running
// `updateSession` on them is wasted work, and the Supabase SSR helper
// rewrites the request in a way that drops the Authorization header before
// it reaches the route handler. /api/extension/token DELIBERATELY stays
// non-public because it reads the Supabase session cookie to mint the JWT.
const publicRoutes = [
  '/api/paddle/webhook',
  '/api/webhooks/paddle',
  '/api/webhooks/razorpay',
  '/api/auth/callback',
  '/api/extension/me',
  '/api/extension/resumes',
  '/api/extension/consistency',
  '/api/extension/scan',
  '/api/linkedin/generate',
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
  '/authors/',
  '/from/',
]

function isPublicMarketingPath(pathname: string): boolean {
  if (PUBLIC_MARKETING_EXACT.has(pathname)) return true
  return PUBLIC_MARKETING_PREFIXES.some((p) => pathname.startsWith(p))
}

// Tool pages that redirect logged-in users to their dashboard equivalent.
// Doing this redirect in middleware (cookie presence check, no session
// validation) lets the marketing landing page stay edge-cacheable for
// anonymous visitors — the vast majority of traffic.
const TOOL_PAGE_DASHBOARD_REDIRECTS: Record<string, string> = {
  '/ats-checker': '/dashboard/ats-checker',
  '/resume-builder': '/dashboard/builder',
  '/match-score': '/dashboard/match-score',
  '/resume-tailoring': '/dashboard/builder?mode=tailor',
  '/cover-letter-generator': '/dashboard/cv-generator',
  '/metadata-enhancer': '/dashboard/metadata-enhancer',
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      return true
    }
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bypass auth for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Tool-page logged-in redirect: cheap cookie presence check, no session
  // refresh. Anonymous visitors fall through to the cached static page.
  const dashboardTarget = TOOL_PAGE_DASHBOARD_REDIRECTS[pathname]
  if (dashboardTarget && hasSupabaseAuthCookie(request)) {
    const url = request.nextUrl.clone()
    const [path, search] = dashboardTarget.split('?')
    url.pathname = path
    url.search = search ? `?${search}` : ''
    return NextResponse.redirect(url)
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
