import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Rezoomed — Profile Optimizer for LinkedIn",
    short_name: "Rezoomed LinkedIn",
    description:
      "Client-side LinkedIn profile score and section-by-section optimization checklist.",
    // Only "storage" is required. Chrome grants it silently at install
    // with no permission prompt. The sign-in flow uses chrome.tabs.create
    // and chrome.tabs.remove which BOTH work without the "tabs"
    // permission (that perm only gates reading URLs/titles of other
    // tabs, which we never do). Adding any other permission later would
    // trigger Chrome's "this update requires permissions X" prompt on
    // every existing install — keep this list minimal forever.
    permissions: ["storage"],
    host_permissions: [
      "*://*.linkedin.com/*",
      "http://localhost:3000/*",
      "https://rezoomed.com/*",
    ],
    action: {
      default_title: "Rezoomed Profile Optimizer",
    },
    // Allow rezoomed.com pages to wake the background worker for silent
    // token refresh once the user has a live web session. The browser
    // checks this list before delivering chrome.runtime.connect /
    // sendMessage calls from web pages.
    externally_connectable: {
      matches: [
        "http://localhost:3000/*",
        "https://rezoomed.com/*",
      ],
    },
  },
});
