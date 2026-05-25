/**
 * Diagnostic logger. Two output channels:
 *
 *   1. console.log, gated on a localStorage flag (rezoomed.debug=1) so
 *      production users never see noise in their devtools.
 *   2. An in-memory ring buffer of the last N trace lines, ALWAYS on.
 *      The panel's "Debug" button reads this buffer so users can share
 *      a single screenshot without opening DevTools.
 *
 * Traces are scoped per scan: callers should call resetDebugTrace()
 * at the start of each scan and getDebugTrace() at the end.
 */

const STORAGE_KEY = "rezoomed.debug";
const MAX_TRACE_LINES = 400;

let cachedFlag: boolean | null = null;
let trace: string[] = [];

export function debugEnabled(): boolean {
  if (cachedFlag !== null) return cachedFlag;
  try {
    cachedFlag =
      typeof window !== "undefined" &&
      window.localStorage?.getItem(STORAGE_KEY) === "1";
  } catch {
    cachedFlag = false;
  }
  return cachedFlag ?? false;
}

function formatLine(args: unknown[]): string {
  return args
    .map((value) => {
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (value === null) return "null";
      if (value === undefined) return "undefined";
      try {
        const json = JSON.stringify(value, replacer, 0);
        // Trim long values so a single dump doesn't blow past the buffer cap.
        return json.length > 200 ? `${json.slice(0, 200)}…` : json;
      } catch {
        return String(value);
      }
    })
    .join(" ");
}

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Element) {
    const el = value as Element;
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
      : "";
    const id = el.id ? `#${el.id}` : "";
    return `<${el.tagName.toLowerCase()}${id}${cls}>`;
  }
  return value;
}

export function debugLog(...args: unknown[]): void {
  const line = formatLine(args);
  trace.push(line);
  if (trace.length > MAX_TRACE_LINES) {
    trace = trace.slice(-MAX_TRACE_LINES);
  }
  if (!debugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log("[Rezoomed]", ...args);
}

export function debugGroup(label: string, body: () => void): void {
  debugLog(`▼ ${label}`);
  if (debugEnabled()) {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[Rezoomed] ${label}`);
    try {
      body();
    } finally {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
    return;
  }
  body();
}

export function resetDebugTrace(): void {
  trace = [];
}

export function getDebugTrace(): string {
  return trace.join("\n");
}
