// Theme switch logic: system, light, dark (spacing-layout-system.md Section 6).
// The colors change through the `.dark` class on <html> (color-system.md Section 5).
// `data-theme` on <html> holds the resolved theme for tests and tools.

export const themeChoices = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof themeChoices)[number];

export const THEME_STORAGE_KEY = "fl-theme";
export const THEME_CHANGE_EVENT = "fl-theme-change";

/**
 * Applies a theme choice to <html>. It must not use anything outside its body,
 * because themeScript inlines its source and runs it before the first paint.
 */
export function applyTheme(choice: string | null) {
  const valid = choice === "light" || choice === "dark" ? choice : "system";
  const isDark =
    valid === "dark" ||
    (valid === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.dataset.theme = isDark ? "dark" : "light";
  root.dataset.themeChoice = valid;
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function readThemeChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be blocked. Fall back to the system theme.
  }
  return "system";
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage can be blocked. The choice then lasts for this page only.
  }
  applyTheme(choice);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * Inline script for <head>. It runs before the body renders, so the page
 * shows the right theme on the first paint. It also follows the system theme
 * while the choice is "system".
 */
export const themeScript = `(function () {
  var apply = ${applyTheme.toString()};
  var read = function () {
    try { return localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch (e) { return null; }
  };
  apply(read());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    apply(read());
  });
})();`;
