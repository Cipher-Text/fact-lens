import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The category page, /[lang]/category/[id] (spacing-layout-system.md 7B): page order, the
// feature section with the rail (LAY-05), the card rows, most read in the columns layout, More stories
// with load more, 404, keyboard and axe, in Bangla and English (COL-13, TYP-03, LAY-02,
// LAY-06, LAY-07, LAY-09 to LAY-14, LAY-17, CPT-05, CPT-06, DR-153, DR-181). The formats
// (DR-415): the main stream is news only, the analysis and opinion row is above Most read,
// More stories has no opinion and no story shows twice.

const PAGES = [
  {
    path: "/category/economy",
    lang: "bn",
    title: "অর্থনীতি ও বাণিজ্য",
    analysis: "বিশ্লেষণ",
    opinion: "মতামত",
    loadMore: "আরও লোড করুন",
  },
  {
    path: "/en/category/economy",
    lang: "en",
    title: "Economy and Trade",
    analysis: "Analysis",
    opinion: "Opinion",
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
            el.tagName.toLowerCase(),
        ),
      );
      // The title band is the first row of main (C-43); the missing translation note keeps
      // an empty status region inside it, above the title (DR-401, U-48).
      await expect(
        page.locator("main > [data-page-title] [data-note][role=status]"),
      ).toHaveCount(1);
      expect(order).toEqual([
        "header",
        "category-feature",
        "ad-band",
        "category-formats",
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

    test("analysis and opinion row: two blocks above Most read, opinion as quote rows", async ({
      page,
    }) => {
      const prefix = p.lang === "en" ? "/en" : "";
      const row = section(page, "category-formats");
      const blocks = row.locator("[data-category-block]");
      for (const width of [360, 600, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await expect(blocks).toHaveCount(2);
        const analysis = row.locator('[data-category-block="analysis"]');
        const opinion = row.locator('[data-category-block="opinion"]');
        await expect(analysis.getByRole("heading", { level: 2 })).toHaveText(
          p.analysis,
        );
        await expect(opinion.getByRole("heading", { level: 2 })).toHaveText(
          p.opinion,
        );
        // Analysis at the start, Opinion at the end from 600; stacked on phones (LAY-07).
        const a = await box(analysis);
        const o = await box(opinion);
        if (width < 600) {
          expect(Math.abs(o.x - a.x)).toBeLessThanOrEqual(1);
          expect(o.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
        } else {
          expect(o.x).toBeGreaterThan(a.x + a.width - 1);
          expect(Math.abs(o.y - a.y)).toBeLessThanOrEqual(1);
        }
        // The blocks stay in the wrapper column, as More stories (the rail is empty).
        const wrapper = await box(page.locator("[data-category-more-wrapper]"));
        expect(Math.abs(a.x - wrapper.x)).toBeLessThanOrEqual(1);
        expect(o.x + o.width).toBeLessThanOrEqual(
          wrapper.x + wrapper.width + 1,
        );
      }
      // Up to 5 stories a block; opinion has no image and shows the author (P-4 rows).
      expect(
        await row.locator('[data-category-block="analysis"] article').count(),
      ).toBeLessThanOrEqual(5);
      const opinionRows = row.locator('[data-category-block="opinion"] li');
      expect(await opinionRows.count()).toBeGreaterThan(0);
      expect(await opinionRows.count()).toBeLessThanOrEqual(5);
      await expect(
        row.locator('[data-category-block="opinion"] .story-media'),
      ).toHaveCount(0);
      await expect(
        row.locator('[data-category-block="opinion"] [data-author]'),
      ).toHaveCount(await opinionRows.count());
      // The MoreLinks go to the format hubs.
      for (const format of ["analysis", "opinion"]) {
        await expect(
          row.locator(
            `[data-category-block="${format}"] a[href="${prefix}/${format}"]`,
          ),
        ).toHaveCount(1);
      }
    });

    test("no story shows twice, and More stories has no opinion", async ({
      page,
    }) => {
      await page.goto(p.path);
      // Show every More story first.
      const button = page.getByRole("button", {
        name: p.loadMore,
        exact: true,
      });
      while ((await button.count()) > 0) await button.click();
      const hrefs = (name: string) =>
        section(page, name)
          .locator("h3 a")
          .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      const shown = [
        ...(await hrefs("category-feature")),
        ...(await hrefs("category-formats")),
        ...(await hrefs("category-more")),
      ];
      expect(shown.length).toBeGreaterThan(0);
      expect(new Set(shown).size).toBe(shown.length);
      const opinion = await section(page, "category-formats")
        .locator('[data-category-block="opinion"] h3 a')
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      const more = await hrefs("category-more");
      for (const href of opinion) expect(more).not.toContain(href);
    });

    // Economy is the page of this test: with news and analysis only in More stories
    // (DR-415), only economy and geopolitics have a second load in today's mock data.
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

test("sparse (7.3): security has no opinion, so the row shows Analysis only, at its size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const prefix of ["", "/en"]) {
    await page.goto(`${prefix}/category/security`);
    const row = page.locator('[data-section="category-formats"]');
    await expect(row.locator("[data-category-block]")).toHaveCount(1);
    await expect(
      row.locator('[data-category-block="analysis"] article'),
    ).toHaveCount(5);
    // The block keeps its half of the row; the other half stays empty.
    const block = await row.locator("[data-category-block]").boundingBox();
    const grid = await row.locator("[data-grouped-row]").boundingBox();
    expect(block!.width).toBeLessThan(grid!.width / 2 + 1);
  }
});

// DR-436 (layout 7B.1, 7B.3): fixed halves, Analysis at the start, Opinion at the end. An empty
// block leaves its own half empty; the other block keeps its place. On phones the empty half
// takes no row.
for (const prefix of ["", "/en"]) {
  test(`fixed halves: an empty block leaves its half empty ${prefix || "/"}`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/category/security`);
    const row = page.locator('[data-section="category-formats"]');
    const empty = row.locator('[data-empty-half="opinion"]');
    await expect(empty).toHaveCount(1);
    await expect(empty).toBeEmpty();
    // From 600 (the first two-column width): Analysis at the start, the empty opinion half
    // at the end, side by side.
    for (const width of [600, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const grid = (await row.locator("[data-grouped-row]").boundingBox())!;
      const analysis = (await row
        .locator('[data-category-block="analysis"]')
        .boundingBox())!;
      const half = (await empty.boundingBox())!;
      expect(Math.abs(analysis.x - grid.x), `${width}`).toBeLessThanOrEqual(1);
      expect(half.x, `${width}`).toBeGreaterThan(analysis.x + analysis.width);
      expect(Math.abs(half.y - analysis.y), `${width}`).toBeLessThanOrEqual(1);
    }
    // Under 600: one block per row, and the empty half is not shown, so it adds no gap.
    for (const width of [360, 599]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(empty).toBeHidden();
      const g = (await row.locator("[data-grouped-row]").boundingBox())!;
      const a = (await row
        .locator('[data-category-block="analysis"]')
        .boundingBox())!;
      expect(
        Math.abs(g.y + g.height - (a.y + a.height)),
        `${width}`,
      ).toBeLessThanOrEqual(1);
    }
  });
}

test("the title band: full width, the title in the shell, under the ad-top row", async ({
  page,
}) => {
  // Block inset space-page-title-band: 24px under 600, 32px from 600, 40px from 1024.
  for (const [width, inset] of [
    [360, "24px"],
    [600, "32px"],
    [1023, "32px"],
    [1024, "40px"],
    [1280, "40px"],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/category/security");
    const band = page.locator("main > [data-page-title]");
    const b = await box(band);
    const ad = await box(page.locator('[data-ad-slot="ad-top"]'));
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(b.x).toBe(0);
    expect(Math.abs(b.width - clientWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.y - (ad.y + ad.height))).toBeLessThanOrEqual(1);
    // The band is --color-page-title-band, surface (DR-424, DR-425), not the page background.
    const [bandBg, pageBg, surface, padTop, padBottom] = await band.evaluate(
      (el) => {
        const probe = document.createElement("div");
        probe.style.backgroundColor = "var(--surface)";
        document.body.append(probe);
        const surface = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const style = getComputedStyle(el);
        return [
          style.backgroundColor,
          getComputedStyle(document.body).backgroundColor,
          surface,
          style.paddingTop,
          style.paddingBottom,
        ];
      },
    );
    expect(bandBg).toBe(surface);
    expect(bandBg).not.toBe(pageBg);
    expect([padTop, padBottom]).toEqual([inset, inset]);
    // The title lines up with the feature section.
    const h1 = await box(band.getByRole("heading", { level: 1 }));
    const wrapper = await box(page.locator("[data-category-wrapper]"));
    expect(Math.abs(h1.x - wrapper.x)).toBeLessThanOrEqual(1);
  }
});

test("More stories: an analysis row shows the format Eyebrow above the title at every width; news rows none", async ({
  page,
}) => {
  for (const prefix of ["", "/en"]) {
    const label = prefix ? "Analysis" : "বিশ্লেষণ";
    const rows = page.locator(
      '[data-section="category-more"] [data-story-card]',
    );
    const eyebrows = rows.locator(".type-eyebrow");
    await page.goto(`${prefix}/category/security`);
    // One analysis row, in the first 10, so it shows without load more.
    await expect(eyebrows).toHaveCount(1);
    expect(
      await rows.evaluateAll((cards) =>
        cards.findIndex((c) => c.querySelector(".type-eyebrow")),
      ),
    ).toBeLessThan(10);
    const analysisRow = rows.filter({ has: page.locator(".type-eyebrow") });
    const eyebrow = analysisRow.getByRole("link", { name: label, exact: true });
    await expect(eyebrow).toHaveAttribute("href", `${prefix}/analysis`);
    await expect(analysisRow.locator("[data-chip]")).toHaveCount(0);
    for (const width of [360, 600, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(eyebrow).toBeVisible();
      const eyebrowBox = await box(eyebrow);
      const title = await box(analysisRow.locator("h3"));
      expect(eyebrowBox.y).toBeLessThan(title.y);
      expect(Math.abs(eyebrowBox.x - title.x)).toBeLessThanOrEqual(1);
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
