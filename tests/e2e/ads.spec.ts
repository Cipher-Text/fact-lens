import { expect, test, type Locator, type Page } from "@playwright/test";

// R2-06: the reserved space of each ad slot, with the ad and without it
// (spacing-layout-system.md Section 9, LAY-09 to LAY-13, LAY-19; C-16 AdSlot).
// Reserve = 24px label line + the reserved creative height.

const LABEL = 24;
// 331 and 335/336 are the DR-207 and DR-206 edges; 768 is the tablet tier.
const WIDTHS = [331, 335, 336, 360, 768, 1024, 1280];

// Reserved creative height and the creative file for the tier (Section 9, C-16).
function expected(slot: string, width: number) {
  switch (slot) {
    case "ad-top":
      if (width < 768) return { reserve: 100, file: "320x100" };
      if (width < 1024) return { reserve: 90, file: "728x90" };
      return { reserve: 250, file: "970x250" };
    case "ad-band":
      if (width < 768)
        return { reserve: 280, file: width >= 336 ? "336x280" : "300x250" };
      if (width < 1024) return { reserve: 90, file: "728x90" }; // DR-315
      return { reserve: 250, file: "970x250" };
    case "ad-inset":
      return width < 1280
        ? { reserve: 250, file: "300x250" }
        : { reserve: 90, file: "728x90" };
    case "ad-rail": // the P-3 rail, from 1280 only (DR-245)
      return { reserve: 600, file: "300x600" };
    default:
      throw new Error(slot);
  }
}

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
}

// The top of <main> in the page, so a slot that shrinks above it shows as a shift.
function mainTop(page: Page) {
  return page
    .locator("main")
    .evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));
}

// Heights of every slot, in page order, once the page has settled.
async function heights(page: Page) {
  const rows = page.locator("[data-ad-slot]:visible");
  const out: { slot: string; height: number }[] = [];
  for (let i = 0; i < (await rows.count()); i++) {
    const row = rows.nth(i);
    await row.scrollIntoViewIfNeeded();
    out.push({
      slot: (await row.getAttribute("data-ad-slot"))!,
      height: Math.round((await box(row)).height),
    });
  }
  return out;
}

for (const path of ["/", "/en"]) {
  for (const width of WIDTHS) {
    test(`${path} ad slots keep their reserved height at ${width}, with the ad (LAY-10)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const rows = await heights(page);
      expect(rows.length).toBeGreaterThan(0);
      for (const { slot, height } of rows) {
        expect(height, slot).toBe(expected(slot, width).reserve + LABEL);
      }
      // Every creative loads for its tier and sits inside its row.
      for (const row of await page.locator("[data-ad-slot]:visible").all()) {
        const slot = (await row.getAttribute("data-ad-slot"))!;
        const img = row.locator("img");
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.currentSrc))
          .toContain(`/mock/ad-${expected(slot, width).file}.svg`);
        const [r, i] = [await box(row), await box(img)];
        expect(i.width).toBeLessThanOrEqual(r.width);
        expect(i.height).toBeLessThanOrEqual(r.height - LABEL);
      }
    });

    test(`${path} ad slots keep their reserved height at ${width}, without the ad (LAY-10)`, async ({
      page,
    }) => {
      // No creative loads (blocked or no fill): the row must not shrink or shift.
      await page.route("**/mock/ad-*.svg", (route) => route.abort());
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const before = await mainTop(page);
      const rows = await heights(page);
      expect(rows.length).toBeGreaterThan(0);
      for (const { slot, height } of rows) {
        expect(height, slot).toBe(expected(slot, width).reserve + LABEL);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await mainTop(page)).toBe(before);
    });
  }
}

test("the top ad is below the header and nothing is sticky but the top bar (LAY-11, LAY-15, DR-295)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/en");
  const top = page.locator('[data-ad-slot="ad-top"]');
  const nav = await box(page.locator("[data-nav-row]"));
  // At 1280 the nav row shows; the top ad row starts where it ends, above the hero.
  expect(Math.round((await box(top)).y)).toBe(Math.round(nav.y + nav.height));
  expect((await box(page.locator("main"))).y).toBeGreaterThanOrEqual(
    (await box(top)).y + (await box(top)).height - 1,
  );
  const positions = await page.evaluate(() =>
    [...document.querySelectorAll("[data-ad-slot]")].flatMap((el) => {
      const out: string[] = [];
      for (let n: Element | null = el; n; n = n.parentElement)
        out.push(getComputedStyle(n).position);
      return out;
    }),
  );
  expect(positions.filter((p) => p === "sticky" || p === "fixed")).toEqual([]);
  await page.mouse.wheel(0, 3000);
  await expect(top).not.toBeInViewport();
});

test("the bands follow the sections and never sit together (7.1, LAY-13)", async ({
  page,
}) => {
  // The rail slot goes into the P-3 rail in R2-11 (its tests are there). Here: bands follow the hero, P-4, both P-2 sections and Most read (7.1).
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");
  const order = await page.evaluate(() =>
    [...document.querySelectorAll("main > *")].map((el) =>
      el.getAttribute("data-ad-slot")
        ? "ad"
        : (el.getAttribute("data-section") ?? "section"),
    ),
  );
  expect(order.filter((o) => o === "ad")).toHaveLength(5);
  for (let i = 1; i < order.length; i++)
    expect(order[i] === "ad" && order[i - 1] === "ad").toBe(false); // LAY-13
});

test("an ad row is not a landmark and its label is visible (DR-266)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const slots = page.locator("[data-ad-slot]:visible");
  expect(await slots.count()).toBeGreaterThan(0);
  for (const slot of await slots.all()) {
    expect(await slot.evaluate((el) => el.tagName)).toBe("DIV");
    await expect(slot).not.toHaveAttribute("aria-label");
    await expect(slot.getByText("বিজ্ঞাপন", { exact: true })).toBeVisible();
  }
});
