// Single place where the Rezoomed web origin is resolved. WXT exposes
// import.meta.env.WXT_* to every entrypoint. The fallback is production
// so that shipped builds (and devs without a .env.local) hit rezoomed.com
// instead of localhost. Local development against the Next.js app should
// set `WXT_REZOOMED_BASE_URL=http://localhost:3000` in `.env.local`.
export const REZOOMED_BASE_URL: string =
  import.meta.env.WXT_REZOOMED_BASE_URL || "https://rezoomed.com";

export const EXTENSION_AUTH_PATH = "/extension-auth";
export const API_ME_PATH = "/api/extension/me";
export const API_TOKEN_PATH = "/api/extension/token";
export const API_RESUMES_PATH = "/api/extension/resumes";
export const API_CONSISTENCY_PATH = "/api/extension/consistency";
export const API_SCAN_PATH = "/api/extension/scan";
export const API_GENERATE_PATH = "/api/linkedin/generate";
