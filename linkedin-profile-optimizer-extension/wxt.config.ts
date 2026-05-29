import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

const EXTENSION_NAME = "Rezoomed: LinkedIn Profile Optimizer";

// Drop localhost host_permissions and externally_connectable entries from
// the production build so the Chrome Web Store reviewer sees the smallest
// possible permission footprint. Set INCLUDE_LOCALHOST=1 when building
// for local development against the Next.js app.
const includeLocalhost =
  process.env.NODE_ENV !== "production" || process.env.INCLUDE_LOCALHOST === "1";

const REZOOMED_HOSTS = [
  "https://rezoomed.com/*",
  "https://*.rezoomed.com/*",
];

const HOST_PERMISSIONS = [
  "*://*.linkedin.com/*",
  ...REZOOMED_HOSTS,
  ...(includeLocalhost ? ["http://localhost:3000/*"] : []),
];

const EXTERNALLY_CONNECTABLE_MATCHES = [
  ...REZOOMED_HOSTS,
  ...(includeLocalhost ? ["http://localhost:3000/*"] : []),
];

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: EXTENSION_NAME,
    short_name: "Rezoomed",
    description:
      "Unmatched LinkedIn profile optimization: score your profile, fix weak sections, and boost recruiter visibility with Rezoomed.",
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      96: "icon/96.png",
      128: "icon/128.png",
    },
    // Only "storage" is required. Chrome grants it silently at install
    // with no permission prompt. The sign-in flow uses chrome.tabs.create
    // and chrome.tabs.remove which BOTH work without the "tabs"
    // permission (that perm only gates reading URLs/titles of other
    // tabs, which we never do). Adding any other permission later would
    // trigger Chrome's "this update requires permissions X" prompt on
    // every existing install — keep this list minimal forever.
    permissions: ["storage"],
    host_permissions: HOST_PERMISSIONS,
    action: {
      default_title: EXTENSION_NAME,
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
        96: "icon/96.png",
        128: "icon/128.png",
      },
    },
    // Allow rezoomed.com pages to wake the background worker for silent
    // token refresh once the user has a live web session. The browser
    // checks this list before delivering chrome.runtime.connect /
    // sendMessage calls from web pages.
    externally_connectable: {
      matches: EXTERNALLY_CONNECTABLE_MATCHES,
    },
    // The Geist variable woff2 ships in /public/fonts/ and gets
    // referenced via chrome.runtime.getURL() inside the shadow root's
    // @font-face. Without exposing it here LinkedIn page context would
    // block the fetch.
    web_accessible_resources: [
      {
        resources: ["fonts/*", "icon/*"],
        matches: ["https://*.linkedin.com/*"],
      },
    ],
  },
});
