// Single place where the Rezoomed web origin is resolved. WXT exposes
// import.meta.env.WXT_* to every entrypoint.
//
// The fallback MUST use the www subdomain: production redirects the bare
// apex (rezoomed.com) to www.rezoomed.com via a 307, and browsers strip
// the Authorization header on cross-host redirects. Hitting www directly
// avoids the redirect and keeps the bearer JWT intact.
//
// Local development against the Next.js app should set
// `WXT_REZOOMED_BASE_URL=http://localhost:3000` in `.env.local`.
export const REZOOMED_BASE_URL: string =
  import.meta.env.WXT_REZOOMED_BASE_URL || "https://www.rezoomed.com";

export const EXTENSION_AUTH_PATH = "/extension-auth";
export const API_ME_PATH = "/api/extension/me";
export const API_TOKEN_PATH = "/api/extension/token";
export const API_RESUMES_PATH = "/api/extension/resumes";
export const API_CONSISTENCY_PATH = "/api/extension/consistency";
export const API_SCAN_PATH = "/api/extension/scan";
export const API_GENERATE_PATH = "/api/linkedin/generate";
export const API_SYNC_FROM_RESUME_PATH = "/api/linkedin/sync-from-resume";
