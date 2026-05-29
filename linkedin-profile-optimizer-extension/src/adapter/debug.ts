/**
 * Dev-only console logger. Output is gated behind a localStorage flag
 * (rezoomed.debug=1) so production users never see noise. The parser
 * sprinkles debugLog/debugGroup calls through the adapter strategies —
 * with the flag off they're effectively free.
 */

const STORAGE_KEY = "rezoomed.debug";

let cachedFlag: boolean | null = null;

function debugEnabled(): boolean {
  if (cachedFlag !== null) return cachedFlag;
  try {
    cachedFlag =
      typeof window !== "undefined" &&
      window.localStorage?.getItem(STORAGE_KEY) === "1";
  } catch {
    cachedFlag = false;
  }
  return cachedFlag ?? false;
}

export function debugLog(...args: unknown[]): void {
  if (!debugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log("[Rezoomed]", ...args);
}

export function debugGroup(label: string, body: () => void): void {
  if (!debugEnabled()) {
    body();
    return;
  }
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[Rezoomed] ${label}`);
  try {
    body();
  } finally {
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}
