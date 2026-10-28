import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { setTheme } from "./theme";

// R4-02: one motion, 450ms ease-slide, for the menu Sheet, the search Drawer, the region
// slider and tab fade, the NavBar hide, the logo scale and the Drawer accordion. Button
// colors stay 200ms. Reduced motion: no motion (spacing-layout-system.md Sections 6 and
// 12.4, LAY-15; component-system.md C-12, C-15, C-17 to C-20; DR-346, DR-348, DR-349).

const PAGES = [
  { path: "/", menu: "মেনু", search: "অনুসন্ধান" },
  { path: "/en", menu: "Menu", search: "Search" },
] as const;

const EASE_SLIDE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Motion = { durations: string[]; easings: string[] };

async function motion(locator: Locator): Promise<Motion> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const split = (value: string) => value.split(/,\s*(?![^(]*\))/);
    return {
      durations: split(style.transitionDuration),
      easings: split(style.transitionTimingFunction),
    };
  });
}

function expectSlide(m: Motion, name: string, reduced: boolean) {
  for (const d of m.durations)
    expect(d, `${name} duration`).toBe(reduced ? "0s" : "0.45s");
  for (const e of m.easings) expect(e, `${name} easing`).toBe(EASE_SLIDE);
}

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("no box");
  return b;
}

async function openWithKeyboard(trigger: Locator, panel: Locator) {
  await expect(async () => {
    await trigger.focus();
    await trigger.press("Enter");
    await expect(panel).toBeVisible({ timeout: 500 });
  }).toPass();
}

/** Reads every motion of the ticket at 360 (Sheet, accordion, tab fade) and 1280. */
async function allMotions(page: Page, p: (typeof PAGES)[number]) {
  const found: Record<string, Motion> = {};

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(p.path);
  found["region tab panel"] = await motion(page.locator("[data-region-row]"));
  const menu = page.getByRole("button", { name: p.menu, exact: true });
  found["button colors"] = await motion(menu);
  const drawer = page.locator("[data-drawer]");
  await openWithKeyboard(menu, drawer);
  found["menu Sheet"] = await motion(drawer);
  found["Sheet backdrop"] = await motion(
    page.locator('[data-slot="sheet-overlay"]'),
  );
  const caret = drawer.locator("nav button[aria-expanded]").first();
  found["accordion caret"] = await motion(caret.locator("svg"));
  await caret.click();
  found["accordion panel"] = await motion(
    drawer.locator('[data-slot="collapsible-content"]').first(),
  );
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(p.path);
  found["slider track"] = await motion(page.locator("[data-region-row]"));
  found["NavBar"] = await motion(page.locator("[data-nav-row]"));
  found["logo"] = await motion(page.locator("[data-top-bar] [data-logo]"));
  const searchButton = page.getByRole("button", {
    name: p.search,
    exact: true,
  });
  const dialog = page.locator("[data-search-dialog]");
  await openWithKeyboard(searchButton, dialog);
  found["search Drawer"] = await motion(dialog);
  return found;
}

for (const p of PAGES) {
  test.describe(`motion ${p.path}`, () => {
    for (const theme of ["light", "dark"] as const) {
      test(`every slide, fade and height change is 450ms ease-slide; buttons 200ms (${theme}) (DR-346, DR-349)`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        const found = await allMotions(page, p);
        for (const [name, m] of Object.entries(found)) {
          if (name === "button colors") {
            for (const d of m.durations) expect(d, name).toBe("0.2s");
          } else expectSlide(m, name, false);
        }
      });
    }

    test("reduced motion: every duration is 0 and the end state shows at once (DR-227, DR-349)", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const found = await allMotions(page, p);
      for (const [name, m] of Object.entries(found))
        for (const d of m.durations) expect(d, name).toBe("0s");

      // The NavBar hides and the logo scales at once.
      await page.goto(p.path);
      const nav = page.locator("[data-nav-row]");
      await expect
        .poll(async () => Math.round((await box(nav)).height))
        .toBe(45);
      await page.evaluate(() => window.scrollTo(0, 100));
      await expect(page.locator("html")).toHaveAttribute("data-bar-stuck", "");
      const end = await page.evaluate(() => {
        const n = document.querySelector("[data-nav-row]")!;
        const logo = document.querySelector("[data-top-bar] [data-logo]")!;
        return {
          visibility: getComputedStyle(n).visibility,
          bottom: Math.round(n.getBoundingClientRect().bottom),
          scale: new DOMMatrix(getComputedStyle(logo).transform).a,
        };
      });
      expect(end).toEqual({ visibility: "hidden", bottom: 64, scale: 0.75 });
    });

    test("the hide moves nothing: bar height and main top stay, CLS 0 in a scripted scroll (DR-295, DR-349)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const nav = page.locator("[data-nav-row]");
      await expect
        .poll(async () => Math.round((await box(nav)).height))
        .toBe(45);
      const layout = () =>
        page.evaluate(() => ({
          bar: Math.round(
            document.querySelector("[data-top-bar]")!.getBoundingClientRect()
              .height,
          ),
          main: Math.round(
            document.querySelector("main")!.getBoundingClientRect().top +
              window.scrollY,
          ),
        }));
      const before = await layout();
      const shift = await page.evaluate(async () => {
        let total = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            total += (entry as unknown as { value: number }).value;
        });
        observer.observe({ type: "layout-shift", buffered: false });
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
        for (const y of [20, 46, 120, 400, 10, 0, 300, 0]) {
          window.scrollTo(0, y);
          await wait(600);
        }
        observer.disconnect();
        return total;
      });
      expect(shift).toBe(0);
      await page.evaluate(() => window.scrollTo(0, 400));
      await expect(page.locator("html")).toHaveAttribute("data-bar-stuck", "");
      expect(await layout()).toEqual(before);
    });

    test("a #hash link stops below the bar with the NavBar hidden (--scroll-offset, DR-265)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const nav = page.locator("[data-nav-row]");
      await expect
        .poll(async () => Math.round((await box(nav)).height))
        .toBe(45);
      // The one # link left in the nav is the parent Analysis and Opinion: Regions goes to
      // /regions now (DR-411, DR-414). The English NavBar hides that last item for lack of
      // room at every width (DR-359), so the link is clicked in the Drawer.
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      await drawer.locator('a[href="#analysis-opinion-title"]').first().click();
      await expect(page.locator("html")).toHaveAttribute("data-bar-stuck", "");
      await expect(nav).toBeHidden();
      // The target stops at the bar bottom + 16px: 64 + 16.
      await expect
        .poll(async () =>
          Math.round((await box(page.locator("#analysis-opinion-title"))).y),
        )
        .toBe(80);
    });

    test("accordion: aria-expanded changes, the panel height animates from 0, Enter and Space open and close it (C-19, DR-349)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      const caret = drawer.locator("nav button[aria-expanded]").first();
      await expect(caret).toHaveAttribute("aria-expanded", "false");

      // Open with a press: sample the panel height while it animates.
      const heights = await caret.evaluate(
        (button) =>
          new Promise<number[]>((resolve) => {
            const seen: number[] = [];
            const start = performance.now();
            const frame = () => {
              const panel = document.querySelector<HTMLElement>(
                `#${button.getAttribute("aria-controls")}`,
              );
              seen.push(panel ? panel.getBoundingClientRect().height : 0);
              if (performance.now() - start < 700) requestAnimationFrame(frame);
              else resolve(seen);
            };
            (button as HTMLElement).click();
            frame();
          }),
      );
      const full = heights.at(-1)!;
      const list = drawer.locator('[data-slot="collapsible-content"] > ul');
      expect(Math.round(full)).toBe(Math.round((await box(list)).height));
      expect(full).toBeGreaterThan(44);
      expect(Math.min(...heights)).toBeLessThan(1);
      expect(heights.some((h) => h > 1 && h < full - 1)).toBe(true);
      await expect(caret).toHaveAttribute("aria-expanded", "true");
      // The caret has turned up (180deg).
      await expect
        .poll(() =>
          caret
            .locator("svg")
            .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
        )
        .toBeCloseTo(-1, 3);

      // The keyboard: Enter closes it, Space opens it.
      await caret.focus();
      await page.keyboard.press("Enter");
      await expect(caret).toHaveAttribute("aria-expanded", "false");
      await expect(drawer.locator("nav ul ul")).toHaveCount(0);
      await page.keyboard.press("Space");
      await expect(caret).toHaveAttribute("aria-expanded", "true");
      await expect(drawer.locator("nav ul ul").first()).toBeVisible();
      await page.keyboard.press("Space");
      await expect(caret).toHaveAttribute("aria-expanded", "false");

      // Escape still closes the Drawer, and focus goes back to the menu button.
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: p.menu, exact: true }),
      ).toBeFocused();
    });

    test("axe: the header and the open Drawer have no serious or critical violation", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      await page.evaluate(() => window.scrollTo(0, 400));
      await expect(page.locator("html")).toHaveAttribute("data-bar-stuck", "");
      const results = await new AxeBuilder({ page })
        .include("[data-top-bar]")
        .include("[data-nav-row]")
        .analyze();
      // The logo is exempt from contrast (WCAG 1.4.3; color-system.md Section 3).
      const violations = results.violations
        .map((v) =>
          v.id === "color-contrast"
            ? {
                ...v,
                nodes: v.nodes.filter((n) => !n.html.includes("data-logo")),
              }
            : v,
        )
        .filter(
          (v) =>
            v.nodes.length > 0 &&
            (v.impact === "serious" || v.impact === "critical"),
        );
      expect(violations).toEqual([]);
    });
  });
}
