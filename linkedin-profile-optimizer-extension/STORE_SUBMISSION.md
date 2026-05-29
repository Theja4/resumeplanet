# Chrome Web Store submission — Rezoomed: LinkedIn Profile Optimizer

## 1. Stated single purpose

> Profile Optimizer for LinkedIn — scores a user's own LinkedIn profile against recruiter-visibility heuristics and suggests rewrites.

This is the ONLY purpose. No bundled unrelated features. No tab tracking, no ad injection, no data brokerage, no third-party SDKs running on LinkedIn page context.

## 2. Permissions justification (Web Store form)

| Permission | Why we need it |
|---|---|
| `storage` | Persist the user's last scan, anonymous PostHog distinct-id, theme preference, and the cached remote selector-config payload. Nothing leaves the device unless the user signs in. |
| `host_permissions: *://*.linkedin.com/*` | The content script renders the optimizer sidebar on `linkedin.com/in/*` profile pages. Read-only DOM access — we never click, type, edit, or navigate on the user's behalf. |
| `host_permissions: https://*.rezoomed.com/*` | After the user clicks "Sign in" in the sidebar, the extension calls our REST API (`/api/extension/*` and `/api/linkedin/*`) over HTTPS to enrich the score with the user's saved resume and to fetch the declarative selector-config override. |
| `externally_connectable: https://*.rezoomed.com/*` | After sign-in, the rezoomed.com page sends the auth token back to the extension's service worker via `chrome.runtime.sendMessage`. This is more secure than reading a token out of `chrome.tabs` because we never need the `tabs` permission. |

We do NOT request `tabs`, `cookies`, `webRequest`, `scripting`, `activeTab`, `<all_urls>`, `identity`, `notifications`, or any broader host pattern.

## 3. Remote code policy — NO REMOTE CODE

We do not execute remote code anywhere. Verifications a reviewer can perform:

- `manifest.json`: no `content_security_policy` overrides loosening `script-src`.
- No `eval(`, `new Function(`, `setTimeout(string`, `setInterval(string` in the bundle. The build is plain ES modules.
- The only network calls from the extension are:
  1. `https://www.rezoomed.com/api/extension/*` — JSON request/response, used after sign-in.
  2. `https://www.rezoomed.com/api/linkedin/generate` and `/api/linkedin/sync-from-resume` — JSON request/response for AI rewrites.
  3. `https://www.rezoomed.com/api/linkedin/adapter-config` — **DECLARATIVE JSON ONLY** (selector strings, JSON-path hints, field maps). The response is validated against a strict whitelist (`src/adapter/config.ts:sanitizeRemoteConfig`) that drops anything not on the known schema before use. Selector strings are passed to `document.querySelectorAll`; pattern strings are passed to `new RegExp(string, flags)`. Neither path interprets code.
  4. `https://us.i.posthog.com/capture/` — fire-and-forget analytics events (no PII; per-field success flags + anonymous distinct-id).

## 4. Data use disclosure (truthful)

The store form asks "Does this extension collect or use any of the following user data?" — answer:

| Category | Collected | Where / Why |
|---|---|---|
| Personally identifiable information | NO | We never read the user's name, email, photo, or other PII from the LinkedIn DOM. The sidebar runs entirely on the user's own profile page. |
| Health information | NO | n/a |
| Financial / payment info | NO | n/a |
| Authentication information | YES — sign-in only | When the user clicks "Sign in" they are redirected to `rezoomed.com`. After auth, our site sends a short-lived JWT to the extension via `chrome.runtime.sendMessage`. The token is stored in `chrome.storage.local` (device-only). It is sent to `*.rezoomed.com` to authorize Pro features. It is never sold or transferred to third parties. |
| Personal communications | NO | n/a |
| Location | NO | n/a |
| Web history | NO | We do not read or track browsing history. |
| User activity | YES — anonymous analytics | We send anonymous PostHog events: `scan_run`, `score_shown`, `extraction_health`, `extraction_empty`, sign-in funnel, Pro CTA clicks. No URL contents, no profile contents — only event names, counts, and field-success flags. Distinct-id is a per-install random UUID until sign-in. |
| Website content | NO — processed locally only | The free scan reads the user's own LinkedIn profile DOM to compute a score. The profile text never leaves the device for the free scan. Pro rewrites send the specific section text (e.g., the user's About text) to `rezoomed.com` for stateless AI processing; we do not log or sell the content. |

### Three required certifications

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

## 5. Privacy policy URL

`https://www.rezoomed.com/privacy/linkedin-extension` — the policy text is in `PRIVACY_POLICY_LINKEDIN_EXTENSION.md` in this repo (publish at that URL before submission).

## 6. Store listing copy

**Name:** Rezoomed: LinkedIn Profile Optimizer
**Short name:** Rezoomed
**Category:** Productivity
**Language:** English (US)

**Short description (132 char max):**
> Score your LinkedIn profile, see recruiter-visibility gaps, and get AI-powered rewrites for headline, about, and experience.

**Detailed description:**
> Rezoomed opens a sidebar on your own LinkedIn profile and grades it the way recruiters actually see it — discoverability, completeness, signals, content quality, and keyword match against a job description you paste.
>
> What you get on the free scan:
> • A 0–100 score with per-category breakdown
> • Concrete fixes ranked by impact (e.g., "add a custom URL", "your headline is generic")
> • A recruiter Boolean string for the role you target
> • Nothing leaves your device — the scan runs locally in your browser
>
> Sign in (free Rezoomed account) to unlock:
> • AI rewrites for headline, about, experience bullets, and skills, anchored to your resume
> • Resume-to-LinkedIn consistency check — flags every section that doesn't match your latest resume
> • Job-description matching: paste a JD, see which keywords your profile is missing
>
> Privacy:
> • The free scan never sends your profile content anywhere
> • Pro rewrites send only the specific section you ask to rewrite, processed statelessly
> • We never sell or transfer your data
>
> Rezoomed is independent and not affiliated with or endorsed by LinkedIn Corporation. "LinkedIn" is a trademark of LinkedIn Corporation and is used here solely to describe the website this tool works on.

**Trademark/naming guardrails:**
- Name is "Rezoomed: LinkedIn Profile Optimizer" — the "for/Profile Optimizer" framing satisfies LinkedIn's brand guidelines (descriptive use of the trademark to identify the platform the tool works on).
- Never use "Official", "Powered by LinkedIn", "LinkedIn Premium", or any phrasing implying partnership.
- Do not use LinkedIn's logo in icons or screenshots.

## 7. Screenshot checklist (1280x800 PNG)

1. Sidebar open on a real LinkedIn profile, score visible, top 3 fixes shown.
2. Score-hero close-up: 67/100 with the category bars.
3. AI rewrite card open on the "About" section, showing the suggested rewrite next to the user's current text.
4. Job-description match tab with a pasted JD and missing-keyword chips.
5. Recruiter Boolean tab with a generated Boolean string for the target role.

## 8. Submission checklist (before clicking "Submit for review")

- [ ] Build with `NODE_ENV=production wxt build` so `localhost:3000` is stripped from `host_permissions` and `externally_connectable.matches`.
- [ ] Confirm `dist/chrome-mv3/manifest.json` permissions = `["storage"]` only. Host permissions = `linkedin.com` + `rezoomed.com` only.
- [ ] Confirm `manifest.json` has no `content_security_policy` loosening, no `web_accessible_resources` beyond `fonts/*` and `icon/*`.
- [ ] Run `grep -rE 'eval\\(|new Function\\(' dist/` → expect zero matches.
- [ ] Run `grep -rE 'http://localhost' dist/` → expect zero matches.
- [ ] Privacy policy published at the URL listed in section 5 and reachable without auth.
- [ ] Screenshots taken on a real profile (use a test account, not a customer's profile).
- [ ] Store listing description proofread; "not affiliated with LinkedIn" disclaimer present.
- [ ] Single-purpose description in the dashboard matches section 1 verbatim.
- [ ] Data-use disclosures in the dashboard match section 4 exactly. No optimistic checkboxes.
- [ ] Tested on Chrome stable AND Edge (Edge uses the same store package).
- [ ] Tested with a fresh Chrome profile (no extensions installed) to confirm no permission prompts beyond the expected `storage` (silent) + `linkedin.com` + `rezoomed.com` host access on install.
