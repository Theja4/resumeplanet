import type { PostHog, CaptureOptions } from 'posthog-js'
import { COOKIE_CONSENT_COOKIE, parseCookieConsentPreference } from '@/lib/cookie-consent'

export type AuthMethod = 'email' | 'google' | 'github'
export type AtsTier = 'basic' | 'advanced'
export type BuilderSource = 'upload' | 'scratch' | 'ats_result'
export type DownloadFormat = 'pdf' | 'docx'
export type CheckoutProduct = 'pro_subscription' | 'writing_service'
export type BlogTrafficSource = 'organic' | 'social' | 'direct' | 'email'
export type BlogCtaType = 'inline' | 'bottom' | 'sidebar' | 'sticky_banner'
export type BlogScrollDepth = 25 | 50 | 75 | 100
export type SharePlatform = 'twitter' | 'linkedin' | 'facebook' | 'copy_link'

export interface AnalyticsIdentifyTraits {
  email?: string
  fullName?: string | null
  plan?: 'free' | 'pro'
  signupDate?: string
}

export interface AnalyticsAttribution {
  ref?: string
  slug?: string
  cta?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  landingPath?: string
  referrer?: string
  capturedAt?: string
}

export interface AnalyticsEventMap {
  page_viewed: { path: string; referrer?: string }
  signup_completed: { method: AuthMethod }
  login_completed: { method: string }
  resume_uploaded: { fileSize: number; pageCount: number; fileType: string }
  resume_parse_completed: { sectionCount: number; durationMs: number }
  resume_parse_failed: { error: string }
  ats_score_requested: { tier: AtsTier }
  ats_score_viewed: { tier: AtsTier; score: number }
  ats_score_upgrade_prompt_shown: { currentScore: number; location: string }
  ats_score_upgrade_prompt_clicked: { currentScore: number }
  builder_opened: { templateId: string; source: BuilderSource }
  builder_section_edited: {
    sectionType: string
    action: 'edit' | 'reorder' | 'toggle_visibility' | 'add' | 'delete'
  }
  builder_section_time_spent: { sectionType: string; durationMs: number }
  builder_template_changed: { fromTemplateId: string; toTemplateId: string }
  builder_preview_opened: { templateId: string }
  builder_download_clicked: { templateId: string; format: DownloadFormat }
  builder_download_completed: { templateId: string; format: string }
  builder_download_failed: { templateId: string; error: string }
  builder_session_ended: {
    durationMs: number
    sectionsEdited: number
    templateId: string
    downloaded: boolean
  }
  builder_undo_redo_used: { action: 'undo' | 'redo' }
  builder_drag_reorder: { sectionType: string; fromIndex: number; toIndex: number }
  builder_visibility_toggled: { sectionType: string; visible: boolean }
  builder_sub_section_editor_opened: { sectionType: string; subSectionId: string }
  builder_idle_detected: { idleDurationMs: number; lastActiveSection: string }
  template_selected: { templateId: string; source: 'gallery' | 'builder' }
  template_gallery_viewed: Record<string, never>
  template_gallery_scrolled: { templatesViewed: number; totalTemplates: number }
  pricing_page_viewed: { source: string }
  checkout_started: { product: CheckoutProduct; price: number; discountCode?: string }
  checkout_completed: { product: string; revenue: number; discountCode?: string }
  checkout_abandoned: { product: string; step: string }
  upgrade_prompt_shown: { location: string; variant?: string }
  upgrade_prompt_clicked: { location: string }
  upgrade_prompt_dismissed: { location: string }
  exit_intent_modal_shown: { page: string; promoCode?: string }
  exit_intent_modal_converted: { promoCode: string }
  exit_intent_modal_dismissed: { page: string }
  blog_post_viewed: {
    slug: string
    title: string
    category?: string
    readTimeMinutes: number
    source: BlogTrafficSource
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
  }
  blog_post_scroll_depth: { slug: string; depth: BlogScrollDepth }
  blog_post_read_completed: { slug: string; actualReadTimeSeconds: number; readTimeMinutes: number }
  blog_cta_shown: { slug: string; ctaType: BlogCtaType; ctaText: string; position: number }
  blog_cta_clicked: { slug: string; ctaType: string; ctaText: string; destination: string }
  blog_to_signup: { slug: string; ctaType: string }
  blog_to_upload: { slug: string; ctaType: string }
  blog_to_pricing: { slug: string; ctaType: string }
  blog_share_clicked: { slug: string; platform: SharePlatform }
  blog_related_post_clicked: { fromSlug: string; toSlug: string }
}

export type AnalyticsEventName = keyof AnalyticsEventMap
export type AnalyticsCaptureOptions = Pick<CaptureOptions, 'transport'>

export const ANALYTICS_ATTRIBUTION_COOKIE = 'rezoomed_analytics_attribution'
export const POSTHOG_DISTINCT_ID_COOKIE = 'rezoomed_posthog_distinct_id'
export const AUTH_INTENT_STORAGE_KEY = 'rezoomed_auth_intent'
export const CHECKOUT_CONTEXT_STORAGE_KEY = 'rezoomed_checkout_context'

const SESSION_COOKIE_ATTRIBUTES = '; path=/; SameSite=Lax'

let posthogPromise: Promise<{ default: PostHog }> | null = null

type SearchParamsLike = {
  get(name: string): string | null
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function isLocalAnalyticsDisabled() {
  if (!isBrowser()) return false
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS === 'true') return false

  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

function isAnalyticsAllowed() {
  if (!isBrowser()) return false
  if (isLocalAnalyticsDisabled()) return false

  const consent = parseCookieConsentPreference(readCookie(COOKIE_CONSENT_COOKIE))
  if (consent === 'all') return true
  if (consent === 'essential') return false

  return document.documentElement.dataset.analyticsDefault === 'granted'
}

function readCookie(name: string) {
  if (!isBrowser()) return null
  const prefix = `${name}=`
  const match = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(prefix))

  if (!match) return null
  return decodeURIComponent(match.slice(prefix.length))
}

function writeSessionCookie(name: string, value: string | null) {
  if (!isBrowser()) return

  if (value === null) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${SESSION_COOKIE_ATTRIBUTES}`
    return
  }

  document.cookie = `${name}=${encodeURIComponent(value)}${SESSION_COOKIE_ATTRIBUTES}`
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function hasAttributionFields(attribution: AnalyticsAttribution) {
  return Boolean(
    attribution.ref ||
      attribution.slug ||
      attribution.cta ||
      attribution.utmSource ||
      attribution.utmMedium ||
      attribution.utmCampaign
  )
}

async function getPostHogInstance() {
  if (!isBrowser()) return null

  posthogPromise ??= import('posthog-js')

  try {
    const importedModule = await posthogPromise
    return importedModule.default
  } catch {
    return null
  }
}

function queueBrowserAnalytics(
  callback: (posthog: PostHog) => void
) {
  if (!isBrowser() || !isAnalyticsAllowed()) return

  void getPostHogInstance()
    .then(posthog => {
      if (!posthog) return
      try {
        callback(posthog)
      } catch {
        // Analytics failures must never break the product flow.
      }
    })
    .catch(() => {
      // Analytics failures must never break the product flow.
    })
}

function queueGoogleAnalytics(callback: (gtag: NonNullable<Window['gtag']>) => void) {
  if (!isBrowser() || !isAnalyticsAllowed()) return
  if (typeof window.gtag !== 'function') return

  try {
    callback(window.gtag)
  } catch {
    // Analytics failures must never break the product flow.
  }
}

function captureEvent<E extends AnalyticsEventName>(
  event: E,
  properties: AnalyticsEventMap[E],
  options?: AnalyticsCaptureOptions
) {
  queueBrowserAnalytics(posthog => {
    posthog.capture(event, properties, options)
  })

  queueGoogleAnalytics(gtag => {
    gtag('event', event, properties as Record<string, unknown>)
  })
}

function createCaptureMethod<E extends AnalyticsEventName>(event: E) {
  return (properties: AnalyticsEventMap[E], options?: AnalyticsCaptureOptions) =>
    captureEvent(event, properties, options)
}

function captureNativePageview(properties: AnalyticsEventMap['page_viewed']) {
  queueBrowserAnalytics(posthog => {
    posthog.capture('$pageview', {
      path: properties.path,
      referrer: properties.referrer,
      $current_url: window.location.href,
    })
  })

  queueGoogleAnalytics(gtag => {
    gtag('event', 'page_view', {
      page_path: properties.path,
      page_location: window.location.href,
      page_referrer: properties.referrer,
    })
  })
}

export function readAnalyticsAttribution() {
  if (!isAnalyticsAllowed()) return null
  return safeParseJson<AnalyticsAttribution>(readCookie(ANALYTICS_ATTRIBUTION_COOKIE))
}

export function clearAnalyticsAttribution() {
  writeSessionCookie(ANALYTICS_ATTRIBUTION_COOKIE, null)
}

export function readPostHogDistinctIdFromCookie() {
  if (!isAnalyticsAllowed()) return null
  return readCookie(POSTHOG_DISTINCT_ID_COOKIE)
}

export function syncDistinctIdCookie(distinctId: string | null | undefined) {
  if (!isAnalyticsAllowed()) {
    writeSessionCookie(POSTHOG_DISTINCT_ID_COOKIE, null)
    return
  }

  if (!distinctId) {
    writeSessionCookie(POSTHOG_DISTINCT_ID_COOKIE, null)
    return
  }

  writeSessionCookie(POSTHOG_DISTINCT_ID_COOKIE, distinctId)
}

export function setAuthIntent(intent: { mode: 'login' | 'register'; method: AuthMethod }) {
  if (!isBrowser() || !isAnalyticsAllowed()) return

  window.sessionStorage.setItem(
    AUTH_INTENT_STORAGE_KEY,
    JSON.stringify({
      ...intent,
      capturedAt: new Date().toISOString(),
    })
  )
}

export function readAuthIntent() {
  if (!isBrowser() || !isAnalyticsAllowed()) return null
  return safeParseJson<{ mode: 'login' | 'register'; method: AuthMethod; capturedAt?: string }>(
    window.sessionStorage.getItem(AUTH_INTENT_STORAGE_KEY)
  )
}

export function clearAuthIntent() {
  if (!isBrowser()) return
  window.sessionStorage.removeItem(AUTH_INTENT_STORAGE_KEY)
}

export function setCheckoutContext(context: {
  product: CheckoutProduct
  price: number
  discountCode?: string
  step?: string
}) {
  if (!isBrowser() || !isAnalyticsAllowed()) return

  window.sessionStorage.setItem(
    CHECKOUT_CONTEXT_STORAGE_KEY,
    JSON.stringify({
      ...context,
      startedAt: new Date().toISOString(),
    })
  )
}

export function readCheckoutContext() {
  if (!isBrowser() || !isAnalyticsAllowed()) return null
  return safeParseJson<{
    product: CheckoutProduct
    price: number
    discountCode?: string
    step?: string
    startedAt?: string
  }>(window.sessionStorage.getItem(CHECKOUT_CONTEXT_STORAGE_KEY))
}

export function clearCheckoutContext() {
  if (!isBrowser()) return
  window.sessionStorage.removeItem(CHECKOUT_CONTEXT_STORAGE_KEY)
}

export function persistAnalyticsAttribution(
  searchParams: SearchParamsLike,
  pathname: string,
  referrer?: string
) {
  if (!isAnalyticsAllowed()) {
    clearAnalyticsAttribution()
    return null
  }

  const existing = readAnalyticsAttribution() ?? {}

  const next: AnalyticsAttribution = {
    ...existing,
    landingPath: existing.landingPath ?? pathname,
    referrer: existing.referrer ?? (referrer || undefined),
    capturedAt: existing.capturedAt ?? new Date().toISOString(),
  }

  const ref = searchParams.get('ref')
  const slug = searchParams.get('slug')
  const cta = searchParams.get('cta')
  const utmSource = searchParams.get('utm_source')
  const utmMedium = searchParams.get('utm_medium')
  const utmCampaign = searchParams.get('utm_campaign')

  if (ref) next.ref = ref
  if (slug) next.slug = slug
  if (cta) next.cta = cta
  if (utmSource) next.utmSource = utmSource
  if (utmMedium) next.utmMedium = utmMedium
  if (utmCampaign) next.utmCampaign = utmCampaign

  if (!hasAttributionFields(next)) {
    return existing && hasAttributionFields(existing) ? existing : null
  }

  writeSessionCookie(ANALYTICS_ATTRIBUTION_COOKIE, JSON.stringify(next))
  return next
}

export async function clearAnalyticsClientState() {
  clearAnalyticsAttribution()
  syncDistinctIdCookie(null)
  clearAuthIntent()
  clearCheckoutContext()

  if (!isBrowser()) return

  try {
    window.localStorage.removeItem(COOKIE_CONSENT_COOKIE)
  } catch {
    // Ignore storage cleanup failures.
  }

  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('ph_') || key.includes('posthog')) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage cleanup failures.
  }

  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith('ph_') || key.includes('posthog')) {
        window.sessionStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage cleanup failures.
  }

  try {
    const importedModule = await import('posthog-js')
    const posthog = importedModule.default

    if (typeof posthog.opt_out_capturing === 'function') {
      posthog.opt_out_capturing()
    }

    if (typeof posthog.reset === 'function') {
      posthog.reset()
    }
  } catch {
    // Ignore PostHog cleanup failures.
  }
}

export function buildBlogAttributionHref(
  href: string,
  slug: string,
  ctaType: string
) {
  const url = new URL(href, 'https://rezoomed.local')
  url.searchParams.set('ref', 'blog')
  url.searchParams.set('slug', slug)
  url.searchParams.set('cta', ctaType)

  const search = url.searchParams.toString()
  return `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
}

export function getBlogTrafficSource(
  referrer: string,
  utmSource?: string,
  utmMedium?: string
): BlogTrafficSource {
  const combined = `${utmSource ?? ''} ${utmMedium ?? ''} ${referrer}`.toLowerCase()

  if (!combined.trim()) return 'direct'
  if (combined.includes('email') || combined.includes('newsletter')) return 'email'
  if (
    combined.includes('linkedin') ||
    combined.includes('twitter') ||
    combined.includes('x.com') ||
    combined.includes('facebook') ||
    combined.includes('reddit') ||
    combined.includes('tiktok') ||
    combined.includes('instagram')
  ) {
    return 'social'
  }

  if (combined.includes('google') || combined.includes('bing') || combined.includes('duckduckgo')) {
    return 'organic'
  }

  return 'direct'
}

export function getBlogAttributionEvent(
  pathname: string,
  attribution: AnalyticsAttribution | null
) {
  if (!attribution || attribution.ref !== 'blog' || !attribution.slug || !attribution.cta) {
    return null
  }

  if (pathname === '/auth/register') {
    return {
      event: 'blog_to_signup' as const,
      properties: {
        slug: attribution.slug,
        ctaType: attribution.cta,
      },
    }
  }

  if (
    pathname === '/ats-checker' ||
    pathname === '/match-score' ||
    pathname === '/dashboard/ats-checker' ||
    pathname === '/dashboard/match-score' ||
    pathname === '/dashboard/resumes'
  ) {
    return {
      event: 'blog_to_upload' as const,
      properties: {
        slug: attribution.slug,
        ctaType: attribution.cta,
      },
    }
  }

  if (pathname === '/dashboard/pricing') {
    return {
      event: 'blog_to_pricing' as const,
      properties: {
        slug: attribution.slug,
        ctaType: attribution.cta,
      },
    }
  }

  return null
}

export const Analytics = {
  capture: captureEvent,
  pageViewed(properties: AnalyticsEventMap['page_viewed'], options?: AnalyticsCaptureOptions) {
    captureEvent('page_viewed', properties, options)
    captureNativePageview(properties)
  },
  signupCompleted: createCaptureMethod('signup_completed'),
  loginCompleted: createCaptureMethod('login_completed'),
  resumeUploaded: createCaptureMethod('resume_uploaded'),
  resumeParseCompleted: createCaptureMethod('resume_parse_completed'),
  resumeParseFailed: createCaptureMethod('resume_parse_failed'),
  atsScoreRequested: createCaptureMethod('ats_score_requested'),
  atsScoreViewed: createCaptureMethod('ats_score_viewed'),
  atsScoreUpgradePromptShown: createCaptureMethod('ats_score_upgrade_prompt_shown'),
  atsScoreUpgradePromptClicked: createCaptureMethod('ats_score_upgrade_prompt_clicked'),
  builderOpened: createCaptureMethod('builder_opened'),
  builderSectionEdited: createCaptureMethod('builder_section_edited'),
  builderSectionTimeSpent: createCaptureMethod('builder_section_time_spent'),
  builderTemplateChanged: createCaptureMethod('builder_template_changed'),
  builderPreviewOpened: createCaptureMethod('builder_preview_opened'),
  builderDownloadClicked: createCaptureMethod('builder_download_clicked'),
  builderDownloadCompleted: createCaptureMethod('builder_download_completed'),
  builderDownloadFailed: createCaptureMethod('builder_download_failed'),
  builderSessionEnded: createCaptureMethod('builder_session_ended'),
  builderUndoRedoUsed: createCaptureMethod('builder_undo_redo_used'),
  builderDragReorder: createCaptureMethod('builder_drag_reorder'),
  builderVisibilityToggled: createCaptureMethod('builder_visibility_toggled'),
  builderSubSectionEditorOpened: createCaptureMethod('builder_sub_section_editor_opened'),
  builderIdleDetected: createCaptureMethod('builder_idle_detected'),
  templateSelected: createCaptureMethod('template_selected'),
  templateGalleryViewed: createCaptureMethod('template_gallery_viewed'),
  templateGalleryScrolled: createCaptureMethod('template_gallery_scrolled'),
  pricingPageViewed: createCaptureMethod('pricing_page_viewed'),
  checkoutStarted: createCaptureMethod('checkout_started'),
  checkoutCompleted: createCaptureMethod('checkout_completed'),
  checkoutAbandoned: createCaptureMethod('checkout_abandoned'),
  upgradePromptShown: createCaptureMethod('upgrade_prompt_shown'),
  upgradePromptClicked: createCaptureMethod('upgrade_prompt_clicked'),
  upgradePromptDismissed: createCaptureMethod('upgrade_prompt_dismissed'),
  exitIntentModalShown: createCaptureMethod('exit_intent_modal_shown'),
  exitIntentModalConverted: createCaptureMethod('exit_intent_modal_converted'),
  exitIntentModalDismissed: createCaptureMethod('exit_intent_modal_dismissed'),
  blogPostViewed: createCaptureMethod('blog_post_viewed'),
  blogPostScrollDepth: createCaptureMethod('blog_post_scroll_depth'),
  blogPostReadCompleted: createCaptureMethod('blog_post_read_completed'),
  blogCtaShown: createCaptureMethod('blog_cta_shown'),
  blogCtaClicked: createCaptureMethod('blog_cta_clicked'),
  blogToSignup: createCaptureMethod('blog_to_signup'),
  blogToUpload: createCaptureMethod('blog_to_upload'),
  blogToPricing: createCaptureMethod('blog_to_pricing'),
  blogShareClicked: createCaptureMethod('blog_share_clicked'),
  blogRelatedPostClicked: createCaptureMethod('blog_related_post_clicked'),
  identify(userId: string, traits: AnalyticsIdentifyTraits = {}) {
    queueBrowserAnalytics(posthog => {
      posthog.identify(userId, traits)
      syncDistinctIdCookie(posthog.get_distinct_id())
    })
  },
  reset() {
    queueBrowserAnalytics(posthog => {
      posthog.reset()
      syncDistinctIdCookie(null)
    })
  },
}
