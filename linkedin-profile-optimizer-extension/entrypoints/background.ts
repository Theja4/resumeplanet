import {
  EXTENSION_AUTH_PATH,
  REZOOMED_BASE_URL,
} from "../src/config/env";
import type { ApiResponse, AuthResponse } from "../src/auth/messages";
import { isApiRequest, isAuthRequest } from "../src/auth/messages";

// Tab-based sign-in. launchWebAuthFlow opens a popup window which Google
// OAuth refuses to render in ("insecure browser"), so we open a real tab,
// let the user log in normally, and the rezoomed.com page sends the token
// back via chrome.runtime.sendMessage (allowed by externally_connectable).

interface PendingSignIn {
  resolve: (response: AuthResponse) => void;
  tabId: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

const PENDING_SIGN_INS = new Map<string, PendingSignIn>();
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;

interface TokenDelivery {
  type: "REZOOMED_TOKEN_DELIVERY";
  requestId: string;
  token: string;
  expiresAt: number;
}

function isTokenDelivery(value: unknown): value is TokenDelivery {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.type === "REZOOMED_TOKEN_DELIVERY" &&
    typeof v.requestId === "string" &&
    typeof v.token === "string" &&
    typeof v.expiresAt === "number"
  );
}

function buildAuthUrl(requestId: string): string {
  const url = new URL(`${REZOOMED_BASE_URL}${EXTENSION_AUTH_PATH}`);
  url.searchParams.set("ext_id", chrome.runtime.id);
  url.searchParams.set("req", requestId);
  return url.toString();
}

async function startSignInFlow(): Promise<AuthResponse> {
  const requestId = crypto.randomUUID();
  const tab = await chrome.tabs.create({ url: buildAuthUrl(requestId), active: true });
  if (typeof tab.id !== "number") {
    return { ok: false, error: "tab_create_failed" };
  }
  const tabId = tab.id;

  return new Promise<AuthResponse>((resolve) => {
    const timeoutId = setTimeout(() => {
      const pending = PENDING_SIGN_INS.get(requestId);
      if (!pending) return;
      PENDING_SIGN_INS.delete(requestId);
      void chrome.tabs.remove(pending.tabId).catch(() => undefined);
      resolve({ ok: false, error: "sign_in_timeout" });
    }, SIGN_IN_TIMEOUT_MS);

    PENDING_SIGN_INS.set(requestId, { resolve, tabId, timeoutId });
  });
}

// Listeners are registered inside defineBackground so WXT's build-time
// fake-browser analyzer (which doesn't implement onMessageExternal) doesn't
// blow up. defineBackground runs only at extension runtime in a real browser.
export default defineBackground(() => {
  chrome.tabs.onRemoved.addListener((closedTabId) => {
    for (const [requestId, pending] of PENDING_SIGN_INS) {
      if (pending.tabId !== closedTabId) continue;
      clearTimeout(pending.timeoutId);
      PENDING_SIGN_INS.delete(requestId);
      pending.resolve({ ok: false, error: "sign_in_cancelled" });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isAuthRequest(message)) {
      if (message.type === "AUTH_SIGN_OUT") {
        sendResponse({ ok: true });
        return false;
      }
      void startSignInFlow().then(sendResponse);
      return true;
    }

    if (isApiRequest(message)) {
      void (async (): Promise<ApiResponse> => {
        try {
          const response = await fetch(`${REZOOMED_BASE_URL}${message.path}`, {
            method: message.method ?? "GET",
            headers: message.headers ?? {},
            body: message.body == null ? undefined : JSON.stringify(message.body),
          });
          // Try JSON; if that fails, fall back to text so the caller still
          // sees something useful on a 5xx HTML response.
          let body: unknown = null;
          const text = await response.text();
          try {
            body = text ? JSON.parse(text) : null;
          } catch {
            body = text;
          }
          return { ok: true, status: response.status, body };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "fetch_failed" };
        }
      })().then(sendResponse);
      return true;
    }

    return false;
  });

  chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
    if (!isTokenDelivery(message)) {
      sendResponse({ ok: false, error: "unknown_message" });
      return false;
    }

    const pending = PENDING_SIGN_INS.get(message.requestId);
    if (!pending) {
      // Stale or unknown request — acknowledge so the page renders success
      // even if the extension was reloaded mid-flow.
      sendResponse({ ok: true });
      return false;
    }

    clearTimeout(pending.timeoutId);
    PENDING_SIGN_INS.delete(message.requestId);
    pending.resolve({ ok: true, token: message.token, expiresAt: message.expiresAt });
    // Close the auth tab a beat after the page renders its success state.
    setTimeout(() => {
      void chrome.tabs.remove(pending.tabId).catch(() => undefined);
    }, 600);
    sendResponse({ ok: true });
    return false;
  });
});
