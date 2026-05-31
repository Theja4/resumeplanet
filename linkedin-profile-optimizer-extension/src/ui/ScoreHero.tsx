import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Card } from "./components";
import {
  aggregateSeverity,
  severityFromRatio,
  type AggregateSeverity,
  type Severity,
} from "../scoring/severity";
import type { ScoreResult } from "../scoring/types";

interface Props {
  score: ScoreResult;
  /**
   * Drives the right-column messaging + the one-time "potential peek"
   * animation. Free users with room to grow see the ring sweep up to
   * their potential, hold, then settle on actual score (loss-aversion
   * cue). Pro users get a calmer reveal.
   */
  isFree?: boolean;
}

const RADIUS = 42;
const CIRC = 2 * Math.PI * RADIUS;

const RECRUITER_TIER = 88;
const TOP_TIER = 95;

function severityColor(s: Severity): string {
  if (s === "good")    return "var(--rz-good-solid)";
  if (s === "warning") return "var(--rz-warning-solid)";
  return "var(--rz-critical-solid)";
}

export function ScoreHero({ score, isFree = true }: Props) {
  const [display, setDisplay] = useState(0);
  const [peakDelta, setPeakDelta] = useState(false);
  const hasPeekedRef = useRef(false);

  const agg = aggregateSeverity(score);
  const lift = Math.min(100 - score.total, Math.round(agg.totalPointsLost));
  const potential = score.total + lift;

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const startValue = display;
    const shouldPeek = !hasPeekedRef.current && isFree && lift > 0;

    if (shouldPeek) {
      hasPeekedRef.current = true;
      const PHASE_UP = 850;
      const PHASE_HOLD = 480;
      const PHASE_DOWN = 700;
      const peakValue = potential;

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        let val: number;
        if (elapsed < PHASE_UP) {
          const t = elapsed / PHASE_UP;
          const eased = 1 - Math.pow(1 - t, 3);
          val = Math.round(eased * peakValue);
        } else if (elapsed < PHASE_UP + PHASE_HOLD) {
          val = peakValue;
        } else if (elapsed < PHASE_UP + PHASE_HOLD + PHASE_DOWN) {
          const t = (elapsed - PHASE_UP - PHASE_HOLD) / PHASE_DOWN;
          const eased = 1 - Math.pow(1 - t, 3);
          val = Math.round(peakValue - eased * (peakValue - score.total));
        } else {
          setDisplay(score.total);
          setPeakDelta(true);
          return;
        }
        setDisplay(val);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }

    const delta = score.total - startValue;
    if (delta === 0) {
      setPeakDelta(true);
      return;
    }
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startValue + delta * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else setPeakDelta(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score.total]);

  const ratio = display / 100;
  const overall = severityFromRatio(score.total / 100);
  const ringColor = severityColor(severityFromRatio(ratio));
  const offset = CIRC - ratio * CIRC;

  return (
    <section className="rz-fade-in mx-2 mt-2 mb-3">
      <Card padded="sm" className="rz-card-elev rz-hero-feature">
        <div className="relative z-[1] rz-hero-live">
          <span className="rz-hero-eq" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span className="rz-hero-live-pulse" aria-hidden="true" />
          Real-time <b>LinkedIn</b> scan
        </div>

        {/* One horizontal row: ring · potential leap · severity chips */}
        <div className="relative z-[1] mt-3 flex flex-wrap items-center gap-3">
          <ScoreRing
            display={display}
            offset={offset}
            color={ringColor}
          />

          <div className="min-w-0 flex-1">
            {isFree ? (
              <FreePotential
                current={score.total}
                potential={potential}
                lift={lift}
                peakDelta={peakDelta}
              />
            ) : (
              <ProHeadline overall={overall} agg={agg} />
            )}
          </div>

          <SeverityChips agg={agg} />
        </div>

        <div className="relative z-[1] mt-4">
          <GoalLadder score={score.total} />
        </div>
      </Card>
    </section>
  );
}

function ScoreRing({
  display,
  offset,
  color,
}: {
  display: number;
  offset: number;
  color: string;
}) {
  return (
    <div
      className="rz-hero-ring relative grid h-[88px] w-[88px] shrink-0 place-items-center"
      role="img"
      aria-label={`Score ${display} of 100`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--rz-border)"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 60ms linear, stroke 200ms var(--rz-ease)" }}
        />
      </svg>
      <div
        className="text-center rz-num leading-none"
        style={{ color: "var(--rz-text)", fontVariantNumeric: "tabular-nums" }}
      >
        <div className="text-[36px] font-bold leading-none tracking-[-0.035em]">
          {display}
        </div>
        <div
          className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--rz-text-3)" }}
        >
          of 100
        </div>
      </div>
    </div>
  );
}

/**
 * Free-user headline — the "current → potential" leap. The ring already
 * shows the current score; this frames the *gain*: a muted red current
 * number flowing through a red→emerald arrow into a big glowing emerald
 * potential, with the point lift as a floating pill that reveals after
 * the ring's one-time peek animation settles (loss-aversion cue).
 */
function FreePotential({
  current,
  potential,
  lift,
  peakDelta,
}: {
  current: number;
  potential: number;
  lift: number;
  peakDelta: boolean;
}) {
  if (lift <= 0) {
    return (
      <div>
        <p className="rz-hero-eyebrow">Potential score</p>
        <div className="mt-1.5 flex items-end gap-3">
          <span className="rz-hero-pot rz-num" data-v={String(current)}>
            <span className="rz-hero-pot-g">{current}</span>
          </span>
          <span className="rz-hero-topflag">Top of the pool</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="rz-hero-eyebrow">Potential score</p>
      <div
        className="mt-1.5 rz-hero-leap"
        role="img"
        aria-label={`Current score ${current}, potential ${potential} — up ${lift} points`}
      >
        <span className="rz-hero-from rz-num">{current}</span>
        <span className="rz-hero-arrow" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="rzLeapArrow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ff6b7d" />
                <stop offset="1" stopColor="#25e08a" />
              </linearGradient>
            </defs>
            <path d="M4 12h15M13 6l6 6-6 6" stroke="url(#rzLeapArrow)" />
          </svg>
        </span>
        <span className="rz-hero-pot rz-num" data-v={String(potential)}>
          <span className="rz-hero-pot-g">{potential}</span>
        </span>
        <span
          className="rz-hero-gain rz-num"
          style={{
            opacity: peakDelta ? 1 : 0,
            transform: peakDelta ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 380ms var(--rz-ease-out), transform 380ms var(--rz-ease-out)",
          }}
        >
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          +{lift}
        </span>
      </div>
    </div>
  );
}

function ProHeadline({
  overall,
  agg,
}: {
  overall: Severity;
  agg: AggregateSeverity;
}) {
  const headline =
    overall === "good" ? "Strong profile" : overall === "warning" ? "Room to grow" : "Needs work";
  const focus = agg.worstSection && agg.criticalCount + agg.warningCount > 0
    ? `Focus on ${agg.worstSection.label.toLowerCase()}.`
    : "Keep momentum — nothing critical.";

  return (
    <div>
      <p
        className="text-[20px] font-bold leading-tight tracking-[-0.014em]"
        style={{ color: "var(--rz-text)" }}
      >
        {headline}
      </p>
      <p
        className="mt-0.5 text-[12.5px] leading-snug"
        style={{ color: "var(--rz-text-3)" }}
      >
        {focus}
      </p>
    </div>
  );
}

/**
 * Severity breakdown as glass chips with breathing severity dots — sits
 * full-width under the score so it reads cleanly on the dark hero.
 */
function SeverityChips({
  agg,
}: {
  agg: AggregateSeverity;
}) {
  const items: Array<{ severity: Severity; count: number; label: string }> = [];
  if (agg.criticalCount > 0) items.push({ severity: "critical", count: agg.criticalCount, label: "critical" });
  if (agg.warningCount > 0)  items.push({ severity: "warning",  count: agg.warningCount,  label: "needs work" });
  if (agg.goodCount > 0)     items.push({ severity: "good",     count: agg.goodCount,     label: "good" });

  if (items.length === 0) return null;

  return (
    <div className="rz-hero-chips">
      {items.map((it) => (
        <span key={it.severity} className="rz-hero-chip">
          <span className="rz-hero-cdot" data-sev={it.severity} aria-hidden="true" />
          <b className="rz-num">{it.count}</b>
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

type LadderPalette = { solid: string; deep: string; glow: string };

function ladderPaletteFor(s: Severity): LadderPalette {
  if (s === "critical") return { solid: "#fb7185", deep: "#f43f5e", glow: "251,113,133" };
  if (s === "warning")  return { solid: "#fbbf24", deep: "#f59e0b", glow: "251,191,36" };
  return { solid: "#2ee88f", deep: "#14b87a", glow: "46,232,143" };
}

/**
 * Compact recruiter-visibility ladder on the dark hero. Plots the score
 * against the 88-pt recruiter cutoff (or 95-pt top tier once cleared):
 * a "You · N" pin above the bar, the cutoff marker + label below-right
 * (anchored so it can't clip the edge), and a one-line gap narration.
 * Colours follow severity (red/amber → cutoff green) so distance to the
 * goal reads at a glance.
 */
function GoalLadder({ score }: { score: number }) {
  const [fillWidth, setFillWidth] = useState(0);
  const [userLeft, setUserLeft] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setFillWidth(score);
      setUserLeft(score);
    });
    return () => cancelAnimationFrame(id);
  }, [score]);

  const belowRecruiter = score < RECRUITER_TIER;
  const belowTop = score < TOP_TIER;
  const milestone = belowRecruiter
    ? { score: RECRUITER_TIER, label: "Recruiter cutoff" }
    : belowTop
      ? { score: TOP_TIER, label: "Top tier" }
      : null;

  const pal = ladderPaletteFor(severityFromRatio(score / 100));
  const dotBorder = "#0c1016";

  const subtext = (() => {
    if (belowRecruiter) {
      const gap = RECRUITER_TIER - score;
      return `You're ${gap} ${gap === 1 ? "point" : "points"} short of the ${RECRUITER_TIER}-point cutoff — where recruiters start surfacing profiles.`;
    }
    if (belowTop) {
      const gap = TOP_TIER - score;
      return `You've cleared the ${RECRUITER_TIER}-point recruiter cutoff. ${gap} ${gap === 1 ? "point" : "points"} to the ${TOP_TIER}-point top tier.`;
    }
    return `You're past the ${TOP_TIER}-point top tier — strong recruiter visibility.`;
  })();

  // Clamp the user-pin's center so the tag never spills off either edge.
  const pinLeft = Math.min(90, Math.max(10, userLeft));

  return (
    <div>
      {/* "You · N" pin above the bar */}
      <div className="relative" style={{ height: 22 }} aria-hidden="true">
        <div
          className="absolute flex flex-col items-center"
          style={{
            bottom: 3,
            left: `${pinLeft}%`,
            transform: "translateX(-50%)",
            transition: "left 900ms var(--rz-ease-out)",
          }}
        >
          <span
            className="rounded-[7px] px-2 py-0.5 text-[10.5px] font-bold rz-num whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, ${pal.solid} 0%, ${pal.deep} 100%)`,
              color: "#1a1206",
              boxShadow: `0 6px 16px -6px rgba(${pal.glow},0.6)`,
            }}
          >
            You · {score}
          </span>
          <span
            className="block h-0 w-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `5px solid ${pal.solid}`,
            }}
          />
        </div>
      </div>

      {/* The bar */}
      <div
        className="relative rounded-full"
        style={{
          height: 8,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
        role="img"
        aria-label={
          belowRecruiter
            ? `Score ${score}, ${RECRUITER_TIER - score} points to the recruiter cutoff.`
            : belowTop
              ? `Score ${score}, past recruiter cutoff. ${TOP_TIER - score} points to top tier.`
              : `Score ${score}, past top tier.`
        }
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, fillWidth))}%`,
            background: `linear-gradient(90deg, ${pal.deep} 0%, ${pal.solid} 100%)`,
            boxShadow: `0 0 14px -2px rgba(${pal.glow},0.55)`,
            transition: "width 900ms var(--rz-ease-out), background 320ms var(--rz-ease)",
          }}
        />

        {/* Cutoff marker — always emerald (the destination). */}
        {milestone ? (
          <span
            className="absolute top-1/2 rounded-full"
            style={{
              left: `${milestone.score}%`,
              transform: "translate(-50%, -50%)",
              width: 12,
              height: 12,
              background: "#2ee88f",
              border: `2px solid ${dotBorder}`,
              boxShadow: "0 0 0 2px #2ee88f, 0 0 12px 1px rgba(46,232,143,0.6)",
            }}
            aria-hidden="true"
          />
        ) : null}

        {/* User dot — radial gradient in the severity colour. */}
        <span
          className="absolute top-1/2 rounded-full"
          style={{
            left: `${Math.min(100, Math.max(0, userLeft))}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            background: `radial-gradient(circle at 30% 30%, #ffffff, ${pal.solid} 70%)`,
            border: `2.5px solid ${dotBorder}`,
            boxShadow: `0 0 0 2px ${pal.solid}, 0 0 14px 1px rgba(${pal.glow},0.6)`,
            transition: "left 900ms var(--rz-ease-out)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Cutoff label below-right, anchored so it never clips; a thin
          tick links it back up to the marker at the milestone%. */}
      {milestone ? (
        <div className="relative" style={{ height: 22, marginTop: 8 }} aria-hidden="true">
          <span
            className="absolute"
            style={{
              top: -8,
              left: `${milestone.score}%`,
              width: 1,
              height: 8,
              background: "#2ee88f",
              opacity: 0.5,
            }}
          />
          <span
            className="absolute right-0 top-0 rounded-[7px] px-2 py-0.5 text-[10.5px] font-bold rz-num whitespace-nowrap"
            style={{
              color: "#2ee88f",
              background: "rgba(46,232,143,0.12)",
              border: "1px solid rgba(46,232,143,0.28)",
            }}
          >
            {milestone.label} · {milestone.score}
          </span>
        </div>
      ) : null}

      <p
        className="text-[12px] leading-snug"
        style={{ color: "rgba(255,255,255,0.74)", marginTop: milestone ? 6 : 10 }}
      >
        {subtext}
      </p>
    </div>
  );
}
