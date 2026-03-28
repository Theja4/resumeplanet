'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import type { Resume } from '@/types'

const STEPS = ['Resume', 'Job Details', 'Notes', 'Review']

const INDUSTRIES = [
  'Technology', 'Finance', 'Consulting', 'Marketing',
  'Healthcare', 'Legal', 'Education', 'Engineering',
  'Operations', 'Sales', 'Design', 'Other',
]

const EXPERIENCE_LEVELS = [
  '0–2 years', '3–5 years', '6–10 years', '10+ years',
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
            i + 1 < current
              ? 'bg-indigo-600 text-white'
              : i + 1 === current
              ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {i + 1 < current ? <Check size={13} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${
            i + 1 === current ? 'text-indigo-700' : 'text-gray-400'
          }`}>{STEPS[i]}</span>
          {i < total - 1 && <div className="w-8 h-px bg-gray-200" />}
        </div>
      ))}
    </div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingResumes, setIsLoadingResumes] = useState(true)

  useEffect(() => {
    async function loadResumes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('resumes')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      setResumes((data ?? []) as Resume[])
      setIsLoadingResumes(false)
    }
    loadResumes()
  }, [supabase])

  const selectedResume = resumes.find(r => r.id === selectedResumeId)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'order',
          resumeId: selectedResumeId,
          jobTitle,
          jobDescription: jobDescription || null,
          additionalNotes: additionalNotes || null,
          industry,
          yearsExp,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl
      } else {
        setError(json.error ?? 'Failed to start checkout. Please try again.')
        setIsSubmitting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-gray-700">
          ← My Orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Order Professional Resume</h1>
        <p className="text-sm text-gray-500 mt-1">A professional writer rewrites your resume in 48 hours.</p>
      </div>

      <StepIndicator current={step} total={4} />

      {/* Step 1: Select Resume */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Which resume should we rewrite?</h2>
          {isLoadingResumes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-3">You haven&apos;t uploaded a resume yet.</p>
              <Link
                href="/dashboard/resumes"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Upload a resume →
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {resumes.map(resume => (
                <button
                  key={resume.id}
                  onClick={() => setSelectedResumeId(resume.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    selectedResumeId === resume.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{resume.title || 'Untitled Resume'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Updated {new Date(resume.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {selectedResumeId === resume.id && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <Check size={13} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedResumeId}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Job Details */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Tell us about the role</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Job title <span className="text-red-500">*</span>
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Job description <span className="text-gray-400 text-xs font-normal">(optional but recommended)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste the job posting here for best results. Our writer will tailor your resume to match the requirements."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Experience <span className="text-red-500">*</span>
              </label>
              <select
                value={yearsExp}
                onChange={e => setYearsExp(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Select level</option>
                {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!jobTitle || !industry || !yearsExp}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Additional Notes */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Anything else we should know?</h2>
          <textarea
            value={additionalNotes}
            onChange={e => setAdditionalNotes(e.target.value.slice(0, 500))}
            rows={8}
            placeholder={`Mention anything specific:\n• Career change from another industry?\n• Gap in employment to explain?\n• Specific companies you're targeting?\n• Seniority level you're aiming for?`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{additionalNotes.length}/500</p>
          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review your order</h2>

          {/* Summary */}
          <div className="border border-gray-200 rounded-xl p-5 mb-4 space-y-2">
            <Row label="Resume" value={selectedResume?.title || 'Untitled'} />
            <Row label="Target role" value={jobTitle} />
            <Row label="Industry" value={industry} />
            <Row label="Experience" value={yearsExp} />
            {additionalNotes && (
              <Row label="Notes" value={additionalNotes.length > 80 ? additionalNotes.slice(0, 80) + '…' : additionalNotes} />
            )}
          </div>

          {/* What's included */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">What&apos;s included</p>
            {[
              'Professional resume writer (former recruiter)',
              'ATS-optimised formatting',
              'Tailored to your target role',
              'Delivered within 48 hours',
              'One round of revisions included',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                <Check size={14} className="text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-gray-900">$29.99</p>
            <p className="text-sm text-gray-400 mt-1">One-time payment · No subscription</p>
            <p className="text-sm text-amber-600 font-medium mt-1">⏱ 48-hour delivery</p>
          </div>

          {error && <p className="text-sm text-red-600 text-center mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Redirecting to Stripe…
              </span>
            ) : (
              'Proceed to payment →'
            )}
          </button>

          <button onClick={() => setStep(3)} className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}
