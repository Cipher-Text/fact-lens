import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The region hub, /[lang]/regions (layout 7C.2 Paths, Region hub row; page/regions brief).
// Page order: the PageTitle band with the description (C-43), the cover (OverlapCard large,
// C-02, N-06) with the Latest rail of 5 (C-03, no MoreLink), then the regions in groups of 4
// CategoryBlocks (C-23), each group with its rail ad from 1024 (C-16), a full-width ad band
// before each group (tajmin, 5 Nov 2026). The Eyebrow on every card in `format` mode (C-08):
// news the category, analysis বিশ্লেষণ / Analysis only (tajmin, 5 Nov 2026). Keyboard and axe, in
// Bangla and English (COL-13, TYP-03, LAY-02, LAY-05, LAY-07, LAY-12, LAY-13, LAY-14, CPT-05,
// CPT-06, DR-18, T-27).

const PAGES = [
  {
    path: "/regions",
    lang: "bn",
    title: "অঞ্চলসমূহ",
    description: "বিশ্বের প্রতিটি অঞ্চলের খবর ও বিশ্লেষণ",
    prefix: "",
    menu: "মেনু",
  },
  {
    path: "/en/regions",
    lang: "en",
    title: "Regions",
    description: "News and analysis from every region of the world",
    prefix: "/en",
    menu: "Menu",
  },
] as const;

// spacing-layout-system.md Section 13, with the tier edges.
const WIDTHS = [
  320, 360, 599, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440,
  1920,
];

const cover = (page: Page) => page.locator('[data-section="regions-cover"]');
const groups = (page: Page) => page.locator('[data-section="regions-grouped"]');
const blocks = (page: Page) =>
  page.locator('[data-section="regions-grouped"] [data-category-block]');

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
  test.describe(`region hub ${p.path}`, () => {
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
            el.tagName.toLowerCase(),
        ),
      );
      expect(order).toEqual([
        "header",
        "regions-cover",
        "ad-band",
        "regions-grouped",
        "ad-band",
        "regions-grouped",
      ]);
      await expect(page.locator('[data-ad-slot="ad-top"]')).toHaveCount(1);
      await expect(page.locator('[data-ad-slot="ad-inset"]')).toHaveCount(0);

      // The cover: a hidden h2, OverlapCard large; the rail: 5 stories, no MoreLink.
      await expect(cover(page).locator("h2.sr-only")).toHaveCount(1);
      await expect(cover(page).locator("[data-overlap-card]")).toHaveCount(1);
      await expect(
        cover(page).locator("[data-regions-rail] [data-story-list] > li"),
      ).toHaveCount(5);
      await expect(
        cover(page).locator(`[data-regions-rail] a[href="${p.prefix}/latest"]`),
      ).toHaveCount(0);

      // 7 regions with stories (Oceania has none, 7.3), in the 7C order, 4 then 3.
      await expect(blocks(page)).toHaveCount(7);
      const counts = await groups(page).evaluateAll((els) =>
        els.map((g) => g.querySelectorAll("[data-category-block]").length),
      );
      expect(counts).toEqual([4, 3]);
      const hrefs = await blocks(page).evaluateAll((els) =>
        els.map((b) =>
          [...b.querySelectorAll("a")].at(-1)?.getAttribute("href"),
        ),
      );
      expect(hrefs).toEqual(
        [
          "americas",
          "europe",
          "russia",
          "middle-east",
          "south-asia",
          "china",
          "asia",
        ].map((id) => `${p.prefix}/regions/${id}`),
      );

      // No Fact Check (DR-18).
      await expect(page.locator("main")).not.toContainText(
        /ফ্যাক্টচেক|fact[\s-]?check/i,
      );
    });

    test("the format Eyebrow: news the category, analysis only Analysis", async ({
      page,
    }) => {
      await page.goto(p.path);
      const rows = await page
        .locator(
          '[data-section="regions-cover"] [data-overlap-card], [data-section="regions-grouped"] [data-story-card], [data-section="regions-grouped"] [data-story-list] > li',
        )
        .evaluateAll((els) =>
          els.map((el) =>
            [...el.querySelectorAll("[data-eyebrow] a")].map(
              (a) => a.getAttribute("href") ?? "",
            ),
          ),
        );
      expect(rows.length).toBe(1 + 7 * 4);
      let analysis = 0;
      for (const links of rows) {
        expect(links).toHaveLength(1);
        if (links[0] === `${p.prefix}/analysis`) analysis += 1;
        else expect(links[0].startsWith(`${p.prefix}/category/`)).toBe(true);
      }
      expect(analysis).toBeGreaterThan(0);
      await expect(page.locator("main [data-eyebrow-separator]")).toHaveCount(
        0,
      );
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

        // The Latest rail: beside the cover from 1024, under it below (LAY-05).
        const card = await box(cover(page).locator("[data-overlap-card]"));
        const rail = await box(cover(page).locator("[data-regions-rail]"));
        if (width >= 1024) {
          expect(rail.x).toBeGreaterThan(card.x + card.width - 1);
        } else {
          expect(rail.y).toBeGreaterThan(card.y + card.height - 1);
        }

        // The region blocks: 1 per row under 600, 2 from 600 (LAY-07).
        const first = groups(page).first();
        const tops = await first
          .locator("[data-category-block]")
          .evaluateAll((els) =>
            els.map((el) => Math.round(el.getBoundingClientRect().y)),
          );
        expect(new Set(tops).size).toBe(width < 600 ? 4 : 2);

        // One rail ad per group from 1024, beside the wrapper; hidden below.
        const railAds = page.locator(
          '[data-section="regions-grouped"] [data-ad-slot="ad-rail"]',
        );
        await expect(railAds).toHaveCount(2);
        for (let i = 0; i < 2; i++) {
          const ad = railAds.nth(i);
          if (width < 1024) {
            await expect(ad).toBeHidden();
          } else {
            await expect(ad).toBeVisible();
            expect(Math.round((await box(ad)).height)).toBe(624);
            const wrapper = await box(
              groups(page).nth(i).locator("[data-regions-grouped-wrapper]"),
            );
            expect((await box(ad)).x).toBeGreaterThan(
              wrapper.x + wrapper.width - 1,
            );
          }
        }
      });
    }

    test("ad density under 768 stays under 30% of the main content (DR-447)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const share = await page.evaluate(() => {
        const ads = [...document.querySelectorAll("[data-ad-slot]")].filter(
          (el) => (el as HTMLElement).offsetParent,
        );
        const total = ads.reduce(
          (sum, el) => sum + el.getBoundingClientRect().height,
          0,
        );
        return (
          total / document.querySelector("main")!.getBoundingClientRect().height
        );
      });
      expect(share).toBeLessThan(0.3);
    });

    test("keyboard: every link and button shows the focus ring (COL-13)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const targets = page.locator('main a:not([tabindex="-1"]), main button');
      const count = await targets.count();
      expect(count).toBeGreaterThan(20);
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

    test("the NavBar and the Drawer mark Regions as the current page (C-18, C-19)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      await waitForNavRow(page);
      const navCurrent = page.locator('[data-nav-row] a[aria-current="page"]');
      await expect(navCurrent).toHaveCount(1);
      await expect(navCurrent).toHaveAttribute("href", p.path);

      await page.setViewportSize({ width: 360, height: 800 });
      await page.getByRole("button", { name: p.menu, exact: true }).click();
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

test("/regions and /en/regions answer 200, no longer a 404 (IMP-18)", async ({
  page,
}) => {
  for (const target of ["/regions", "/en/regions"]) {
    const response = await page.request.get(target);
    expect(response.status()).toBe(200);
  }
});
