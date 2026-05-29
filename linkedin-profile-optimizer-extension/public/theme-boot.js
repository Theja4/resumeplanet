/**
 * Synchronously apply the cached theme so the popup never flashes
 * light-on-dark (or vice versa) for one paint while React boots.
 * Loaded via <script src="/theme-boot.js"> — must be a real file
 * because Manifest V3's default CSP blocks inline scripts.
 */
(function () {
  try {
    var v = localStorage.getItem("rezoomed.theme.v1.cache");
    if (v !== "dark" && v !== "light") v = "light";
    document.documentElement.setAttribute("data-theme", v);
  } catch (_e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
