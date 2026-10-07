import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-03: Shell, Wrapper, Rail, AdRow, SectionHeading and the peer row on the
// temporary page /layout-parts. Values from spacing-layout-system.md Sections 3.2 and 9.

const PATHS = ["/layout-parts", "/en/layout-parts"] as const;

type Expected = {
  shell: number;
  /** Wrapper width when the rail is beside it; null when the rail stacks. */
  wrapper: number | null;
  adBandTop: number;
  adBand: number;
  adInset: number;
};

// Reserved creative heights: ad-band-top 100 / 90 / 250, ad-band 280 / 250 / 250,
// ad-inset 250, 90 from 1280. The label line (--ad-label) adds 24px.
const WIDTHS: Record<number, Expected> = {
  360: { shell: 328, wrapper: null, adBandTop: 100, adBand: 280, adInset: 250 },
  599: { shell: 567, wrapper: null, adBandTop: 100, adBand: 280, adInset: 250 },
  600: { shell: 552, wrapper: null, adBandTop: 100, adBand: 280, adInset: 250 },
  768: { shell: 720, wrapper: null, adBandTop: 90, adBand: 250, adInset: 250 },
  834: { shell: 786, wrapper: null, adBandTop: 90, adBand: 250, adInset: 250 },
  1024: { shell: 976, wrapper: 648, adBandTop: 250, adBand: 250, adInset: 250 },
  1180: {
    shell: 1132,
    wrapper: 804,
    adBandTop: 250,
    adBand: 250,
    adInset: 250,
  },
  1280: { shell: 1232, wrapper: 904, adBandTop: 250, adBand: 250, adInset: 90 },
  1366: { shell: 1280, wrapper: 952, adBandTop: 250, adBand: 250, adInset: 90 },
  1440: { shell: 1280, wrapper: 952, adBandTop: 250, adBand: 250, adInset: 90 },
  1920: { shell: 1280, wrapper: 952, adBandTop: 250, adBand: 250, adInset: 90 },
};

const AD_LABEL = 24;

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
}

async function expectNoBlockingAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

async function adSpacing(row: Locator) {
  return row.evaluate((el) => {
    const s = getComputedStyle(el);
    return [
      s.paddingTop,
      s.paddingRight,
      s.paddingBottom,
      s.paddingLeft,
      s.marginTop,
      s.marginRight,
      s.marginBottom,
      s.marginLeft,
    ];
  });
}

for (const path of PATHS) {
  for (const [w, expected] of Object.entries(WIDTHS)) {
    const width = Number(w);

    test.describe(`${path} at ${width}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
      });

      test("shell, wrapper and rail have the spec widths (LAY-03, LAY-05)", async ({
        page,
      }) => {
        const shell = await box(page.getByTestId("shell"));
        const wrapper = await box(page.getByTestId("wrapper"));
        const rail = await box(page.getByTestId("rail"));

        expect(Math.round(shell.width)).toBe(expected.shell);
        // The shell is centered.
        expect(Math.round(shell.x)).toBe(Math.round((width - shell.width) / 2));

        if (expected.wrapper === null) {
          // Below 1024: the rail is under the wrapper, at full shell width.
          expect(Math.round(wrapper.width)).toBe(expected.shell);
          expect(Math.round(rail.width)).toBe(expected.shell);
          expect(rail.y).toBeGreaterThanOrEqual(wrapper.y + wrapper.height);
          expect(Math.round(rail.x)).toBe(Math.round(wrapper.x));
        } else {
          // From 1024: the rail is 304 wide, beside the wrapper, with the column gap.
          expect(Math.round(wrapper.width)).toBe(expected.wrapper);
          expect(Math.round(rail.width)).toBe(304);
          expect(Math.round(rail.y)).toBe(Math.round(wrapper.y));
          expect(Math.round(rail.x - (wrapper.x + wrapper.width))).toBe(24);
          expect(Math.round(rail.x + rail.width)).toBe(
            Math.round(shell.x + shell.width),
          );
        }

        // A section with no rail: the wrapper spans the shell (Section 7.3).
        const full = await box(page.getByTestId("wrapper-full"));
        expect(Math.round(full.width)).toBe(expected.shell);
      });

      test("ad rows reserve their height and have no spacing (LAY-09, LAY-10)", async ({
        page,
      }) => {
        const top = page.locator('[data-ad-slot="ad-band-top"]');
        const band = page.locator('[data-ad-slot="ad-band"]');
        const inset = page.locator('[data-ad-slot="ad-inset"]');

        const topBox = await box(top);
        const bandBox = await box(band);
        const insetBox = await box(inset);
        const wrapper = await box(page.getByTestId("wrapper"));

        expect(Math.round(topBox.height)).toBe(expected.adBandTop + AD_LABEL);
        expect(Math.round(bandBox.height)).toBe(expected.adBand + AD_LABEL);
        expect(Math.round(insetBox.height)).toBe(expected.adInset + AD_LABEL);

        // Band rows are full width; the inset is at wrapper width.
        expect(Math.round(topBox.x)).toBe(0);
        expect(Math.round(topBox.width)).toBe(width);
        expect(Math.round(bandBox.x)).toBe(0);
        expect(Math.round(bandBox.width)).toBe(width);
        expect(Math.round(insetBox.width)).toBe(Math.round(wrapper.width));

        for (const row of [top, band, inset]) {
          expect(await adSpacing(row)).toEqual(Array(8).fill("0px"));
          const position = await row.evaluate(
            (el) => getComputedStyle(el).position,
          );
          expect(position).toBe("static"); // LAY-11
          // The placeholder creative stays inside the row.
          const creative = await box(row.locator("> div > div"));
          const rowBox = await box(row);
          expect(creative.width).toBeLessThanOrEqual(rowBox.width);
        }
      });

      test("peer row has 1 card below 600 and 2 from 600 (LAY-07, LAY-08)", async ({
        page,
      }) => {
        const cards = page.getByTestId("wrapper").locator("article");
        await expect(cards).toHaveCount(4);
        const first = await box(cards.nth(0));
        const second = await box(cards.nth(1));
        if (width < 600) {
          expect(Math.round(second.x)).toBe(Math.round(first.x));
          expect(second.y).toBeGreaterThan(first.y);
        } else {
          expect(Math.round(second.y)).toBe(Math.round(first.y));
          expect(second.x).toBeGreaterThan(first.x);
          // Subgrid: the meta lines up although the second card has no summary.
          const metaA = await box(cards.nth(0).locator("p").last());
          const metaB = await box(cards.nth(1).locator("p").last());
          expect(Math.round(metaB.y)).toBe(Math.round(metaA.y));
        }
      });

      test("no horizontal scroll (LAY-02)", async ({ page }) => {
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scrollWidth).toBeLessThanOrEqual(width);
      });
    });
  }

  test(`${path} has no horizontal scroll at 320`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`${path} in ${scheme} has no serious axe violations`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      await expectNoBlockingAxe(page);
    });
  }
}

test.describe("interface language (T-27)", () => {
  test("Bangla page shows the Bangla ad label and headings", async ({
    page,
  }) => {
    await page.goto("/layout-parts");
    await expect(page.getByText("বিজ্ঞাপন", { exact: true })).toHaveCount(3);
    await expect(page.getByText("Advertisement")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "রেলসহ সেকশন" }),
    ).toBeVisible();
  });

  test("English page shows the English ad label and headings", async ({
    page,
  }) => {
    await page.goto("/en/layout-parts");
    await expect(page.getByText("Advertisement", { exact: true })).toHaveCount(
      3,
    );
    await expect(page.getByText("বিজ্ঞাপন")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "Section with a rail" }),
    ).toBeVisible();
  });
});

test("the section heading has the brand rule above it (COL-04)", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en/layout-parts");
  const row = page
    .getByRole("heading", { name: "Section with a rail" })
    .locator("..");
  const style = await row.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      width: s.borderTopWidth,
      style: s.borderTopStyle,
      color: s.borderTopColor,
      pad: s.paddingTop,
    };
  });
  expect(style.width).toBe("1px");
  expect(style.style).toBe("solid");
  expect(style.color).toBe("rgb(153, 51, 20)"); // brand, light theme
  expect(style.pad).toBe("12px"); // space-section-rule-title
});
