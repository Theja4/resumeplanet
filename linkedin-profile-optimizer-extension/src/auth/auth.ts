// Public auth API used by content scripts and the popup. The actual OAuth
// dance happens in the background worker (see entrypoints/background.ts).

import { clearStoredToken, readStoredToken, writeStoredToken } from "./storage";
import type { AuthResponse } from "./messages";

const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 3; // refresh if <3 days left

export async function getToken(): Promise<string | null> {
  const stored = await readStoredToken();
  if (!stored) return null;
  if (stored.expiresAt < Math.floor(Date.now() / 1000)) {
    await clearStoredToken();
    return null;
  }
  return stored.token;
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getToken()) !== null;
}

export async function signIn(): Promise<{ ok: true } | { ok: false; error: string }> {
  // chrome.runtime.sendMessage can reject (channel closed, SW asleep,
  // extension reloaded mid-flow). Always return a typed result so callers
  // never see an unhandled "Failed to fetch" surface in chrome://extensions.
  let response: AuthResponse | undefined;
  try {
    response = (await chrome.runtime.sendMessage({
      type: "AUTH_SIGN_IN",
    })) as AuthResponse;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "sendmessage_failed",
    };
  }

  if (!response?.ok) {
    return { ok: false, error: response?.error ?? "unknown_error" };
  }

  try {
    await writeStoredToken({
      token: response.token,
      expiresAt: response.expiresAt,
      storedAt: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "token_store_failed",
    };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await clearStoredToken();
  // Best-effort notify of sign-out so background can do future cleanup.
  try {
    await chrome.runtime.sendMessage({ type: "AUTH_SIGN_OUT" });
  } catch {
    // ignore — background may be inactive
  }
}

const REFRESH_RETRY_INTERVAL_MS = 5 * 60 * 1000; // at most one attempt / 5 min

let refreshInFlight: Promise<void> | null = null;
let lastRefreshAttempt = 0;

// Asks the background to re-mint a fresh token, presenting the current
// (still-valid) token as a bearer so the server can slide the session with
// no cross-site cookie. This is tab-free: on failure we leave the existing
// token untouched. We never open an interactive tab here — that only
// happens when the user explicitly clicks "Sign in".
async function attemptSilentRefresh(token: string): Promise<void> {
  let response: AuthResponse | undefined;
  try {
    response = (await chrome.runtime.sendMessage({
      type: "AUTH_SILENT_REFRESH",
      token,
    })) as AuthResponse;
  } catch {
    return; // background asleep / channel closed — keep the current token
  }
  if (!response?.ok) return;
  try {
    await writeStoredToken({
      token: response.token,
      expiresAt: response.expiresAt,
      storedAt: Math.floor(Date.now() / 1000),
    });
  } catch {
    // Storage write failed — the in-memory token still rides until expiry.
  }
}

// Called before each API request. When the token is approaching expiry we
// kick off ONE tab-free silent refresh, deduped across concurrent requests
// and rate-limited so a persistently-failing refresh (cookie not sent)
// can't fire a network call on every request. If it never succeeds the
// token simply rides until a real 401, which surfaces the interactive
// sign-in CTA the user can choose to act on.
export async function refreshIfNeeded(): Promise<void> {
  const stored = await readStoredToken();
  if (!stored) return;
  const secondsLeft = stored.expiresAt - Math.floor(Date.now() / 1000);
  if (secondsLeft > REFRESH_THRESHOLD_SECONDS) return;

  const now = Date.now();
  if (!refreshInFlight && now - lastRefreshAttempt >= REFRESH_RETRY_INTERVAL_MS) {
    lastRefreshAttempt = now;
    refreshInFlight = attemptSilentRefresh(stored.token).finally(() => {
      refreshInFlight = null;
    });
  }
  if (refreshInFlight) await refreshInFlight;
}
