import type { Metadata } from 'next'
import LogoMarqueeSection from '@/components/landing/LogoMarquee'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import LandingHeroV2 from '@/components/landing/LandingHeroV2'
import LandingBento from '@/components/landing/LandingBento'
import LandingStats from '@/components/landing/LandingStats'
import LandingWorkflow from '@/components/landing/LandingWorkflow'
import LandingFinalCTA from '@/components/landing/LandingFinalCTA'
import LandingTestimonials from '@/components/landing/LandingTestimonials'
import LandingFaqs from '@/components/landing/LandingFaqs'
import { buildPublicMetadata, getAbsoluteUrl, toJsonLd } from '@/lib/seo'

export const metadata: Metadata = buildPublicMetadata({
  title: 'Free AI Resume Builder & ATS Checker | Rezoomed',
  description:
    'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
  path: '/',
  keywords: [
    'ai resume builder',
    'ats checker',
    'resume optimization',
    'ats resume checker',
    'resume builder',
    'resume match score',
    'job description match',
    'metadata enhancer',
    'job matching',
    'resume tailoring',
    'resume keyword optimization',
    'Rezoomed',
  ],
})

export default async function LandingPage() {
  const siteUrl = getAbsoluteUrl('/')
  
  // Define FAQ JSON-LD data for SEO (Server Side)
  const FAQS_DATA = [
    {
      question: 'How does the ATS Scanner improve my interview chances?',
      answer: 'Most companies use Applicant Tracking Systems (ATS) to filter resumes. Our scanner "X-rays" your file to find formatting traps, hidden tables, and missing keywords that cause auto-rejections. By fixing these before you apply, you ensure your resume actually reaches a human recruiter.',
    },
    {
      question: 'What is a Match Score and how should I use it?',
      answer: 'The Match Score is a real-time analysis of how well your resume aligns with a specific job description. We look for technical skills, soft skills, and industry keywords. Aim for a score of 85% or higher to be considered a top-tier candidate for that specific role.',
    },
    {
      question: 'How does the "Tailor Mode" feature work?',
      answer: 'Tailor Mode is our most powerful tool. Instead of manually editing your resume for every job, our AI analyzes the job description and suggests specific bullet point rewrites and summary adjustments. It helps you speak the recruiter\'s language in seconds, not hours.',
    },
    {
      question: 'Can I export my resume to both PDF and Word (DOCX)?',
      answer: 'Yes. While our recruiter-grade PDF export ensures your layout stays pixel-perfect, we also offer editable DOCX (Word) exports for Pro users. Both formats are fully optimized for ATS readability and modern hiring workflows.',
    },
    {
      question: 'Is my personal data secure and private?',
      answer: 'Absolutely. Your privacy is our priority. We do not sell your data to third parties or recruiters. Your resumes are stored securely and only used to provide you with AI-powered insights and tailoring suggestions.',
    },
    {
      question: 'Can I import my existing resume or LinkedIn profile?',
      answer: 'Yes! You don\'t have to start from scratch. You can upload any existing PDF/DOCX resume or even a LinkedIn export. Our parser will instantly structure your experience into our builder so you can start optimizing immediately.',
    },
    {
      question: 'What is the difference between the Free and Pro plans?',
      answer: 'Our Free plan includes basic resume building and daily ATS scans. The Pro plan unlocks our most advanced features: Unlimited Resume Tailoring, Match Scores, DOCX exports, and access to our premium AI models for more nuanced writing suggestions.',
    },
    {
      question: 'How do I optimize my PDF metadata for ATS?',
      answer: 'Many users don\'t realize that PDFs contain hidden metadata that can conflict with your resume content. Rezoomed automatically cleans and optimizes your file\'s metadata (Title, Author, Subject) during export to ensure ATS systems don\'t get confused by "old" file info.',
    },
  ]

  const homepageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${siteUrl}/#webpage`,
        url: siteUrl,
        name: 'Free AI Resume Builder & ATS Checker | Rezoomed',
        description:
          'Build ATS-friendly resumes, check ATS score, match job descriptions, and tailor applications faster with Rezoomed.',
        isPartOf: {
          '@id': `${siteUrl}/#website`,
        },
        about: {
          '@id': `${siteUrl}/#software`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: getAbsoluteUrl('/product-hero-v2.jpg'),
          width: 1792,
          height: 836,
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#software`,
        name: 'Rezoomed',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description:
          'AI resume builder, ATS checker, match score, and resume tailoring platform for job seekers.',
        url: siteUrl,
        image: getAbsoluteUrl('/product-hero-v2.jpg'),
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        brand: {
          '@type': 'Brand',
          name: 'Rezoomed',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: getAbsoluteUrl('/pricing'),
        },
        featureList: [
          'AI resume builder',
          'ATS checker',
          'Resume match score',
          'Resume tailoring',
          'PDF metadata enhancer',
          'Cover letter generator',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: FAQS_DATA.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <div className="bg-white text-zinc-950 font-body selection:bg-[#A3FFB3] selection:text-[#022c14]">
      <PublicSiteHeader active="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(homepageJsonLd) }}
      />

      <main className="pt-16">
        <LandingHeroV2 />

        <LogoMarqueeSection />

        <LandingBento />

        <LandingStats />

        <LandingWorkflow />

        <LandingTestimonials />

        <LandingFaqs />

        <LandingFinalCTA />
      </main>

      <PublicSiteFooter />
    </div>
  )
}
