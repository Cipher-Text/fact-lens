import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// R2-12: P-5 Most read, C-07 RankedList (component-system.md; spacing-layout-system.md
// 7.1 to 7.3, 8, 9, 13; DR-44, DR-68, DR-290; LAY-03, LAY-07, LAY-12, LAY-13, LAY-14, LAY-17,
// TYP-17, COL-13). The columns layout and the rank chip of the category page (IMP-99).

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
        await waitForNavRow(page);

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        const gutter = width < 600 ? 16 : 24;
        const shell = Math.min(width - 2 * gutter, 1280);
        // --grid-column-gap (16 / 24 from 768 / 32 from 1280, DR-300). --rank-list-gap
        // between the items, no rule (24 / 28 from 600 / 32 from 1280).
        const columnGap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;
        const itemGap = width >= 1280 ? 32 : width >= 600 ? 28 : 24;
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;

        const s = mostRead(page);
        const sectionBox = await box(s);
        expect(Math.round(sectionBox.width)).toBe(shell); // LAY-03

        // From 1024 three equal columns: the start column stays empty and the list takes
        // the middle and end columns. Below 1024 the list spans the shell (C-07).
        const list = await box(s.locator("ol"));
        const third = (shell - 2 * columnGap) / 3;
        if (width >= 1024) {
          expect(
            Math.abs(list.x - (sectionBox.x + third + columnGap)),
          ).toBeLessThanOrEqual(1);
          expect(
            Math.abs(list.width - (2 * third + columnGap)),
          ).toBeLessThanOrEqual(1);
        } else {
          expect(Math.abs(list.x - sectionBox.x)).toBeLessThanOrEqual(1);
          expect(Math.abs(list.width - shell)).toBeLessThanOrEqual(1);
        }

        // Phone: one column. From 600 two CSS columns, column-first: items 1 to 3 in the
        // first, 4 and 5 in the second, the tops of the two columns level (C-07).
        const items = s.locator("[data-most-read-item]");
        await expect(items).toHaveCount(5);
        const b = await Promise.all(
          [0, 1, 2, 3, 4].map((i) => box(items.nth(i))),
        );
        const columns = width >= 600 ? [[0, 1, 2], [3, 4]] : [[0, 1, 2, 3, 4]];
        const columnWidth =
          columns.length === 2 ? (list.width - columnGap) / 2 : list.width;
        columns.forEach((column, c) => {
          const x = list.x + c * (columnWidth + columnGap);
          for (const [n, i] of column.entries()) {
            expect(Math.abs(b[i].x - x), `item ${i + 1} x`).toBeLessThanOrEqual(1);
            expect(
              Math.abs(b[i].width - columnWidth),
              `item ${i + 1} width`,
            ).toBeLessThanOrEqual(1);
            if (n === 0) {
              expect(Math.abs(b[i].y - b[0].y)).toBeLessThanOrEqual(1);
            } else {
              const above = b[column[n - 1]];
              expect(
                Math.abs(b[i].y - (above.y + above.height) - itemGap),
                `gap above item ${i + 1}`,
              ).toBeLessThanOrEqual(0.5);
            }
          }
        });

        // The rank chip: a square in --color-bar with on-interactive serif digits, 36px
        // with 24px digits at 700, 44px with 32px digits at 600 from 1024; 16px to the
        // title; chip and title centered on each other. The rank comes from the data, in
        // an aria-hidden span, digits in the page language (DR-290). No CSS counter.
        const big = width >= 1024;
        const chips = await items.evaluateAll((lis) =>
          lis.map((li) => {
            const chip = li.firstElementChild as HTMLElement;
            const s = getComputedStyle(chip);
            const probe = (v: string) => {
              const el = document.createElement("span");
              el.style.color = `var(${v})`;
              li.append(el);
              const c = getComputedStyle(el).color;
              el.remove();
              return c;
            };
            const c = chip.getBoundingClientRect();
            const h = li.querySelector("h3")!.getBoundingClientRect();
            const l = li.getBoundingClientRect();
            return {
              width: c.width,
              height: c.height,
              size: s.fontSize,
              weight: s.fontWeight,
              background: s.backgroundColor,
              bar: probe("--color-bar"),
              color: s.color,
              onInteractive: probe("--on-interactive"),
              titleOffset: h.left - l.left,
              chipCenter: c.top + c.height / 2,
              titleCenter: h.top + h.height / 2,
              text: chip.textContent,
              hidden: chip.getAttribute("aria-hidden"),
            };
          }),
        );
        const digits = p.bengali
          ? ["১", "২", "৩", "৪", "৫"]
          : ["1", "2", "3", "4", "5"];
        chips.forEach((chip, i) => {
          expect(chip.width).toBe(big ? 44 : 36);
          expect(chip.height).toBe(chip.width);
          expect(chip.size).toBe(big ? "32px" : "24px");
          expect(chip.weight).toBe(big ? "600" : "700");
          expect(chip.background).toBe(chip.bar);
          expect(chip.color).toBe(chip.onInteractive);
          // Every title starts at the same position: the chip and 16px.
          expect(Math.round(chip.titleOffset)).toBe(chip.width + 16);
          expect(
            Math.abs(chip.chipCenter - chip.titleCenter),
          ).toBeLessThanOrEqual(1);
          expect(chip.hidden).toBe("true");
          expect(chip.text).toBe(digits[i]);
        });

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
        await setTheme(page, theme);
        await page.goto(p.path);
        await expect(mostRead(page)).toBeVisible();
        await expectNoBlockingAxe(page);
      });
    }

    test("sheet checks: no radius, border, rule or shadow, link colors (C-07, CPT-05)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const s = mostRead(page);
      const info = await s.locator("[data-most-read-item]").evaluateAll((lis) =>
        lis.map((li) => {
          const link = li.querySelector("a")!;
          const el = document.createElement("span");
          el.style.color = "var(--ink)";
          li.append(el);
          const ink = getComputedStyle(el).color;
          el.remove();
          const nodes = [li, li.firstElementChild!, li.querySelector("h3")!, link];
          return {
            linkColor: getComputedStyle(link).color,
            ink,
            // No Divider.item between the items: no rule pseudo-element either.
            rule: ["::before", "::after"].some(
              (pseudo) => getComputedStyle(li, pseudo).content !== "none",
            ),
            decorated: nodes.some(
              (n) =>
                getComputedStyle(n).textDecorationLine !== "none" ||
                getComputedStyle(n).borderTopWidth !== "0px" ||
                getComputedStyle(n).borderBottomWidth !== "0px" ||
                getComputedStyle(n).borderRadius !== "0px" ||
                getComputedStyle(n).boxShadow !== "none",
            ),
          };
        }),
      );
      for (const item of info) {
        expect(item.linkColor).toBe(item.ink);
        expect(item.rule).toBe(false);
        expect(item.decorated).toBe(false);
      }
      const list = s.locator("ol");
      expect(
        await list.evaluate((el) => getComputedStyle(el).listStyleType),
      ).toBe("none");
    });

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

      // The chip is hidden from screen readers; the list order gives the rank.
      const names = await list
        .locator("li")
        .evaluateAll((lis) =>
          lis.map((li) => li.querySelector("h3")!.textContent),
        );
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
          expect(info.ring, info.name).toBe("outline"); // COL-13
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
