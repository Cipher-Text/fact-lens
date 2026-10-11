// Theme switch logic: light and dark (spacing-layout-system.md Section 6, DR-201).
// Light is the first state on every device. The system setting is not used.
// The colors change through the `.dark` class on <html> (color-system.md Section 5).
// `data-theme` on <html> holds the resolved theme for tests and tools.

export const themeChoices = ["light", "dark"] as const;
export type ThemeChoice = (typeof themeChoices)[number];

export const THEME_STORAGE_KEY = "fl-theme";
export const THEME_CHANGE_EVENT = "fl-theme-change";

/**
 * Applies a theme choice to <html>. It must not use anything outside its body,
 * because themeScript inlines its source and runs it before the first paint.
 */
export function applyTheme(choice: string | null) {
  const isDark = choice === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.dataset.theme = isDark ? "dark" : "light";
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function readThemeChoice(): ThemeChoice {
  try {
    if (window.localStorage.getItem(THEME_STORAGE_KEY) === "dark")
      return "dark";
  } catch {
    // Storage can be blocked. Fall back to light.
  }
  return "light";
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
 * shows the right theme on the first paint.
 */
export const themeScript = `(function () {
  var apply = ${applyTheme.toString()};
  var stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch (e) {}
  apply(stored);
})();`;

/** The other theme, for the two-state switch. */
export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return choice === "dark" ? "light" : "dark";
}
