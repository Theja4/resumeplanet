# Privacy Policy — Rezoomed: LinkedIn Profile Optimizer (Chrome extension)

**Last updated:** 2026-05-26

This policy covers the Rezoomed: LinkedIn Profile Optimizer Chrome extension ("the extension"). The Rezoomed web application at rezoomed.com has its own broader privacy policy; this document covers only the extension.

## What the extension does

The extension renders a sidebar on the LinkedIn profile pages you visit. It reads the page's DOM to compute a profile score and surface fixes. It does not click, type, edit, post, message, or navigate on your behalf.

## What we collect

### Free scan (no sign-in required)

The free scan runs **entirely on your device**. The extension reads visible profile fields (headline, about, experience, skills, education, photo/banner presence, custom URL, recommendation count) from the page DOM you are already viewing. The scan result is stored locally in `chrome.storage.local` so the sidebar can re-open without re-scanning.

**Nothing about your profile content leaves your device for the free scan.**

### Anonymous analytics

The extension sends fire-and-forget events to PostHog (`us.i.posthog.com`) so we can measure aggregate usage and detect when LinkedIn DOM changes break extraction. These events contain no profile content. They are:

- `scan_run` — that a scan happened, plus its duration in milliseconds.
- `score_shown` — that a score was rendered (the numeric score, count of readable checks, whether the user is signed in).
- `extraction_health` / `extraction_empty` — which fields the extractor was able to read on this page. Used to alert us when LinkedIn changes its HTML.
- Sign-in funnel and Pro-CTA-click events — surface name only.

Each install is identified by a random UUID stored in `chrome.storage.local`. We never collect IP-based identifiers ourselves; PostHog may log the request IP per its own policy.

### Sign-in (optional)

If you click "Sign in" in the sidebar, the extension opens a Rezoomed login tab. After you authenticate, our website sends a short-lived JWT back to the extension's service worker via Chrome's `externally_connectable` channel. The token is stored in `chrome.storage.local` and is used only to authorize requests to `*.rezoomed.com`.

### Pro features (signed-in only)

When you ask the extension to run an AI rewrite or a resume-to-LinkedIn consistency check, the extension sends the specific section text you want rewritten (e.g., your About paragraph), plus the target role/JD if you provided one, to `rezoomed.com/api/linkedin/*`. The request is processed statelessly — we do not retain the section text after the response is returned, we do not train models on it, and we do not sell or transfer it.

## What we do NOT do

- We do not read or transmit any page on any site other than the LinkedIn profile DOM you are actively viewing.
- We do not collect your name, email, photo, or any PII from the LinkedIn DOM.
- We do not read your browsing history, tabs, cookies, passwords, or page contents on other sites.
- We do not inject ads, run third-party tracking pixels, or sell data to brokers.
- We do not execute remote code. The extension's selector strategies are configured via a remote JSON file (`/api/linkedin/adapter-config`), but the response is strict, validated JSON — selector and pattern strings only.

## Data retention

- Local data (`chrome.storage.local`) lives until you uninstall the extension or clear extension storage.
- Anonymous PostHog events are retained per PostHog's standard retention.
- Pro-feature requests are not persisted on our side beyond the response cycle.

## Your controls

- Uninstall the extension to delete all locally stored data.
- Sign out from the sidebar's profile menu to clear the stored auth token.
- Email privacy@rezoomed.com to request deletion of any account-level data on the Rezoomed web app side.

## Trademarks

"LinkedIn" is a trademark of LinkedIn Corporation. This extension is independent and is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation.

## Contact

privacy@rezoomed.com
