import { expect, test, type Locator } from "@playwright/test";

// R2-07: the story units (C-01, C-02, C-03, C-24, C-25) with the full, long-headline and
// no-image content, on the development test page /dev/story-units.

const PAGES = ["/dev/story-units", "/en/dev/story-units"];
const WIDTHS = [360, 768, 1024, 1280];

const clamp = (min: number, value: number, max: number) =>
  Math.min(max, Math.max(min, value));

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
}

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test.describe(`story units ${path} at ${width}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
      });

      test("no sideways scroll and no clipped or cut title", async ({
        page,
      }) => {
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);
        const cut = await page.evaluate(() =>
          [...document.querySelectorAll("main *")]
            .filter((n) => {
              const style = getComputedStyle(n);
              const hides =
                style.overflowX !== "visible" ||
                style.overflowY !== "visible" ||
                style.textOverflow === "ellipsis" ||
                style.webkitLineClamp !== "none";
              return (
                hides &&
                n.textContent?.trim() &&
                (n.scrollWidth > n.clientWidth + 1 ||
                  n.scrollHeight > n.clientHeight + 1)
              );
            })
            .map((n) => n.tagName),
        );
        expect(cut).toEqual([]);
      });

      test("LeadStory: panel overlap, inset and bar follow the card width", async ({
        page,
      }) => {
        for (const unit of ["lead-story", "lead-story-long"]) {
          const lead = page.locator(`[data-unit="${unit}"] [data-lead]`);
          const image = await box(lead.locator("img"));
          const panel = await box(lead.locator("[data-lead-panel]"));
          const w = image.width;
          const narrow = w < 600;
          const overlap = narrow ? 32 : clamp(64, w * 0.1, 96);
          const insetStart = narrow ? 0 : clamp(32, w * 0.042, 40);
          const insetEnd = narrow ? 32 : clamp(32, w * 0.042, 40);
          expect(image.y + image.height - panel.y).toBeCloseTo(overlap, 0);
          expect(panel.x - image.x).toBeCloseTo(insetStart, 0);
          expect(image.x + image.width - (panel.x + panel.width)).toBeCloseTo(
            insetEnd,
            0,
          );
          const bar = await box(lead.locator("[data-lead-bar]"));
          expect(bar.height).toBe(w >= 880 ? 10 : w >= 600 ? 8 : 6);
          expect(bar.y).toBe(panel.y);
        }
      });

      test("LeadStory with no image: panel flows under the title area, no overlap", async ({
        page,
      }) => {
        const lead = page.locator(
          '[data-unit="lead-story-no-image"] [data-lead]',
        );
        await expect(lead.locator("img")).toHaveCount(0);
        const panel = await box(lead.locator("[data-lead-panel]"));
        const article = await box(lead);
        expect(panel.x).toBe(article.x);
        expect(Math.round(panel.width)).toBe(Math.round(article.width));
      });

      test("OverlapCard: overlap and notch are 10% of the card, 40 to 64px", async ({
        page,
      }) => {
        const card = page
          .locator('[data-unit="overlap-card"] [data-overlap-card]')
          .first();
        const image = await box(card.locator("img"));
        const body = await box(card.locator("[data-overlap-body]"));
        const expected = clamp(40, image.width * 0.1, 64);
        expect(image.y + image.height - body.y).toBeCloseTo(expected, 0);
        expect(image.x + image.width - (body.x + body.width)).toBeCloseTo(
          expected,
          0,
        );
        expect(body.x).toBe(image.x);
      });

      test("OverlapCard with no image keeps the full width and the cards are top-aligned", async ({
        page,
      }) => {
        const cards = page.locator(
          '[data-unit="overlap-card"] [data-overlap-card]',
        );
        const a = await box(cards.nth(0));
        const b = await box(cards.nth(1));
        await expect(cards.nth(1).locator("img")).toHaveCount(0);
        const body = await box(cards.nth(1).locator("[data-overlap-body]"));
        expect(Math.round(body.width)).toBe(Math.round(b.width));
        if (width >= 600) expect(Math.round(b.y)).toBe(Math.round(a.y));
        else expect(b.y).toBeGreaterThan(a.y);
      });

      test("StoryCard: layouts move the image with the grid, text first in the markup", async ({
        page,
      }) => {
        const wrapperWidth = (await box(page.locator('[data-case="feature"]')))
          .width;

        // Feature split: stack under 768, text then clamped image column from 768.
        const feature = page.locator('[data-case="feature"]');
        const fImg = await box(feature.locator("img"));
        const fText = await box(feature.locator("h3"));
        if (width < 768) {
          expect(fImg.y + fImg.height).toBeLessThanOrEqual(fText.y);
          expect(Math.round(fImg.width)).toBe(Math.round(wrapperWidth));
        } else {
          const share = width >= 1024 ? 0.6 : 0.5;
          expect(fImg.x).toBeGreaterThan(fText.x);
          expect(fImg.width).toBeCloseTo(
            clamp(420, (wrapperWidth - 24) * share, 557),
            0,
          );
        }

        // Row, third: text 2fr, image 1fr, 16px gap, at every width.
        const row = page.locator('[data-case="row"]');
        const rImg = await box(row.locator("img"));
        const rText = await box(row.locator("h3"));
        expect(rImg.x).toBeGreaterThan(rText.x);
        expect(rImg.width).toBeCloseTo((wrapperWidth - 16) / 3, 0);

        // No image: one text column over the full width.
        const none = page.locator('[data-case="no-image"]');
        await expect(none.locator("img")).toHaveCount(0);
        const nTitle = await box(none.locator("h3"));
        expect(nTitle.width).toBeGreaterThan(wrapperWidth * 0.9);

        // Rail image story: row under 1024, stack in the 304px rail from 1024.
        const rail = page.locator('[data-case="rail"]');
        const railImg = await box(rail.locator("img"));
        const railText = await box(rail.locator("h3"));
        if (width < 1024) expect(railImg.x).toBeGreaterThan(railText.x);
        else {
          expect(railImg.y + railImg.height).toBeLessThanOrEqual(railText.y);
          expect(Math.round(railImg.width)).toBe(304);
        }
      });

      test("StoryList: one column, two column-first from 768 to 1023", async ({
        page,
      }) => {
        const items = page.locator('[data-unit="story-list"] li');
        await expect(items).toHaveCount(5);
        const [a, b, c, d, e] = await Promise.all(
          [0, 1, 2, 3, 4].map((i) => box(items.nth(i))),
        );
        if (width >= 768 && width < 1024) {
          expect(Math.round(b.x)).toBe(Math.round(a.x));
          expect(d.x).toBeGreaterThan(a.x);
          expect(Math.round(d.y)).toBe(Math.round(a.y));
          expect(Math.round(e.x)).toBe(Math.round(d.x));
          // No rule at the top of the second column.
          expect(
            await items
              .nth(3)
              .evaluate((n) => getComputedStyle(n).borderTopWidth),
          ).toBe("0px");
        } else {
          for (const [prev, next] of [
            [a, b],
            [b, c],
            [c, d],
            [d, e],
          ]) {
            expect(next.y).toBeGreaterThan(prev.y);
            expect(Math.round(next.x)).toBe(Math.round(prev.x));
          }
        }
        expect(
          await items
            .nth(1)
            .evaluate((n) => getComputedStyle(n).borderTopWidth),
        ).toBe("1px");
      });
    });
  }
}
