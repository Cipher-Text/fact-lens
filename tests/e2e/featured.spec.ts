import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// R2-10: P-2 FeaturedCategorySection for বাংলাদেশ and ভূরাজনীতি (component-system.md P-2,
// C-24, C-03; spacing-layout-system.md 7.1 to 7.3, 13; DR-118, DR-119, DR-121, DR-122,
// DR-123, LAY-03, LAY-05, LAY-12, LAY-13).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    titles: { bangladesh: "বাংলাদেশ", geopolitics: "ভূরাজনীতি ও কূটনীতি" },
    more: (title: string) => `আরও দেখুন: ${title}`,
  },
  {
    path: "/en",
    lang: "en",
    titles: {
      bangladesh: "Bangladesh",
      geopolitics: "Geopolitics and Diplomacy",
    },
    more: (title: string) => `See more: ${title}`,
  },
] as const;

const CATEGORIES = ["bangladesh", "geopolitics"] as const;

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440, 1920,
];

// spacing-layout-system.md 3.2: the wrapper is shell − 304 − column gap (24px at 1024, 32px from 1280).
const WRAPPER: Record<number, number> = {
  1024: 648,
  1180: 804,
  1279: 903,
  1280: 896,
  1366: 944,
  1440: 944,
  1920: 944,
};

const section = (page: Page, category: string) =>
  page.locator(`[data-section="featured"][data-category="${category}"]`);

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
  test.describe(`featured categories ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        const gutter = width < 600 ? 16 : 24;
        const shell = Math.min(width - 2 * gutter, 1280);
        // --grid-column-gap: 16px, 24px from 768, 32px from 1280 (spacing-layout-system.md §3).
        const columnGap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;

        for (const category of CATEGORIES) {
          const s = section(page, category);
          const wrapper = s.locator("[data-featured-wrapper]");
          const rail = s.locator("[data-featured-rail]");
          const feature = wrapper.locator("[data-story-card]");
          const featureImage = feature.locator("[data-story-media] img");
          const featureText = feature.locator(".story-body");

          // Shell width (LAY-03).
          const sectionBox = await box(s);
          expect(Math.round(sectionBox.width)).toBe(shell);

          // Wrapper + 304px rail from 1024; rail under the wrapper below (LAY-05).
          const w = await box(wrapper);
          const r = await box(rail);
          if (width >= 1024) {
            expect(Math.round(r.width)).toBe(304);
            expect(Math.round(w.width)).toBe(WRAPPER[width]);
            expect(Math.round(r.y)).toBe(Math.round(w.y));
            expect(r.x).toBeGreaterThan(w.x + w.width);
          } else {
            expect(Math.round(w.width)).toBe(shell);
            expect(Math.round(r.width)).toBe(shell);
            expect(r.y).toBeGreaterThan(w.y + w.height);
          }

          // Feature story: one column under 768, image first, 16px to the text (P-2).
          // From 768 the text is at the start and the image at the end, top aligned, with
          // the image 50% (768 to 1023, DR-119) or 60% (from 1024, DR-118) of the free
          // width, between 420 and 557px.
          const i = await box(featureImage);
          const t = await box(featureText);
          expect(Math.round((i.width / i.height) * 100)).toBe(150); // 3:2
          if (width < 768) {
            expect(Math.round(i.width)).toBe(Math.round(w.width));
            expect(Math.round(t.y)).toBe(Math.round(i.y + i.height + 16));
            expect(Math.round(t.x)).toBe(Math.round(i.x));
          } else {
            const share = width >= 1024 ? 0.6 : 0.5;
            const expected = Math.min(
              557,
              Math.max(420, (w.width - columnGap) * share),
            );
            expect(Math.abs(i.width - expected)).toBeLessThanOrEqual(1);
            expect(Math.round(t.y)).toBe(Math.round(i.y));
            expect(Math.round(i.x + i.width)).toBe(Math.round(w.x + w.width));
            expect(Math.round(i.x - (t.x + t.width))).toBe(columnGap);
          }

          // The image link is as tall as its image, so the focus ring fits (COL-13).
          for (const media of [
            featureImage.locator("xpath=.."),
            rail.locator("[data-story-media]"),
          ]) {
            const link = await box(media);
            const img = await box(media.locator("img"));
            expect(Math.abs(link.height - img.height)).toBeLessThanOrEqual(1);
          }

          // Rail: one image story, then two text rows with a rule between (C-24, C-03).
          const card = rail.locator("[data-story-card]");
          const cardImage = card.locator("[data-story-media] img");
          const cardText = card.locator(".story-body");
          const rows = rail.locator("[data-story-list] > li");
          await expect(rows).toHaveCount(2);
          await expect(rows.locator("img")).toHaveCount(0);
          const ci = await box(cardImage);
          const ct = await box(cardText);
          expect(Math.round((ci.width / ci.height) * 100)).toBe(178); // 16:9
          if (width >= 1024) {
            // In the 304px rail: image on top, 16px, text below.
            expect(Math.round(ci.width)).toBe(304);
            expect(Math.round(ct.y)).toBe(Math.round(ci.y + ci.height + 16));
          } else {
            // Row 2 : 1, --grid-column-gap between them (DR-300), text at the start, image at the end (DR-121).
            const imageWidth = (r.width - columnGap) / 3;
            expect(Math.abs(ci.width - imageWidth)).toBeLessThanOrEqual(1);
            expect(Math.round(ct.y)).toBe(Math.round(ci.y));
            expect(Math.round(ci.x + ci.width)).toBe(Math.round(r.x + r.width));
            expect(Math.round(ci.x - (ct.x + ct.width))).toBe(columnGap);
          }
          const cardBox = await box(card);
          const firstRow = await box(rows.nth(0));
          const secondRow = await box(rows.nth(1));
          expect(firstRow.y).toBeGreaterThan(cardBox.y + cardBox.height);
          expect(secondRow.y).toBeGreaterThan(firstRow.y + firstRow.height);

          // One আরও দেখুন link below the wrapper and the rail, at the end edge (DR-123).
          const more = s.getByRole("link", {
            name: p.more(p.titles[category]),
          });
          await expect(more).toHaveCount(1);
          await expect(more).toHaveAttribute(
            "href",
            `${p.lang === "bn" ? "" : "/en"}/category/${category}`,
          );
          const m = await box(more);
          expect(m.y).toBeGreaterThan(
            Math.max(w.y + w.height, r.y + r.height) - 1,
          );
          expect(
            Math.abs(m.x + m.width - (sectionBox.x + sectionBox.width)),
          ).toBeLessThanOrEqual(1);

          // No text is clipped and no word runs out of its box (LAY-17, TYP-09).
          const overflowing = await s.evaluate((el) =>
            [...el.querySelectorAll(":is(h2, h3, p, a, time):not(.sr-only)")]
              .filter(
                (n) =>
                  n.scrollWidth > n.clientWidth + 1 ||
                  getComputedStyle(n).textOverflow === "ellipsis" ||
                  getComputedStyle(n).webkitLineClamp !== "none",
              )
              .map((n) => n.textContent),
          );
          expect(overflowing).toEqual([]);

          // An ad row comes before and after the section. The space-module between
          // them is the section's padding, not the ad row's (LAY-12).
          await expect(
            s.locator("xpath=preceding-sibling::*[1]"),
          ).toHaveAttribute("data-ad-slot", "ad-band");
          const next = s.locator("xpath=following-sibling::*[1]");
          await expect(next).toHaveAttribute("data-ad-slot", "ad-band");
          expect(Math.round((await box(next)).y)).toBe(
            Math.round(sectionBox.y + sectionBox.height),
          );
          const padding = await s.evaluate((el) => {
            const style = getComputedStyle(el);
            return [style.paddingTop, style.paddingBottom];
          });
          expect(padding).toEqual([`${space}px`, `${space}px`]);
        }
      });
    }

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        await page.goto(p.path);
        await expectNoBlockingAxe(page);
      });
    }

    for (const width of [1024, 1280]) {
      test(`sparse content at ${width}: no rail, the wrapper spans the shell (7.3)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${p.path}?content=sparse`);
        const s = section(page, "bangladesh");
        await expect(s.locator("[data-featured-rail]")).toHaveCount(0);
        expect(
          Math.round((await box(s.locator("[data-featured-wrapper]"))).width),
        ).toBe(Math.round((await box(s)).width));
        // A section with no content is not shown, nor is its ad row (LAY-13).
        await expect(section(page, "geopolitics")).toHaveCount(0);
        const adjacentAds = await page.evaluate(
          () =>
            [...document.querySelectorAll("main > [data-ad-slot]")].filter(
              (el) => el.nextElementSibling?.hasAttribute("data-ad-slot"),
            ).length,
        );
        expect(adjacentAds).toBe(0);
      });
    }

    for (const width of [360, 600, 768, 1024, 1280, 1440]) {
      test(`image first in the markup, visual order kept at ${width} (C-24, DR-267, DR-348)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        for (const category of CATEGORIES) {
          const section = page.locator(`[data-category="${category}"]`);
          const cards = [
            {
              card: section.locator("[data-featured-wrapper] article"),
              row: width >= 768,
            },
            {
              card: section.locator(
                "[data-featured-rail] article[data-story-card]",
              ),
              row: width < 1024,
            },
          ];
          for (const { card, row } of cards) {
            const media = card.locator(".story-media");
            const body = card.locator(".story-body");
            // DOM order: the image comes before the text, and no CSS order is set.
            expect(
              await card.evaluate((el) => {
                const m = el.querySelector(".story-media")!;
                const b = el.querySelector(".story-body")!;
                return (
                  (m.compareDocumentPosition(b) &
                    Node.DOCUMENT_POSITION_FOLLOWING) !==
                    0 &&
                  getComputedStyle(m).order === "0" &&
                  getComputedStyle(b).order === "0"
                );
              }),
            ).toBe(true);
            // Visual order: a row puts the image at the end, beside the text; a stack puts
            // the image on top.
            const m = await box(media);
            const b = await box(body);
            if (row) {
              expect(m.x).toBeGreaterThan(b.x + b.width - 0.5);
              expect(Math.abs(m.y - b.y)).toBeLessThanOrEqual(0.5);
            } else {
              expect(b.y).toBeGreaterThanOrEqual(m.y + m.height - 0.5);
              expect(Math.abs(m.x - b.x)).toBeLessThanOrEqual(0.5);
            }
          }
        }
      });
    }

    test("headings, anchors and language", async ({ page }) => {
      await page.goto(p.path);
      for (const category of CATEGORIES) {
        const s = section(page, category);
        await expect(s).toHaveAttribute("id", `category-${category}`);
        await expect(
          s.getByRole("heading", { level: 2, name: p.titles[category] }),
        ).toBeVisible();
        const text = (await s.innerText()).replace(/\s+/g, " ");
        if (p.lang === "bn") {
          // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
          expect(text).not.toMatch(/[A-Za-z0-9]/);
        } else {
          expect(text).not.toMatch(/[ঀ-৿]/);
        }
      }
    });

    test("keyboard: every link is reachable and shows the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const selector = '[data-section="featured"]';
      // The image links have tabindex -1: one tab stop per story (C-24).
      const links = page.locator(`${selector} a:not([tabindex="-1"])`);
      const count = await links.count();
      // Per section: the feature story, three rail stories and the MoreLink.
      expect(count).toBe(10);

      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 120 && seen.length < count; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          return {
            href: el.getAttribute("href") ?? "",
            // The base outline (COL-13).
            ring: (() => {
              const s = getComputedStyle(el);
              return s.outlineStyle === "solid" && s.outlineWidth === "2px"
                ? "outline"
                : "missing";
            })(),
          };
        }, selector);
        if (info) {
          expect(info.ring).toBe("outline"); // COL-13
          seen.push(info.href);
        }
      }
      expect(seen).toHaveLength(count);
    });
  });
}

test("page order: P-4, ad, বাংলাদেশ, ad, ভূরাজনীতি, ad (7.1)", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(3)).toHaveAttribute("data-section", "analysis-opinion");
  await expect(main.nth(4)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(5)).toHaveAttribute("data-category", "bangladesh");
  await expect(main.nth(6)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(7)).toHaveAttribute("data-category", "geopolitics");
  await expect(main.nth(8)).toHaveAttribute("data-ad-slot", "ad-band");
});

test("the nav link scrolls to its category section (IMP-14)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .locator('nav a[href="#category-geopolitics"]:visible')
    .first()
    .click();
  await expect(page).toHaveURL(/#category-geopolitics$/);
  await expect(
    section(page, "geopolitics").getByRole("heading", { level: 2 }),
  ).toBeInViewport();
});
