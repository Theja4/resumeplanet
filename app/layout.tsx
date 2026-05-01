import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies, headers } from 'next/headers'
import "./globals.css";
import { getActiveBannerPromo } from '@/lib/pricing'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import { DEFAULT_OG_IMAGE, DEFAULT_SEO_DESCRIPTION, getAbsoluteUrl } from '@/lib/seo'
import PromoBanner from '@/components/shared/PromoBanner'
import PaddleProvider from '@/components/providers/PaddleProvider'
import PostHogProvider from '@/components/providers/PostHogProvider'
import GoogleAnalyticsProvider from '@/components/providers/GoogleAnalyticsProvider'
import AffiliateReferralTracker from '@/components/providers/AffiliateReferralTracker'
import PendingJobApplyPrompt from '@/components/jobs/PendingJobApplyPrompt'
import CookieConsentBanner from '@/components/shared/CookieConsentBanner'
import { JOB_BOARD_ENABLED } from '@/lib/featureFlags'
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

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  applicationName: SITE_NAME,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: SITE_NAME,
    description: DEFAULT_SEO_DESCRIPTION,
    url: siteUrl,
    images: [
      {
        url: getAbsoluteUrl(DEFAULT_OG_IMAGE.url),
        alt: DEFAULT_OG_IMAGE.alt,
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE.url)],
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon-48x48.png', type: 'image/png' }],
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

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
      data-analytics-default={analyticsEnabled ? 'granted' : 'denied'}
    >
      <body
        suppressHydrationWarning
        className={`min-h-full flex flex-col ${showCookieConsentBanner ? 'pt-28 sm:pt-24 lg:pt-20' : ''}`}
      >
        {showCookieConsentBanner ? <CookieConsentBanner /> : null}
        <AffiliateReferralTracker />
        <PostHogProvider enabled={analyticsEnabled}>
          <GoogleAnalyticsProvider enabled={analyticsEnabled}>
            <PaddleProvider>
              {bannerPromo && <PromoBanner promo={bannerPromo} />}
              {children}
              {JOB_BOARD_ENABLED ? <PendingJobApplyPrompt /> : null}
            </PaddleProvider>
          </GoogleAnalyticsProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
