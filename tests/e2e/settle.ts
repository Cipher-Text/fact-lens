import { expect, type Page } from "@playwright/test";

/**
 * The server HTML of the nav row wraps until the items that do not fit are hidden after
 * hydration (IMP-16). Until then the page below the header is one row (44px) lower. A test
 * that reads two boxes at different moments must wait for the one-line row first: 44px +
 * the 1px rule. The nav row shows from 1280 only (C-18); under 1280 this does nothing.
 * R4-05: WebKit hydrates later than Chromium, so it hit this race (W4-12, group A).
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
