import { getOrganizationSameAsLinks, SITE_NAME } from '@/lib/site'
import { getAbsoluteUrl, toJsonLd } from '@/lib/seo'

export default function Head() {
  const siteUrl = getAbsoluteUrl('/')
  const organizationSameAs = getOrganizationSameAsLinks()
  const organizationJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: getAbsoluteUrl('/icon.png'),
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

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: 'en',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }}
      />
    </>
  )
}
