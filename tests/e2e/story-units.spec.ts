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

      test("LeadStory with no image: the no-image placeholder and the same overlap (DR-338)", async ({
        page,
      }) => {
        const lead = page.locator(
          '[data-unit="lead-story-no-image"] [data-lead]',
        );
        await expect(lead.locator("[data-placeholder]")).toHaveCount(1);
        await expect(lead.locator("img")).toHaveCount(0);
        const image = await box(lead.locator("[data-placeholder]"));
        const panel = await box(lead.locator("[data-lead-panel]"));
        expect(image.y + image.height - panel.y).toBeGreaterThan(0);
        expect(panel.width).toBeLessThan(image.width);
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

      test("OverlapCard with no image shows the placeholder with the same overlap and notch, and the cards are top-aligned (DR-338)", async ({
        page,
      }) => {
        const cards = page.locator(
          '[data-unit="overlap-card"] [data-overlap-card]',
        );
        const a = await box(cards.nth(0));
        const b = await box(cards.nth(1));
        await expect(cards.nth(1).locator("[data-placeholder]")).toHaveCount(1);
        await expect(cards.nth(1).locator("img")).toHaveCount(0);
        const image = await box(cards.nth(1).locator("[data-placeholder]"));
        const body = await box(cards.nth(1).locator("[data-overlap-body]"));
        const expected = clamp(40, image.width * 0.1, 64);
        expect(image.y + image.height - body.y).toBeCloseTo(expected, 0);
        expect(image.x + image.width - (body.x + body.width)).toBeCloseTo(
          expected,
          0,
        );
        if (width >= 600) expect(Math.round(b.y)).toBe(Math.round(a.y));
        else expect(b.y).toBeGreaterThan(a.y);
      });

      test("StoryCard: layouts move the image with the grid, image first in the markup", async ({
        page,
      }) => {
        const wrapperWidth = (await box(page.locator('[data-case="feature"]')))
          .width;
        // --grid-column-gap: 16px, 24px from 768, 32px from 1280 (spacing-layout-system.md §3).
        const columnGap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;

        // side: stack under 768; from 768 the text, then the image at 2 / 3 of the whole card
        // width, no minimum and no maximum (DR-451, DR-464).
        const feature = page.locator('[data-case="feature"]');
        const fImg = await box(feature.locator("img"));
        const fText = await box(feature.locator("h3"));
        if (width < 768) {
          expect(fImg.y + fImg.height).toBeLessThanOrEqual(fText.y);
          expect(Math.round(fImg.width)).toBe(Math.round(wrapperWidth));
        } else {
          expect(fImg.x).toBeGreaterThan(fText.x);
          expect(fImg.width).toBeCloseTo((wrapperWidth * 2) / 3, 0);
        }

        // thumbnail: text 2fr, image 1fr, --grid-column-gap between them (DR-300).
        const row = page.locator('[data-case="row"]');
        const rImg = await box(row.locator("img"));
        const rText = await box(row.locator("h3"));
        expect(rImg.x).toBeGreaterThan(rText.x);
        expect(rImg.width).toBeCloseTo((wrapperWidth - columnGap) / 3, 0);

        // No image: the placeholder, in the same row layout (DR-338).
        const none = page.locator('[data-case="no-image"]');
        await expect(none.locator("[data-placeholder]")).toHaveCount(1);
        await expect(none.locator("img")).toHaveCount(0);
        const nImg = await box(none.locator("[data-placeholder]"));
        const nTitle = await box(none.locator("h3"));
        expect(nImg.x).toBeGreaterThan(nTitle.x);
        expect(nImg.width).toBeCloseTo((wrapperWidth - columnGap) / 3, 0);

        // top in the rail: the image above the text at every width, 304px wide from 1024.
        const rail = page.locator('[data-case="rail"]');
        const railImg = await box(rail.locator("img"));
        const railText = await box(rail.locator("h3"));
        expect(railImg.y + railImg.height).toBeLessThanOrEqual(railText.y);
        if (width >= 1024) expect(Math.round(railImg.width)).toBe(304);
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
        // Divider.item: a 1px dotted rule drawn on the li (DR-262).
        expect(
          await items
            .nth(1)
            .evaluate((n) => getComputedStyle(n, "::before").height),
        ).toBe("1px");
      });
    });
  }
}
