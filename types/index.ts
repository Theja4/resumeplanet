// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  subscription_status: string | null
  subscription_interval: 'monthly' | 'annual' | null
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
  bulletVisibility?: boolean[]
  summary?: string
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

export type CustomSectionType = 'text' | 'tags' | 'complex'

export interface CustomSection {
  id: string
  title: string
  type: CustomSectionType
  text?: string
  tags?: string[]
  items?: ExperienceItem[]
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
  customSections?: CustomSection[]
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
  paddle_transaction_id: string | null
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
  sectionOrder?: string[]
  density?: 'compressed' | 'relaxed'
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

// ─── Builder Visibility ───────────────────────────────────────────────────────

export interface BuilderVisibility {
  /** Top-level section visibility — key = section id */
  sections: Record<string, boolean>
  /** Sub-item visibility within complex sections — index matches array index in ResumeData */
  items: {
    [key: string]: boolean[] | undefined
  }
  /** Section order — array of section ids determines render order in template */
  sectionOrder: string[]
  /** Layout spacing property enabling smooth fluid transition between compressed/relaxed templates */
  density?: 'compressed' | 'relaxed'
}

export const DEFAULT_VISIBILITY: BuilderVisibility = {
  sections: {
    contact: true,
    summary: true,
    skills: true,
    languages: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    volunteer: true,
    interests: true,
    awards: true,
    publications: true,
    references: true,
  },
  items: {
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  },
  sectionOrder: [
    'contact', 'summary', 'experience', 'education', 'skills',
    'projects', 'certifications', 'volunteer', 'languages',
    'interests', 'awards', 'publications', 'references',
  ],
  density: 'relaxed',
}

export const EMPTY_RESUME_DATA: ResumeData = {
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  languages: [],
  volunteer: [],
  interests: [],
  awards: [],
  publications: [],
  references: [],
  customSections: [],
}
