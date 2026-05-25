import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface Props {
  value: number;
  earned: number;
  available: number;
}

function statusFor(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: "Strong", tone: "var(--rz-primary)" };
  if (score >= 60) return { label: "Good — room to grow", tone: "var(--rz-warn)" };
  if (score >= 40) return { label: "Needs work", tone: "var(--rz-warn)" };
  return { label: "Major gaps", tone: "var(--rz-danger)" };
}

export function ScoreHero({ value, earned, available }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;
    const startedAt = performance.now();
    const duration = 800;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + delta * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const status = statusFor(display);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (display / 100) * circumference;

  return (
    <section className="rz-fade-in mx-4 mt-2 mb-4">
      <div
        className="relative overflow-hidden rounded-3xl p-5"
        style={{
          background: "var(--rz-glass)",
          backdropFilter: "blur(24px) saturate(170%)",
          WebkitBackdropFilter: "blur(24px) saturate(170%)",
          border: "1px solid var(--rz-border)",
          boxShadow: "var(--rz-shadow-card)",
        }}
      >
        {/* Soft inner glow behind the ring. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-10 h-[180px] w-[180px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(128,218,146,0.35) 0%, rgba(128,218,146,0) 70%)" }}
        />

        <div className="relative flex items-center gap-5">
          <div className="relative grid h-[124px] w-[124px] shrink-0 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <defs>
                <linearGradient id="rz-score-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a3ffb3" />
                  <stop offset="55%" stopColor="#80da92" />
                  <stop offset="100%" stopColor="#026d32" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="url(#rz-score-grad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition: "stroke-dashoffset 60ms linear",
                  filter: "drop-shadow(0 0 10px rgba(128,218,146,0.55))",
                }}
              />
            </svg>
            <div className="text-center leading-none">
              <div
                className="text-[44px] font-extrabold leading-none tracking-tight"
                style={{ color: "var(--rz-on-surface)" }}
              >
                {display}
              </div>
              <div
                className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--rz-on-surface-3)" }}
              >
                of 100
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: "var(--rz-primary-soft)",
                color: status.tone,
                border: "1px solid var(--rz-border-strong)",
              }}
            >
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {status.label}
            </p>
            <p
              className="mt-3 text-[26px] font-extrabold leading-none tracking-tight"
              style={{ color: "var(--rz-on-surface)" }}
            >
              {earned}
              <span
                className="text-[18px] font-bold"
                style={{ color: "var(--rz-on-surface-3)" }}
              >
                {" "}/ {available}
              </span>
            </p>
            <p
              className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--rz-on-surface-3)" }}
            >
              points earned
            </p>
          </div>
        </div>

        <p
          className="relative mt-4 text-[13px] leading-snug"
          style={{ color: "var(--rz-on-surface-2)" }}
        >
          Unread sections are excluded. Keep editing to push above 80.
        </p>
      </div>
    </section>
  );
}
