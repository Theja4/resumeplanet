import type { Profile } from '@/types'
import { FREE_PLAN, PRO_PLAN } from '@/lib/pricing'
import { isPeriodEndInFuture } from '@/lib/subscriptionPeriod'

type ProAccessProfile = Pick<Profile, 'plan'> & {
  payment_provider?: string | null
  current_period_end?: string | null
}

const CLAUDE_STANDARD = process.env.ANTHROPIC_MODEL || 'deepseek/deepseek-v4-flash'
const CLAUDE_PREMIUM = process.env.ANTHROPIC_MODEL_PREMIUM || 'deepseek/deepseek-v4-flash'

export function isPro(profile: ProAccessProfile | null): boolean {
  if (
    (profile?.payment_provider === 'razorpay' || profile?.payment_provider === 'polar') &&
    profile.current_period_end
  ) {
    return profile.plan === 'pro' && isPeriodEndInFuture(profile.current_period_end)
  }

  return profile?.plan === 'pro'
}

export function canRunAdvancedATS(profile: Profile | null): boolean {
  return isPro(profile)
}

export function canDownloadTemplates(profile: Profile | null): boolean {
  return isPro(profile)
}

export function canOptimiseResume(profile: Profile | null): boolean {
  return isPro(profile)
}

export function getRemainingFreeScans(profile: Profile | null): number | null {
  if (isPro(profile) || FREE_PLAN.limits.atsScansPerDay === null) return null
  const resetAt = new Date(profile?.ats_scans_reset_at ?? 0)
  if (!Number.isNaN(resetAt.getTime())) {
    const elapsedMs = Date.now() - resetAt.getTime()
    if (elapsedMs >= 24 * 60 * 60 * 1000) {
      return FREE_PLAN.limits.atsScansPerDay
    }
  }
  return Math.max(0, FREE_PLAN.limits.atsScansPerDay - (profile?.ats_scans_today ?? 0))
}

export function getATSModel(profile: Profile | null): string {
  return isPro(profile) ? CLAUDE_PREMIUM : CLAUDE_STANDARD
}

export function getTrackedJobsLimit(profile: Profile | null): number {
  return isPro(profile) ? PRO_PLAN.limits.maxTrackedJobs : FREE_PLAN.limits.maxTrackedJobs
}

export function getTrackedJobsLimitLabel(profile: Profile | null): string {
  return isPro(profile) ? 'Unlimited' : String(FREE_PLAN.limits.maxTrackedJobs)
}

export function getRemainingTrackedJobs(profile: Profile | null, trackedJobCount: number): number {
  if (isPro(profile)) return Infinity
  return Math.max(0, FREE_PLAN.limits.maxTrackedJobs - trackedJobCount)
}
