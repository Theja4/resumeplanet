'use client'

export type SessionToolScope = 'dashboard' | 'public'
export type SessionAnalysisMode = 'ats' | 'match'

const STORAGE_KEYS = {
  ats(scope: SessionToolScope, mode: SessionAnalysisMode) {
    return `rezoomed:draft:ats-checker:${scope}:${mode}:v1`
  },
  coverLetter(scope: SessionToolScope) {
    return `rezoomed:draft:cover-letter:${scope}:v1`
  },
}

export function getAtsCheckerDraftKey(scope: SessionToolScope, mode: SessionAnalysisMode) {
  return STORAGE_KEYS.ats(scope, mode)
}

export function getCoverLetterDraftKey(scope: SessionToolScope) {
  return STORAGE_KEYS.coverLetter(scope)
}

export function readSessionDraft<T>(key: string) {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeSessionDraft(key: string, value: unknown) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota and serialization failures.
  }
}

export function removeSessionDraft(key: string) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

export function clearWorkspaceSessionDrafts() {
  if (typeof window === 'undefined') return

  const keys = [
    STORAGE_KEYS.ats('dashboard', 'ats'),
    STORAGE_KEYS.ats('dashboard', 'match'),
    STORAGE_KEYS.ats('public', 'ats'),
    STORAGE_KEYS.ats('public', 'match'),
    STORAGE_KEYS.coverLetter('dashboard'),
    STORAGE_KEYS.coverLetter('public'),
  ]

  for (const key of keys) {
    removeSessionDraft(key)
  }
}
