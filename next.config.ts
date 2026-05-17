import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const nodeModulesRoot = join(projectRoot, "node_modules");

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
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
