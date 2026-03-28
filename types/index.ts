// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  ats_scans_today: number
  ats_scans_reset_at: string
  created_at: string
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export interface ExperienceItem {
  company: string
  title: string
  location: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface EducationItem {
  institution: string
  degree: string
  field: string
  graduationDate: string
  gpa: string
}

export interface CertificationItem {
  name: string
  issuer: string
  date: string
}

export interface ProjectItem {
  name: string
  description: string
  technologies: string[]
}

export interface AwardItem {
  title: string
  issuer: string
  date: string
}

export interface PublicationItem {
  title: string
  publisher: string
  date: string
}

export interface ResumeData {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: string[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
  languages: string[]
  volunteer: ExperienceItem[]
  interests: string[]
  awards: AwardItem[]
  publications: PublicationItem[]
  references: string[]
}

export interface Resume {
  id: string
  user_id: string
  title: string
  raw_text: string | null
  parsed_data: ResumeData | null
  original_file_url: string | null
  created_at: string
  updated_at: string
}

// ─── ATS ──────────────────────────────────────────────────────────────────────

export type ATSScanTier = 'basic' | 'advanced'

export interface ATSSuggestion {
  category: 'keywords' | 'formatting' | 'experience' | 'education' | 'skills' | 'summary'
  severity: 'high' | 'medium' | 'low'
  issue: string
  fix: string
  example?: string  // only present in advanced scans
}

export interface ATSResult {
  score: number
  tier: ATSScanTier
  // Basic and advanced
  missingKeywords: string[]
  presentKeywords: string[]
  suggestions: ATSSuggestion[]
  summary: string
  // Advanced only
  scoreBreakdown?: {
    keywordMatch: number
    formatting: number
    relevance: number
    completeness: number
    keywordDensity: number
  }
  keywordAnalysis?: {
    mustHave: string[]
    niceToHave: string[]
    overused: string[]
  }
  industryInsight?: string
  formattingIssues?: string[]
}

export interface ATSScore {
  id: string
  user_id: string
  resume_id: string | null
  job_description: string | null
  score: number
  missing_keywords: string[]
  suggestions: ATSSuggestion[]
  optimised_resume_text: string | null
  scan_tier: ATSScanTier
  created_at: string
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string
  user_id: string
  resume_id: string | null
  stripe_payment_intent_id: string | null
  stripe_session_id: string | null
  amount: number
  status: 'pending' | 'paid' | 'in_progress' | 'delivered'
  job_title: string | null
  job_description: string | null
  additional_notes: string | null
  delivered_file_url: string | null
  created_at: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ─── Templates ────────────────────────────────────────────────────────────────

export type TemplateId =
  | 'modern-minimal'
  | 'executive-classic'
  | 'creative-bold'
  | 'graduate-entry'
  | 'technical-pro'

export interface TemplateProps {
  data: ResumeData
  isEditing?: boolean
  onFieldChange?: (path: string, value: string) => void
}

export interface TemplateConfig {
  id: TemplateId
  name: string
  description: string
  targetRole: string
  accentColor: string
  isPremium?: boolean
  isNew?: boolean
  tags?: string[]
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export interface BuilderField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'email' | 'phone'
  placeholder?: string
  maxLength?: number
}

export interface BuilderSection {
  id: string
  label: string
  icon: string
  isRequired: boolean
  fields?: BuilderField[]
}

export type BuilderMode = 'builder' | 'tailor'

export interface TailorAnalysis {
  matchScore: number
  missingKeywords: string[]
  suggestions: { sectionId: string; hint: string }[]
}
