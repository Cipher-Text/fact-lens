import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-10: P-5 Most read (spacing-layout-system.md 7.1 to 7.3, 8, 9, 13; DR-51, DR-68;
// typography-system.md 7.1 type-rank; LAY-03, LAY-07, LAY-12, LAY-13, LAY-14, LAY-17,
// TYP-17, COL-04, COL-13).

const PAGES = [
  { path: "/", lang: "bn", title: "সর্বাধিক পঠিত", bengali: true },
  { path: "/en", lang: "en", title: "Most read", bengali: false },
] as const;

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440, 1920,
];

const mostRead = (page: Page) => page.locator('[data-section="most-read"]');

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
  test.describe(`most read ${p.path}`, () => {
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
        const columnGap = width >= 1024 ? 24 : width >= 768 ? 20 : 16;
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;

        const s = mostRead(page);
        const sectionBox = await box(s);
        expect(Math.round(sectionBox.width)).toBe(shell); // LAY-03

        // 4 per row from 1024 with item 5 alone on row 2; 2 per row from 600;
        // 1 per row on phones (DR-51, Section 8).
        const items = s.locator("[data-most-read-item]");
        await expect(items).toHaveCount(5);
        const b = await Promise.all(
          [0, 1, 2, 3, 4].map((i) => box(items.nth(i))),
        );
        const perRow = width >= 1024 ? 4 : width >= 600 ? 2 : 1;
        for (let i = 0; i < 5; i++) {
          const column = i % perRow;
          const first = b[i - column];
          // Same row as the first item of the row, same column as the item above.
          expect(Math.round(b[i].y)).toBe(Math.round(first.y));
          if (i >= perRow) {
            expect(Math.round(b[i].x)).toBe(Math.round(b[i - perRow].x));
            expect(b[i].y).toBeGreaterThan(b[i - perRow].y);
          }
          if (column > 0) {
            const prev = b[i - 1];
            expect(Math.round(b[i].x - (prev.x + prev.width))).toBe(columnGap);
          }
        }
        if (perRow === 1) expect(Math.round(b[0].width)).toBe(shell);
        // Item 5 keeps its column width; the rest of row 2 stays empty.
        expect(Math.abs(b[4].width - b[0].width)).toBeLessThanOrEqual(1);

        // type-rank (typography-system.md 7.1): numeral 40px in a 50px column with
        // a 12px gap; 48px, 60px and 16px from 1024. The numeral uses
        // text-interactive, not brand (COL-04), and the page-language counter.
        const rank = await items.first().evaluate((li) => {
          const before = getComputedStyle(li, "::before");
          const probe = document.createElement("span");
          probe.style.color = "var(--interactive)";
          li.append(probe);
          const interactive = getComputedStyle(probe).color;
          probe.remove();
          return {
            columns: getComputedStyle(li).gridTemplateColumns,
            gap: getComputedStyle(li).columnGap,
            size: before.fontSize,
            weight: before.fontWeight,
            color: before.color,
            interactive,
            content: before.content,
          };
        });
        const big = width >= 1024;
        expect(rank.columns.split(" ")[0]).toBe(big ? "60px" : "50px");
        expect(rank.gap).toBe(big ? "16px" : "12px");
        expect(rank.size).toBe(big ? "48px" : "40px");
        expect(rank.weight).toBe("600");
        expect(rank.color).toBe(rank.interactive);
        // Bengali digits on Bangla pages; decimal (the default, which Chrome omits
        // from the computed value) on English pages. The empty alternative text hides
        // the numeral from screen readers (DOC-19).
        if (p.bengali) expect(rank.content).toContain("bengali");
        else expect(rank.content).not.toContain("bengali");
        expect(rank.content).toMatch(/^counter\(rank.*\/ ""$/);

        // Every title starts at the same position in its item.
        const offsets = await items.evaluateAll((lis) =>
          lis.map(
            (li) =>
              li.querySelector("h3")!.getBoundingClientRect().left -
              li.getBoundingClientRect().left,
          ),
        );
        expect(new Set(offsets.map(Math.round)).size).toBe(1);
        expect(Math.round(offsets[0])).toBe(big ? 76 : 62);

        // After P-3 with no ad row between: P-3 keeps space-section, P-5 none above.
        // Then space-module and the ad-band (LAY-12, DR-68).
        const prev = s.locator("xpath=preceding-sibling::*[1]");
        await expect(prev).toHaveAttribute("data-section", "grouped");
        expect(await s.evaluate((el) => getComputedStyle(el).paddingTop)).toBe(
          "0px",
        );
        expect(
          await s.evaluate((el) => getComputedStyle(el).paddingBottom),
        ).toBe(`${space}px`);
        const next = s.locator("xpath=following-sibling::*[1]");
        await expect(next).toHaveAttribute("data-ad-slot", "ad-band");
        expect(Math.round((await box(next)).y)).toBe(
          Math.round(sectionBox.y + sectionBox.height),
        );

        // No text is clipped (LAY-17, TYP-09).
        const overflowing = await s.evaluate((el) =>
          [...el.querySelectorAll(":is(h2, h3, a):not(.sr-only)")]
            .filter(
              (n) =>
                n.scrollWidth > n.clientWidth + 1 ||
                getComputedStyle(n).textOverflow === "ellipsis" ||
                getComputedStyle(n).webkitLineClamp !== "none",
            )
            .map((n) => n.textContent),
        );
        expect(overflowing).toEqual([]);
      });
    }

    for (const width of [360, 600, 1024]) {
      test(`sparse content at ${width}: the items that exist (7.3)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${p.path}?content=sparse`);
        const s = mostRead(page);
        await expect(s.locator("[data-most-read-item]")).toHaveCount(3);
        await expect(
          s.locator("xpath=following-sibling::*[1]"),
        ).toHaveAttribute("data-ad-slot", "ad-band");
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);
      });
    }

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(p.path);
        await expect(mostRead(page)).toBeVisible();
        await expectNoBlockingAxe(page);
      });
    }

    test("heading, list semantics and language", async ({ page }) => {
      await page.goto(p.path);
      const s = mostRead(page);
      await expect(page.getByRole("region", { name: p.title })).toHaveAttribute(
        "data-section",
        "most-read",
      );
      await expect(
        s.getByRole("heading", { level: 2, name: p.title }),
      ).toBeVisible();
      const list = s.locator("ol");
      await expect(list.getByRole("heading", { level: 3 })).toHaveCount(5);

      // The numeral is hidden from screen readers; the list order gives the rank.
      const names = await list
        .locator("li")
        .evaluateAll((lis) => lis.map((li) => li.textContent));
      const snapshot = await list.ariaSnapshot();
      for (const name of names) expect(snapshot).toContain(name!);
      expect(snapshot).not.toMatch(/listitem:?\s*"?[0-9০-৯]/);

      const text = (await s.innerText()).replace(/\s+/g, " ");
      if (p.lang === "bn") {
        // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
        expect(text).not.toMatch(/[A-Za-z0-9]/);
      } else {
        expect(text).not.toMatch(/[ঀ-৿]/);
      }
    });

    test("keyboard: every link is reachable and shows the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const selector = '[data-section="most-read"]';
      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 300 && seen.length < 5; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          return {
            name: el.getAttribute("href") ?? el.tagName,
            // The base outline (COL-13), or the old ring on controls that are not rebuilt yet.
            ring: (() => {
              const s = getComputedStyle(el);
              return s.outlineStyle === "solid" && s.outlineWidth === "2px"
                ? "outline"
                : s.boxShadow;
            })(),
          };
        }, selector);
        if (info) {
          expect(info.ring, info.name).not.toBe("none"); // COL-13
          seen.push(info.name);
        }
      }
      expect(seen).toHaveLength(5);
    });
  });
}

test("page order: P-3, P-5, ad (7.1)", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(9)).toHaveAttribute("data-section", "grouped");
  await expect(main.nth(10)).toHaveAttribute("data-section", "most-read");
  await expect(main.nth(11)).toHaveAttribute("data-ad-slot", "ad-band");
});
