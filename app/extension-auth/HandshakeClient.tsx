'use client'

import { useEffect, useState } from 'react'

// chrome.runtime.sendMessage is only typed when the @types/chrome package is
// installed (it's not in this project). The function is injected by the
// browser at runtime onto web pages listed in an extension's
// externally_connectable.matches.
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          callback?: (response: unknown) => void
        ) => void
        lastError?: { message?: string }
      }
    }
  }
}

type HandshakeStatus =
  | { kind: 'minting' }
  | { kind: 'delivering' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

interface Props {
  extId: string
  requestId: string
}

export default function HandshakeClient({ extId, requestId }: Props) {
  const [status, setStatus] = useState<HandshakeStatus>({ kind: 'minting' })

  useEffect(() => {
    let cancelled = false

    async function run() {
      // 1. Ask the server to mint a JWT (it re-verifies the Supabase session).
      let token: string
      let expiresAt: number
      try {
        const res = await fetch('/api/extension/token', { method: 'POST' })
        if (!res.ok) throw new Error(`token_${res.status}`)
        const data = (await res.json()) as { token: string; expiresAt: number }
        token = data.token
        expiresAt = data.expiresAt
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'mint_failed'
        setStatus({ kind: 'error', message })
        return
      }

      if (cancelled) return
      setStatus({ kind: 'delivering' })

      // 2. Send the token to the background worker. externally_connectable
      // on the extension's manifest is what makes this call legal.
      const sendMessage = window.chrome?.runtime?.sendMessage
      if (typeof sendMessage !== 'function') {
        setStatus({
          kind: 'error',
          message:
            'Chrome extension API not available in this browser. Open this page from the Rezoomed extension.',
        })
        return
      }

      // sendMessage's callback fires once with the extension's reply OR
      // with chrome.runtime.lastError set (extension uninstalled, disabled,
      // or this origin not in externally_connectable.matches). If neither
      // happens within 5s, treat it as silently dropped and surface an
      // error so the user isn't stuck staring at a spinner.
      let settled = false
      const fallbackTimer = window.setTimeout(() => {
        if (settled || cancelled) return
        settled = true
        setStatus({
          kind: 'error',
          message:
            "Couldn't reach the Rezoomed extension. Open chrome://extensions, make sure Rezoomed is enabled, then click 'Sign in' again from LinkedIn.",
        })
      }, 5000)

      sendMessage(
        extId,
        {
          type: 'REZOOMED_TOKEN_DELIVERY',
          requestId,
          token,
          expiresAt,
        },
        (reply) => {
          if (settled || cancelled) return
          settled = true
          window.clearTimeout(fallbackTimer)
          const lastError = window.chrome?.runtime?.lastError?.message
          if (lastError) {
            setStatus({
              kind: 'error',
              message: `Couldn't reach the extension (${lastError}). Open chrome://extensions, make sure Rezoomed is enabled, then click 'Sign in' again from LinkedIn.`,
            })
            return
          }
          // Background returns { ok: true } when it accepts the token, or
          // { ok: false } when the request ID is unknown (e.g. extension
          // was reloaded mid-flow and lost its pending state).
          const accepted =
            !!reply && typeof reply === 'object' && (reply as { ok?: unknown }).ok === true
          if (!accepted) {
            setStatus({
              kind: 'error',
              message:
                "The extension didn't accept the token. Click 'Sign in' again from the LinkedIn panel — the previous sign-in attempt expired.",
            })
            return
          }
          setStatus({ kind: 'success' })
          // Background worker closes this tab shortly after acknowledging.
        }
      )
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [extId, requestId])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {status.kind === 'minting' && (
        <>
          <Spinner />
          <h1 className="mt-6 text-lg font-semibold text-neutral-900">
            Connecting Rezoomed to the extension…
          </h1>
          <p className="mt-2 text-sm text-neutral-600">Verifying your account.</p>
        </>
      )}
      {status.kind === 'delivering' && (
        <>
          <Spinner />
          <h1 className="mt-6 text-lg font-semibold text-neutral-900">Almost there…</h1>
          <p className="mt-2 text-sm text-neutral-600">Handing the token to the extension.</p>
        </>
      )}
      {status.kind === 'success' && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </div>
          <h1 className="mt-6 text-lg font-semibold text-neutral-900">
            Connected. You can close this tab.
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Return to LinkedIn — the Rezoomed panel is ready.
          </p>
        </>
      )}
      {status.kind === 'error' && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            !
          </div>
          <h1 className="mt-6 text-lg font-semibold text-neutral-900">
            Couldn't complete sign-in
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{status.message}</p>
        </>
      )}
    </main>
  )
}

function Spinner() {
  return (
    <div
      aria-label="Loading"
      className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"
    />
  )
}
