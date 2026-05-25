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
  const response = (await chrome.runtime.sendMessage({
    type: "AUTH_SIGN_IN",
  })) as AuthResponse;

  if (!response?.ok) {
    return { ok: false, error: response?.error ?? "unknown_error" };
  }

  await writeStoredToken({
    token: response.token,
    expiresAt: response.expiresAt,
    storedAt: Math.floor(Date.now() / 1000),
  });
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

// Called before each API request. If the token is approaching expiry, kick
// off a silent re-auth (which still uses launchWebAuthFlow but {interactive:
// false}, so it only succeeds when the user has a live web session).
export async function refreshIfNeeded(): Promise<void> {
  const stored = await readStoredToken();
  if (!stored) return;
  const secondsLeft = stored.expiresAt - Math.floor(Date.now() / 1000);
  if (secondsLeft > REFRESH_THRESHOLD_SECONDS) return;
  // Silent attempt; if it fails the next /me call returns 401 and the UI
  // prompts the user to re-auth interactively.
  await signIn().catch(() => undefined);
}
