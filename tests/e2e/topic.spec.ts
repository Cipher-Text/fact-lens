import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The topic page, /[lang]/topic/<slug> (layout 7C.2 Paths, Topic row; DR-410), in the order
// of the Latest page (layout 7D): the topic name as the h1, no label; the dated StoryCard rows
// (C-24) of news and analysis, no opinion, newest first; the C-08 Eyebrow: category on news,
// format on analysis; 10 first and load more (C-12); keyboard and axe, in Bangla and English
// (COL-13, TYP-03, LAY-02, LAY-14, CPT-05, CPT-06, DR-18, T-27).
// The mock topics are test cases (tajmin, 30 Oct 2026): regional-cooperation 14 (load more),
// rivers 10 (no Button), archives, river-trade, foreign-reserves 3 each (sparse).

const PAGES = [
  {
    prefix: "",
    lang: "bn",
    title: "আঞ্চলিক সহযোগিতা",
    loadMore: "আরও লোড করুন",
    category: "/category/",
    analysis: "/analysis",
  },
  {
    prefix: "/en",
    lang: "en",
    title: "Regional cooperation",
    loadMore: "Load more",
    category: "/en/category/",
    analysis: "/en/analysis",
  },
] as const;

// spacing-layout-system.md Section 13, with the tier edges.
const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

const cards = (page: Page) =>
  page.locator('[data-section="topic"] [data-story-card]');

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
  const path = `${p.prefix}/topic/regional-cooperation`;

  test.describe(`topic ${path}`, () => {
    test("page order, title, language and 10 rows", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(p.title);
      // Only the page title: no label in the band (tajmin, 30 Oct 2026).
      await expect(page.locator("[data-page-title] p")).toHaveCount(0);

      const order = await page.evaluate(() =>
        [...document.querySelectorAll("main > *")].map(
          (el) =>
            el.getAttribute("data-section") ??
            el.getAttribute("data-ad-slot") ??
            el.tagName.toLowerCase(),
        ),
      );
      // The title band, then the list; no ad band, as on the Latest page.
      expect(order).toEqual(["header", "topic"]);
      await expect(page.locator('[data-ad-slot="ad-top"]')).toHaveCount(1);
      await expect(page.locator('main [data-ad-slot="ad-band"]')).toHaveCount(
        0,
      );

      // The h1 names the list; no heading of its own, the titles are h2.
      const list = page.locator('[data-section="topic"]');
      await expect(list).toHaveAttribute("aria-labelledby", "topic-title");
      await expect(page.locator("h1#topic-title")).toHaveCount(1);
      await expect(cards(page)).toHaveCount(10);
      await expect(list.locator("h2")).toHaveCount(10);

      // No Fact Check, and never the word "tag" (DR-18, DR-410).
      await expect(page.locator("main")).not.toContainText(
        /ফ্যাক্টচেক|fact[\s-]?check|\btags?\b|ট্যাগ/i,
      );
    });

    test("one Eyebrow per row: category on news, format on analysis; no opinion; newest first", async ({
      page,
    }) => {
      await page.goto(path);
      await page.getByRole("button", { name: p.loadMore, exact: true }).click();
      await expect(cards(page)).toHaveCount(14);
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
      expect(hrefs.filter((h) => h === p.analysis)).toHaveLength(3);
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

    test("load more adds the last 4, moves focus to the first new title, and goes", async ({
      page,
    }) => {
      await page.goto(path);
      const button = page.getByRole("button", {
        name: p.loadMore,
        exact: true,
      });
      const rule = page.locator('[data-section="topic"] [data-divider="rule"]');
      await expect(cards(page)).toHaveCount(10);
      await expect(rule).toBeVisible();

      // Keyboard: focus the button and press Enter.
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(cards(page)).toHaveCount(14);
      // The title link, not the Eyebrow link before it.
      await expect(cards(page).nth(10).locator("h2 a")).toBeFocused();
      await expect(button).toHaveCount(0);
      await expect(rule).toHaveCount(0);
    });

    test("exactly 10 stories: no Button; 3 stories: a short list, no Button", async ({
      page,
    }) => {
      for (const [slug, count] of [
        ["rivers", 10],
        ["archives", 3],
        ["river-trade", 3],
        ["foreign-reserves", 3],
      ] as const) {
        await page.goto(`${p.prefix}/topic/${slug}`);
        await expect(cards(page), slug).toHaveCount(count);
        await expect(
          page.getByRole("button", { name: p.loadMore, exact: true }),
        ).toHaveCount(0);
        await expect(
          page.locator('[data-section="topic"] [data-divider="rule"]'),
        ).toHaveCount(0);
      }
    });

    // DR-432 (layout 7E): below 3 stories a topic page is noindex, follow; from 3 it sets no
    // robots rule. Every mock topic has 3 stories or more, so the noindex case is in the
    // unit test (src/lib/seo.test.ts).
    test("robots: 3 stories or more set no noindex", async ({ page }) => {
      for (const slug of ["regional-cooperation", "archives"]) {
        await page.goto(`${p.prefix}/topic/${slug}`);
        await expect(page.locator('meta[name="robots"]'), slug).toHaveCount(0);
      }
    });

    test("the language switch keeps the topic", async ({ page }) => {
      await page.goto(path);
      // The TopBar language link goes to the same topic in the other language (DR-270).
      const target =
        p.lang === "bn"
          ? "/en/topic/regional-cooperation?lang=en"
          : "/topic/regional-cooperation?lang=bn";
      await expect(page.locator("[data-top-bar] a[hreflang]")).toHaveAttribute(
        "href",
        target,
      );
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

test("an unknown topic and a bare /topic give a 404 (layout 7C.1)", async ({
  page,
}) => {
  for (const path of [
    "/topic/no-such-topic",
    "/en/topic/no-such-topic",
    "/topic",
    "/en/topic",
    "/topic/Rivers",
  ]) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("the article Topics links open the topic pages", async ({ page }) => {
  for (const prefix of ["", "/en"]) {
    await page.goto(`${prefix}/topic/rivers`);
    // The article of the river data story carries 4 topics (C-34).
    const href = await cards(page)
      .locator('h2 a[href*="river-data-framework"]')
      .getAttribute("href");
    await page.goto(href!);
    const links = page.locator(`a[href^="${prefix}/topic/"]`);
    await expect(links).toHaveCount(4);
    for (const topicHref of await links.evaluateAll((els) =>
      els.map((a) => a.getAttribute("href")!),
    )) {
      const response = await page.request.get(topicHref);
      expect(response.status(), topicHref).toBe(200);
    }
  }
});
