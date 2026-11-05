import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The region page, /[lang]/regions/<slug> (layout 7C.2 Paths, Region row; DR-411), in the order
// of the topic and Latest pages (layout 7E, 7D; tajmin, 5 Nov 2026): the region name as the h1,
// no label and no description; the dated StoryCard rows (C-24) of news and analysis, no
// opinion, newest first; the C-08 Eyebrow: category on news, format on analysis; 10 first and
// load more (C-12); the region's nav item is current; every /regions/<slug> link opens its
// page (IMP-128); keyboard and axe, in Bangla and English (COL-13, TYP-03, LAY-02, LAY-14,
// CPT-05, CPT-06, DR-18, T-27).
// The mock regions are test cases: south-asia over 10 (load more), china 4 (no Button),
// oceania 0 (the title band only, noindex).

const PAGES = [
  {
    prefix: "",
    lang: "bn",
    title: "দক্ষিণ এশিয়া",
    china: "চীন",
    oceania: "ওশেনিয়া",
    loadMore: "আরও লোড করুন",
    menu: "মেনু",
    category: "/category/",
    analysis: "/analysis",
  },
  {
    prefix: "/en",
    lang: "en",
    title: "South Asia",
    china: "China",
    oceania: "Oceania",
    loadMore: "Load more",
    menu: "Menu",
    category: "/en/category/",
    analysis: "/en/analysis",
  },
] as const;

const REGIONS = [
  "americas",
  "europe",
  "russia",
  "middle-east",
  "south-asia",
  "china",
  "asia",
  "oceania",
];

// spacing-layout-system.md Section 13, with the tier edges.
const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

const list = (page: Page) => page.locator('[data-section="region"]');
const cards = (page: Page) => list(page).locator("[data-story-card]");

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
  const path = `${p.prefix}/regions/south-asia`;

  test.describe(`region ${path}`, () => {
    test("page order, title, language and 10 rows", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(p.title);
      // Only the page title: no label and no description (tajmin, 5 Nov 2026).
      await expect(page.locator("[data-page-title] p")).toHaveCount(0);

      const order = await page.evaluate(() =>
        [...document.querySelectorAll("main > *")].map(
          (el) =>
            el.getAttribute("data-section") ??
            el.getAttribute("data-ad-slot") ??
            el.tagName.toLowerCase(),
        ),
      );
      // The title band, then the list; no ad band and no rail ad, as the topic page.
      expect(order).toEqual(["header", "region"]);
      await expect(page.locator('[data-ad-slot="ad-top"]')).toHaveCount(1);
      await expect(page.locator('main [data-ad-slot="ad-band"]')).toHaveCount(
        0,
      );
      await expect(page.locator('main [data-ad-slot="ad-rail"]')).toHaveCount(
        0,
      );

      // The h1 names the list; no heading of its own, the titles are h2.
      await expect(list(page)).toHaveAttribute(
        "aria-labelledby",
        "region-title",
      );
      await expect(page.locator("h1#region-title")).toHaveCount(1);
      await expect(cards(page)).toHaveCount(10);
      await expect(list(page).locator("h2")).toHaveCount(10);

      // No Fact Check (DR-18).
      await expect(page.locator("main")).not.toContainText(
        /ফ্যাক্টচেক|fact[\s-]?check/i,
      );
    });

    test("one Eyebrow per row: category on news, format on analysis; no opinion; newest first", async ({
      page,
    }) => {
      await page.goto(path);
      await page.getByRole("button", { name: p.loadMore, exact: true }).click();
      await expect(cards(page)).toHaveCount(20);
      const rows = await cards(page).evaluateAll((els) =>
        els.map((card) => ({
          eyebrows: [...card.querySelectorAll("[data-eyebrow] a")].map(
            (a) => a.getAttribute("href") ?? "",
          ),
          time: card.querySelector("time")?.getAttribute("datetime") ?? "",
        })),
      );
      for (const row of rows) expect(row.eyebrows).toHaveLength(1);
      const hrefs = rows.map((row) => row.eyebrows[0]);
      // Analysis links to the analysis hub; every other row to its category. No opinion.
      expect(hrefs.filter((h) => h === p.analysis).length).toBeGreaterThan(0);
      expect(
        hrefs
          .filter((h) => h !== p.analysis)
          .every((h) => h.startsWith(p.category)),
      ).toBe(true);
      expect(hrefs.some((h) => h.includes("opinion"))).toBe(false);
      const times = rows.map((row) => Date.parse(row.time));
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
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

        // C-24 dated: image on top on phones; date | body | image from 600.
        const first = cards(page).first();
        const image = await box(first.locator(".story-media"));
        const title = await box(first.locator("h2"));
        if (width < 600) {
          expect(title.y).toBeGreaterThan(image.y + image.height - 1);
        } else {
          expect(image.x).toBeGreaterThan(title.x + title.width - 1);
          const date = await box(first.locator(".story-date"));
          expect(title.x).toBeGreaterThan(date.x + date.width - 1);
        }
      });
    }

    test("load more adds 10 and moves focus to the first new title", async ({
      page,
    }) => {
      await page.goto(path);
      const button = page.getByRole("button", {
        name: p.loadMore,
        exact: true,
      });
      await expect(cards(page)).toHaveCount(10);
      // Keyboard: focus the button and press Enter.
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(cards(page)).toHaveCount(20);
      // The title link, not the Eyebrow link before it.
      await expect(cards(page).nth(10).locator("h2 a")).toBeFocused();
      await expect(button).toHaveCount(1);
    });

    test("sparse: 4 stories, no Button; no stories, the title band only and noindex", async ({
      page,
    }) => {
      await page.goto(`${p.prefix}/regions/china`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.china);
      await expect(cards(page)).toHaveCount(4);
      await expect(
        page.getByRole("button", { name: p.loadMore, exact: true }),
      ).toHaveCount(0);
      await expect(list(page).locator('[data-divider="rule"]')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

      // Oceania has no stories: no list; the empty-state message is open (U-63).
      await page.goto(`${p.prefix}/regions/oceania`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        p.oceania,
      );
      await expect(list(page)).toHaveCount(0);
      // Below 3 stories: noindex, follow (DR-432, as the topic page).
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, follow",
      );
    });

    test("the language switch keeps the region", async ({ page }) => {
      await page.goto(path);
      const target =
        p.lang === "bn"
          ? "/en/regions/south-asia?lang=en"
          : "/regions/south-asia?lang=bn";
      await expect(page.locator("[data-top-bar] a[hreflang]")).toHaveAttribute(
        "href",
        target,
      );
    });

    test("nav: the region's Drawer item is current, South Asia in the NavBar too, Regions not", async ({
      page,
    }) => {
      // From 1280 the NavBar shows South Asia as the current item.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      await waitForNavRow(page);
      const navBar = page.locator("[data-nav-row]");
      await expect(navBar.locator('[aria-current="page"]')).toHaveAttribute(
        "href",
        path,
      );

      // The Drawer opens the Regions accordion with the region current.
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`${p.prefix}/regions/china`);
      const drawer = page.locator("[data-drawer]");
      await expect(async () => {
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        await menu.focus();
        await menu.press("Enter");
        await expect(drawer).toBeVisible({ timeout: 500 });
      }).toPass();
      const current = drawer.locator('[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute(
        "href",
        `${p.prefix}/regions/china`,
      );
      await expect(current).toBeVisible();
      await expect(
        drawer.locator(`a[href="${p.prefix}/regions"]`),
      ).not.toHaveAttribute("aria-current", "page");
    });

    test("IMP-128: every link to a region page opens it", async ({ page }) => {
      const hrefs = new Set<string>();
      // The region hub MoreLinks and the homepage P-2 featured region and nav links.
      for (const from of [`${p.prefix}/regions`, p.prefix || "/"]) {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(from);
        for (const href of await page
          .locator(`a[href^="${p.prefix}/regions/"]`)
          .evaluateAll((els) => els.map((a) => a.getAttribute("href")!)))
          hrefs.add(href);
      }
      // The Drawer sub-items: every region in the region order.
      for (const id of REGIONS) hrefs.add(`${p.prefix}/regions/${id}`);
      expect(hrefs.size).toBe(REGIONS.length);
      for (const href of hrefs) {
        const response = await page.request.get(href);
        expect(response.status(), href).toBe(200);
      }
    });

    test("keyboard: every link and button shows the focus ring (COL-13)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
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

    for (const theme of ["light", "dark"] as const) {
      for (const width of [360, 1280]) {
        test(`axe in ${theme} theme at ${width}`, async ({ page }) => {
          await setTheme(page, theme);
          await page.setViewportSize({ width, height: 900 });
          await page.goto(path);
          await expectNoBlockingAxe(page);
        });
      }
    }
  });
}

test("an unknown region gives a 404 (layout 7C.1)", async ({ page }) => {
  for (const path of [
    "/regions/atlantis",
    "/en/regions/atlantis",
    "/regions/China",
  ]) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
