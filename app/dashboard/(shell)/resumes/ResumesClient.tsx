'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [resumes, setResumes] = useState<Resume[]>(initialResumes)
  const [showPaywall, setShowPaywall] = useState(false)

  function handleUploadAttempt() {
    if (plan === 'free' && resumes.length >= 1) {
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {resumes.length === 0
              ? 'Upload a resume to get started'
              : `${resumes.length} resume${resumes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Upload zone — blocked for free plan with 1+ resumes */}
      <div
        onClick={() => {
          if (plan === 'free' && resumes.length >= 1) {
            setShowPaywall(true)
          }
        }}
      >
        <UploadZone
          onUploadSuccess={handleUploadSuccess}
          disabled={plan === 'free' && resumes.length >= 1}
        />
      </div>

      {/* Resume grid */}
      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload your first resume to get started. We support PDF and DOCX files up to 5MB."
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              latestScore={latestScores[resume.id]}
              onDelete={() => handleDelete(resume.id)}
              onRename={(title) => handleRename(resume.id, title)}
            />
          ))}
        </div>
      )}

      {/* Ad banner — free users only */}
      {resumes.length > 0 && <AdBanner size="rectangle" className="mt-6" />}

      <PaywallModal />
    </div>
  )
}
