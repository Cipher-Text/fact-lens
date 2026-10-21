import { expect, type Page } from "@playwright/test";

/**
 * Waits for the one-line nav row: 44px + the 1px rule. Until run 4 the server HTML of the
 * row wrapped until hydration hid the items that do not fit (IMP-16, IMP-90), and WebKit hit
 * that race (W4-12, group A). Since R5-01 the item list is one row tall from the server
 * HTML (DR-359), so this is a guard. The nav row shows from 1280 only (C-18); under 1280
 * this does nothing.
 */
export async function waitForNavRow(page: Page) {
  const width = page.viewportSize()?.width ?? 0;
  if (width < 1280) return;
  await expect
    .poll(async () =>
      page
        .locator("[data-nav-row]")
        .evaluate((el) => Math.round(el.getBoundingClientRect().height)),
    )
    .toBe(45);
}
