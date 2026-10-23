import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// The article page (page/article-parallel, DR-392): the mandatory checks of AGENTS.md
// Section 11 only. Widths with no horizontal scroll, bn and en, light and dark with axe,
// the keyboard on the share dialog and the text size radio group, the band and inline
// ads, and the header # links. The header, footer and top ad are the homepage parts.

const SLUG = "river-data-framework";
const PAGES = [
  { lang: "bn", path: `/story/${SLUG}`, home: "/", share: "শেয়ার" },
  { lang: "en", path: `/en/story/${SLUG}`, home: "/en", share: "Share" },
];
const WIDTHS = [320, 768, 1280];

// Ads (spacing-layout-system.md Section 9, C-16), as in ads.spec.ts: a 24px label line
// over the reserved creative box. ad-inline is a 300×250 box at every width (AdSlot.tsx).
const AD_LABEL = 24;
const AD_WIDTHS = [331, 336, 768, 1024, 1280];

function adSize(slot: "ad-band" | "ad-inline", width: number) {
  if (slot === "ad-inline") return { reserve: 250, file: "300x250" };
  if (width < 768)
    return { reserve: 280, file: width >= 336 ? "336x280" : "300x250" };
  if (width < 1024) return { reserve: 90, file: "728x90" };
  return { reserve: 250, file: "970x250" };
}

async function expectNoBlockingAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations
    // The logo is exempt from contrast (WCAG 1.4.3; color-system.md Section 3).
    .map((v) =>
      v.id === "color-contrast"
        ? { ...v, nodes: v.nodes.filter((n) => !n.html.includes("data-logo")) }
        : v,
    )
    .filter((v) => v.nodes.length > 0)
    .filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

for (const p of PAGES) {
  test.describe(`article ${p.lang}`, () => {
    for (const width of WIDTHS) {
      test(`at ${width}: renders in ${p.lang} with no horizontal scroll`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
        await expect(page.locator("h1")).toHaveCount(1);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });
    }

    for (const theme of ["light", "dark"] as const) {
      test(`${theme}: no serious or critical axe violations`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(p.path);
        await expect(page.locator("html")).toHaveClass(
          theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/,
        );
        await expectNoBlockingAxe(page);
      });
    }

    test("share dialog opens, traps focus, closes on Escape and returns focus", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const trigger = page
        .locator(".rd-rail")
        .getByRole("button", { name: p.share, exact: true });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        // Past the last control, Base UI's focus guard moves focus back to the first
        // one a moment after the Tab, so the check waits for it.
        await expect
          .poll(
            () => dialog.evaluate((el) => el.contains(document.activeElement)),
            { message: "focus stays in the dialog" },
          )
          .toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("text size radio group moves with the arrow keys", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const group = page.locator(".rd-rail").getByRole("radiogroup");
      const radios = group.getByRole("radio");
      await expect(radios).toHaveCount(3);
      await expect(radios.nth(0)).toHaveAttribute("aria-checked", "true");
      const root = page.locator(".rd");

      await radios.nth(0).focus();
      await page.keyboard.press("ArrowRight");
      await expect(radios.nth(1)).toBeFocused();
      await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");
      await expect(root).toHaveAttribute("data-reader-size", "lg");

      await page.keyboard.press("ArrowDown");
      await expect(radios.nth(2)).toHaveAttribute("aria-checked", "true");
      await expect(root).toHaveAttribute("data-reader-size", "xl");
      // The last step stays put.
      await page.keyboard.press("ArrowRight");
      await expect(radios.nth(2)).toBeFocused();

      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowUp");
      await expect(radios.nth(0)).toHaveAttribute("aria-checked", "true");
      await expect(root).not.toHaveAttribute("data-reader-size");
    });

    for (const width of AD_WIDTHS) {
      for (const fill of [true, false]) {
        test(`at ${width}: the band and inline ads keep their reserved size ${fill ? "with" : "without"} the ad (LAY-09, LAY-10)`, async ({
          page,
        }) => {
          if (!fill) await page.route("**/mock/ad-*.svg", (r) => r.abort());
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          for (const slot of ["ad-band", "ad-inline"] as const) {
            const rows = page.locator(`[data-ad-slot="${slot}"]`);
            expect(await rows.count(), slot).toBeGreaterThan(0);
            for (const row of await rows.all()) {
              await row.scrollIntoViewIfNeeded();
              const want = adSize(slot, width);
              const b = (await row.boundingBox())!;
              expect(Math.round(b.height), slot).toBe(want.reserve + AD_LABEL);
              // The band is a full-width row with no gutter (LAY-09).
              if (slot === "ad-band")
                expect(Math.round(b.width), slot).toBe(
                  await page.evaluate(
                    () => document.documentElement.clientWidth,
                  ),
                );
              if (fill) {
                const img = row.locator("img");
                await expect
                  .poll(() =>
                    img.evaluate((el: HTMLImageElement) => el.currentSrc),
                  )
                  .toContain(`/mock/ad-${want.file}.svg`);
                const i = (await img.boundingBox())!;
                expect(i.width).toBeLessThanOrEqual(b.width);
                expect(i.height).toBeLessThanOrEqual(b.height - AD_LABEL);
              }
            }
          }
        });
      }
    }

    test("header section links point to targets on the homepage (DR-331)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const hrefs = await page
        .locator('[data-nav-row] a[href*="#"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")!));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs)
        expect(href.startsWith(`${p.home}#`), href).toBe(true);

      await page.goto(p.home);
      // The region links wait for R3-06, as on the homepage (header.spec.ts).
      for (const href of hrefs.filter((h) => !h.includes("#region-"))) {
        const hash = href.slice(href.indexOf("#"));
        await expect(page.locator(hash), href).toHaveCount(1);
      }
    });
  });
}
