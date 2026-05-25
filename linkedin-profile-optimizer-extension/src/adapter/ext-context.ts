/**
 * When a Chrome extension is reloaded or uninstalled while one of its
 * content scripts is still running in a tab, Chrome does NOT kill the
 * orphaned script — it invalidates the extension's URLs instead. Any
 * subsequent reference to a chrome-extension:// resource (CSS, image,
 * runtime API) resolves to chrome-extension://invalid/ and floods the
 * console with net::ERR_FAILED.
 *
 * The cleanest way to detect this from inside the content script is
 * to read chrome.runtime.id. While the context is valid it returns the
 * extension ID; once invalidated, it's undefined (or throws).
 *
 * Callers should:
 *   1. Check isExtensionContextValid() before any work that touches
 *      the DOM, the panel, or extension APIs.
 *   2. Use onExtensionContextInvalidated() once at startup to register
 *      teardown work (un-mount panel, disconnect observers, clear
 *      timers).
 */

export function isExtensionContextValid(): boolean {
  try {
    // chrome.runtime can be undefined in non-extension contexts, and
    // chrome.runtime.id can be undefined after an extension reload
    // even though chrome.runtime itself still exists.
    return Boolean(
      typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id,
    );
  } catch {
    return false;
  }
}

/**
 * Polls isExtensionContextValid() and invokes `onInvalid` once when the
 * context flips from valid to invalid. Returns a cleanup function.
 *
 * We poll instead of using a chrome API listener because the only
 * official signal (chrome.runtime.onConnect / onMessage from a now-
 * dead background page) is unreliable for this exact "the extension
 * just got reloaded" scenario.
 */
export function onExtensionContextInvalidated(
  onInvalid: () => void,
  pollMs = 500,
): () => void {
  let fired = false;
  const interval = window.setInterval(() => {
    if (fired) return;
    if (isExtensionContextValid()) return;
    fired = true;
    window.clearInterval(interval);
    try {
      onInvalid();
    } catch {
      // Swallow — by definition we're already in a torn-down state.
    }
  }, pollMs);

  return () => {
    window.clearInterval(interval);
  };
}
