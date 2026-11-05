import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// The Latest page, /[lang]/latest (layout 7D; layout 7C.2 Paths, News hub row: news only):
// page order, the dated StoryCard rows (C-24) with the category Eyebrow (C-08), newest
// first, 10 first and 10 per load more (C-12), keyboard and axe, in Bangla and English
// (COL-13, TYP-03, LAY-02, LAY-07, LAY-14, LAY-17, CPT-05, CPT-06, DR-18, T-27).

const PAGES = [
  {
    path: "/latest",
    lang: "bn",
    title: "সর্বশেষ",
    loadMore: "আরও লোড করুন",
    category: "/category/",
    hoursAgo: "৩ ঘণ্টা আগে",
  },
  {
    path: "/en/latest",
    lang: "en",
    title: "Latest",
    loadMore: "Load more",
    category: "/en/category/",
    hoursAgo: "3 hours ago",
  },
] as const;

// spacing-layout-system.md Section 13, with the tier edges.
const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

const cards = (page: Page) =>
  page.locator('[data-section="latest"] [data-story-card]');

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
  test.describe(`latest ${p.path}`, () => {
    test("page order, title, language and 10 rows", async ({ page }) => {
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
      // The title band, then the list; no ad band (tajmin, 28 Oct 2026).
      expect(order).toEqual(["header", "latest"]);
      await expect(page.locator('[data-ad-slot="ad-top"]')).toHaveCount(1);
      await expect(page.locator('main [data-ad-slot="ad-band"]')).toHaveCount(
        0,
      );

      // The h1 names the list; no heading of its own, the titles are h2.
      const list = page.locator('[data-section="latest"]');
      await expect(list).toHaveAttribute("aria-labelledby", "latest-title");
      await expect(page.locator("h1#latest-title")).toHaveCount(1);
      await expect(cards(page)).toHaveCount(10);
      await expect(list.locator("h2")).toHaveCount(10);

      // No Fact Check (DR-18).
      await expect(page.locator("main")).not.toContainText(
        /ফ্যাক্টচেক|fact[\s-]?check/i,
      );
    });

    test("every row shows the category Eyebrow, news only, newest first", async ({
      page,
    }) => {
      await page.goto(p.path);
      const rows = await cards(page).evaluateAll((els) =>
        els.map((card) => ({
          eyebrows: [...card.querySelectorAll("[data-eyebrow] a")].map(
            (a) => a.getAttribute("href") ?? "",
          ),
          time: card.querySelector("time")?.getAttribute("datetime") ?? "",
        })),
      );
      expect(rows).toHaveLength(10);
      for (const row of rows) {
        // One Eyebrow, the category link: no analysis or opinion label (news only).
        expect(row.eyebrows).toHaveLength(1);
        expect(row.eyebrows[0].startsWith(p.category)).toBe(true);
      }
      const times = rows.map((row) => Date.parse(row.time));
      expect(times).toEqual([...times].sort((a, b) => b - a));
      // The page mixes categories.
      expect(new Set(rows.map((row) => row.eyebrows[0])).size).toBeGreaterThan(
        1,
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

        // C-24 dated: image on top on phones; date | body | image from 600, the date
        // column the same width on every row.
        const first = cards(page).first();
        const image = await box(first.locator(".story-media"));
        const title = await box(first.locator("h2"));
        if (width < 600) {
          expect(title.y).toBeGreaterThan(image.y + image.height - 1);
        } else {
          expect(image.x).toBeGreaterThan(title.x + title.width - 1);
          const date = await box(first.locator(".story-date"));
          expect(title.x).toBeGreaterThan(date.x + date.width - 1);
          const starts = await cards(page).evaluateAll((els) =>
            els.map((card) =>
              Math.round(
                card.querySelector(".story-body")!.getBoundingClientRect().x,
              ),
            ),
          );
          expect(new Set(starts).size).toBe(1);
        }
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
      const rule = page.locator(
        '[data-section="latest"] [data-divider="rule"]',
      );
      await expect(cards(page)).toHaveCount(10);
      await expect(rule).toBeVisible();

      // Keyboard: focus the button and press Enter.
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(cards(page)).toHaveCount(20);
      // The title link, not the Eyebrow link before it.
      await expect(cards(page).nth(10).locator("h2 a")).toBeFocused();

      let shown = 20;
      while ((await button.count()) > 0) {
        await button.click();
        await expect(cards(page)).not.toHaveCount(shown);
        const now = await cards(page).count();
        expect(now - shown).toBeLessThanOrEqual(10);
        shown = now;
      }
      expect(shown).toBeGreaterThan(20);
      await expect(button).toHaveCount(0);
      await expect(rule).toHaveCount(0);
    });

    test("rows added by load more show the reader time at once (TYP-17)", async ({
      page,
    }) => {
      const button = page.getByRole("button", {
        name: p.loadMore,
        exact: true,
      });
      // The time of the 11th story, the first row the first press adds.
      await page.goto(p.path);
      await button.click();
      const iso = await cards(page)
        .nth(10)
        .locator("time")
        .getAttribute("datetime");
      // Date.now fixed at 3 hours after it. The test reads the row right after the press,
      // long before the script's 5 minute run could set it.
      await page.clock.setFixedTime(Date.parse(iso!) + 3 * 3600000);
      await page.goto(p.path);
      await button.click();
      await expect(cards(page).nth(10).locator("time")).toHaveText(p.hoursAgo);
    });

    test("load more: the added rows fade in, the first rows do not; axe after the fade", async ({
      page,
    }) => {
      await page.goto(p.path);
      const list = page.locator('[data-section="latest"]');
      await expect(list.locator("li[data-added]")).toHaveCount(0);
      await page.getByRole("button", { name: p.loadMore, exact: true }).click();
      const added = list.locator("li[data-added]");
      await expect(added).toHaveCount(10);
      await expect(list.locator("li").nth(10)).toHaveAttribute(
        "data-added",
        "true",
      );
      // Opacity only, the one motion duration (DR-346, DR-284): nothing moves.
      const motion = await added.first().evaluate((el) => {
        const s = getComputedStyle(el);
        const from = (
          el.getAnimations()[0]?.effect as KeyframeEffect | undefined
        )?.getKeyframes()[0];
        return [
          s.animationName,
          s.animationDuration,
          String(from?.opacity),
          String(from?.transform),
        ];
      });
      expect(motion).toEqual(["story-added", "0.45s", "0", "undefined"]);
      // axe reads a lighter color while the rows fade: wait for the end (IMP-119).
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((a) => a.finished)),
      );
      await expect(added.first()).toHaveCSS("opacity", "1");
      await expectNoBlockingAxe(page);
    });

    test("load more: a slow image of an added row fades in when it has loaded; the first rows' images do not fade", async ({
      page,
    }) => {
      await page.goto(p.path);
      // The first rows' images show as they load, as before.
      await expect(
        page.locator('[data-section="latest"] .story-image-fade'),
      ).toHaveCount(0);
      // Hold the images back, so they arrive after the row has faded in.
      let release!: () => void;
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route(/\/_next\/image|\/mock\/landscape/, async (route) => {
        await held;
        await route.continue();
      });
      await page.getByRole("button", { name: p.loadMore, exact: true }).click();
      const image = page
        .locator('[data-section="latest"] li[data-added] img.story-image-fade')
        .first();
      await image.scrollIntoViewIfNeeded();
      // The row is in (its fade has ended); the image is still transparent over the slot
      // fill. The held image has no transition yet, so this waits for the row only.
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((a) => a.finished)),
      );
      await expect(image).not.toHaveAttribute("data-loaded");
      await expect(image).toHaveCSS("opacity", "0");
      const slot = await image.evaluate(
        (img) => getComputedStyle(img.parentElement!).backgroundColor,
      );
      expect(slot).not.toBe("rgba(0, 0, 0, 0)");
      // The image arrives and fades in over the one motion duration.
      release();
      await expect(image).toHaveAttribute("data-loaded", "");
      await expect(image).toHaveCSS("transition-duration", "0.45s");
      await expect(image).toHaveCSS("opacity", "1");
    });

    test("load more with reduced motion: the added rows show at once", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(p.path);
      await page.getByRole("button", { name: p.loadMore, exact: true }).click();
      const row = page
        .locator('[data-section="latest"] li[data-added]')
        .first();
      await expect(row).toHaveCSS("animation-duration", "0s");
      await expect(row).toHaveCSS("opacity", "1");
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

test("the homepage Latest See more link opens the Latest page", async ({
  page,
}) => {
  for (const [home, target] of [
    ["/", "/latest"],
    ["/en", "/en/latest"],
  ] as const) {
    await page.goto(home);
    const response = await page.request.get(target);
    expect(response.status()).toBe(200);
    await expect(
      page.locator(`[data-section="hero"] a[href="${target}"]`),
    ).toHaveCount(1);
  }
});
