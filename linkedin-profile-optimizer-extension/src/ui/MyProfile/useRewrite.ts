import { useCallback, useState } from "react";

import { postGenerate, type GeneratorType, type GenerateResponse } from "../../auth/api";
import { track } from "../../telemetry/events";

export interface UseRewriteArgs {
  checkId: string;
  generator: GeneratorType;
  currentText: string;
  targetRole: string;
  targetJobDescription: string;
  hasResume: boolean;
}

export interface UseRewriteResult {
  result: GenerateResponse | null;
  loading: boolean;
  error: string | null;
  /** Reset state (used when collapsing the rewrite panel). */
  reset: () => void;
  /** Triggers the API call. Returns the result or null on failure. */
  run: () => Promise<GenerateResponse | null>;
}

/**
 * Centralised AI rewrite invocation. Pulled out of RewriteCard so that
 * the new SectionRow can reuse the exact same flow without duplication.
 * Telemetry event `pro_cta_clicked` is preserved on the trigger.
 */
export function useRewrite(args: UseRewriteArgs): UseRewriteResult {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
  }, []);

  const run = useCallback(async (): Promise<GenerateResponse | null> => {
    void track({ name: "pro_cta_clicked", props: { section: args.checkId } });
    if (result) return result;
    if (!args.targetRole.trim()) {
      const msg = "Add a target role in Job Match so the rewrite can match it.";
      setError(msg);
      return null;
    }
    if (!args.currentText.trim()) {
      const msg = "Couldn't read this section to rewrite it.";
      setError(msg);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await postGenerate({
        generator: args.generator,
        targetRole: args.targetRole.slice(0, 200),
        currentText: args.currentText.slice(0, 12000),
        targetJobDescription: args.targetJobDescription.trim() || undefined,
        useResumeContext: args.hasResume,
      });
      setResult(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "rewrite_failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [args, result]);

  return { result, loading, error, reset, run };
}
