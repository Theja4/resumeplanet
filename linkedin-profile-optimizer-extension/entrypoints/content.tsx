import ReactDOM from "react-dom/client";

// Vite's ?inline query bundles the resolved CSS as a string at build time.
// We inject this into the shadow root manually instead of letting WXT
// fetch chrome-extension://EXTENSION_ID/content-scripts/content.css at
// runtime — that fetch is exactly what produces the recurring
// "GET chrome-extension://invalid/ net::ERR_FAILED" console errors when
// the extension is reloaded while a content script is still alive in
// the tab. With the CSS bundled inline, no fetch happens, so even
// orphaned scripts don't generate network failures.
import shadowCss from "../src/styles.css?inline";
import {
  isExtensionContextValid,
  onExtensionContextInvalidated,
} from "../src/adapter/ext-context";
import { isLinkedInProfileUrl, isLikelyOwnProfilePage } from "../src/adapter/ownership";
import { ProfileOptimizerPanel } from "../src/ui/ProfileOptimizerPanel";

const THEME_LOCALSTORAGE_KEY = "rezoomed.theme.v1.cache";
const PANEL_FONT_PATH = "fonts/Geist-Variable.woff2";

function readCachedThemeSync(): "light" | "dark" {
  try {
    const v = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

export default defineContentScript({
  // Match every LinkedIn page (not just /in/*) so the script is already
  // alive when the user soft-navigates (SPA, no full reload) from the
  // feed/search into their own profile. Injection happens once per hard
  // page load; subsequent in-app navigations reuse the live script and
  // are handled by the wxt:locationchange listener in main(). All heavy
  // work stays gated behind the own-profile check, so nothing renders
  // until you're actually on your profile.
  matches: ["*://*.linkedin.com/*"],
  runAt: "document_idle",
  // "manual" means WXT does NOT auto-inject CSS via the manifest or via
  // a runtime fetch. We're responsible for stylesheet placement, which
  // we do below by appending a <style> element to the shadow root with
  // the inlined Tailwind output.
  cssInjectionMode: "manual",
  async main(ctx) {
    // Swallow rejections that originate inside our own script (and only
    // ours — we don't want to mask LinkedIn's own bugs). Without this, a
    // transient network blip on a fire-and-forget fetch ends up logged
    // in chrome://extensions as a red "Failed to fetch" entry.
    installUnhandledRejectionGuard();

    const ui = await createShadowRootUi(ctx, {
      name: "rezoomed-profile-optimizer",
      position: "inline",
      anchor: "body",
      isolateEvents: true,
      onMount(container, shadow) {
        // Inject the bundled stylesheet directly — no chrome-extension://
        // URL traversal, so this works even after the extension is
        // reloaded (orphan-safe).
        const style = document.createElement("style");
        const fontUrl = chrome.runtime.getURL(PANEL_FONT_PATH);
        style.textContent = `
          @font-face {
            font-family: "Geist";
            src: url("${fontUrl}") format("woff2");
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }
        ` + shadowCss;
        shadow.appendChild(style);

        const app = document.createElement("div");
        app.id = "rezoomed-root";
        // Apply the cached theme synchronously to avoid flashing the
        // wrong palette on the first paint. The ThemeProvider inside
        // ProfileOptimizerPanel takes over for runtime changes.
        app.setAttribute("data-theme", readCachedThemeSync());
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(<ProfileOptimizerPanel />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    let mounted = false;
    // Monotonic token so an in-flight ownership poll from a previous
    // navigation can't mount the panel after a newer navigation started.
    let navToken = 0;

    async function syncToLocation(): Promise<void> {
      const myToken = (navToken += 1);
      if (!isExtensionContextValid()) return;

      // Always tear down first: leaving the profile, or moving to a
      // different person's profile via SPA navigation, must never flash a
      // stale panel scoped to the previous profile.
      if (mounted) {
        ui.remove();
        mounted = false;
      }

      if (!isLinkedInProfileUrl(window.location.href)) return;

      const ownProfile = await waitForOwnProfile(document);
      // A newer navigation began while we were polling — let it win.
      if (myToken !== navToken || !isExtensionContextValid()) return;
      if (ownProfile) {
        ui.mount();
        mounted = true;
      }
    }

    await syncToLocation();

    // Re-evaluate on every in-app navigation. WXT dispatches
    // wxt:locationchange on history.pushState / replaceState / popstate,
    // which is how LinkedIn's SPA moves between the feed and a profile.
    ctx.addEventListener(window, "wxt:locationchange", () => {
      void syncToLocation();
    });

    // Tear the panel down the moment the extension is reloaded or
    // disabled. Without this, the orphaned script keeps firing its
    // MutationObserver and Chrome floods the page console with
    // chrome-extension://invalid/ net::ERR_FAILED errors as it tries
    // to refetch CSS/asset URLs that no longer resolve.
    onExtensionContextInvalidated(() => {
      try {
        ui.remove();
      } catch {
        // Already torn down — nothing to do.
      }
    });
  },
});

async function waitForOwnProfile(doc: Document): Promise<boolean> {
  if (isLikelyOwnProfilePage(doc)) return true;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!isExtensionContextValid()) return false;
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    if (isLikelyOwnProfilePage(doc)) return true;
  }

  return false;
}

let unhandledRejectionGuardInstalled = false;
function installUnhandledRejectionGuard() {
  if (unhandledRejectionGuardInstalled) return;
  unhandledRejectionGuardInstalled = true;
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "";
    // Quiet only the noisy network failures that come from our own
    // fire-and-forget fetches (telemetry, background-relayed API calls
    // when the SW is asleep). LinkedIn's own rejections never reach this
    // handler because they fire on the page's window, not ours.
    const isOurFetchFailure =
      /failed to fetch|network ?error|message port closed|Extension context invalidated/i.test(
        message,
      );
    if (isOurFetchFailure) event.preventDefault();
  });
}
