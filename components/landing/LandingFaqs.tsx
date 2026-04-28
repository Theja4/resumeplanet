'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

const FAQS = [
  {
    question: 'How does the ATS Scanner improve my interview chances?',
    answer:
      'Most companies use Applicant Tracking Systems (ATS) to filter resumes. Our scanner "X-rays" your file to find formatting traps, hidden tables, and missing keywords that cause auto-rejections. By fixing these before you apply, you ensure your resume actually reaches a human recruiter.',
  },
  {
    question: 'What is a Match Score and how should I use it?',
    answer:
      'The Match Score is a real-time analysis of how well your resume aligns with a specific job description. We look for technical skills, soft skills, and industry keywords. Aim for a score of 85% or higher to be considered a top-tier candidate for that specific role.',
  },
  {
    question: 'How does the "Tailor Mode" feature work?',
    answer:
      'Tailor Mode is our most powerful tool. Instead of manually editing your resume for every job, our AI analyzes the job description and suggests specific bullet point rewrites and summary adjustments. It helps you speak the recruiter\'s language in seconds, not hours.',
  },
  {
    question: 'Can I export my resume to both PDF and Word (DOCX)?',
    answer:
      'Yes. While our recruiter-grade PDF export ensures your layout stays pixel-perfect, we also offer editable DOCX (Word) exports for Pro users. Both formats are fully optimized for ATS readability and modern hiring workflows.',
  },
  {
    question: 'Is my personal data secure and private?',
    answer:
      'Absolutely. Your privacy is our priority. We do not sell your data to third parties or recruiters. Your resumes are stored securely and only used to provide you with AI-powered insights and tailoring suggestions.',
  },
  {
    question: 'Can I import my existing resume or LinkedIn profile?',
    answer:
      'Yes! You don\'t have to start from scratch. You can upload any existing PDF/DOCX resume or even a LinkedIn export. Our parser will instantly structure your experience into our builder so you can start optimizing immediately.',
  },
  {
    question: 'What is the difference between the Free and Pro plans?',
    answer:
      'Our Free plan includes basic resume building and daily ATS scans. The Pro plan unlocks our most advanced features: Unlimited Resume Tailoring, Match Scores, DOCX exports, and access to our premium AI models for more nuanced writing suggestions.',
  },
  {
    question: 'How do I optimize my PDF metadata for ATS?',
    answer:
      'Many users don\'t realize that PDFs contain hidden metadata that can conflict with your resume content. Rezoomed automatically cleans and optimizes your file\'s metadata (Title, Author, Subject) during export to ensure ATS systems don\'t get confused by "old" file info.',
  },
] as const

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="group rounded-[1.75rem] border border-zinc-100 bg-white shadow-[0_12px_30px_rgba(18,24,21,0.04)] transition-all hover:border-[#A3FFB3] hover:shadow-[0_18px_40px_rgba(2,109,50,0.08)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 md:p-7 cursor-pointer flex items-center justify-between"
      >
        <span className="text-lg md:text-xl font-black tracking-tight text-zinc-950 pr-8">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[#00a84d] flex-shrink-0"
        >
          <Plus size={28} strokeWidth={2.5} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-6 md:px-7 md:pb-7 -mt-1">
              <div className="h-px w-full bg-zinc-100 mb-5" />
              <p className="text-sm md:text-base leading-7 text-zinc-600">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingFaqs() {
  return (
    <section className="bg-[#f8faf9] px-6 py-24 md:py-28">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-3 text-center md:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#00a84d]">Support & Insights</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.06] text-zinc-950">
            Quick <span className="landing-italic-safe italic bg-gradient-to-r from-[#00a84d] to-[#026d32] bg-clip-text text-transparent">answers.</span>
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map(faq => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  )
}
