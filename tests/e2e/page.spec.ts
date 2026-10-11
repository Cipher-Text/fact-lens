import { expect, test, type Locator } from "@playwright/test";
import { setTheme } from "./theme";

// Whole-page ad-row and heading checks, moved from the temporary layout-parts page
// to the homepage in FL-13 (spacing-layout-system.md Section 9; LAY-09 to LAY-11;
// COL-04).

const WIDTHS = [320, 360, 600, 768, 834, 1024, 1180, 1280, 1366, 1440, 1920];

// Reserved creative heights (Section 9). The label line (--ad-label) adds 24px.
function reserved(slot: string, width: number) {
  if (slot === "ad-band-top")
    return width < 768 ? 100 : width < 1024 ? 90 : 250;
  if (slot === "ad-band") return width < 768 ? 280 : 250;
  return width < 1280 ? 250 : 90; // ad-inset
}
const AD_LABEL = 24;

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
}

for (const path of ["/", "/en"]) {
  for (const width of WIDTHS) {
    test(`${path} ad rows at ${width} (LAY-09, LAY-10, LAY-11)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const rows = page.locator("[data-ad-slot]");
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const slot = (await row.getAttribute("data-ad-slot"))!;
        const rowBox = await box(row);

        expect(Math.round(rowBox.height), `${slot} #${i}`).toBe(
          reserved(slot, width) + AD_LABEL,
        );
        if (slot !== "ad-inset") {
          // Band rows are full width.
          expect(Math.round(rowBox.x)).toBe(0);
          expect(Math.round(rowBox.width)).toBe(width);
        }

        const style = await row.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            spacing: [
              s.paddingTop,
              s.paddingRight,
              s.paddingBottom,
              s.paddingLeft,
              s.marginTop,
              s.marginRight,
              s.marginBottom,
              s.marginLeft,
            ],
            position: s.position,
          };
        });
        expect(style.spacing).toEqual(Array(8).fill("0px"));
        expect(style.position).toBe("static");

        // The placeholder creative stays inside the row.
        const creative = await box(row.locator("> div > div"));
        expect(creative.width).toBeLessThanOrEqual(rowBox.width);
      }
    });
  }
}

test("section headings have the divider above them: border rule, brand bar, 12px to the title (C-13, C-22, COL-04)", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/en");
  const heading = page.locator(
    '[data-section="most-read"] .type-section-title',
  );
  const divider = page.locator('[data-section="most-read"] [data-divider]');
  const style = await divider.evaluate((el) => {
    const [rule, bar] = [...el.children].map((child) => {
      const s = getComputedStyle(child);
      return { height: s.height, background: s.backgroundColor };
    });
    return { rule, bar };
  });
  expect(style.rule.height).toBe("1px");
  expect(style.rule.background).toBe("rgb(221, 210, 196)"); // border, light theme
  expect(style.bar.background).toBe("rgb(153, 51, 20)"); // brand, light theme
  const gap =
    (await heading.boundingBox())!.y -
    (await divider.boundingBox())!.y -
    (await divider.boundingBox())!.height;
  expect(Math.round(gap)).toBe(12); // space-section-rule-title
});
