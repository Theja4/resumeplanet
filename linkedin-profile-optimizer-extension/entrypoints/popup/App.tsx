import { ExternalLink, ShieldCheck } from "lucide-react";

export function PopupApp() {
  return (
    <main className="w-[360px] bg-neutral-50 p-4 text-neutral-950">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
              Rezoomed
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-tight">
              Profile Optimizer for LinkedIn
            </h1>
          </div>
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden="true" />
        </div>

        <p className="mt-3 text-sm leading-5 text-neutral-600">
          The score panel appears on your own LinkedIn profile. No login, backend,
          LLM, or profile storage is used in this version.
        </p>

        <a
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          href="https://www.linkedin.com/in/me/"
          rel="noreferrer"
          target="_blank"
        >
          Open my LinkedIn profile
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}
