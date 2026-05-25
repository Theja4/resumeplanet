// Direct POST to PostHog's capture endpoint. posthog-js is ~50kB and pulls
// in DOM-history listeners we don't need in a content script — we only fire
// six fire-and-forget events, so raw fetch is enough.

const POSTHOG_HOST = "https://us.i.posthog.com";
const POSTHOG_KEY: string = import.meta.env.WXT_POSTHOG_KEY || "";
const DISTINCT_ID_KEY = "rezoomed.posthog.distinct_id.v1";

type EventProps = Record<string, unknown>;

export type RezoomedEvent =
  | { name: "scan_run"; props: { profileUrl: string; durationMs: number } }
  | { name: "score_shown"; props: { score: number; readableChecks: number; authed: boolean } }
  | { name: "signup_started"; props: { surface: "panel" | "consistency_card" } }
  | { name: "signup_completed"; props: { surface: "panel" | "consistency_card" } }
  | {
      name: "consistency_gap_shown";
      props: { mismatches: number; hasResume: boolean; resumeSwitched: boolean };
    }
  | { name: "pro_cta_clicked"; props: { section: string } };

async function getDistinctId(): Promise<string> {
  const stored = await chrome.storage.local.get(DISTINCT_ID_KEY);
  const existing = stored[DISTINCT_ID_KEY] as string | undefined;
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  await chrome.storage.local.set({ [DISTINCT_ID_KEY]: fresh });
  return fresh;
}

export async function track<E extends RezoomedEvent>(event: E): Promise<void> {
  if (!POSTHOG_KEY) return; // No-op in local dev without a key set
  try {
    const distinct_id = await getDistinctId();
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: event.name,
        distinct_id,
        properties: {
          ...(event.props as EventProps),
          $lib: "rezoomed-extension",
          $lib_version: "0.1.0",
        },
      }),
      keepalive: true,
    });
  } catch {
    // Swallow — analytics must never break the extension.
  }
}

// Once the user signs in, alias the anon distinct_id to their userId so
// PostHog stitches anonymous teaser events to the authed funnel.
export async function aliasToUser(userId: string): Promise<void> {
  if (!POSTHOG_KEY) return;
  try {
    const previous = await getDistinctId();
    if (previous === userId) return;
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "$create_alias",
        distinct_id: userId,
        properties: { alias: previous, $lib: "rezoomed-extension" },
      }),
      keepalive: true,
    });
    await chrome.storage.local.set({ [DISTINCT_ID_KEY]: userId });
  } catch {
    // ignore
  }
}
