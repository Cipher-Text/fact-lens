import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The category page, /[lang]/category/[id] (spacing-layout-system.md 7B): page order, the
// feature section with the rail (LAY-05), the card rows, most read in the columns layout, More stories
// with load more, 404, keyboard and axe, in Bangla and English (COL-13, TYP-03, LAY-02,
// LAY-06, LAY-07, LAY-09 to LAY-14, LAY-17, CPT-05, CPT-06, DR-153, DR-181).

const PAGES = [
  {
    path: "/category/economy",
    lang: "bn",
    title: "অর্থনীতি ও বাণিজ্য",
    loadMore: "আরও লোড করুন",
  },
  {
    path: "/en/category/economy",
    lang: "en",
    title: "Economy and Trade",
    loadMore: "Load more",
  },
] as const;

// spacing-layout-system.md Section 13, with the tier edges.
const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

const section = (page: Page, name: string) =>
  page.locator(`[data-section="${name}"]`);

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
  test.describe(`category ${p.path}`, () => {
    test("page order, title and language", async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(p.title);

      const order = await page.evaluate(() =>
        [...document.querySelectorAll("main > *")].map(
          (el) =>
            el.getAttribute("data-section") ??
            el.getAttribute("data-ad-slot") ??
            (el.hasAttribute("data-note") ? "note" : null) ??
            el.tagName.toLowerCase(),
        ),
      );
      // The missing translation note keeps an empty status region (DR-401, U-48).
      expect(order).toEqual([
        "note",
        "header",
        "category-feature",
        "ad-band",
        "most-read",
        "ad-band",
        "category-more",
      ]);
      // The top ad row is under the site header, outside main (DR-295).
      await expect(page.locator('[data-ad-slot="ad-top"]')).toHaveCount(1);

      // CategoryFeatureSection: the feature story, the 3 card rows and the latest 5 in the rail.
      await expect(
        section(page, "category-feature").locator("[data-latest] li"),
      ).toHaveCount(5);
      await expect(
        page.locator("[data-category-wrapper] > ul > li"),
      ).toHaveCount(3);
      await expect(page.locator("[data-most-read-item]")).toHaveCount(5);
      // More stories: 10 at first.
      await expect(
        page.locator('[data-section="category-more"] [data-story-card]'),
      ).toHaveCount(10);

      // No Eyebrow: the page title names the category (DR-153). No Fact Check (DR-18).
      await expect(page.locator("main [data-eyebrow]")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(
        /ফ্যাক্টচেক|fact[\s-]?check/i,
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

        // The rail is beside the wrapper from 1024, under the whole wrapper below (LAY-05).
        const wrapper = await box(page.locator("[data-category-wrapper]"));
        const rail = await box(page.locator("[data-category-rail]"));
        if (width >= 1024) {
          expect(rail.x).toBeGreaterThan(wrapper.x + wrapper.width - 1);
          expect(Math.abs(rail.y - wrapper.y)).toBeLessThanOrEqual(1);
        } else {
          expect(rail.y).toBeGreaterThanOrEqual(wrapper.y + wrapper.height - 1);
        }

        // Most read, columns layout: phone one column; from 600 two columns, 1 to 3 then 4
        // and 5, the tops lined up; from 1024 the list in the middle and end thirds.
        const items = page.locator("[data-most-read-item]");
        const tops: number[] = [];
        const lefts: number[] = [];
        for (let i = 0; i < 5; i++) {
          const b = await box(items.nth(i));
          tops.push(Math.round(b.y));
          lefts.push(Math.round(b.x));
        }
        if (width < 600) {
          expect(new Set(lefts).size).toBe(1);
          for (let i = 1; i < 5; i++)
            expect(tops[i]).toBeGreaterThan(tops[i - 1]);
        } else {
          expect(lefts[0]).toBe(lefts[1]);
          expect(lefts[1]).toBe(lefts[2]);
          expect(lefts[3]).toBe(lefts[4]);
          expect(lefts[3]).not.toBe(lefts[0]);
          expect(Math.abs(tops[3] - tops[0])).toBeLessThanOrEqual(1);
          const shell = await box(section(page, "most-read"));
          const list = await box(page.locator('[data-section="most-read"] ol'));
          if (width >= 1024) {
            // The start third stays empty.
            expect(list.x).toBeGreaterThan(shell.x + shell.width / 3 - 1);
          } else {
            expect(Math.abs(list.x - shell.x)).toBeLessThanOrEqual(1);
          }
        }

        // More stories: image on top on phones; date | body | image from 600.
        const story = page
          .locator('[data-section="category-more"] [data-story-card]')
          .first();
        const image = await box(story.locator(".story-media"));
        const title = await box(story.locator("h3"));
        if (width < 600) {
          expect(title.y).toBeGreaterThan(image.y + image.height - 1);
        } else {
          expect(image.x).toBeGreaterThan(title.x + title.width - 1);
        }
      });
    }

    test("load more adds 10, moves focus to the first new story, and goes when none are left", async ({
      page,
    }) => {
      await page.goto(p.path);
      const stories = page.locator(
        '[data-section="category-more"] [data-story-card]',
      );
      const button = page.getByRole("button", {
        name: p.loadMore,
        exact: true,
      });
      const rule = page.locator(
        '[data-section="category-more"] [data-divider="rule"]',
      );
      await expect(stories).toHaveCount(10);
      await expect(rule).toBeVisible();

      // Keyboard: focus the button and press Enter.
      await button.focus();
      await page.keyboard.press("Enter");
      const after = await stories.count();
      expect(after).toBeGreaterThan(10);
      expect(after).toBeLessThanOrEqual(20);
      await expect(stories.nth(10).getByRole("link").first()).toBeFocused();

      // Press until no stories are left: each press adds 10 at most, and the rule and the
      // button go with the last one.
      let shown = after;
      while ((await button.count()) > 0) {
        expect(shown % 10).toBe(0);
        await button.click();
        await expect(stories).not.toHaveCount(shown);
        shown = await stories.count();
      }
      await expect(button).toHaveCount(0);
      await expect(rule).toHaveCount(0);
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

test("every category page builds in both languages", async ({ page }) => {
  // Bangladesh is not a category (DR-412).
  for (const id of [
    "geopolitics",
    "economy",
    "security",
    "technology",
    "history",
  ]) {
    for (const prefix of ["", "/en"]) {
      const response = await page.goto(`${prefix}/category/${id}`);
      expect(response?.status(), `${prefix}/category/${id}`).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  }
});

test("an unknown category id is a 404, and চীন is not a category (DR-19)", async ({
  page,
}) => {
  for (const path of [
    "/category/no-such-category",
    "/en/category/no-such-category",
    "/category/china",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});
