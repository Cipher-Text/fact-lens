import { expect, type Locator } from "@playwright/test";

/**
 * The StoryCard side title fits its text column (DR-464 as amended: stacked below 1024; from
 * 1024 the image is 3 / 5 of the card, no text minimum). The h3 does not scroll sideways and the body stays inside the card
 * (TYP-08, TYP-09, LAY-02, LAY-17). 200% text is out of scope (tajmin, 4 Nov 2026). Used
 * by the analysis hub cover and the P-2 feature story tests.
 */
export async function sideTitleFits(card: Locator) {
  const m = await card.evaluate((el) => {
    const h3 = el.querySelector("h3")!;
    const body = el.querySelector(".story-body")!.getBoundingClientRect();
    const c = el.getBoundingClientRect();
    return {
      scroll: h3.scrollWidth,
      client: h3.clientWidth,
      start: body.left - c.left,
      end: c.right - body.right,
    };
  });
  expect(m.scroll).toBeLessThanOrEqual(m.client);
  expect(m.start).toBeGreaterThanOrEqual(-0.5);
  expect(m.end).toBeGreaterThanOrEqual(-0.5);
}
