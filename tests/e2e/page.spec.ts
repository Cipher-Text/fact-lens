import { expect, test, type Locator } from "@playwright/test";
import { setTheme } from "./theme";

// Whole-page ad-row and heading checks, moved from the temporary layout-parts page
// to the homepage in FL-13 (spacing-layout-system.md Section 9; LAY-09 to LAY-11;
// COL-04).

const WIDTHS = [320, 360, 600, 768, 834, 1024, 1180, 1280, 1366, 1440, 1920];

// Reserved creative heights (Section 9). The label line (--ad-label) adds 24px.
function reserved(slot: string, width: number) {
  if (slot === "ad-top") return width < 768 ? 100 : width < 1024 ? 90 : 250;
  if (slot === "ad-band") return width < 768 ? 280 : width < 1024 ? 90 : 250; // DR-315
  if (slot === "ad-rail") return 600; // from 1024, when the rail is a column
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
        if (slot === "ad-rail" && width < 1024) {
          // In the HTML at every width, hidden until the rail is a column at 1024 (9.1,
          // DR-244; tajmin, 4 Nov 2026).
          await expect(row).toBeHidden();
          continue;
        }
        const rowBox = await box(row);

        expect(Math.round(rowBox.height), `${slot} #${i}`).toBe(
          reserved(slot, width) + AD_LABEL,
        );
        if (slot === "ad-top" || slot === "ad-band") {
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
        // ad-inset is full screen width under 332px, so its side margins are the
        // negative page gutter there (DR-207).
        if (slot === "ad-inset" && width < 332) {
          expect(Math.round(rowBox.x)).toBe(0);
          expect(Math.round(rowBox.width)).toBe(width);
          expect(style.spacing.slice(0, 4)).toEqual(Array(4).fill("0px"));
        } else {
          expect(style.spacing).toEqual(Array(8).fill("0px"));
        }
        expect(style.position).toBe("static");

        // The placeholder creative stays inside the row.
        const creative = await box(row.locator("img"));
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
  expect(style.rule.height).toBe("2px"); // 2px solid rule (DR-262)
  expect(style.rule.background).toBe("rgb(206, 199, 189)"); // border #CEC7BD, light theme (DR-358)
  expect(style.bar.background).toBe("rgb(153, 51, 20)"); // brand, light theme
  const gap =
    (await heading.boundingBox())!.y -
    (await divider.boundingBox())!.y -
    (await divider.boundingBox())!.height;
  expect(Math.round(gap)).toBe(12); // space-section-rule-title
});

// Story time script (typography-system.md TYP-17, DR-348): 1.5 KB or less, measured as the
// UTF-8 bytes of the inline script in the served HTML. The dev server does not minify, so
// this is the upper bound of the built size.
for (const path of ["/", "/en"]) {
  test(`${path} story time script is 1.5 KB or less (DR-348)`, async ({
    request,
  }) => {
    const html = await (await request.get(path)).text();
    // The inline script itself, not the copy of it in the RSC payload.
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
      .map((m) => m[1])
      .filter(
        (s) => s.startsWith("(function") && s.includes("time[data-story-time]"),
      );
    expect(scripts).toHaveLength(1);
    expect(new TextEncoder().encode(scripts[0]).length).toBeLessThanOrEqual(
      1536,
    );
  });
}

// R5-01: the border token shows divider rules on every surface (color-system §2.5, DR-358).
for (const path of ["/", "/en"]) {
  for (const [theme, hex, rgb] of [
    ["light", "#cec7bd", "rgb(206, 199, 189)"],
    ["dark", "#494d55", "rgb(73, 77, 85)"],
  ] as const) {
    test(`${path} ${theme}: --border is ${hex} (DR-358)`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(path);
      const border = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.backgroundColor = "var(--color-border)";
        document.body.append(probe);
        const value = {
          token: getComputedStyle(document.documentElement)
            .getPropertyValue("--border")
            .trim(),
          color: getComputedStyle(probe).backgroundColor,
        };
        probe.remove();
        return value;
      });
      expect(border.token).toBe(hex);
      expect(border.color).toBe(rgb);
    });
  }
}
