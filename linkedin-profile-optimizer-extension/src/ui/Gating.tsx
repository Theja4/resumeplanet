import { useEffect, useState } from "react";
import { LogIn, Lock, Sparkles } from "lucide-react";

import { signIn } from "../auth/auth";
import { aliasToUser, track } from "../telemetry/events";
import { fetchMe, HttpError, type MeResponse } from "../auth/api";

interface GatingState {
  status: "loading" | "anonymous" | "authed";
  me: MeResponse | null;
}

interface GatingProps {
  children: (state: GatingState) => React.ReactNode;
}

// Centralizes "is the user signed in?" so every consumer in the panel reads
// the same state. Anonymous users see the score number + top 2 issues only;
// authed users see the full breakdown plus consistency gap and Pro CTAs.
export function GatingProvider({ children }: GatingProps) {
  const [state, setState] = useState<GatingState>({ status: "loading", me: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        await aliasToUser(me.userId);
        setState({ status: "authed", me });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof HttpError && err.status === 401) {
          setState({ status: "anonymous", me: null });
        } else {
          // Network failure — treat as anonymous so the teaser still works.
          setState({ status: "anonymous", me: null });
        }
      }
    }
    void load();

    // Re-check on focus: when the auth tab closes and the LinkedIn tab
    // regains focus, the panel should pick up the new token without the
    // user having to reopen the page.
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return <>{children(state)}</>;
}

export interface SignInPromptProps {
  surface: "panel" | "consistency_card";
  title: string;
  body: string;
  cta?: string;
  onSignedIn?: (me: MeResponse) => void;
}

export function SignInPrompt({
  surface,
  title,
  body,
  cta = "Sign in with Rezoomed",
  onSignedIn,
}: SignInPromptProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    void track({ name: "signup_started", props: { surface } });
    const result = await signIn();
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    try {
      const me = await fetchMe();
      void track({ name: "signup_completed", props: { surface } });
      await aliasToUser(me.userId);
      onSignedIn?.(me);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5"
      style={{
        background: "var(--rz-glass)",
        backdropFilter: "blur(24px) saturate(170%)",
        WebkitBackdropFilter: "blur(24px) saturate(170%)",
        border: "1px solid var(--rz-border-strong)",
        boxShadow: "var(--rz-shadow-card)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-[180px] w-[180px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(128,218,146,0.5) 0%, rgba(128,218,146,0) 70%)" }}
      />
      <div className="relative flex items-start gap-3.5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: "var(--rz-gradient)", boxShadow: "var(--rz-shadow-pop)" }}
          aria-hidden="true"
        >
          <Lock className="h-5 w-5" style={{ color: "var(--rz-on-primary)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold leading-tight">{title}</p>
          <p className="mt-2 text-[14px] leading-snug" style={{ color: "var(--rz-on-surface-2)" }}>
            {body}
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold transition hover:-translate-y-px disabled:opacity-60"
            style={{
              background: "var(--rz-gradient)",
              color: "var(--rz-on-primary)",
              boxShadow: "var(--rz-shadow-pop)",
            }}
            disabled={busy}
            onClick={handleClick}
            type="button"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {busy ? "Opening Rezoomed…" : cta}
          </button>
          {error ? (
            <p className="mt-3 text-[13px]" style={{ color: "var(--rz-danger)" }}>
              Couldn't complete sign-in ({error}). Try again or open Rezoomed in a tab
              and sign in there first.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export interface ProCtaProps {
  section: string;
  label?: string;
}

// Per-section "Fix this (Pro)" link. Routes to /pricing in the existing app —
// checkout already works there for both Polar and Razorpay.
export function ProCta({ section, label = "Fix this (Pro)" }: ProCtaProps) {
  return (
    <a
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold transition hover:-translate-y-px"
      style={{
        background: "var(--rz-primary-soft)",
        color: "var(--rz-primary)",
        border: "1px solid var(--rz-border-strong)",
      }}
      href="https://rezoomed.com/pricing?ref=ext_pro_cta"
      onClick={() => track({ name: "pro_cta_clicked", props: { section } })}
      rel="noreferrer noopener"
      target="_blank"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </a>
  );
}
