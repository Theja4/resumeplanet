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
  affiliate_source_code: string | null
  affiliate_source_recorded_at: string | null
  ats_scans_today: number
  ats_scans_reset_at: string
  created_at: string
}

// ─── Affiliate Program ───────────────────────────────────────────────────────

export type AffiliateReferralStatus = 'active' | 'trialing' | 'churned'
export type AffiliatePayoutStatus = 'pending' | 'paid' | 'rejected'

export interface Affiliate {
  id: string
  user_id: string
  name: string
  email: string
  discount_code: string
  paddle_discount_id?: string | null
  discount_percent: number
  commission_percent: number
  paypal_email: string | null
  created_at: string
  updated_at: string
}

export interface AffiliateReferral {
  id: string
  affiliate_id: string
  referred_user_email: string
  paddle_subscription_id: string
  plan_name: string
  status: AffiliateReferralStatus
  mrr: number
  created_at: string
  updated_at: string
}

export interface AffiliatePayout {
  id: string
  affiliate_id: string
  amount: number
  paypal_email: string
  status: AffiliatePayoutStatus
  requested_at: string
  paid_at: string | null
}

export interface AffiliateCommission {
  id: string
  affiliate_id: string
  referral_id: string | null
  paddle_transaction_id: string
  gross_amount: number
  commission_amount: number
  discount_code: string | null
  created_at: string
}

export interface AffiliateMonthlySignup {
  monthKey: string
  label: string
  signups: number
}

export interface AffiliateDashboardStats {
  totalSignups: number
  activeSubscriptions: number
  totalEarned: number
  pendingPayout: number
  monthlySignups: AffiliateMonthlySignup[]
}

export interface DashboardOverview {
  resumeCount: number
  lastScore: number | null
  hasAffiliate: boolean
}

export interface AffiliateReferralPage {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  referrals: AffiliateReferral[]
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
  startDate?: string
  endDate?: string
  graduationDate: string
  gpa: string
}

export interface SkillSection {
  title: string
  tag?: string
  skills: string[]
}

export interface CertificationItem {
  name: string
  issuer: string
  date: string
}

export interface ProjectItem {
  name: string
  description: string
  bullets?: string[]
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
  currentRole: string
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: string[]
  skillSections?: SkillSection[]
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
  builder_visibility?: BuilderVisibility | null
  ats_score?: number | null
  ai_insights_signature?: string | null
  ai_insights_cache?: unknown | null
  ai_insights_cached_at?: string | null
  original_file_url: string | null
  template_config: UniversalConfig | null
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

export type ATSRoadmapLane = 'fixable_now' | 'needs_stronger_evidence'

export interface ATSRoadmapAction {
  criterionId: string
  lane: ATSRoadmapLane
  section:
    | 'Header'
    | 'Professional Summary'
    | 'Work Experience'
    | 'Skills'
    | 'Education'
    | 'Resume Structure'
    | 'Resume-wide'
  title: string
  reason: string
  estimatedGainMin: number
  estimatedGainMax: number
  evidence: string[]
}

export interface ATSScoreRoadmap {
  currentScore: number
  targetScore: number
  gapToTarget: number
  truthfulCeiling: number
  fixablePotential: number
  blockedPotential: number
  canReachTargetNow: boolean
  fixableNow: ATSRoadmapAction[]
  evidenceBlockers: ATSRoadmapAction[]
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
  roadmap?: ATSScoreRoadmap
  industryInsight?: string
  formattingIssues?: string[]
}

// ── Rezoomed LLM Pipeline v3 types ───────────────────────────────────────────

interface SectionScore {
  score: number
  max: number
}

interface SectionScoreWithIssues extends SectionScore {
  issues: string[]
}

export interface FreeATSResult {
  ats_score: number
  section_scores: {
    contact_information: SectionScore
    section_structure: SectionScore
    formatting: SectionScore
    content_quality: SectionScore
    keyword_optimization: SectionScore
    length_density: SectionScore
  }
  detected_sections: string[]
  missing_sections: string[]
  word_count: number
  has_quantified_achievements: boolean
}

export interface BulletRewrite {
  section: string
  company_or_project: string
  original: string
  rewritten: string
  why: string
}

export interface ProATSResult {
  ats_score: number
  section_scores: {
    contact_information: SectionScoreWithIssues
    section_structure: SectionScoreWithIssues
    formatting: SectionScoreWithIssues
    content_quality: SectionScoreWithIssues
    keyword_optimization: SectionScoreWithIssues
    length_density: SectionScoreWithIssues
  }
  top_3_fixes: [string, string, string]
  detected_sections: string[]
  missing_sections: string[]
  word_count: number
  has_quantified_achievements: boolean
  action_verb_percentage: number
  bullet_rewrites: BulletRewrite[]
  summary_suggestion: string | null
  skills_section_suggestion: {
    current_skills: string[]
    missing_high_value_skills: string[]
    recommended_format: string
  }
  overall_assessment: string
}

export interface JDTailorResult {
  match_score: number
  match_tier: 'STRONG_FIT' | 'MODERATE_FIT' | 'STRETCH' | 'LONG_SHOT'
  jd_keywords: {
    matched: Array<{ keyword: string; evidence: string }>
    unmatched: Array<{ keyword: string; suggestion: string }>
  }
  tailored_summary: string
  tailored_bullets: Array<{
    section: string
    company_or_project: string
    original: string
    tailored: string
    jd_keywords_hit: string[]
  }>
  skills_reorder: {
    recommended_order: string[]
    add: string[]
    deprioritize: string[]
  }
  gaps: Array<{
    jd_requirement: string
    gap_severity: 'CRITICAL' | 'MODERATE' | 'MINOR'
    mitigation: string
  }>
  bullet_reorder: Array<{
    section: string
    company_or_project: string
    recommended_order: string[]
    reason: string
  }>
  overall_strategy: string
  shortlisting_probability: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
  honest_assessment: string
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
  uploaded_resume_text: string | null
  delivered_file_url: string | null
  created_at: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ─── Template Rendering ───────────────────────────────────────────────────────

export interface TemplateProps {
  data: ResumeData
  isEditing?: boolean
  showEmptyStateGuidance?: boolean
  highlightedSectionId?: string | null
  onFieldChange?: (path: string, value: string) => void
  sectionOrder?: string[]
  sidebarSectionOrder?: string[]
  density?: 'compressed' | 'relaxed'
  accentColor?: string
  fontFamily?: string
}

// ─── Universal Template ─────────────────────────────────────────────────────────

export type UniversalLayout = 'single-column' | 'sidebar-left' | 'sidebar-right' | 'sidebar'
export type UniversalHeaderStyle =
  | 'minimal'
  | 'banner'
  | 'sidebar-integrated'
  | 'classic'
  | 'centered'
  | 'compact'
  | 'timeless'
export type UniversalBulletStyle = 'plain' | 'timeline' | 'dash' | 'square' | 'latex'
export type UniversalSkillsStyle = 'inline' | 'badges' | 'divider' | 'stacked'
export type UniversalSectionHeadingStyle = 'rule' | 'label' | 'minimal' | 'latex-rule'
export type UniversalContactStyle = 'inline' | 'stacked'
export type UniversalDateLayout = 'right' | 'inline'
export type UniversalNameSize = 'standard' | 'large' | 'hero'

export interface UniversalConfig {
  layout: UniversalLayout // legacy sidebar values are sanitized back to single-column
  headerStyle: UniversalHeaderStyle
  bulletStyle: UniversalBulletStyle
  skillsStyle: UniversalSkillsStyle
  sectionHeadingStyle: UniversalSectionHeadingStyle
  contactStyle: UniversalContactStyle
  dateLayout: UniversalDateLayout
  nameSize: UniversalNameSize
  accentColor: string
  fontFamily: string
  density: 'compressed' | 'relaxed'
}

export const DEFAULT_UNIVERSAL_CONFIG: UniversalConfig = {
  layout: 'single-column',
  headerStyle: 'classic',
  bulletStyle: 'plain',
  skillsStyle: 'inline',
  sectionHeadingStyle: 'rule',
  contactStyle: 'inline',
  dateLayout: 'right',
  nameSize: 'large',
  accentColor: '#026d32', // Forest green preset
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  density: 'relaxed',
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

export type TailorIntensity = 'conservative' | 'balanced' | 'aggressive' | 'overboard'

export interface TailorKeywordEvidence {
  keyword: string
  evidence: string
}

export interface TailorKeywordGap {
  keyword: string
  suggestion: string
}

export interface TailorSectionFocus {
  sectionId: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'volunteer'
  priority: 'high' | 'medium' | 'low'
  title: string
  reason: string
}

export interface TailorBulletRewrite {
  sectionId: 'experience' | 'volunteer' | 'projects'
  companyOrProject: string
  original: string
  tailored: string
  keywordsHit: string[]
  rationale: string
  impact: 'high' | 'medium' | 'low'
}

export interface TailorBulletOrderPlan {
  sectionId: 'experience' | 'volunteer'
  companyOrProject: string
  orderedOriginalBullets: string[]
  reason: string
}

export interface TailorAnalysis {
  intensity: TailorIntensity
  matchScore: number
  matchTier: 'STRONG_FIT' | 'MODERATE_FIT' | 'STRETCH' | 'LONG_SHOT'
  shortlistingProbability: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
  overallStrategy: string
  honestAssessment: string
  tailoredHeadline: string
  tailoredSummary: string
  matchedKeywords: TailorKeywordEvidence[]
  missingKeywords: TailorKeywordGap[]
  skillsPlan: {
    recommendedOrder: string[]
    add: string[]
    deprioritize: string[]
    rationale: string
  }
  sectionFocus: TailorSectionFocus[]
  bulletRewrites: TailorBulletRewrite[]
  bulletOrderPlans: TailorBulletOrderPlan[]
}

// ─── Builder Visibility ───────────────────────────────────────────────────────

export interface BuilderVisibility {
  /** Top-level section visibility — key = section id */
  sections: Record<string, boolean>
  /** Sub-item visibility within complex sections — index matches array index in ResumeData */
  items: {
    [key: string]: boolean[] | undefined
  }
  /** Section order — array of section ids determines render order in primary column */
  sectionOrder: string[]
  /** Sidebar section order — array of section ids determines render order in sidebar column */
  sidebarSectionOrder?: string[]
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
    'summary', 'experience', 'education',
    'projects', 'volunteer'
  ],
  sidebarSectionOrder: [
    'skills', 'certifications', 'languages',
    'interests', 'awards', 'publications', 'references'
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
  currentRole: '',
  experience: [],
  education: [],
  skills: [],
  skillSections: [],
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

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobSourceProvider = 'greenhouse' | 'lever' | 'remotive' | 'manual'
export type JobRemoteType = 'remote' | 'hybrid' | 'on_site' | 'unknown'
export type TrackedJobStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'archived'

export interface Job {
  id: string
  source_provider: JobSourceProvider
  source_key: string
  external_id: string
  slug: string
  title: string
  company_name: string
  location_text: string
  remote_type: JobRemoteType
  employment_type: string | null
  salary_text: string | null
  description_text: string
  apply_url: string
  source_url: string | null
  company_logo_url: string | null
  category: string | null
  tags: string[]
  posted_at: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  last_seen_at: string
  created_at: string
  updated_at: string
  tracked_status?: TrackedJobStatus | null
}

export interface TrackedJob {
  id: string
  user_id: string
  job_id: string
  status: TrackedJobStatus
  title_override?: string | null
  company_name_override?: string | null
  location_text_override?: string | null
  applied_at: string | null
  saved_on: string | null
  salary_text: string | null
  job_description: string | null
  excitement_rating: number | null
  notes: string | null
  created_at: string
  updated_at: string
  job?: Job | null
}
