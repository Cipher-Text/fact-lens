import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { sideTitleFits } from "./side-title";
import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The analysis hub, /[lang]/analysis (layout 7C.2 Paths, Analysis hub row): analysis only,
// newest first. Page order: the PageTitle band with the description (C-43), the cover
// (StoryCard `side` with `large`, C-24, the image 3 / 5 of the card width from 1024,
// DR-464), the 2 x 2 OverlapCard mosaic (C-02) with the ad rail from 1024 (C-16), the ad
// band, More stories (10 then 10,
// C-12); the category Eyebrow everywhere (C-08, DR-417). Keyboard and axe, in Bangla and
// English (COL-13, TYP-03, LAY-02, LAY-07, LAY-12, LAY-14, CPT-05, CPT-06, DR-18, T-27).

const PAGES = [
  {
    path: "/analysis",
    lang: "bn",
    title: "বিশ্লেষণ",
    description:
      "ফ্যাক্ট লেন্স টিমের বিশ্লেষণ, ব্যাখ্যামূলক প্রতিবেদন ও বিস্তারিত ফিচার",
    loadMore: "আরও লোড করুন",
    category: "/category/",
  },
  {
    path: "/en/analysis",
    lang: "en",
    title: "Analysis",
    description:
      "In-depth analysis, explanatory journalism and long-form narratives by Fact Lens Team",
    loadMore: "Load more",
    category: "/en/category/",
  },
] as const;

// spacing-layout-system.md Section 13, with the tier edges.
const WIDTHS = [
  320, 360, 599, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440,
  1920,
];

const hero = (page: Page) => page.locator('[data-section="analysis-cover"]');
const mosaic = (page: Page) =>
  page.locator('[data-section="analysis-top"] [data-overlap-card]');
const more = (page: Page) =>
  page.locator('[data-section="category-more"] [data-story-card]');

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
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
  test.describe(`analysis ${p.path}`, () => {
    test("page order, title, description and language", async ({ page }) => {
      const response = await page.goto(p.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(p.title);
      await expect(page.locator("[data-page-title-description]")).toHaveText(
        p.description,
      );

      const order = await page.evaluate(() =>
        [...document.querySelectorAll("main > *")].map(
          (el) =>
            el.getAttribute("data-section") ??
            el.getAttribute("data-ad-slot") ??
            (el.hasAttribute("data-analysis-cover-rule")
              ? "rule"
              : el.tagName.toLowerCase()),
        ),
      );
      expect(order).toEqual([
        "header",
        "analysis-cover",
        "rule",
        "analysis-top",
        "ad-band",
        "category-more",
      ]);
      await expect(page.locator('[data-ad-slot="ad-top"]')).toHaveCount(1);

      // The hero and the mosaic have hidden h2s; More stories has its heading.
      await expect(hero(page).locator("h2.sr-only")).toHaveCount(1);
      await expect(
        page.locator('[data-section="analysis-top"] h2.sr-only'),
      ).toHaveCount(1);
      await expect(mosaic(page)).toHaveCount(4);
      await expect(more(page)).toHaveCount(10);

      // No Fact Check (DR-18).
      await expect(page.locator("main")).not.toContainText(
        /ফ্যাক্টচেক|fact[\s-]?check/i,
      );
    });

    test("analysis only, newest first, no repeats; the category Eyebrow everywhere", async ({
      page,
    }) => {
      await page.goto(p.path);
      await page.getByRole("button", { name: p.loadMore, exact: true }).click();
      await expect(more(page)).not.toHaveCount(10);
      const cards = page.locator(
        "main [data-story-card], main [data-overlap-card]",
      );
      const rows = await cards.evaluateAll((els) =>
        els.map((card) => ({
          href: card.querySelector("h3 a")?.getAttribute("href") ?? "",
          eyebrows: [...card.querySelectorAll("[data-eyebrow] a")].map(
            (a) => a.getAttribute("href") ?? "",
          ),
          time: card.querySelector("time")?.getAttribute("datetime") ?? "",
        })),
      );
      expect(rows.length).toBeGreaterThan(15);
      expect(new Set(rows.map((row) => row.href)).size).toBe(rows.length);
      for (const row of rows) {
        expect(row.eyebrows).toHaveLength(1);
        expect(row.eyebrows[0].startsWith(p.category)).toBe(true);
      }
      const times = rows.map((row) => Date.parse(row.time));
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForNavRow(page);

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        // No rounded corners and no card border (CPT-05, CPT-06).
        const rounded = await page.evaluate(
          () =>
            [...document.querySelectorAll("main *")].filter(
              (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) > 0,
            ).length,
        );
        expect(rounded).toBe(0);

        // PageTitle.description has no measure (TYP-12 exception, AN-12): max-inline-size
        // none, not the text-lg (deck) measure, and as wide as the shell content.
        const description = await page
          .locator("[data-page-title-description]")
          .evaluate((el) => {
            const shell = el.parentElement!;
            const s = getComputedStyle(shell);
            return {
              max: getComputedStyle(el).maxInlineSize,
              width: Math.round(el.getBoundingClientRect().width),
              shell: Math.round(
                shell.clientWidth -
                  parseFloat(s.paddingInlineStart) -
                  parseFloat(s.paddingInlineEnd),
              ),
            };
          });
        expect(description.max).toBe("none");
        expect(description.width).toBe(description.shell);

        // Cover: image first under 1024; from 1024 text at the start, image at the end, the
        // image 3 / 5 of the row (DR-464 as amended).
        const media = await box(hero(page).locator(".story-media"));
        const title = await box(hero(page).locator("h3"));
        if (width < 1024) {
          expect(title.y).toBeGreaterThan(media.y + media.height - 1);
        } else {
          expect(media.x).toBeGreaterThan(title.x + title.width - 1);
          const row = await box(hero(page).locator("[data-story-card]"));
          expect(
            Math.abs(media.width - (row.width * 3) / 5),
          ).toBeLessThanOrEqual(1);
        }
        // 3:2 image.
        expect(media.width / media.height).toBeCloseTo(1.5, 1);

        // Below 600 the lead title takes the story title size; from 600 it is larger
        // (typography 3.1, tajmin, 4 Nov 2026).
        const sizes = await page.evaluate(() =>
          [
            '[data-section="analysis-cover"] h3',
            '[data-section="analysis-top"] h3',
          ].map((s) =>
            parseFloat(getComputedStyle(document.querySelector(s)!).fontSize),
          ),
        );
        if (width < 600) expect(sizes[0]).toBeCloseTo(sizes[1], 1);
        else expect(sizes[0]).toBeGreaterThan(sizes[1]);

        // Mosaic: 1 per row under 600, 2 from 600 (LAY-07).
        const tops = await mosaic(page).evaluateAll((els) =>
          els.map((el) => Math.round(el.getBoundingClientRect().y)),
        );
        expect(new Set(tops).size).toBe(width < 600 ? 4 : 2);

        // The rail ad shows from 1024, beside the wrapper.
        const railAd = page.locator(
          '[data-section="analysis-top"] [data-ad-slot="ad-rail"]',
        );
        if (width < 1024) {
          await expect(railAd).toBeHidden();
        } else {
          await expect(railAd).toBeVisible();
          // The reserved 300 x 600 box under the 24px label line (LAY-10, LAY-19).
          const reserve = await box(railAd.locator("a").first().locator(".."));
          expect([
            Math.round(reserve.width),
            Math.round(reserve.height),
          ]).toEqual([300, 600]);
          expect(Math.round((await box(railAd)).height)).toBe(624);
          // Divider.column-full: the rail rule runs the full height of the grid (C-22).
          const rule = await page
            .locator('[data-section="analysis-top"] .with-rail')
            .evaluate((grid) => {
              const after = getComputedStyle(grid, "::after");
              return [after.top, after.bottom, after.width];
            });
          expect(rule).toEqual(["0px", "0px", "1px"]);
          const wrapper = await box(
            page.locator("[data-analysis-top-wrapper]"),
          );
          expect((await box(railAd)).x).toBeGreaterThan(
            wrapper.x + wrapper.width - 1,
          );
        }
      });
    }

    for (const width of [768, 1023, 1024, 1280]) {
      test(`the cover title fits its text column at ${width} (DR-464)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForNavRow(page);
        await sideTitleFits(hero(page).locator("[data-story-card]"));
      });
    }

    test("load more adds 10, moves focus to the first new title, and goes when none are left", async ({
      page,
    }) => {
      await page.goto(p.path);
      const button = page.getByRole("button", {
        name: p.loadMore,
        exact: true,
      });
      await expect(more(page)).toHaveCount(10);
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(more(page)).not.toHaveCount(10);
      const shown = await more(page).count();
      expect(shown - 10).toBeLessThanOrEqual(10);
      await expect(more(page).nth(10).locator("h3 a")).toBeFocused();
      while ((await button.count()) > 0) await button.click();
      await expect(button).toHaveCount(0);
    });

    test("keyboard: every link and button shows the focus ring (COL-13)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const targets = page.locator('main a:not([tabindex="-1"]), main button');
      const count = await targets.count();
      expect(count).toBeGreaterThan(10);
      for (let i = 0; i < count; i++) {
        const el = targets.nth(i);
        await el.focus();
        await expect(el).toBeFocused();
        const outline = await el.evaluate((node) => {
          const s = getComputedStyle(node);
          return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
        });
        expect(
          outline,
          await el.evaluate((n) => n.outerHTML.slice(0, 80)),
        ).toBe(true);
      }
    });

    test("the Drawer marks the Analysis child as the current page (C-19)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", {
        name: p.lang === "bn" ? "মেনু" : "Menu",
        exact: true,
      });
      await menu.click();
      const current = page.locator('[data-drawer] a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("href", p.path);
      await expect(current).toBeVisible();
    });

    for (const theme of ["light", "dark"] as const) {
      for (const width of [360, 1280]) {
        test(`axe in ${theme} theme at ${width}`, async ({ page }) => {
          await setTheme(page, theme);
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          await expectNoBlockingAxe(page);
        });
      }
    }
  });
}

test("/analysis and /en/analysis answer 200, no longer a 404 (IMP-18)", async ({
  page,
}) => {
  for (const target of ["/analysis", "/en/analysis"]) {
    const response = await page.request.get(target);
    expect(response.status()).toBe(200);
  }
});
