import ReactDOM from "react-dom/client";

import "../../src/styles.css";
import { PopupApp } from "./App";
import { ThemeProvider, readCachedTheme } from "../../src/ui/theme/useTheme";

const fontUrl = chrome.runtime.getURL("fonts/Geist-Variable.woff2");
const fontStyle = document.createElement("style");
fontStyle.textContent = `
  @font-face {
    font-family: "Geist";
    src: url("${fontUrl}") format("woff2");
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
  }
`;
document.head.appendChild(fontStyle);

// Theme is already applied to <html> by the inline script in index.html
// (no flash). The ThemeProvider then takes over for runtime updates and
// chrome.storage sync with the sidebar.
const initial = readCachedTheme();
document.documentElement.setAttribute("data-theme", initial);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider applyTo={document.documentElement} initialTheme={initial}>
    <PopupApp />
  </ThemeProvider>,
);
