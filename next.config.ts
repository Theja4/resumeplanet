import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const nodeModulesRoot = join(projectRoot, "node_modules");

// Allowlists derived from real third parties used on the site:
//   - Paddle (checkout)
//   - PayPal (alt checkout)
//   - Razorpay (India checkout)
//   - Polar (orders)
//   - Supabase (auth + storage)
//   - PostHog (analytics)
//   - Google Tag Manager + Analytics
//   - simpleicons.org (logo strip)
//   - Vercel insights
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://*.paddle.com https://*.paypal.com https://*.razorpay.com https://*.polar.sh",
  "frame-ancestors 'self'",
  // 'unsafe-inline' + 'unsafe-eval' are required by Next.js, GTM, and Paddle/Stripe SDKs.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paddle.com https://*.paypal.com https://*.razorpay.com https://*.polar.sh https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://app.posthog.com https://www.googletagmanager.com https://www.google-analytics.com https://*.vercel-insights.com https://*.vercel-scripts.com",
  "script-src-elem 'self' 'unsafe-inline' https://*.paddle.com https://*.paypal.com https://*.razorpay.com https://*.polar.sh https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://app.posthog.com https://www.googletagmanager.com https://www.google-analytics.com https://*.vercel-insights.com https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.simpleicons.org https://*.supabase.co https://*.googleusercontent.com https://www.googletagmanager.com https://www.google-analytics.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.paddle.com https://*.paypal.com https://*.razorpay.com https://*.polar.sh https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://app.posthog.com https://www.googletagmanager.com https://www.google-analytics.com https://*.vercel-insights.com https://vitals.vercel-analytics.com",
  "frame-src 'self' https://*.paddle.com https://*.paypal.com https://*.razorpay.com https://*.polar.sh",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Report-Only first — switch to enforcing once Vercel logs show no false-positive blocks.
  { key: 'Content-Security-Policy-Report-Only', value: CSP_DIRECTIVES },
]

// Routes that are public marketing pages — safe to cache at the edge for short windows.
// Authenticated routes (/dashboard, /api, /auth) are excluded.
const MARKETING_CACHE_PATHS = [
  '/',
  '/blog',
  '/blog/:slug*',
  '/ats-checker',
  '/ats-resume-test',
  '/ats-resume-format',
  '/resume-builder',
  '/resume-scanner',
  '/resume-format',
  '/resume-format/:role*',
  '/resume-format-for-job-applications',
  '/us-resume-format',
  '/resume-tailoring',
  '/match-score',
  '/metadata-enhancer',
  '/cover-letter-generator',
  '/amazon-ats-resume-guide',
  '/what-ats-does-amazon-use',
  '/pricing',
  '/cookie-policy',
  '/privacy-policy',
  '/refund-policy',
  '/terms',
]

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: join(nodeModulesRoot, "tailwindcss/index.css"),
      "tw-animate-css": join(nodeModulesRoot, "tw-animate-css/dist/tw-animate.css"),
      "shadcn/tailwind.css": join(nodeModulesRoot, "shadcn/dist/tailwind.css"),
    },
  },
  // Keep pdfjs-dist and mammoth as Node.js externals — not bundled by Turbopack
  serverExternalPackages: ['pdfjs-dist', 'mammoth'],
  outputFileTracingIncludes: {
    '/api/resume/pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
    // pdfjs needs the bundled CMap tables + standard PDF fonts to extract
    // text from CJK / Devanagari / Arabic / Thai / Hebrew resumes correctly.
    // Without these, non-Latin text comes back as unmapped CIDs.
    '/api/resume/parse': [
      './node_modules/pdfjs-dist/cmaps/**/*',
      './node_modules/pdfjs-dist/standard_fonts/**/*',
    ],
    '/api/ats/extract-text': [
      './node_modules/pdfjs-dist/cmaps/**/*',
      './node_modules/pdfjs-dist/standard_fonts/**/*',
    ],
  },
  images: {
    // Serve AVIF when the browser supports it, fall back to WebP otherwise.
    // Cuts hero-image bytes ~15-25% beyond WebP, which moves real LCP.
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      // Edge-cache marketing pages for 60s with 5min stale-while-revalidate.
      // Authenticated routes are not listed and keep their existing no-cache behavior.
      ...MARKETING_CACHE_PATHS.map(source => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      })),
    ]
  },
  async redirects() {
    return [
      // SEO audit C7: predictable URL was 404. Capture link equity + direct typing.
      {
        source: '/blog/how-to-land-a-job-at-google',
        destination: '/blog/how-to-land-a-google-job',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
