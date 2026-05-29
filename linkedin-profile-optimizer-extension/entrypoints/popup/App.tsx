import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  Divider,
  SeverityDot,
  Stat,
  ThemeToggle,
} from "../../src/ui/components";
import { severityFromRatio } from "../../src/scoring/severity";
import { BrandMark, ProfileCardIllustration, ScoreWaveSvg } from "../../src/ui/svg";
import { SIDEBAR_OPEN_REQUEST_KEY } from "../../src/ui/sidebarState";

const LAST_SCAN_KEY = "rezoomed.lastScan.v1";

interface LastScan {
  score: number;
  ts: number;
  url?: string;
}

export function PopupApp() {
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      chrome?.storage?.local?.get?.([LAST_SCAN_KEY], (result) => {
        if (cancelled) return;
        const v = result?.[LAST_SCAN_KEY] as LastScan | undefined;
        if (v && typeof v.score === "number") setLastScan(v);
      });
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
    };
  }, []);

  let iconUrl: string | null = null;
  let mascotUrl: string | null = null;
  try {
    iconUrl = chrome?.runtime?.getURL?.("icon/128.png") ?? null;
    mascotUrl = chrome?.runtime?.getURL?.("logo.png") ?? null;
  } catch {
    iconUrl = null;
    mascotUrl = null;
  }

  return (
    <main
      className="rz-popup-shell relative flex h-full min-h-[576px] w-full flex-col overflow-hidden"
      style={{
        background: "var(--rz-panel-bg)",
        color: "var(--rz-text)",
      }}
    >
      <header
        className="flex items-center justify-between gap-3 px-5 py-4 rz-fade-in"
        style={{ borderBottom: "1px solid var(--rz-border)" }}
      >
        <BrandMark size="md" iconUrl={iconUrl} />
        <ThemeToggle size="sm" />
      </header>

      <div className="flex-1 space-y-4 px-5 py-5">
        <HeroCard mascotUrl={mascotUrl} />
        <PopupActions />
        <ScanCard lastScan={lastScan} />

        <div className="grid grid-cols-3 gap-2 rz-stagger">
          <SignalTile
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label="ATS"
            value="Score"
            tone="var(--rz-primary)"
          />
          <SignalTile
            icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
            label="AI"
            value="Rewrite"
            tone="var(--rz-pop)"
          />
          <SignalTile
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            label="Local"
            value="Private"
            tone="var(--rz-sky)"
          />
        </div>

      </div>

      <footer
        className="px-5 pb-4"
        style={{ color: "var(--rz-text-3)" }}
      >
        <Divider className="mb-3" />
        <div className="flex items-center justify-between gap-3 text-[12.5px]">
          <span className="whitespace-nowrap">
            <kbd className="rz-popup-kbd">⌘</kbd>
            <kbd className="rz-popup-kbd">.</kbd>
            <span className="ml-1">to toggle on LinkedIn</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Runs locally
          </span>
        </div>
      </footer>

      <style>{`
        .rz-popup-kbd {
          display: inline-block;
          min-width: 16px;
          padding: 1px 4px;
          margin: 0 1px;
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: var(--rz-text-2);
          background: var(--rz-card-bg);
          border: 1px solid var(--rz-border);
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </main>
  );
}

function PopupActions() {
  const openLinkedInPanel = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    event.preventDefault();
    const url = "https://www.linkedin.com/in/me/";
    try {
      chrome?.storage?.local?.set?.(
        { [SIDEBAR_OPEN_REQUEST_KEY]: Date.now() },
        () => {
          chrome.tabs.create({ url }, () => {
            void chrome.runtime.lastError;
          });
        },
      );
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card padded="md" className="rz-action-card rz-popup-rounded-card rz-pop-in">
      <div className="relative z-[1] flex flex-col gap-2.5">
        <Button
          href="https://www.linkedin.com/in/me/"
          variant="primary"
          size="lg"
          block
          onClick={openLinkedInPanel}
          trailingIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
          className="rz-btn-hero rz-sheen"
        >
          Optimize my LinkedIn
        </Button>
        <Button
          href="https://rezoomed.com?ref=ext_popup"
          variant="secondary"
          size="md"
          block
          trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          className="rz-btn-dashboard"
        >
          Go to Rezoomed
        </Button>
      </div>
    </Card>
  );
}

function HeroCard({ mascotUrl }: { mascotUrl: string | null }) {
  return (
    <Card padded="lg" className="rz-brand-panel rz-popup-rounded-card rz-pop-in">
      <div className="relative z-[1] flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <Badge tone="pro" icon={<Sparkles className="h-3 w-3" aria-hidden="true" />}>
            Profile coach
          </Badge>
          <h1 className="mt-3 rz-h1">
            Rezoom your LinkedIn profile.
          </h1>
          <p className="mt-2 text-[15px] leading-snug" style={{ color: "var(--rz-text-2)" }}>
            Score your headline, About, experience, skills, and recruiter signals while you edit.
          </p>
        </div>
        <div className="rz-mascot-tile rz-float grid h-[118px] w-[118px] shrink-0 place-items-center overflow-hidden rounded-[18px]">
          {mascotUrl ? (
            <img
              src={mascotUrl}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <ProfileCardIllustration className="h-[96px] w-[130px]" />
          )}
        </div>
      </div>
    </Card>
  );
}

function ScanCard({ lastScan }: { lastScan: LastScan | null }) {
  if (!lastScan) {
    return (
      <Card padded="lg" className="rz-pop-in">
        <div className="flex items-center gap-4">
          <div
            className="grid h-[82px] w-[104px] shrink-0 place-items-center rounded-[8px]"
            style={{
              background: "var(--rz-card-bg-alt)",
              border: "1px solid var(--rz-border)",
            }}
          >
            <ProfileCardIllustration className="h-[70px] w-[104px]" />
          </div>
          <div className="min-w-0">
            <p className="rz-eyebrow">Profile Optimizer</p>
            <p
              className="mt-2 text-[19px] font-extrabold leading-snug"
              style={{ color: "var(--rz-text)" }}
            >
              Open LinkedIn to run your first scan.
            </p>
            <p
              className="mt-1.5 text-[14.5px] leading-snug"
              style={{ color: "var(--rz-text-2)" }}
            >
              Your score appears here after the sidebar scans your profile.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const ratio = lastScan.score / 100;
  const severity = severityFromRatio(ratio);
  const ago = formatAgo(lastScan.ts);

  return (
    <Card padded="lg" className="rz-pop-in">
      <div className="flex items-center gap-5">
        <MiniScoreRing score={lastScan.score} />
        <div className="min-w-0 flex-1">
          <Stat
            label="Last profile score"
            value={lastScan.score}
            suffix="/100"
            size="lg"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <Badge tone={severity === "good" ? "success" : severity === "warning" ? "warning" : "critical"}>
              {severity === "good"
                ? "On track"
                : severity === "warning"
                  ? "Room to improve"
                  : "Needs attention"}
            </Badge>
            <span style={{ color: "var(--rz-text-3)" }}>Scanned {ago}</span>
          </div>
        </div>
      </div>
      <ScoreWaveSvg className="mt-4 h-10 w-full opacity-80" />
    </Card>
  );
}

function MiniScoreRing({ score }: { score: number }) {
  const ratio = score / 100;
  const severity = severityFromRatio(ratio);
  const color =
    severity === "good"
      ? "var(--rz-good-solid)"
      : severity === "warning"
        ? "var(--rz-warning-solid)"
        : "var(--rz-critical-solid)";
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  return (
    <div
      className="relative grid h-[86px] w-[86px] shrink-0 place-items-center rounded-[8px]"
      style={{
        background: "var(--rz-card-bg-alt)",
        border: "1px solid var(--rz-border)",
      }}
    >
      <svg viewBox="0 0 76 76" className="absolute inset-1 -rotate-90">
        <circle cx="38" cy="38" r={radius} stroke="var(--rz-border)" strokeWidth="7" fill="none" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - ratio * circ}
        />
      </svg>
      <SeverityDot severity={severity} size="sm" className="absolute right-2 top-2 rz-score-pulse" />
      <span className="rz-num text-[22px] font-extrabold" style={{ color: "var(--rz-text)" }}>
        {score}
      </span>
    </div>
  );
}

function SignalTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card padded="sm" className="text-center">
      <span
        className="mx-auto grid h-8 w-8 place-items-center rounded-[8px]"
        style={{ background: "var(--rz-card-bg-alt)", color: tone }}
      >
        {icon}
      </span>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--rz-text-3)" }}>
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-extrabold" style={{ color: "var(--rz-text)" }}>
        {value}
      </p>
    </Card>
  );
}

function formatAgo(ts: number): string {
  const ms = Date.now() - ts;
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
}
