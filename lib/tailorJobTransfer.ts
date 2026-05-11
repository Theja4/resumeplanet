'use client'

import type { TailorIntensity } from '@/types'

const TAILOR_JOB_TRANSFER_PREFIX = 'rezoomed:tailor-job:'
const TAILOR_JOB_TRANSFER_TTL_MS = 30 * 60 * 1000

export interface TailorJobTransfer {
  jobDescription: string
  intensity: TailorIntensity
  createdAt: number
}

export function writeTailorJobTransfer(
  jobDescription: string,
  intensity: TailorIntensity = 'balanced'
): string | null {
  if (typeof window === 'undefined') return null

  const trimmed = jobDescription.trim()
  if (!trimmed) return null

  try {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const payload: TailorJobTransfer = {
      jobDescription: trimmed,
      intensity,
      createdAt: Date.now(),
    }
    window.sessionStorage.setItem(`${TAILOR_JOB_TRANSFER_PREFIX}${key}`, JSON.stringify(payload))
    return key
  } catch {
    return null
  }
}

export function readTailorJobTransfer(key: string, consume = true): TailorJobTransfer | null {
  if (typeof window === 'undefined' || !key) return null

  const storageKey = `${TAILOR_JOB_TRANSFER_PREFIX}${key}`

  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<TailorJobTransfer>
    if (consume) {
      window.sessionStorage.removeItem(storageKey)
    }

    if (
      typeof parsed.jobDescription !== 'string' ||
      !parsed.jobDescription.trim() ||
      typeof parsed.createdAt !== 'number' ||
      Date.now() - parsed.createdAt > TAILOR_JOB_TRANSFER_TTL_MS
    ) {
      return null
    }

    return {
      jobDescription: parsed.jobDescription.trim(),
      intensity: parsed.intensity ?? 'balanced',
      createdAt: parsed.createdAt,
    }
  } catch {
    return null
  }
}
