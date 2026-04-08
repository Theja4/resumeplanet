'use client'

import Link from 'next/link'
import { useState } from 'react'
import { clearAnalyticsClientState } from '@/lib/analytics'
import { COOKIE_CONSENT_COOKIE, type CookieConsentPreference } from '@/lib/cookie-consent'

const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

function writeConsentCookie(value: CookieConsentPreference) {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${COOKIE_CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
}

export default function CookieConsentBanner() {
  const [saving, setSaving] = useState<CookieConsentPreference | null>(null)

  async function applyConsent(preference: CookieConsentPreference) {
    setSaving(preference)

    if (preference === 'essential') {
      await clearAnalyticsClientState()
    }

    writeConsentCookie(preference)
    window.location.reload()
  }

  return (
    <div className="border-b border-emerald-950/10 bg-[linear-gradient(135deg,#eefaf0_0%,#ffffff_52%,#f4fbf5_100%)] px-4 py-4 shadow-[0_10px_30px_rgba(2,109,50,0.08)] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <p className="inline-flex w-fit rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
            Cookie Preferences
          </p>
          <p className="max-w-3xl text-sm leading-6 text-zinc-700 sm:text-[15px]">
            We use required cookies to keep sign-in and key product flows working. We would also like
            to use analytics cookies to understand product usage and improve Rezoomed. Read our{' '}
            <Link href="/cookie-policy" className="font-bold text-[#026d32] underline underline-offset-4">
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => applyConsent('essential')}
            disabled={saving !== null}
            className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-black/5 disabled:opacity-70"
          >
            {saving === 'essential' ? 'Saving…' : 'Required only'}
          </button>
          <button
            type="button"
            onClick={() => applyConsent('all')}
            disabled={saving !== null}
            className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-zinc-900 disabled:opacity-70"
          >
            {saving === 'all' ? 'Saving…' : 'Allow analytics'}
          </button>
        </div>
      </div>
    </div>
  )
}
