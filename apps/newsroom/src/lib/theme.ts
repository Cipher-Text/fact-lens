// Theme for the newsroom: follow the system, or force light or dark. The choice is kept in local
// storage; the `dark` class on <html> says which theme is showing, and the page script below sets
// it before the first paint so there is no flash of the wrong theme.

export const themeChoices = ['system', 'light', 'dark'] as const;
export type ThemeChoice = (typeof themeChoices)[number];

export const THEME_STORAGE_KEY = 'nr-theme';
export const THEME_CHANGE_EVENT = 'nr-theme-change';

export function parseChoice(value: unknown): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system';
}

/** Which theme shows for a choice. Pure. */
export function effectiveTheme(choice: ThemeChoice, systemDark: boolean): 'light' | 'dark' {
  return choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;
}

/**
 * Puts the theme on <html>. It must use nothing outside its own body, because `themeScript`
 * inlines its source and runs it before the page is drawn.
 */
export function applyTheme(choice: string | null, systemDark: boolean) {
  const dark = choice === 'dark' || (choice !== 'light' && systemDark);
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

// Kept for this page only when storage is blocked, so the control still works until reload.
let pageChoice: ThemeChoice = 'system';

export function readChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== null) return parseChoice(stored);
  } catch {
    // Storage can be blocked. Use the choice kept for this page.
  }
  return pageChoice;
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function setChoice(choice: ThemeChoice) {
  pageChoice = choice;
  try {
    if (choice === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage can be blocked. The choice then lasts for this page only.
  }
  applyTheme(choice, systemPrefersDark());
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Inline script for <head>: runs before the body is drawn. */
export const themeScript = `(function () {
  var apply = ${applyTheme.toString()};
  var stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch (e) {}
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  apply(stored, !!(media && media.matches));
})();`;
