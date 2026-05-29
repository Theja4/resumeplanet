import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";

import { Button } from "./components";

const KEY = "rezoomed.onboarded.v1";

interface Step {
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    eyebrow: "Welcome",
    title: "Real-time profile coach",
    body:
      "Rezoomed scans your profile in real time and surfaces what recruiters look for. Watch the score update as you edit.",
  },
  {
    eyebrow: "Workflow",
    title: "Two tabs, focused work",
    body:
      "My Profile shows your section-by-section score with severity pills and inline AI rewrites. Job Match scores you against any JD.",
  },
  {
    eyebrow: "Pro tip",
    title: "Collapse anytime",
    body:
      "Press ⌘. (Ctrl+. on Windows) to collapse this sidebar to a thin rail. Re-press to bring it back.",
  },
];

/**
 * Three-step onboarding shown on first run. Persists a single
 * `rezoomed.onboarded.v1=1` flag in localStorage so it never repeats.
 *
 * Stripe-grade rebuild — flat card, numbered step indicator, no
 * orb pulses, no gem badges.
 */
export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") {
        const t = window.setTimeout(() => setShow(true), 700);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
    return undefined;
  }, []);

  // Auto-focus the primary CTA on each step.
  useEffect(() => {
    if (!show) return;
    const id = window.requestAnimationFrame(() => {
      nextBtnRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [show, step]);
  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  // Escape closes the tour.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const advance = () => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  if (!show) return null;
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="rz-fade-in fixed inset-0 z-[2147483647] grid place-items-center"
      style={{ background: "var(--rz-overlay)" }}
      onClick={finish}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rz-tour-title"
        className="rz-scale-in relative mx-4 w-[min(380px,calc(100vw-32px))]"
        style={{
          background: "var(--rz-card-bg)",
          border: "1px solid var(--rz-border)",
          borderRadius: "var(--rz-radius-lg)",
          boxShadow: "var(--rz-shadow-md)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={finish}
          className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-md transition"
          style={{
            color: "var(--rz-text-3)",
          }}
          aria-label="Skip tour"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--rz-card-bg-alt)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-text-3)";
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="px-6 pb-5 pt-7">
          <p
            className="rz-eyebrow"
            style={{ color: "var(--rz-primary)" }}
          >
            {current.eyebrow} · {step + 1} / {STEPS.length}
          </p>
          <p
            id="rz-tour-title"
            className="mt-2 rz-h2"
            style={{ color: "var(--rz-text)" }}
          >
            {current.title}
          </p>
          <p
            className="mt-2 rz-body"
            style={{ color: "var(--rz-text-2)" }}
          >
            {current.body}
          </p>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 rounded-full"
                  style={{
                    width: i === step ? 18 : 6,
                    background:
                      i === step ? "var(--rz-primary)" : "var(--rz-border)",
                    transition:
                      "width 220ms var(--rz-ease), background 200ms ease",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="tertiary" size="sm" onClick={finish}>
                Skip
              </Button>
              <span
                ref={(node) => {
                  if (node) {
                    const btn = node.querySelector("button");
                    if (btn) nextBtnRef.current = btn as HTMLButtonElement;
                  }
                }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  onClick={advance}
                  trailingIcon={<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                >
                  {isLast ? "Get started" : "Next"}
                </Button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
