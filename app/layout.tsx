import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies, headers } from 'next/headers'
import "./globals.css";
import { getActiveBannerPromo } from '@/lib/pricing'
import { getOrganizationSameAsLinks, getSiteUrl, SITE_NAME } from '@/lib/site'
import PromoBanner from '@/components/shared/PromoBanner'
import PaddleProvider from '@/components/providers/PaddleProvider'
import PostHogProvider from '@/components/providers/PostHogProvider'
import AffiliateReferralTracker from '@/components/providers/AffiliateReferralTracker'
import PendingJobApplyPrompt from '@/components/jobs/PendingJobApplyPrompt'
import CookieConsentBanner from '@/components/shared/CookieConsentBanner'
import {
  COOKIE_CONSENT_COOKIE,
  detectRequestCountry,
  parseCookieConsentPreference,
  shouldEnableAnalyticsForRequest,
  shouldShowCookieConsentBanner,
} from '@/lib/cookie-consent'

const geistSans = localFont({
  src: './fonts/geist-sans.woff2',
  variable: "--font-geist-sans",
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/geist-mono.woff2',
  variable: "--font-geist-mono",
  display: 'swap',
});

const siteUrl = getSiteUrl()
const organizationSameAs = getOrganizationSameAsLinks()

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Rezoomed helps job seekers improve resumes, boost ATS performance, and land more interviews.',
  applicationName: SITE_NAME,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: './',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: 'Rezoomed helps job seekers improve resumes, boost ATS performance, and land more interviews.',
    url: siteUrl,
    images: [
      {
        url: '/icon.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Rezoomed helps job seekers improve resumes, boost ATS performance, and land more interviews.',
    images: ['/icon.png'],
  },
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bannerPromo = getActiveBannerPromo()
  const cookieStore = await cookies()
  const headerStore = await headers()
  const countryCode = detectRequestCountry(headerStore)
  const cookieConsentPreference = parseCookieConsentPreference(
    cookieStore.get(COOKIE_CONSENT_COOKIE)?.value
  )
  const analyticsEnabled = shouldEnableAnalyticsForRequest({
    countryCode,
    consentPreference: cookieConsentPreference,
  })
  const showCookieConsentBanner = shouldShowCookieConsentBanner({
    countryCode,
    consentPreference: cookieConsentPreference,
  })
  const organizationJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@rezoomed.com',
      },
    ],
  }

  if (organizationSameAs.length > 0) {
    organizationJsonLd.sameAs = organizationSameAs
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
      data-analytics-default={analyticsEnabled ? 'granted' : 'denied'}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {showCookieConsentBanner ? <CookieConsentBanner /> : null}
        <AffiliateReferralTracker />
        <PostHogProvider enabled={analyticsEnabled}>
          <PaddleProvider>
            {bannerPromo && <PromoBanner promo={bannerPromo} />}
            {children}
            <PendingJobApplyPrompt />
          </PaddleProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
