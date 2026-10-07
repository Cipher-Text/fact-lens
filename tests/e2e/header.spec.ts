import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-05: top ad, top bar, nav row, drawer and search dialog
// (spacing-layout-system.md Sections 6 and 9; DR-21, DR-41 to DR-43, LAY-15).

const PAGES = [
  { path: "/", lang: "bn", menu: "মেনু", search: "অনুসন্ধান" },
  { path: "/en", lang: "en", menu: "Menu", search: "Search" },
] as const;

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1024, 1180, 1279, 1280, 1366, 1440, 1920,
];

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
}

async function expectNoBlockingAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations
    // The logo is not contrast-tested: WCAG 1.4.3 exempts logotypes, and color-system.md
    // Section 3 excludes the logo. Only that one node of that one rule is left out.
    .map((v) =>
      v.id === "color-contrast"
        ? { ...v, nodes: v.nodes.filter((n) => !n.html.includes("data-logo")) }
        : v,
    )
    .filter((v) => v.nodes.length > 0)
    .filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

/** Presses Enter on a focused trigger until the dialog opens (the page may still hydrate). */
async function openWithKeyboard(trigger: Locator, dialog: Locator) {
  await expect(async () => {
    await trigger.focus();
    await trigger.press("Enter");
    await expect(dialog).toHaveJSProperty("open", true, { timeout: 500 });
  }).toPass();
}

async function activeLabel(page: Page) {
  return page.evaluate(
    () => document.activeElement?.getAttribute("aria-label") ?? null,
  );
}

for (const p of PAGES) {
  test.describe(`header ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);

        const top = page.locator('[data-ad-slot="ad-band-top"]');
        const bar = page.locator("header.top-bar");
        const navRow = page.locator("[data-nav-row]");
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        const search = page.getByRole("button", {
          name: p.search,
          exact: true,
        });
        // The drawer is inside the header; the bar's own Subscribe link is not in a dialog.
        const subscribe = bar.locator('a[href="#newsletter"]:not(dialog *)');
        const logo = bar.locator("[data-logo]");

        // The top ad is the first row, above the bar.
        const topBox = await box(top);
        const barBox = await box(bar);
        expect(Math.round(topBox.y)).toBe(0);
        expect(Math.round(barBox.y)).toBe(Math.round(topBox.height));

        // Bar height: 56px, 64px from 1024 (--bar-height).
        expect(Math.round(barBox.height)).toBe(width >= 1024 ? 64 : 56);
        expect(Math.round(barBox.width)).toBe(width);

        // Menu on the left at every width; search and Subscribe from 768 (DR-21, DR-43).
        await expect(menu).toBeVisible();
        await expect(logo).toBeVisible();
        await expect(bar.locator("[data-theme-toggle]")).toBeVisible();
        await expect(bar.locator("a[hreflang]")).toBeVisible();
        if (width >= 768) {
          await expect(search).toBeVisible();
          await expect(subscribe).toBeVisible();
          const menuBox = await box(menu);
          const searchBox = await box(search);
          expect(searchBox.x).toBeGreaterThan(menuBox.x);
        } else {
          await expect(search).toBeHidden();
          await expect(subscribe).toBeHidden();
        }

        // The logo is in the center when the sides leave room for it (1fr auto 1fr).
        const logoBox = await box(logo);
        const menuBox = await box(menu);
        expect(logoBox.x).toBeGreaterThan(menuBox.x + menuBox.width);
        if (width >= 600) {
          const center = logoBox.x + logoBox.width / 2;
          expect(Math.abs(center - width / 2)).toBeLessThanOrEqual(1);
        }

        // The nav row shows from 1280 only, at shell width (DR-41).
        if (width >= 1280) {
          await expect(navRow).toBeVisible();
          const navBox = await box(navRow);
          expect(Math.round(navBox.width)).toBe(Math.min(width - 48, 1280));
          expect(Math.round(navBox.y)).toBe(
            Math.round(barBox.y + barBox.height),
          );
          expect(Math.round(navBox.height)).toBe(48);
        } else {
          await expect(navRow).toBeHidden();
        }

        // No horizontal scroll (LAY-02).
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scrollWidth).toBeLessThanOrEqual(width);
      });
    }

    test("nav row items fit on one line, with no fact-check and no China (DR-18, DR-19)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const links = page.locator("[data-nav-row] li:not([hidden]) a");
      await expect(links.first()).toBeVisible();
      const tops = await links.evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().top)),
      );
      expect(new Set(tops).size).toBe(1);
      const text = await page.locator("[data-nav-row]").innerText();
      expect(text).not.toMatch(/ফ্যাক্টচেক|fact[\s-]?check/i);
      expect(text).not.toMatch(/চীন|China/);
      // A hidden item leaves the tab order: no "More" item (DR-41).
      expect(text).not.toMatch(/আরও|More/);
    });

    test("only the top bar sticks; the top ad and nav row scroll away (LAY-15)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect
        .poll(async () =>
          Math.round((await box(page.locator("header.top-bar"))).y),
        )
        .toBe(0);
      const top = await box(page.locator('[data-ad-slot="ad-band-top"]'));
      expect(top.y + top.height).toBeLessThanOrEqual(0);
      const nav = await box(page.locator("[data-nav-row]"));
      expect(nav.y + nav.height).toBeLessThan(64);
      const navPosition = await page
        .locator("[data-nav-row]")
        .evaluate((el) => getComputedStyle(el).position);
      expect(navPosition).toBe("static");
    });

    for (const width of [360, 1280]) {
      test(`drawer works with the keyboard at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        const drawer = page.locator("dialog[data-drawer]");

        await openWithKeyboard(menu, drawer);
        // Focus moves to the first item: the search field on phones, else the first nav link.
        const focused = page.locator(":focus");
        if (width < 768) {
          await expect(focused).toHaveAttribute("name", "q");
          await expect(drawer.locator('a[href="#newsletter"]')).toBeVisible();
        } else {
          await expect(focused).toHaveAttribute("href", "#category-bangladesh");
          await expect(drawer.locator('input[name="q"]')).toBeHidden();
          await expect(drawer.locator('a[href="#newsletter"]')).toBeHidden();
        }

        // The drawer is at the left edge (after the slide), full height, --drawer-width wide.
        await expect
          .poll(async () => Math.round((await box(drawer)).x))
          .toBe(0);
        const drawerBox = await box(drawer);
        expect(Math.round(drawerBox.height)).toBe(800);
        expect(Math.round(drawerBox.width)).toBe(Math.min(320, width - 48));

        // Every nav item is in the drawer; regions are sub-items, China among them (DR-19).
        await expect(drawer.locator("nav > ul > li")).toHaveCount(7);
        await expect(drawer.locator("nav ul ul a")).toHaveCount(7);

        await expectNoBlockingAxe(page);

        await page.keyboard.press("Escape");
        await expect(drawer).toHaveJSProperty("open", false);
        expect(await activeLabel(page)).toBe(p.menu);
      });
    }

    test("drawer opens with no slide when reduced motion is set", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("dialog[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      const duration = await drawer.evaluate(
        (el) => getComputedStyle(el).transitionDuration,
      );
      expect(duration).toBe("0s");
      // In place at once, with no wait for a slide.
      expect(Math.round((await box(drawer)).x)).toBe(0);
    });

    test("drawer closes with the close button and the scrim", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("dialog[data-drawer]");

      await openWithKeyboard(menu, drawer);
      await drawer.locator("button").first().click();
      await expect(drawer).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.menu);

      await openWithKeyboard(menu, drawer);
      // The scrim is to the right of the drawer.
      await page.mouse.click(350, 400);
      await expect(drawer).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.menu);
    });

    test("a drawer link closes the drawer and moves focus to its target", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("dialog[data-drawer]");
      await openWithKeyboard(menu, drawer);
      // The category sections come in FL-06 to FL-09; a stand-in target is added here,
      // after hydration (the drawer is open), so React does not remove it.
      await page.evaluate(() => {
        const section = document.createElement("section");
        section.id = "category-bangladesh";
        document.querySelector("main")?.append(section);
      });
      await drawer.locator('nav a[href="#category-bangladesh"]').click();
      await expect(drawer).toHaveJSProperty("open", false);
      await expect(page.locator("#category-bangladesh")).toBeFocused();
      await expect(page.locator("html")).not.toHaveAttribute("data-modal-open");
    });

    test("search dialog works with the keyboard from 768", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const search = page.getByRole("button", { name: p.search, exact: true });
      const dialog = page.locator("dialog[data-search-dialog]");

      await openWithKeyboard(search, dialog);
      const field = dialog.locator('input[name="q"]');
      await expect(field).toBeFocused();

      // Mock search: a note in the page language, no results page (DR-01).
      await field.fill("Bay of Bengal");
      await page.keyboard.press("Enter");
      await expect(dialog.getByRole("status")).not.toBeEmpty();
      await expect(page).toHaveURL(
        new RegExp(`${p.path === "/" ? "/$" : "/en$"}`),
      );

      await expectNoBlockingAxe(page);

      await page.keyboard.press("Escape");
      await expect(dialog).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.search);

      // The close button also closes it.
      await openWithKeyboard(search, dialog);
      await dialog.getByRole("button").first().click();
      await expect(dialog).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.search);
    });

    test("theme toggle cycles system, light, dark", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" });
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const toggle = page.locator("header [data-theme-toggle]");
      await expect(toggle).toHaveAttribute("data-theme-toggle", "system");
      await expect(async () => {
        await toggle.click();
        await expect(toggle).toHaveAttribute("data-theme-toggle", "light", {
          timeout: 500,
        });
      }).toPass();
      await toggle.click();
      await expect(toggle).toHaveAttribute("data-theme-toggle", "dark");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await toggle.click();
      await expect(toggle).toHaveAttribute("data-theme-toggle", "system");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    });

    test("the header has interface text in the page language only (T-27)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const text = await page.locator("header.top-bar").innerText();
      const other = await page
        .locator("header.top-bar a[hreflang]")
        .innerText();
      const rest = text.replace(other, "");
      if (p.lang === "bn") expect(rest).not.toMatch(/[A-Za-z]/);
      else expect(rest).not.toMatch(/[ঀ-৿]/);
    });

    for (const scheme of ["light", "dark"] as const) {
      test(`no serious axe violations in ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(p.path);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          scheme,
        );
        await expectNoBlockingAxe(page);
      });
    }
  });
}
