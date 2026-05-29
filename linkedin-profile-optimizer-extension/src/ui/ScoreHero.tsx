import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Badge, Card, SeverityDot } from "./components";
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
  const fixCount = agg.criticalCount + agg.warningCount;

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
    <section className="rz-fade-in mx-4 mt-2 mb-3">
      <Card padded="md" className="rz-card-elev rz-brand-panel">
        <div className="relative z-[1] flex items-center gap-5">
          <ScoreRing
            display={display}
            offset={offset}
            color={ringColor}
          />

          <div className="min-w-0 flex-1">
            <Badge tone={overall === "good" ? "success" : overall === "warning" ? "warning" : "critical"}>
              Live LinkedIn scan
            </Badge>

            <div className="mt-2">
              {isFree ? (
                <FreeHeadline
                  current={score.total}
                  potential={potential}
                  lift={lift}
                  fixCount={fixCount}
                  peakDelta={peakDelta}
                />
              ) : (
                <ProHeadline overall={overall} agg={agg} />
              )}
            </div>

            <SeverityLegend agg={agg} />
          </div>
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
      className="relative grid h-[122px] w-[122px] shrink-0 place-items-center"
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
        <div className="text-[40px] font-extrabold leading-none">
          {display}
        </div>
        <div
          className="mt-1 text-[11px] font-bold uppercase tracking-[0.06em]"
          style={{ color: "var(--rz-text-3)" }}
        >
          of 100
        </div>
      </div>
    </div>
  );
}

function FreeHeadline({
  current,
  potential,
  lift,
  peakDelta,
}: {
  current: number;
  potential: number;
  lift: number;
  fixCount: number;
  peakDelta: boolean;
}) {
  if (lift <= 0) {
    return (
      <p
        className="text-[18px] font-extrabold leading-tight"
        style={{ color: "var(--rz-text)" }}
      >
        Top of the pool
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[11.5px] font-extrabold uppercase tracking-[0.06em]"
        style={{ color: "var(--rz-text-3)" }}
      >
        Potential
      </span>
      <span
        className="rz-num text-[26px] font-extrabold leading-none"
        style={{ color: "var(--rz-text)" }}
      >
        {potential}
      </span>
      <span
        className="inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 text-[11px] font-bold rz-num"
        style={{
          background: "var(--rz-good-bg)",
          color: "var(--rz-good-text)",
          border: "1px solid var(--rz-good-border)",
          opacity: peakDelta ? 1 : 0,
          transform: peakDelta ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 380ms var(--rz-ease-out), transform 380ms var(--rz-ease-out)",
        }}
      >
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        +{potential - current}
      </span>
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
        className="text-[20px] font-extrabold leading-tight"
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

function SeverityLegend({
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
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {items.map((it, idx) => (
        <span
          key={it.severity}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium"
          style={{ color: "var(--rz-text-2)" }}
        >
          <SeverityDot severity={it.severity} size="sm" />
          <span className="rz-num font-medium" style={{ color: "var(--rz-text)" }}>
            {it.count}
          </span>
          <span style={{ color: "var(--rz-text-3)" }}>{it.label}</span>
          {idx < items.length - 1 ? (
            <span aria-hidden="true" style={{ color: "var(--rz-text-4)" }}>
              ·
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

interface UserPalette {
  /** Strong base color — used for the chip background, pointer, and dot ring. */
  solid: string;
  /** Lighter shade — used on the bar fill's right edge for a soft gradient. */
  light: string;
  /** Translucent halo color matching `solid` — for the dot's outer glow. */
  halo: string;
}

function userPaletteFor(s: Severity): UserPalette {
  if (s === "critical") {
    return {
      solid: "var(--rz-critical-solid)",
      light: "#f87171",
      halo: "rgba(220, 38, 38, 0.42)",
    };
  }
  if (s === "warning") {
    return {
      solid: "var(--rz-warning-solid)",
      light: "#fbbf24",
      halo: "rgba(217, 119, 6, 0.42)",
    };
  }
  return {
    solid: "var(--rz-primary)",
    light: "#1fd07e",
    halo: "rgba(20, 168, 90, 0.50)",
  };
}

/**
 * Recruiter-visibility ladder. The bar plots the user's score against
 * a single anchored milestone (the 88-pt recruiter cutoff). The user
 * pin + bar fill take their colour from `severityFromRatio(score/100)`
 * so red/amber/green narrate distance to the goal; the recruiter
 * cutoff itself is always green (it's the destination).
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

  const userSeverity = severityFromRatio(score / 100);
  const palette = userPaletteFor(userSeverity);

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
  const pinLeft = Math.min(92, Math.max(8, userLeft));

  return (
    <div>
      {/* Floating "You · 76" tag anchored to the user dot. Colour-coded
          by severity so it reads at a glance: red when far below the
          cutoff, amber when close, green once past. The pointer's tip
          extends down past the chip baseline so it visibly meets the
          user dot on the bar instead of floating above it. */}
      <div className="relative h-8" aria-hidden="true">
        <div
          className="absolute bottom-0 flex flex-col items-center"
          style={{
            left: `${pinLeft}%`,
            transform: "translateX(-50%)",
            transition: "left 900ms var(--rz-ease-out)",
          }}
        >
          <span
            className="inline-flex items-center gap-1 rounded-[7px] px-1.5 py-0.5 text-[11px] font-extrabold rz-num whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, ${palette.solid} 0%, ${palette.light} 100%)`,
              color: "#ffffff",
              boxShadow: `0 4px 12px -4px ${palette.halo}, inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
            }}
          >
            You · {score}
          </span>
          <span
            className="block h-0 w-0"
            style={{
              // Slightly bigger pointer so the visual link from the
              // chip down to the user dot reads clearly at a glance.
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `8px solid ${palette.solid}`,
              filter: `drop-shadow(0 1px 1px ${palette.halo})`,
            }}
          />
        </div>
      </div>

      {/* The bar */}
      <div
        className="relative h-2 rounded-full"
        style={{
          background: "var(--rz-card-bg-alt)",
          border: "1px solid var(--rz-border)",
          boxShadow: "inset 0 1px 1px rgba(15, 23, 42, 0.06)",
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
            background: `linear-gradient(90deg, ${palette.solid} 0%, ${palette.light} 100%)`,
            transition:
              "width 900ms var(--rz-ease-out), background 320ms var(--rz-ease)",
            boxShadow: `0 0 12px -2px ${palette.halo}`,
          }}
        />

        {/* Milestone tick — always green because the cutoff is the goal. */}
        {milestone ? (
          <span
            className="absolute top-1/2"
            style={{
              left: `${milestone.score}%`,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden="true"
          >
            <span
              className="grid place-items-center rounded-full"
              style={{
                width: 14,
                height: 14,
                background: "var(--rz-good-solid)",
                border: "2px solid var(--rz-card-bg)",
                boxShadow:
                  "0 0 0 2px var(--rz-good-solid), 0 4px 10px -2px rgba(5, 150, 105, 0.55)",
              }}
            />
          </span>
        ) : null}

        {/* User dot — radial gradient in the severity colour. */}
        <span
          className="absolute top-1/2 rounded-full"
          style={{
            left: `${Math.min(100, Math.max(0, userLeft))}%`,
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            background: `radial-gradient(circle at 30% 30%, #ffffff, ${palette.solid} 70%)`,
            border: "3px solid var(--rz-card-bg)",
            boxShadow: `0 0 0 2px ${palette.solid}, 0 6px 16px -3px ${palette.halo}`,
            transition:
              "left 900ms var(--rz-ease-out), background 320ms var(--rz-ease), box-shadow 320ms var(--rz-ease)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Milestone label below the bar — wrapped in a green chip so the
          colour matches the cutoff tick directly above it. The tick
          line + margin together leave a clear gap below the green dot
          on the bar, so the chip never visually collides with it. */}
      {milestone ? (
        <div className="relative h-12">
          <div
            className="absolute top-0 flex flex-col items-center"
            style={{
              left: `${milestone.score}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span
              className="block w-px"
              style={{
                // 12px tick — clears the user/milestone dots' 3px
                // bottom overhang past the bar plus ~9px of breathing
                // room before the chip starts.
                height: 12,
                background: "var(--rz-good-solid)",
                opacity: 0.7,
              }}
              aria-hidden="true"
            />
            <span
              className="mt-1.5 inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[11px] font-extrabold rz-num whitespace-nowrap"
              style={{
                background: "var(--rz-good-bg)",
                color: "var(--rz-good-text)",
                border: "1px solid var(--rz-good-border)",
              }}
            >
              {milestone.label} · {milestone.score}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-1" />
      )}

      <p
        className="mt-2 text-[12.5px] leading-snug"
        style={{ color: "var(--rz-text-2)" }}
      >
        {subtext}
      </p>
    </div>
  );
}
