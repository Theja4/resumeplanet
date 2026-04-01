'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import UploadZone from '@/components/resumes/UploadZone'
import ResumeCard from '@/components/resumes/ResumeCard'
import EmptyState from '@/components/shared/EmptyState'
import PaywallModal from '@/components/shared/PaywallModal'
import AdBanner from '@/components/shared/AdBanner'
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
  const [resumes, setResumes] = useState<Resume[]>(initialResumes)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    if (searchParams.get('status') === 'limit-reached') {
      setShowPaywall(true)
      // Clean up the URL to prevent showing the popup again on refresh
      router.replace('/dashboard/resumes')
    }
  }, [searchParams, router])

  function handleUploadAttempt() {
    if (plan === 'free' && resumes.length >= 3) {
      setShowPaywall(true)
      return false
    }
    return true
  }

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
      {/* Editorial Header - Only visible on desktop if needed, otherwise rely on the layout header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-1">
            Your Library
          </h3>
          <p className="text-4xl font-black text-on-surface tracking-tight">
            Recent Resumes
          </p>
        </div>
      </div>

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
          description="Upload your first resume to get started. We support PDF and DOCX files up to 5MB."
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
                <div key="cta-card" className="group bg-primary-container p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-lg shadow-primary/5">
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
                    onClick={() => router.push('/dashboard/ats-checker')}
                    className="w-full py-3 bg-on-primary-container text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md shadow-primary/20"
                  >
                    Try AI Tailoring
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ad banner — free users only */}
      {resumes.length > 0 && <AdBanner size="rectangle" className="mt-12 opacity-80" />}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="unlimited resume uploads"
        reason={<span>Free users can <strong>save up to 3 resumes</strong>. Please remove an existing resume or upgrade to Pro to create more.</span>}
      />
    </div>
  )
}
