'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import UploadZone from '@/components/resumes/UploadZone'
import ResumeCard from '@/components/resumes/ResumeCard'
import EmptyState from '@/components/shared/EmptyState'
import PaywallModal from '@/components/shared/PaywallModal'
import AdBanner from '@/components/shared/AdBanner'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { ADS_ENABLED } from '@/lib/ads'
import { MAX_RESUME_UPLOAD_LABEL } from '@/lib/uploadLimits'
import { deleteResume, renameResume } from './actions'
import type { Resume, Profile } from '@/types'

interface ResumesClientProps {
  initialResumes: Resume[]
  latestScores: Record<string, number>
  plan: Profile['plan']
}

export default function ResumesClient({
  initialResumes,
  latestScores,
  plan,
}: ResumesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const limitReached = searchParams.get('status') === 'limit-reached'
  const [resumes, setResumes] = useState<Resume[]>(initialResumes)
  const [showPaywall, setShowPaywall] = useState(limitReached)

  useEffect(() => {
    if (limitReached) {
      // Clean up the URL to prevent showing the popup again on refresh
      router.replace('/dashboard/resumes')
    }
  }, [limitReached, router])

  function handleUploadSuccess(newResume: Resume) {
    setResumes((prev) => [newResume, ...prev])
    router.push(`/dashboard/builder/${newResume.id}`)
  }

  async function handleDelete(id: string) {
    setResumes((prev) => prev.filter((r) => r.id !== id))
    await deleteResume(id)
  }

  async function handleRename(id: string, title: string) {
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)))
    await renameResume(id, title)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <DashboardPageIntro
        kicker="Resume Library"
        title="Every version, one polished system."
        description="Upload new resumes, revisit old drafts, and move straight into ATS analysis or the builder without losing the calmer visual language from login and landing."
        aside={
          <div className="space-y-2.5">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${plan === 'pro' ? 'text-primary' : 'text-primary/80'}`}>
              {plan === 'pro' ? 'Pro workspace' : 'Free workspace'}
            </p>
            <p className="text-2xl font-black tracking-tight text-on-background">
              {resumes.length} saved resume{resumes.length === 1 ? '' : 's'}
            </p>
            <p className="text-sm leading-6 text-on-surface-variant">
              {plan === 'pro'
                ? 'Store unlimited tailored drafts and jump between versions freely.'
                : 'Free plans can save up to 3 resumes before the library locks.'}
            </p>
          </div>
        }
      />

      {/* Hero Upload Section */}
      <div
        onClick={() => {
          if (plan === 'free' && resumes.length >= 3) {
            setShowPaywall(true)
          }
        }}
      >
        <UploadZone
          onUploadSuccess={handleUploadSuccess}
          disabled={plan === 'free' && resumes.length >= 3}
        />
      </div>

      {/* Resume Grid */}
      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description={`Upload your first resume to get started. We support PDF and DOCX files up to ${MAX_RESUME_UPLOAD_LABEL}.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumes.map((resume, index) => (
            <div key={resume.id} className="contents">
              <ResumeCard
                resume={resume}
                latestScore={latestScores[resume.id]}
                onDelete={() => handleDelete(resume.id)}
                onRename={(title) => handleRename(resume.id, title)}
              />
              {/* Insert Asymmetric CTA Card after the second item */}
              {index === 1 && (
                <DashboardSurface key="cta-card" variant="accent" className="dashboard-card-hover group flex flex-col justify-between p-6">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <span className="bg-white/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-on-primary-container mb-4 inline-block">
                      Pro Tip
                    </span>
                    <h4 className="text-xl font-extrabold text-on-primary-container leading-tight mb-4">
                      Tailor your resume for every job application.
                    </h4>
                    <p className="text-on-primary-fixed-variant/70 text-sm font-medium mb-6">
                      Our AI analysis shows tailored resumes have a 4.5x higher interview rate.
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/match-score')}
                    className="w-full rounded-full bg-zinc-950 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900 active:scale-95"
                  >
                    Try AI Tailoring
                  </button>
                </DashboardSurface>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ad banner — free users only */}
      {ADS_ENABLED && resumes.length > 0 ? <AdBanner size="rectangle" className="mt-12 opacity-80" /> : null}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="unlimited resume uploads"
        reason={<span>Free users can <strong>save up to 3 resumes</strong>. Please remove an existing resume or upgrade to Pro to create more.</span>}
      />
    </div>
  )
}
