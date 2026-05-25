import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, FileText, Upload } from "lucide-react";

import {
  fetchConsistency,
  fetchResumes,
  type ConsistencyResponse,
  type ResumeListItem,
} from "../auth/api";
import type { ProfileData } from "../adapter/types";
import { track } from "../telemetry/events";
import { ProCta } from "./Gating";

const SELECTED_RESUME_KEY = "rezoomed.consistency.selectedResume.v1";

interface Props {
  userId: string;
  hasResume: boolean;
  profile: ProfileData | null;
}

interface Mismatch {
  field: "headline" | "title" | "skills";
  linkedinValue: string;
  resumeValue: string;
}

function detectMismatches(profile: ProfileData, consistency: ConsistencyResponse): Mismatch[] {
  const out: Mismatch[] = [];
  // ProfileData fields are FieldValue wrappers — pull .value off each one.
  const linkedinHeadline = (profile.headline?.value ?? "").trim();
  if (consistency.headline && linkedinHeadline && !looksEquivalent(linkedinHeadline, consistency.headline)) {
    out.push({ field: "headline", linkedinValue: linkedinHeadline, resumeValue: consistency.headline });
  }
  const latestRole = (profile.experience?.value?.[0]?.title?.value ?? "").trim();
  if (consistency.jobTitle && latestRole && !looksEquivalent(latestRole, consistency.jobTitle)) {
    out.push({ field: "title", linkedinValue: latestRole, resumeValue: consistency.jobTitle });
  }
  const linkedinSkillsList = profile.skills?.value ?? [];
  const linkedinSkills = new Set(linkedinSkillsList.map((s) => s.toLowerCase()));
  const resumeSkills = consistency.topSkills.map((s) => s.toLowerCase());
  const missing = resumeSkills.filter((s) => !linkedinSkills.has(s)).slice(0, 5);
  if (missing.length > 0) {
    out.push({
      field: "skills",
      linkedinValue: linkedinSkills.size ? `${linkedinSkills.size} skills` : "no skills listed",
      resumeValue: `resume highlights: ${missing.join(", ")}`,
    });
  }
  return out;
}

function looksEquivalent(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  return norm(a) === norm(b);
}

async function getSelectedResumeId(userId: string): Promise<string | null> {
  const store = await chrome.storage.local.get(SELECTED_RESUME_KEY);
  const map = store[SELECTED_RESUME_KEY] as Record<string, string> | undefined;
  return map?.[userId] ?? null;
}

async function setSelectedResumeId(userId: string, resumeId: string): Promise<void> {
  const store = await chrome.storage.local.get(SELECTED_RESUME_KEY);
  const map = (store[SELECTED_RESUME_KEY] as Record<string, string> | undefined) ?? {};
  map[userId] = resumeId;
  await chrome.storage.local.set({ [SELECTED_RESUME_KEY]: map });
}

export function ConsistencyGap({ userId, hasResume, profile }: Props) {
  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null);
  const [consistency, setConsistency] = useState<ConsistencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeSwitched, setResumeSwitched] = useState(false);

  useEffect(() => {
    if (!hasResume) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const selectedId = await getSelectedResumeId(userId);
        const [list, c] = await Promise.all([
          fetchResumes().catch(() => [] as ResumeListItem[]),
          fetchConsistency(selectedId ?? undefined).catch(() => null),
        ]);
        if (cancelled) return;
        setResumes(list);
        if (c && !("hasResume" in c)) {
          setConsistency(c);
        } else {
          setConsistency(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, hasResume]);

  // Fire telemetry once the gap is rendered with actual data.
  useEffect(() => {
    if (!profile || !consistency) return;
    const mismatches = detectMismatches(profile, consistency).length;
    void track({
      name: "consistency_gap_shown",
      props: { mismatches, hasResume, resumeSwitched },
    });
  }, [profile, consistency, hasResume, resumeSwitched]);

  if (!hasResume) {
    return (
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--rz-gradient-soft)",
          border: "1px solid var(--rz-border)",
          boxShadow: "var(--rz-shadow-card)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: "var(--rz-gradient)" }}
          >
            <Upload className="h-4 w-4" style={{ color: "var(--rz-on-primary)" }} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-bold leading-snug">
              See if your resume matches your LinkedIn
            </p>
            <p className="mt-1 text-[14px] leading-snug" style={{ color: "var(--rz-on-surface-2)" }}>
              Recruiters notice when your headline, title, and skills drift between your
              resume and LinkedIn. Upload a resume to Rezoomed and we'll surface the gap here.
            </p>
            <a
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[16px] font-bold transition hover:-translate-y-px"
              style={{
                background: "var(--rz-gradient)",
                color: "var(--rz-on-primary)",
                boxShadow: "var(--rz-shadow-pop)",
              }}
              href="https://rezoomed.com/dashboard?ref=ext_consistency_upload"
              rel="noreferrer noopener"
              target="_blank"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Upload to Rezoomed
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="rounded-xl p-3 text-[14px]"
        style={{
          background: "var(--rz-surface-2)",
          border: "1px solid var(--rz-border)",
          color: "var(--rz-on-surface-2)",
        }}
      >
        <span className="rz-skeleton mr-2 inline-block h-2 w-2 rounded-full align-middle" />
        Checking resume ↔ LinkedIn consistency…
      </div>
    );
  }

  if (!consistency || !profile) return null;

  const mismatches = detectMismatches(profile, consistency);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: mismatches.length === 0 ? "var(--rz-primary-tint)" : "var(--rz-warn-soft)",
        border: "1px solid var(--rz-border)",
        boxShadow: "var(--rz-shadow-card)",
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: mismatches.length === 0 ? "var(--rz-primary)" : "var(--rz-warn)" }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[16px] font-bold leading-snug">
              Resume ↔ LinkedIn consistency
            </p>
          </div>

          {resumes && resumes.length > 1 ? (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[14px]">
              <span style={{ color: "var(--rz-on-surface-3)" }}>Comparing against:</span>
              <div className="relative">
                <select
                  className="appearance-none rounded-md py-1 pl-2 pr-7 text-[14px] font-semibold outline-none"
                  style={{
                    background: "var(--rz-surface)",
                    border: "1px solid var(--rz-border)",
                    color: "var(--rz-on-surface)",
                  }}
                  onChange={async (e) => {
                    const newId = e.target.value;
                    await setSelectedResumeId(userId, newId);
                    setLoading(true);
                    setResumeSwitched(true);
                    try {
                      const c = await fetchConsistency(newId);
                      if (c && !("hasResume" in c)) setConsistency(c);
                    } catch {
                      // Surface nothing — old consistency stays visible.
                    } finally {
                      setLoading(false);
                    }
                  }}
                  value={consistency.resumeId}
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                      {r.isLatest ? " (latest)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5"
                  style={{ color: "var(--rz-on-surface-3)" }}
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[12px]" style={{ color: "var(--rz-on-surface-3)" }}>
              Against: <span className="font-semibold">{consistency.resumeTitle}</span>
            </p>
          )}

          {mismatches.length === 0 ? (
            <p className="mt-3 text-[14px] leading-snug" style={{ color: "var(--rz-on-surface-2)" }}>
              Looks aligned — your headline, title and top skills match the resume.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-[14px] leading-snug" style={{ color: "var(--rz-on-surface)" }}>
              {mismatches.map((m) => (
                <li key={m.field}>
                  <span className="font-bold capitalize">{m.field}:</span>{" "}
                  LinkedIn says <span className="italic">"{m.linkedinValue}"</span>, resume
                  says <span className="italic">"{m.resumeValue}"</span> — recruiters notice the mismatch.
                </li>
              ))}
            </ul>
          )}

          {mismatches.length > 0 ? <ProCta section="consistency_gap" label="Auto-fix with Pro" /> : null}
        </div>
      </div>
    </div>
  );
}
