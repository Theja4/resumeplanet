import { useEffect, useState } from "react";
import { Sparkles, ChevronRight, X } from "lucide-react";

const KEY = "rezoomed.onboarded.v1";

const STEPS = [
  {
    title: "Welcome to Rezoomed",
    body: "I scan your profile in real time and surface what recruiters look for. Watch the score update as you edit.",
  },
  {
    title: "Tabs split the work",
    body: "Overview shows the big picture. Fixes lists what to improve. Rewrites generates AI edits. Match scores against a JD.",
  },
  {
    title: "Tip — collapse anytime",
    body: "Press ⌘. (Ctrl+. on Windows) to collapse this sidebar to a thin rail. Re-press to bring it back.",
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") {
        // Slight delay so the score has time to animate in first.
        const t = window.setTimeout(() => setShow(true), 900);
        return () => window.clearTimeout(t);
      }
    } catch {
      // private mode — skip the tour rather than nag every load.
    }
    return undefined;
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="rz-fade-in fixed inset-0 z-[2147483647] grid place-items-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={finish}
    >
      <div
        className="mx-4 max-w-sm overflow-hidden rounded-3xl"
        style={{
          background: "var(--rz-canvas-2)",
          backdropFilter: "blur(24px) saturate(170%)",
          WebkitBackdropFilter: "blur(24px) saturate(170%)",
          border: "1px solid var(--rz-border-strong)",
          boxShadow: "var(--rz-shadow-rail)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--rz-gradient)", color: "var(--rz-on-primary)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
              {step + 1} of {STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-md p-1 transition hover:bg-white/15"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[18px] font-extrabold leading-tight">{current.title}</p>
          <p
            className="mt-2.5 text-[14px] leading-snug"
            style={{ color: "var(--rz-on-surface-2)" }}
          >
            {current.body}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-6 rounded-full transition"
                  style={{
                    background:
                      i === step ? "var(--rz-primary)" : "var(--rz-surface-3)",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={finish}
                className="rounded-xl px-3 py-2 text-[13px] font-semibold transition"
                style={{ color: "var(--rz-on-surface-3)" }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => (isLast ? finish() : setStep(step + 1))}
                className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-bold transition hover:-translate-y-px"
                style={{
                  background: "var(--rz-gradient)",
                  color: "var(--rz-on-primary)",
                  boxShadow: "var(--rz-shadow-pop)",
                }}
              >
                {isLast ? "Get started" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
