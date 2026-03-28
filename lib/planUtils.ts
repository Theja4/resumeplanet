import type { Profile } from '@/types'

// Model strings duplicated here to avoid importing lib/claude (which instantiates
// the Anthropic client and cannot be bundled into client components).
const CLAUDE_PREMIUM = 'claude-opus-4-6'
const CLAUDE_STANDARD = 'claude-sonnet-4-6'

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
  return Math.max(0, 3 - (profile?.ats_scans_today ?? 0))
}

export function getATSModel(profile: Profile | null): string {
  return isPro(profile) ? CLAUDE_PREMIUM : CLAUDE_STANDARD
}
