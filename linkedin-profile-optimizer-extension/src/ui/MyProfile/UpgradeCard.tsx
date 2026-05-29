import { Check, Lock } from "lucide-react";
import { Button, Card } from "../components";
import { track } from "../../telemetry/events";

interface Props {
  /** Where the user clicked from — sent to telemetry + the pricing ref. */
  source: string;
  onDismiss?: () => void;
  className?: string;
}

const FEATURES = [
  "AI rewrites for your headline, About, experience and skills",
  "Resume ↔ LinkedIn consistency check (auto-fix)",
  "Priority queue and unlimited regenerations",
];

/**
 * Inline upgrade card. Replaces the previous gradient-and-sparkles
 * "Pro feature" overlay. Shown right where the user tries to take
 * a Pro action (e.g. clicking "AI rewrite" as a free user).
 */
export function UpgradeCard({ source, onDismiss, className = "" }: Props) {
  const href = `https://rezoomed.com/pricing?ref=ext_${encodeURIComponent(source)}`;
  return (
    <Card padded="md" tone="default" className={`rz-fade-in ${className}`}>
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md"
          style={{
            background: "var(--rz-primary-soft)",
            color: "var(--rz-primary)",
          }}
        >
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug" style={{ color: "var(--rz-text)" }}>
            AI rewrites are a Pro feature
          </p>
          <p
            className="mt-1 text-[13px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            Generate recruiter-ready copy for every section, tuned to your target role.
          </p>
          <ul className="mt-3 space-y-1.5">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: "var(--rz-text-2)" }}
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--rz-primary)" }}
                  aria-hidden="true"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <Button
              href={href}
              variant="primary"
              size="sm"
              onClick={() =>
                void track({ name: "pro_cta_clicked", props: { section: source } })
              }
            >
              Upgrade to Pro
            </Button>
            {onDismiss ? (
              <Button variant="tertiary" size="sm" onClick={onDismiss}>
                Maybe later
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
