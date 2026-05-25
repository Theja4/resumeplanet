# Rezoomed — Profile Optimizer for LinkedIn

Client-side Manifest V3 Chrome extension built with WXT, TypeScript, React, and Tailwind.

This session is intentionally local-only:

- No backend
- No auth
- No LLM
- No profile data storage
- No LinkedIn writing, editing, or automation
- No remote code execution

## Run

```bash
cd linkedin-profile-optimizer-extension
npm install
npm run dev
```

WXT opens a development browser profile. During dev, WXT may add temporary hot-reload permissions. The production build manifest is the permission source of truth.

## Build

```bash
cd linkedin-profile-optimizer-extension
npm run build
```

Load the unpacked extension from:

```text
linkedin-profile-optimizer-extension/.output/chrome-mv3
```

In Chrome:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select `.output/chrome-mv3`
5. Open your own LinkedIn profile at `https://www.linkedin.com/in/...`

## Permission Contract

Production manifest permissions are limited to:

```json
{
  "permissions": ["storage"],
  "host_permissions": ["*://*.linkedin.com/*"]
}
```

The content script is matched to LinkedIn profile URLs and exits before extracting profile data unless the page looks like the signed-in user's own profile.
