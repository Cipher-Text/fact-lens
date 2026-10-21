import type { Page } from "@playwright/test";

/**
 * Sets the stored theme before the page loads. The theme has two states and does not
 * follow the system setting (DR-201), so a test cannot use `emulateMedia` for it.
 */
export async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("fl-theme", value);
    } catch {
      // Storage is blocked: the page stays light.
    }
  }, theme);
}
