/**
 * Browser support detection utilities
 * Provides graceful fallbacks for unsupported features
 */

/**
 * Checks if the browser supports modern JavaScript features
 * @returns true if browser supports ES2020+ features
 */
export function isModernBrowser(): boolean {
  if (typeof window === "undefined") return true; // SSR context

  try {
    // Check for key modern features we rely on
    return (
      "fetch" in window &&
      "Promise" in window &&
      "Map" in window &&
      "Set" in window &&
      typeof globalThis !== "undefined" &&
      // Check for optional chaining support (ES2020)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      eval("const obj = {}; obj?.test") !== undefined
    );
  } catch {
    return false;
  }
}

/**
 * Checks if the browser supports modern CSS features
 * @returns true if browser supports modern CSS
 */
export function supportsModernCSS(): boolean {
  if (typeof window === "undefined") return true; // SSR context

  try {
    return (
      CSS.supports("display", "grid") &&
      CSS.supports("gap", "1rem") &&
      CSS.supports("backdrop-filter", "blur(10px)")
    );
  } catch {
    return false;
  }
}

/**
 * Shows a browser upgrade notification for unsupported browsers
 * Should be called sparingly and only for critical incompatibilities
 */
export function showBrowserUpgradeNotice(): void {
  if (typeof window === "undefined") return;

  const notice = document.createElement("div");
  notice.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f39c12;
    color: white;
    padding: 12px;
    text-align: center;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  notice.innerHTML = `
    Your browser is outdated. For the best experience, please 
    <a href="https://browsehappy.com/" style="color: white; text-decoration: underline;">
      update to a modern browser
    </a>.
  `;

  document.body.insertBefore(notice, document.body.firstChild);
}
