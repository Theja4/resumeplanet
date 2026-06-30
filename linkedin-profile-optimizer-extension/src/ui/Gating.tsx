import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, LogIn, Sparkles } from "lucide-react";

import { isLoggedIn, signIn, signOut as authSignOut } from "../auth/auth";
import { aliasToUser, track } from "../telemetry/events";
import { fetchMe, type MeResponse } from "../auth/api";
import { Button, Card } from "./components";

interface GatingState {
  status: "loading" | "anonymous" | "authed";
  me: MeResponse | null;
  /** Clears the stored token and flips the panel back to anonymous. */
  signOut: () => void;
}

interface GatingProps {
  children: (state: GatingState) => React.ReactNode;
}

/**
 * Centralizes "is the user signed in?" so every consumer in the panel
 * reads the same state. Anonymous users see the score number + top 2
 * issues only; authed users see the full breakdown plus consistency
 * gap and Pro CTAs.
 */
export function GatingProvider({ children }: GatingProps) {
  const [state, setState] = useState<{
    status: GatingState["status"];
    me: MeResponse | null;
  }>({ status: "loading", me: null });

  useEffect(() => {
    let cancelled = false;
    let lastFocusCheck = 0;
    const FOCUS_RECHECK_MS = 60 * 1000;

    async function load() {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        await aliasToUser(me.userId);
        setState({ status: "authed", me });
      } catch {
        if (cancelled) return;
        // 401 or any other failure: treat as anonymous. The exact status
        // doesn't change the outcome, so we don't branch on it.
        setState({ status: "anonymous", me: null });
      }
    }
    void load();

    // Re-validate on focus so a sign-in completed in another tab (the auth
    // tab closing returns focus here) flips the panel to authed, and a Pro
    // upgrade is picked up. But skip the /me round-trip when there's no
    // token to validate — otherwise every alt-tab hit the network — and
    // throttle to once a minute for an already-authed user.
    const onFocus = () => {
      void (async () => {
        if (!(await isLoggedIn())) return;
        const now = Date.now();
        if (now - lastFocusCheck < FOCUS_RECHECK_MS) return;
        lastFocusCheck = now;
        void load();
      })();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const signOut = useCallback(() => {
    setState({ status: "anonymous", me: null });
    void authSignOut();
  }, []);

  return <>{children({ ...state, signOut })}</>;
}

export interface SignInPromptProps {
  surface: "panel" | "consistency_card";
  title: string;
  body: string;
  cta?: string;
  /** Tight layout: no left icon tile, no benefit grid, mid-size button. */
  compact?: boolean;
  onSignedIn?: (me: MeResponse) => void;
}

export function useSignInAction({
  surface,
  onSignedIn,
}: {
  surface: SignInPromptProps["surface"];
  onSignedIn?: (me: MeResponse) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setBusy(true);
    setError(null);
    void track({ name: "signup_started", props: { surface } });
    try {
      const result = await signIn();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const me = await fetchMe();
      void track({ name: "signup_completed", props: { surface } });
      await aliasToUser(me.userId);
      onSignedIn?.(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "sign_in_failed");
    } finally {
      setBusy(false);
    }
  }, [onSignedIn, surface]);

  return { busy, error, handleClick };
}

export function SignInPrompt({
  surface,
  title,
  body,
  cta = "Sign in with Rezoomed",
  compact = false,
  onSignedIn,
}: SignInPromptProps) {
  const { busy, error, handleClick } = useSignInAction({ surface, onSignedIn });

  if (compact) {
    return (
      <Card padded="md" className="rz-unlock-card rz-brand-panel">
        <div className="relative z-[1]">
          <p
            className="text-[17px] font-bold leading-tight tracking-[-0.014em]"
            style={{ color: "var(--rz-text)" }}
          >
            {title}
          </p>
          <p
            className="mt-1 text-[13.5px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            {body}
          </p>
          <div className="mt-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleClick}
              loading={busy}
              icon={<LogIn className="h-4 w-4" aria-hidden="true" />}
              className="rz-btn-hero rz-btn-auth rz-sheen rz-cta-glow"
              block
            >
              {busy ? "Opening Rezoomed…" : cta}
            </Button>
          </div>
          {error ? (
            <p
              className="mt-2 text-[12px]"
              style={{ color: "var(--rz-critical-text)" }}
            >
              Couldn't complete sign-in ({error}).
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card padded="lg" className="rz-unlock-card rz-brand-panel">
      <div className="relative z-[1] flex items-start gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px]"
          style={{
            background: "var(--rz-primary-soft)",
            color: "var(--rz-primary)",
            border: "1px solid var(--rz-border-strong)",
          }}
          aria-hidden="true"
        >
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.09em]"
            style={{
              background: "var(--rz-card-bg-alt)",
              color: "var(--rz-primary)",
              border: "1px solid var(--rz-border)",
            }}
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Rezoomed account
          </div>
          <p
            className="mt-3 text-[19px] font-bold leading-tight tracking-[-0.014em]"
            style={{ color: "var(--rz-text)" }}
          >
            {title}
          </p>
          <p
            className="mt-1.5 text-[15.5px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            {body}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniBenefit label="Full score map" />
            <MiniBenefit label="AI rewrites" />
          </div>
          <div className="mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleClick}
              loading={busy}
              icon={<LogIn className="h-5 w-5" aria-hidden="true" />}
              trailingIcon={<ArrowRight className="h-5 w-5" aria-hidden="true" />}
              className="rz-btn-hero rz-sheen"
              block
            >
              {busy ? "Opening Rezoomed…" : cta}
            </Button>
          </div>
          {error ? (
            <p
              className="mt-2 text-[12px]"
              style={{ color: "var(--rz-critical-text)" }}
            >
              Couldn't complete sign-in ({error}). Try again or open Rezoomed in
              a tab and sign in there first.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function MiniBenefit({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-2 text-[12.5px] font-semibold"
      style={{
        background: "var(--rz-card-bg)",
        color: "var(--rz-text-2)",
        border: "1px solid var(--rz-border)",
      }}
    >
      <CheckCircle2
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: "var(--rz-primary)" }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export interface ProCtaProps {
  section: string;
  label?: string;
}

/**
 * Per-section "Fix this with Pro" link. Routes to the same /pricing
 * page the rest of the app uses, with a section-tagged ref param so
 * we can attribute conversions in the dashboard.
 */
export function ProCta({ section, label = "Fix with Pro" }: ProCtaProps) {
  return (
    <Button
      variant="secondary"
      size="sm"
      href={`https://rezoomed.com/pricing?ref=ext_${encodeURIComponent(section)}`}
      onClick={() => void track({ name: "pro_cta_clicked", props: { section } })}
      icon={<Lock className="h-3.5 w-3.5" aria-hidden="true" />}
    >
      {label}
    </Button>
  );
}
