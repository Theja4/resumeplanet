// Shared message contract between content scripts / popup and the background
// service worker. Only the background can call chrome.identity.launchWebAuthFlow.

export type AuthRequest =
  | { type: "AUTH_SIGN_IN" }
  | { type: "AUTH_SIGN_OUT" }
  // Tab-free token refresh attempted before requests when the stored
  // token is near expiry. The background hits /api/extension/token,
  // presenting the current (still-valid) token as a bearer so the server
  // can re-mint it without any cross-site cookie. On failure it returns
  // ok:false and the caller leaves the existing token in place (no tab).
  | { type: "AUTH_SILENT_REFRESH"; token: string };

export type AuthResponse =
  | { ok: true; token: string; expiresAt: number }
  | { ok: false; error: string };

export type SignOutResponse = { ok: true };

export function isAuthRequest(value: unknown): value is AuthRequest {
  if (!value || typeof value !== "object") return false;
  const t = (value as { type?: unknown }).type;
  return t === "AUTH_SIGN_IN" || t === "AUTH_SIGN_OUT" || t === "AUTH_SILENT_REFRESH";
}

// API proxy: content scripts can't do cross-origin fetches in MV3 even with
// host_permissions (browser still enforces CORS). The background worker can,
// so it acts as a proxy. Send the path + init, get back status + body.
export interface ApiRequest {
  type: "API_REQUEST";
  path: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export type ApiResponse =
  | { ok: true; status: number; body: unknown }
  | { ok: false; error: string };

export function isApiRequest(value: unknown): value is ApiRequest {
  if (!value || typeof value !== "object") return false;
  return (value as { type?: unknown }).type === "API_REQUEST";
}
