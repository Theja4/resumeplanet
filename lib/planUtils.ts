import type { Profile } from '@/types'
import { FREE_PLAN } from '@/lib/pricing'

const CLAUDE_STANDARD = process.env.ANTHROPIC_MODEL || 'google/gemini-2.5-flash'
const CLAUDE_PREMIUM = process.env.ANTHROPIC_MODEL_PREMIUM || 'deepseek/deepseek-v3.2'

export function isPro(profile: Profile | null): boolean {
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

export function getRemainingFreeScans(profile: Profile | null): number {
  if (isPro(profile)) return Infinity
  return Math.max(0, FREE_PLAN.limits.atsScansPerDay - (profile?.ats_scans_today ?? 0))
}

export function getATSModel(profile: Profile | null): string {
  return isPro(profile) ? CLAUDE_PREMIUM : CLAUDE_STANDARD
}
