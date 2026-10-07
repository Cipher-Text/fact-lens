import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-11: P-3b Regions (spacing-layout-system.md 7.1 to 7.4, 13; DR-19, DR-54;
// typography-system.md 7.1 region chip; LAY-02, LAY-03, LAY-12, LAY-14, LAY-17,
// TYP-09, COL-13).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    title: "অঞ্চল",
    previous: "আগের অঞ্চল",
    next: "পরের অঞ্চল",
  },
  {
    path: "/en",
    lang: "en",
    title: "Regions",
    previous: "Previous region",
    next: "Next region",
  },
] as const;

const WIDTHS = [
  320, 360, 599, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

// Full content: 6 regions with stories (আফ্রিকা has none and is not shown).
const REGION_COUNT = 6;

const regions = (page: Page) => page.locator('[data-section="regions"]');
const row = (page: Page) => page.locator("[data-region-row]");

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

// From 600, the client code drops the tab roles once it runs: the slider is hydrated.
async function waitForSlider(page: Page) {
  await expect(regions(page).locator('[role="tabpanel"]')).toHaveCount(0);
}

const scrollLeft = (page: Page) =>
  row(page).evaluate((el) => Math.round(el.scrollLeft));

for (const p of PAGES) {
  test.describe(`regions ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);

        // No horizontal page scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        const gutter = width < 600 ? 16 : 24;
        const shell = Math.min(width - 2 * gutter, 1280);
        const columnGap = width >= 1024 ? 24 : width >= 768 ? 20 : 16;

        const s = regions(page);
        const sectionBox = await box(s);
        expect(Math.round(sectionBox.width)).toBe(shell); // LAY-03

        const panels = s.locator("[data-region]");
        await expect(panels).toHaveCount(REGION_COUNT);
        const tablist = s.getByRole("tablist");
        const previous = s.getByRole("button", { name: p.previous });
        const next = s.getByRole("button", { name: p.next });

        if (width < 600) {
          // Tabs: one panel shows, at shell width (7.4).
          await expect(tablist).toBeVisible();
          await expect(previous).toBeHidden();
          await expect(next).toBeHidden();
          await expect(s.locator("[data-region]:visible")).toHaveCount(1);
          const panel = s.getByRole("tabpanel");
          await expect(panel).toHaveCount(1);
          expect(Math.round((await box(panel)).width)).toBe(shell);
          // A chip is as wide as its label and 44px tall or more (TYP-09).
          const chips = await s.getByRole("tab").evaluateAll((tabs) =>
            tabs.map((t) => ({
              height: t.getBoundingClientRect().height,
              clipped: t.scrollWidth > t.clientWidth + 1,
              font: getComputedStyle(t).fontSize,
            })),
          );
          for (const chip of chips) {
            expect(chip.height).toBeGreaterThanOrEqual(44);
            expect(chip.clipped).toBe(false);
          }
        } else {
          // Slider: 2 regions in view, 4 from 1024 (7.2), at the column gap.
          await expect(tablist).toBeHidden();
          await expect(s.getByRole("tabpanel")).toHaveCount(0);
          // Each column is a named group, not one more landmark.
          await expect(s.getByRole("group")).toHaveCount(REGION_COUNT);
          await expect(s.getByRole("region")).toHaveCount(0);
          const inView = width >= 1024 ? 4 : 2;
          const b = await Promise.all([0, 1, 2].map((i) => box(panels.nth(i))));
          const column = (shell - (inView - 1) * columnGap) / inView;
          expect(Math.abs(b[0].width - column)).toBeLessThanOrEqual(1);
          expect(Math.round(b[1].x - (b[0].x + b[0].width))).toBe(columnGap);
          // The first column starts at the shell edge.
          expect(Math.round(b[0].x)).toBe(Math.round(sectionBox.x));
          // All columns are in one row.
          expect(Math.round(b[2].y)).toBe(Math.round(b[0].y));
          // 6 regions: buttons show, previous disabled at the start.
          await expect(previous).toBeVisible();
          await expect(previous).toHaveAttribute("aria-disabled", "true");
          await expect(next).not.toHaveAttribute("aria-disabled");
          const snap = await row(page).evaluate(
            (el) => getComputedStyle(el).scrollSnapType,
          );
          expect(snap).toContain("x");
        }

        // After the Most read ad row: space-module above (LAY-12). Last section.
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;
        const prev = s.locator("xpath=preceding-sibling::*[1]");
        await expect(prev).toHaveAttribute("data-ad-slot", "ad-band");
        expect(await s.evaluate((el) => getComputedStyle(el).paddingTop)).toBe(
          `${space}px`,
        );

        // No text is clipped (LAY-17, TYP-09).
        const overflowing = await s.evaluate((el) =>
          [...el.querySelectorAll(":is(h2, h3, h4, a):not(.sr-only)")]
            // Skip hidden panels and the phone heading, which is visually hidden
            // (sr-only, 1px) because the chip names the panel.
            .filter((n) => (n as HTMLElement).offsetParent !== null)
            .filter((n) => n.getBoundingClientRect().width > 1)
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

    for (const width of [600, 1024, 1366]) {
      test(`buttons move one region and stop at each end at ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForSlider(page);
        const s = regions(page);
        const previous = s.getByRole("button", { name: p.previous });
        const next = s.getByRole("button", { name: p.next });
        const panels = s.locator("[data-region]");
        const [a, b] = await Promise.all([
          box(panels.nth(0)),
          box(panels.nth(1)),
        ]);
        const step = Math.round(b.x - a.x);
        const inView = width >= 1024 ? 4 : 2;
        const moves = REGION_COUNT - inView;

        for (let i = 1; i <= moves; i++) {
          await next.click();
          await expect.poll(() => scrollLeft(page)).toBe(i * step);
        }
        // At the end: next is disabled, a press does nothing. No loop.
        await expect(next).toHaveAttribute("aria-disabled", "true");
        await expect(previous).not.toHaveAttribute("aria-disabled");
        // Playwright does not click an aria-disabled button, so send the event.
        await next.dispatchEvent("click");
        await page.waitForTimeout(400);
        expect(await scrollLeft(page)).toBe(moves * step);

        // Keyboard on the buttons; focus stays on the disabled button (COL-13).
        await previous.focus();
        for (let i = moves - 1; i >= 0; i--) {
          await page.keyboard.press("Enter");
          await expect.poll(() => scrollLeft(page)).toBe(i * step);
        }
        await expect(previous).toHaveAttribute("aria-disabled", "true");
        await expect(previous).toBeFocused();
      });
    }

    test("swipe (native scroll) updates the buttons, and snaps to a column", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 900 });
      await page.goto(p.path);
      await waitForSlider(page);
      const s = regions(page);
      const r = row(page);
      await r.evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
      });
      await expect(s.getByRole("button", { name: p.next })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await expect(
        s.getByRole("button", { name: p.previous }),
      ).not.toHaveAttribute("aria-disabled");
      await page.mouse.move(400, 400);
      await r.hover();
      await page.mouse.wheel(-100, 0);
      // Mandatory snap ends on a column start, not part way.
      const panels = s.locator("[data-region]");
      const [a, b] = await Promise.all([
        box(panels.nth(0)),
        box(panels.nth(1)),
      ]);
      const step = b.x - a.x;
      await expect
        .poll(async () => (await scrollLeft(page)) % Math.round(step))
        .toBe(0);
    });

    test("reduced motion: a button press moves at once", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(p.path);
      await waitForSlider(page);
      const s = regions(page);
      const before = await scrollLeft(page);
      // Read the position in the same task as the click: no animation frames.
      const after = await s
        .getByRole("button", { name: p.next })
        .evaluate((button, start) => {
          (button as HTMLButtonElement).click();
          const el = document.querySelector<HTMLElement>("[data-region-row]")!;
          return Math.round(el.scrollLeft) - start;
        }, before);
      expect(after).toBeGreaterThan(0);
    });

    test("with motion: a button press animates for about 250ms", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(p.path);
      await waitForSlider(page);
      const result = await page.evaluate(async () => {
        const el = document.querySelector<HTMLElement>("[data-region-row]")!;
        const button =
          document.querySelector<HTMLElement>("[data-region-next]")!;
        button.click();
        const sameTask = el.scrollLeft;
        const start = performance.now();
        let end = start;
        let last = el.scrollLeft;
        while (performance.now() - start < 1000) {
          await new Promise((r) => requestAnimationFrame(r));
          if (el.scrollLeft !== last) {
            last = el.scrollLeft;
            end = performance.now();
          }
        }
        return { sameTask, moved: el.scrollLeft, duration: end - start };
      });
      expect(result.sameTask).toBe(0);
      expect(result.moved).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(150);
      expect(result.duration).toBeLessThan(400);
    });

    test("phone tabs: arrow keys, Home and End select a region", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const s = regions(page);
      const tabs = s.getByRole("tab");
      await expect(tabs).toHaveCount(REGION_COUNT);
      await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

      // One tab stop for the tablist (roving tabindex).
      await tabs.first().focus();
      await page.keyboard.press("ArrowRight");
      await expect(tabs.nth(1)).toBeFocused();
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
      const panel = s.getByRole("tabpanel");
      await expect(panel).toHaveCount(1);
      await expect(panel).toHaveAttribute(
        "id",
        (await tabs.nth(1).getAttribute("aria-controls"))!,
      );

      // End: the last chip is selected and scrolls into view.
      await page.keyboard.press("End");
      const last = tabs.nth(REGION_COUNT - 1);
      await expect(last).toBeFocused();
      await expect(last).toHaveAttribute("aria-selected", "true");
      await expect(last).toBeInViewport({ ratio: 1 });
      await page.keyboard.press("ArrowRight");
      await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("ArrowLeft");
      await expect(last).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Home");
      await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

      // Tab leaves the tablist and goes into the panel.
      await page.keyboard.press("Tab");
      const inPanel = await page.evaluate(
        () => !!document.activeElement?.closest('[role="tabpanel"]'),
      );
      expect(inPanel).toBe(true);

      // A click selects too.
      await tabs.nth(2).click();
      await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    });

    test("a #region-<id> link selects the region on phones", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`${p.path}#region-europe`);
      const panel = regions(page).getByRole("tabpanel");
      await expect(panel).toHaveAttribute("id", "region-europe");
      await expect(panel).toBeInViewport();
    });

    for (const width of [360, 600, 1024]) {
      test(`sparse content at ${width}: no buttons, empty region hidden (7.3)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${p.path}?content=sparse`);
        const s = regions(page);
        const ids = await s
          .locator("[data-region]")
          .evaluateAll((els) => els.map((e) => e.getAttribute("data-region")));
        expect(ids.length).toBeLessThanOrEqual(4);
        expect(ids).not.toContain("africa");
        await expect(s.getByRole("button", { name: p.previous })).toHaveCount(
          0,
        );
        await expect(s.getByRole("button", { name: p.next })).toHaveCount(0);
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);
      });
    }

    for (const theme of ["light", "dark"] as const) {
      for (const width of [360, 1280]) {
        test(`axe in ${theme} theme at ${width}`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: theme });
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          await expect(regions(page)).toBeVisible();
          await expectNoBlockingAxe(page);
        });
      }
    }

    test("heading, region names and language", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const s = regions(page);
      await expect(page.getByRole("region", { name: p.title })).toHaveAttribute(
        "id",
        "regions",
      );
      await expect(
        s.getByRole("heading", { level: 2, name: p.title }),
      ).toBeVisible();
      await expect(s.getByRole("heading", { level: 3 })).toHaveCount(
        REGION_COUNT,
      );

      const text = (await s.innerText()).replace(/\s+/g, " ");
      if (p.lang === "bn") {
        // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
        expect(text).not.toMatch(/[A-Za-z0-9]/);
        await expect(
          s.getByRole("heading", { level: 3, name: "চীন", exact: true }),
        ).toBeVisible(); // DR-19
      } else {
        expect(text).not.toMatch(/[ঀ-৿]/);
      }
    });

    test("keyboard: every link in every region is reachable with the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const selector = "[data-region-row]";
      const total = await row(page).locator("a").count();
      const seen = new Set<string>();
      await page.getByRole("button", { name: p.next }).focus();
      for (let i = 0; i < 80 && seen.size < total; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          const r = el.getBoundingClientRect();
          const rowBox = el.closest(sel)!.getBoundingClientRect();
          return {
            name: el.getAttribute("href") ?? el.tagName,
            ring: getComputedStyle(el).boxShadow,
            // The focused link scrolls into the row's view.
            inView: r.left >= rowBox.left - 1 && r.right <= rowBox.right + 1,
          };
        }, selector);
        if (info) {
          expect(info.ring, info.name).not.toBe("none"); // COL-13
          expect(info.inView, info.name).toBe(true);
          seen.add(info.name);
        }
      }
      expect(seen.size).toBe(total);
    });
  });
}

test("page order: P-5, ad, P-3b (7.1)", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(10)).toHaveAttribute("data-section", "most-read");
  await expect(main.nth(11)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(12)).toHaveAttribute("data-section", "regions");
  await expect(main).toHaveCount(13);
});
