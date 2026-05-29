import {
  API_CONSISTENCY_PATH,
  API_GENERATE_PATH,
  API_ME_PATH,
  API_RESUMES_PATH,
  API_SCAN_PATH,
  API_SYNC_FROM_RESUME_PATH,
} from "../config/env";
import { clearStoredToken } from "./storage";
import { getToken, refreshIfNeeded } from "./auth";
import type { ApiResponse } from "./messages";

export interface MeResponse {
  userId: string;
  email: string;
  plan: "free" | "pro";
  hasResume: boolean;
}

export interface ResumeListItem {
  id: string;
  title: string;
  updatedAt: string;
  isLatest: boolean;
}

export interface ConsistencyResponse {
  resumeId: string;
  resumeTitle: string;
  headline: string | null;
  jobTitle: string | null;
  topSkills: string[];
}

export interface ScanPayload {
  profileUrl: string;
  score: number;
  sections: unknown;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Content scripts in MV3 can't do cross-origin fetch even with host_permissions
// (browser CORS still applies). The background service worker can, so we
// proxy every API call through it.
async function authedRequest(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<unknown> {
  await refreshIfNeeded();
  const token = await getToken();
  if (!token) throw new HttpError(401, "not_authenticated");

  const response = (await chrome.runtime.sendMessage({
    type: "API_REQUEST",
    path,
    method: init.method,
    body: init.body,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body != null ? { "content-type": "application/json" } : {}),
    },
  })) as ApiResponse | undefined;

  if (!response || !response.ok) {
    throw new HttpError(0, response?.error ?? "background_unreachable");
  }
  if (response.status === 401) {
    await clearStoredToken();
    throw new HttpError(401, "token_invalid");
  }
  if (response.status < 200 || response.status >= 300) {
    throw new HttpError(response.status, `request_failed:${response.status}`);
  }
  return response.body;
}

export async function fetchMe(): Promise<MeResponse> {
  return (await authedRequest(API_ME_PATH)) as MeResponse;
}

export async function fetchResumes(): Promise<ResumeListItem[]> {
  return (await authedRequest(API_RESUMES_PATH)) as ResumeListItem[];
}

export async function fetchConsistency(
  resumeId?: string
): Promise<ConsistencyResponse | { hasResume: false }> {
  const path = resumeId
    ? `${API_CONSISTENCY_PATH}?resumeId=${encodeURIComponent(resumeId)}`
    : API_CONSISTENCY_PATH;
  return (await authedRequest(path)) as ConsistencyResponse | { hasResume: false };
}

export async function postScan(payload: ScanPayload): Promise<void> {
  await authedRequest(API_SCAN_PATH, { method: "POST", body: payload });
}

export type GeneratorType = "headline" | "about" | "experience_bullets" | "skills";

export interface GeneratePayload {
  generator: GeneratorType;
  targetRole: string;
  currentText: string;
  targetJobDescription?: string;
  useResumeContext?: boolean;
}

export interface GenerateResponse {
  rewrite: string;
  rewriteLines?: string[];
  rationale: string;
  cached: boolean;
}

export async function postGenerate(payload: GeneratePayload): Promise<GenerateResponse> {
  return (await authedRequest(API_GENERATE_PATH, {
    method: "POST",
    body: payload,
  })) as GenerateResponse;
}

export interface SyncFromResumePayload {
  targetRole: string;
  resumeId?: string;
  targetJobDescription?: string;
  /** Current LinkedIn text per section, used as anti-contradiction context. */
  linkedinCurrent: {
    headline: string;
    about: string;
    experience_bullets: string;
    skills: string;
  };
}

export interface SyncFromResumeSection {
  generator: GeneratorType;
  rewrite: string;
  rewriteLines?: string[];
  rationale: string;
  cached: boolean;
  empty: boolean;
}

export interface SyncFromResumeResponse {
  resumeId: string;
  resumeTitle: string;
  sections: SyncFromResumeSection[];
}

/**
 * Pro-only sync. Generates LinkedIn output for all 4 sections from
 * the user's most recent (or specified) resume, tuned for LinkedIn's
 * recruiter Boolean net.
 *
 * Throws HttpError(402) when the user is not on Pro.
 * Throws HttpError(404) when the user has no resume on Rezoomed.
 */
export async function postSyncFromResume(
  payload: SyncFromResumePayload,
): Promise<SyncFromResumeResponse> {
  return (await authedRequest(API_SYNC_FROM_RESUME_PATH, {
    method: "POST",
    body: payload,
  })) as SyncFromResumeResponse;
}

export { HttpError };
