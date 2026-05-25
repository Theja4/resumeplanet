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

export default defineContentScript({
  matches: ["*://*.linkedin.com/in/*"],
  runAt: "document_idle",
  // "manual" means WXT does NOT auto-inject CSS via the manifest or via
  // a runtime fetch. We're responsible for stylesheet placement, which
  // we do below by appending a <style> element to the shadow root with
  // the inlined Tailwind output.
  cssInjectionMode: "manual",
  async main(ctx) {
    if (!isLinkedInProfileUrl(window.location.href)) return;

    const ownProfile = await waitForOwnProfile(document);
    if (!ownProfile) return;

    const ui = await createShadowRootUi(ctx, {
      name: "rezoomed-profile-optimizer",
      position: "inline",
      anchor: "body",
      isolateEvents: true,
      onMount(container, shadow) {
        // Inject the bundled stylesheet directly — no chrome-extension://
        // URL traversal, so this works even after the extension is
        // reloaded (orphan-safe).
        // Plus Jakarta Sans is bundled in /public/fonts/ and referenced
        // through chrome.runtime.getURL so LinkedIn's CSP can't block it.
        // We inject the @font-face BEFORE the main stylesheet so the font
        // is registered before any element tries to render with it.
        const fontStyle = document.createElement("style");
        const fontUrl = chrome.runtime.getURL("fonts/PlusJakartaSans-VF.woff2");
        fontStyle.textContent = `
          @font-face {
            font-family: "Plus Jakarta Sans";
            font-style: normal;
            font-weight: 200 800;
            font-display: swap;
            src: url("${fontUrl}") format("woff2-variations"),
                 url("${fontUrl}") format("woff2");
          }
        `;
        shadow.appendChild(fontStyle);

        const style = document.createElement("style");
        style.textContent = shadowCss;
        shadow.appendChild(style);

        const app = document.createElement("div");
        app.id = "rezoomed-root";
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(<ProfileOptimizerPanel />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();

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
