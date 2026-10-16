import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { setTheme } from "./theme";

// R2-05, R3-02: top bar, nav row, Drawer (shadcn Sheet) and search dialog (shadcn Drawer)
// (spacing-layout-system.md Sections 6 and 9; component-system.md C-12, C-17 to C-20;
// DR-21, DR-41, DR-173, DR-188, DR-201, DR-249, DR-269, DR-280, DR-281, DR-295, DR-340,
// LAY-15).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    menu: "মেনু",
    closeMenu: "মেনু বন্ধ করুন",
    search: "অনুসন্ধান",
    closeSearch: "অনুসন্ধান বন্ধ করুন",
    clear: "মুছুন",
    themeName: "ডার্ক থিম",
  },
  {
    path: "/en",
    lang: "en",
    menu: "Menu",
    closeMenu: "Close menu",
    search: "Search",
    closeSearch: "Close search",
    clear: "Clear",
    themeName: "Dark theme",
  },
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

/** Presses Enter on a focused trigger until the panel opens (the page may still hydrate). */
async function openWithKeyboard(trigger: Locator, panel: Locator) {
  await expect(async () => {
    await trigger.focus();
    await trigger.press("Enter");
    await expect(panel).toBeVisible({ timeout: 500 });
  }).toPass();
}

/** Waits until a Sheet has finished its slide in from the start edge. */
async function expectSettled(panel: Locator) {
  await expect.poll(async () => Math.round((await box(panel)).x)).toBe(0);
}

/** A closed shadcn Sheet or Drawer is not in the page. */
async function expectClosed(panel: Locator) {
  await expect(panel).toHaveCount(0);
}

/** The bottom rule of the top bar is drawn when its color is not transparent. */
async function barRuleShown(page: Page) {
  const color = await page
    .locator("[data-top-bar]")
    .evaluate((el) => getComputedStyle(el).borderBottomColor);
  return color !== "rgba(0, 0, 0, 0)";
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

        const top = page.locator('[data-ad-slot="ad-top"]');
        const bar = page.locator("[data-top-bar]");
        const navRow = page.locator("[data-nav-row]");
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        const search = page.getByRole("button", {
          name: p.search,
          exact: true,
        });
        const logo = bar.locator("[data-logo]:not(dialog *)");

        // The bar is at the top of the page. The top ad row is below the header: below
        // the nav row from 1280, below the bar under 1280 (DR-295).
        const topBox = await box(top);
        const barBox = await box(bar);
        expect(Math.round(barBox.y)).toBe(0);
        const headerBottom =
          width >= 1280
            ? (await box(navRow)).y + (await box(navRow)).height
            : barBox.y + barBox.height;
        expect(Math.round(topBox.y)).toBe(Math.round(headerBottom));

        // Bar height: 56px, 64px from 1024 (--bar-height). Full page width.
        expect(Math.round(barBox.height)).toBe(width >= 1024 ? 64 : 56);
        expect(Math.round(barBox.width)).toBe(width);

        // The same bar at every width: menu at the start, search from 768 (C-17).
        await expect(menu).toBeVisible();
        await expect(logo).toBeVisible();
        await expect(bar.locator("a[hreflang]")).toBeVisible();
        const menuBox = await box(menu);
        const buttonSize = width >= 768 ? 44 : 32;
        expect(Math.round(menuBox.width)).toBe(buttonSize);
        expect(Math.round(menuBox.height)).toBe(buttonSize);
        if (width >= 768) {
          await expect(search).toBeVisible();
          expect((await box(search)).x).toBeGreaterThan(menuBox.x);
        } else {
          await expect(search).toBeHidden();
        }

        // The 20px menu icon sits on the page gutter: 16px under 600, 24px from 600.
        const gutter = width >= 600 ? 24 : 16;
        const icon = await box(menu.locator("svg"));
        expect(Math.round(icon.x)).toBe(gutter);

        // The end control (the switch from 768) ends on the gutter too: the switch has no
        // inner space, so the end group adds the difference.
        const endEdge = await box(
          bar.locator(
            width >= 768 ? "[data-theme-toggle]" : "[data-theme-button]",
          ),
        );
        const endInner = width >= 768 ? 0 : 6;
        expect(Math.round(width - (endEdge.x + endEdge.width) + endInner)).toBe(
          gutter,
        );

        // The logo is in the center at every width (1fr auto 1fr).
        const logoBox = await box(logo);
        expect(logoBox.x).toBeGreaterThan(menuBox.x + menuBox.width);
        const center = logoBox.x + logoBox.width / 2;
        expect(Math.abs(center - width / 2)).toBeLessThanOrEqual(2);

        // The theme control: ThemeButton under 768, ThemeToggle from 768. Not both.
        const button = bar.locator("[data-theme-button]");
        const toggle = bar.locator("[data-theme-toggle]");
        if (width >= 768) {
          await expect(toggle).toBeVisible();
          await expect(button).toBeHidden();
          const t = await box(toggle);
          expect([Math.round(t.width), Math.round(t.height)]).toEqual([56, 32]);
        } else {
          await expect(button).toBeVisible();
          await expect(toggle).toBeHidden();
          const t = await box(button);
          expect([Math.round(t.width), Math.round(t.height)]).toEqual([32, 32]);
        }

        // The language link: "En" on Bangla phones, "English" from 768 (C-17).
        const language = (await bar.locator("a[hreflang]").innerText()).trim();
        if (p.lang === "bn")
          expect(language).toBe(width >= 768 ? "English" : "En");
        else expect(language).toBe("বাংলা");

        // No subscribe button in the header (DR-188).
        expect(await page.locator('a[href="#newsletter"]').count()).toBe(0);

        // The nav row shows from 1280 only, at shell width, with a 1px rule (DR-41).
        if (width >= 1280) {
          await expect(navRow).toBeVisible();
          const navBox = await box(navRow);
          expect(Math.round(navBox.width)).toBe(Math.min(width - 48, 1280));
          expect(Math.round(navBox.y)).toBe(
            Math.round(barBox.y + barBox.height),
          );
          // The row is 48px (--nav-row-height) and the 1px rule is below it.
          expect(Math.round(navBox.height)).toBe(49);
          const navRule = await navRow.evaluate(
            (el) => getComputedStyle(el).borderBottomWidth,
          );
          expect(navRule).toBe("1px");
        } else {
          await expect(navRow).toBeHidden();
        }
        // No rule on the bar at the page top, at any width: the bar shows its rule only when
        // it is stuck (DR-173, DR-295). The border is transparent, so the bar does not move.
        expect(await barRuleShown(page)).toBe(false);
        await expect(bar).toHaveCSS("border-bottom-width", "1px");

        // The logo is type-logo: 20px on phones, 28px at 768, 32px from 1024 (DR-306).
        await expect(logo).toHaveCSS(
          "font-size",
          width >= 1024 ? "32px" : width >= 768 ? "28px" : "20px",
        );
        await expect(logo).toHaveCSS("font-weight", "700");

        // No horizontal scroll (LAY-02).
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scrollWidth).toBeLessThanOrEqual(width);
      });
    }

    test("nav row: 9 items in the C-18 order fit on one line, no fact-check and no China (DR-18, DR-19)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const links = page.locator("[data-nav-row] li:not([hidden]) a");
      await expect(links.first()).toBeVisible();
      // The row settles after the web fonts load and the items are measured again.
      await expect
        .poll(async () => {
          const tops = await links.evaluateAll((els) =>
            els.map((el) => Math.round(el.getBoundingClientRect().top)),
          );
          return new Set(tops).size;
        })
        .toBe(1);
      // The row does not overflow the shell.
      const overflow = await page
        .locator("[data-nav-row]")
        .evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const text = await page.locator("[data-nav-row]").innerText();
      expect(text).not.toMatch(/ফ্যাক্টচেক|fact[\s-]?check/i);
      expect(text).not.toMatch(/চীন|China/);
      // No "More" item (DR-255).
      expect(text).not.toMatch(/আরও|More/);
      // The first item is Home, and it is the current page.
      await expect(links.first()).toHaveText(p.lang === "bn" ? "হোম" : "Home");
      await expect(links.first()).toHaveAttribute("aria-current", "page");
    });

    test("only the top bar sticks; the top ad and nav row scroll away; the bar rule returns (LAY-15, DR-173)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const bar = page.locator("[data-top-bar]");
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect.poll(async () => Math.round((await box(bar)).y)).toBe(0);
      const top = await box(page.locator('[data-ad-slot="ad-top"]'));
      expect(top.y + top.height).toBeLessThanOrEqual(0);
      const nav = await box(page.locator("[data-nav-row]"));
      expect(nav.y + nav.height).toBeLessThan(64);
      const navPosition = await page
        .locator("[data-nav-row]")
        .evaluate((el) => getComputedStyle(el).position);
      expect(navPosition).toBe("static");
      // The nav row is gone, so the bar shows its own 1px rule again (DR-287).
      await expect.poll(() => barRuleShown(page)).toBe(true);
      await expect(page.locator("html")).toHaveAttribute("data-bar-stuck", "");
      // Stuck: the logo is 24px, and the bar keeps its height (DR-295).
      await expect(bar.locator("[data-logo]")).toHaveCSS("font-size", "24px");
      expect(Math.round((await box(bar)).height)).toBe(64);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => barRuleShown(page)).toBe(false);
      await expect(page.locator("html")).not.toHaveAttribute("data-bar-stuck");
    });

    test("under 1280 the bar sticks alone: its rule shows once the page scrolls (DR-295)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const bar = page.locator("[data-top-bar]");
      expect(await barRuleShown(page)).toBe(false);
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect.poll(async () => Math.round((await box(bar)).y)).toBe(0);
      await expect.poll(() => barRuleShown(page)).toBe(true);
      // Phones keep the 20px logo when stuck.
      await expect(bar.locator("[data-logo]")).toHaveCSS("font-size", "20px");
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => barRuleShown(page)).toBe(false);
    });

    test("--scroll-offset is the rendered bar height + 16px; anchors stop below the bar (DR-265)", async ({
      page,
    }) => {
      for (const [width, bar] of [
        [360, 56],
        [1024, 64],
      ] as const) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        await expect
          .poll(() =>
            page.evaluate(
              () => getComputedStyle(document.documentElement).scrollPaddingTop,
            ),
          )
          .toBe(`${bar + 16}px`);
      }
    });

    test("SkipLink is the first focusable element and moves focus to main (DR-269)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const skip = page.locator("[data-skip-link]");
      await expect(skip).toHaveText(
        p.lang === "bn" ? "মূল খবরে যান" : "Skip to main content",
      );
      await expect(skip).not.toBeInViewport();
      await expect(async () => {
        await page.evaluate(() =>
          (document.activeElement as HTMLElement).blur(),
        );
        await page.keyboard.press("Tab");
        await expect(skip).toBeFocused({ timeout: 500 });
      }).toPass();
      // Shown at the page start, with the focus outline of the base rule.
      await expect(skip).toBeInViewport();
      expect(Math.round((await box(skip)).y)).toBeLessThan(64);
      await expect(skip).not.toHaveCSS("outline-style", "none");
      await page.keyboard.press("Enter");
      await expect(page.locator("main#main")).toBeFocused();
      await expect(page.locator("main#main")).toHaveAttribute("tabindex", "-1");
    });

    test("nav row items: Bangla is type-ui 16px, English type-ui-sm; every # link has a target (DR-295, DR-331)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const item = page.locator("[data-nav-row] li:not([hidden]) a").nth(1);
      await expect(item).toHaveCSS("font-weight", "600");
      await expect(item).toHaveCSS(
        "font-size",
        p.lang === "bn" ? "16px" : "14px",
      );
      const hrefs = await page
        .locator('[data-nav-row] a[href^="#"]:not([href^="#region-"])')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")!));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs)
        await expect(page.locator(href), href).toHaveCount(1);
    });

    for (const width of [360, 1280]) {
      test(`drawer works with the keyboard at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        const drawer = page.locator("[data-drawer]");

        await openWithKeyboard(menu, drawer);
        // Focus moves to the panel itself, not to an item (DR-249).
        await expect(drawer).toBeFocused();
        await expect(drawer).toHaveAttribute("role", "dialog");

        // Search is the first item on phones only.
        const search = drawer.locator('input[name="q"]');
        if (width < 768) await expect(search).toBeVisible();
        else await expect(search).toBeHidden();

        // The drawer is at the left edge (after the slide), full height, --drawer-width wide.
        await expect
          .poll(async () => Math.round((await box(drawer)).x))
          .toBe(0);
        const drawerBox = await box(drawer);
        expect(Math.round(drawerBox.height)).toBe(800);
        expect(Math.round(drawerBox.width)).toBe(Math.min(320, width - 48));

        // The head is 56px; no subscribe button (DR-188).
        expect(await page.locator('a[href="#newsletter"]').count()).toBe(0);
        const head = await box(drawer.locator("[data-logo]"));
        expect(head.y).toBeLessThan(56);

        // Every nav item is in the drawer: 9 rows, Regions with 7 regions (China among
        // them, DR-19) and Analysis and Opinion with 2 sub-items, no Op-ed (DR-302). All
        // accordions are closed (DR-181).
        await expect(drawer.locator("nav > ul > li")).toHaveCount(9);
        const carets = drawer.locator("nav button[aria-expanded]");
        await expect(carets).toHaveCount(2);
        for (const caret of await carets.all())
          await expect(caret).toHaveAttribute("aria-expanded", "false");
        await expect(drawer.locator("nav ul ul")).toHaveCount(0);
        for (const caret of await carets.all()) await caret.click();
        await expect(drawer.locator("nav ul ul a")).toHaveCount(9);
        await expect(drawer.locator('a[href*="op-ed"]')).toHaveCount(0);
        // Every # link has a target on the page (DR-331). The region links wait for R3-06:
        // the slider shows 4 of the 7 regions until it uses all of them.
        const hrefs = await drawer
          .locator('nav a[href^="#"]:not([href^="#region-"])')
          .evaluateAll((els) => els.map((el) => el.getAttribute("href")!));
        for (const href of hrefs)
          await expect(page.locator(href), href).toHaveCount(1);

        // The social band is pinned at the bottom, with the 5 links of the footer.
        const social = drawer.locator("[data-social]");
        await expect(social).toHaveCount(5);
        const last = await box(social.last());
        expect(Math.round(last.y + last.height)).toBeGreaterThan(800 - 70);
        for (let i = 0; i < 5; i++) {
          const b = await box(social.nth(i));
          expect([Math.round(b.width), Math.round(b.height)]).toEqual([44, 44]);
        }

        // Tab stays inside the open drawer: the page behind it is hidden and out of reach.
        // The focus guards move focus on the next frame, so wait a frame after each key.
        for (let i = 0; i < 40; i++) {
          await page.keyboard.press("Tab");
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(resolve)),
          );
        }
        const inside = await page.evaluate(
          () => document.activeElement?.closest("[data-drawer]") !== null,
        );
        expect(inside).toBe(true);
        // The page behind the drawer is hidden from assistive technology (Base UI sets
        // aria-hidden, not inert) and does not scroll.
        await expect(page.getByRole("main")).toHaveCount(0);
        // Base UI locks the scroll on <body> while the panel is open.
        await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

        await expectNoBlockingAxe(page);

        await page.keyboard.press("Escape");
        await expectClosed(drawer);
        expect(await activeLabel(page)).toBe(p.menu);
      });
    }

    test("drawer rows are 52px with a 1px rule; sub-items open with the caret and close again", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      await expectSettled(drawer);
      // The rows and rules sit inside the 20px panel inset, with no side padding of their
      // own (DR-295).
      const row = drawer
        .locator("nav > ul > li")
        .first()
        .locator("a")
        .locator("..");
      expect(Math.round((await box(row)).height)).toBe(53); // 52px + 1px rule
      expect(Math.round((await box(row)).x)).toBe(20);
      // 360 - 48 = 312 wide, less the 2 x 20 inset.
      expect(Math.round((await box(row)).width)).toBe(272);
      await expect(row).toHaveCSS("border-bottom-width", "1px");

      const caret = drawer.locator("nav button[aria-expanded]").first();
      await expect(caret).toHaveAttribute("aria-expanded", "false");
      const children = drawer.locator("nav ul ul").first();
      await expect(children).toHaveCount(0);
      await caret.click();
      await expect(caret).toHaveAttribute("aria-expanded", "true");
      await expect(children).toBeVisible();
      // The child group is as wide as the rules. Children are 44px rows on the page
      // surface, indented 16px.
      expect(Math.round((await box(children)).x)).toBe(20);
      expect(Math.round((await box(children)).width)).toBe(272);
      const child = children.locator("a").first();
      expect(Math.round((await box(child)).height)).toBe(44);
      await expect(child).toHaveCSS("padding-inline-start", "16px");
      await expect(child).toHaveCSS("font-weight", "500");
      await expect(children).toHaveCSS(
        "background-color",
        "rgb(255, 249, 237)",
      );

      // Closing and opening the drawer closes every accordion again.
      await page.keyboard.press("Escape");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      await expect(caret).toHaveAttribute("aria-expanded", "false");
      await expect(children).toHaveCount(0);
    });

    test("drawer opens with the Sheet slide, and with reduced motion it does not slide (DR-280)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("[data-drawer]");
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      await openWithKeyboard(menu, drawer);
      const slide = await drawer.evaluate((el) => ({
        time: getComputedStyle(el).transitionDuration,
        property: getComputedStyle(el).transitionProperty,
      }));
      // Transform and opacity, 200ms each.
      expect(slide.time).toBe("0.2s, 0.2s");
      expect(slide.property).toContain("transform");
      await page.keyboard.press("Escape");
      await expectClosed(drawer);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await openWithKeyboard(menu, drawer);
      await expect(drawer).toHaveCSS("transition-duration", "0s");
      // In place at once, with no wait for a slide.
      await expectSettled(drawer);
    });

    test("drawer closes with the close button and the backdrop", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("[data-drawer]");

      await openWithKeyboard(menu, drawer);
      await drawer.getByRole("button", { name: p.closeMenu }).click();
      await expectClosed(drawer);
      expect(await activeLabel(page)).toBe(p.menu);

      await openWithKeyboard(menu, drawer);
      // The backdrop is to the right of the drawer.
      await page.mouse.click(350, 400);
      await expectClosed(drawer);
      expect(await activeLabel(page)).toBe(p.menu);
    });

    test("a drawer link closes the drawer and moves focus to its target", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(menu, drawer);
      // The target is the P-2 বাংলাদেশ section (FL-08).
      await drawer.locator('nav a[href="#category-bangladesh"]').click();
      await expectClosed(drawer);
      const target = page.locator("#category-bangladesh");
      await expect(target).toBeFocused();
      // The target keeps no tabindex once focus has left it (DR-330).
      await page.keyboard.press("Tab");
      await expect(target).not.toHaveAttribute("tabindex");
      // The scroll lock is gone with the drawer.
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    });

    test("search dialog works with the keyboard from 768", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const search = page.getByRole("button", { name: p.search, exact: true });
      const dialog = page.locator("[data-search-dialog]");

      await openWithKeyboard(search, dialog);
      const field = dialog.locator('input[name="q"]');
      // Focus is on the panel itself; one Tab reaches the field (DR-249, DR-280).
      await expect(dialog).toBeFocused();
      await expect(dialog).toHaveAttribute("role", "dialog");
      await page.keyboard.press("Tab");
      await expect(field).toBeFocused();

      // Panel: full width at the top, 96px above the field, a 56px field (C-20).
      await expect.poll(async () => Math.round((await box(dialog)).y)).toBe(0);
      const panel = await box(dialog);
      expect([Math.round(panel.x), Math.round(panel.y)]).toEqual([0, 0]);
      expect(Math.round(panel.width)).toBe(1024);
      const fieldBox = await box(field.locator(".."));
      expect(Math.round(fieldBox.y)).toBe(96);
      expect(Math.round(fieldBox.height)).toBe(56);
      // The field is in the shell, and the close button's icon is on the page gutter.
      expect(Math.round(fieldBox.x)).toBe(24);
      const close = dialog.getByRole("button", { name: p.closeSearch });
      expect(Math.round((await box(close)).y)).toBe(12);
      expect(Math.round((await box(close.locator("svg"))).x + 20)).toBe(
        1024 - 24,
      );

      // It opens with the shadcn Drawer slide (DR-280).
      await expect(dialog).toHaveCSS("transition-duration", "0.45s");

      // Trending: up to 6 terms under the field, 24px below it (C-20).
      const terms = dialog.locator("[data-trending] button");
      await expect(terms).toHaveCount(6);
      const termsRow = await box(dialog.locator("[data-trending]"));
      expect(Math.round(termsRow.y - (fieldBox.y + fieldBox.height))).toBe(24);

      // Clear shows only while the field has text; it empties the field and keeps focus.
      const clear = dialog.getByRole("button", { name: p.clear, exact: true });
      await expect(clear).toBeHidden();
      await field.fill("Bay of Bengal");
      await expect(clear).toBeVisible();
      await clear.click();
      await expect(field).toHaveValue("");
      await expect(field).toBeFocused();

      // Mock search: a note in the page language, no results page (DR-01).
      await terms.first().click();
      await expect(field).not.toHaveValue("");
      await expect(dialog.getByRole("status")).not.toBeEmpty();
      await field.fill("Bay of Bengal");
      await page.keyboard.press("Enter");
      await expect(dialog.getByRole("status")).not.toBeEmpty();
      await expect(page).toHaveURL(
        new RegExp(`${p.path === "/" ? "/$" : "/en$"}`),
      );

      await expectNoBlockingAxe(page);

      await page.keyboard.press("Escape");
      await expectClosed(dialog);
      expect(await activeLabel(page)).toBe(p.search);

      // The close button also closes it, and so does a press on the backdrop.
      await openWithKeyboard(search, dialog);
      await dialog.getByRole("button", { name: p.closeSearch }).click();
      await expectClosed(dialog);
      expect(await activeLabel(page)).toBe(p.search);

      await openWithKeyboard(search, dialog);
      await page.mouse.click(500, 790);
      await expectClosed(dialog);
      expect(await activeLabel(page)).toBe(p.search);

      // With reduced motion there is no slide.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openWithKeyboard(search, dialog);
      await expect(dialog).toHaveCSS("transition-duration", "0s");
    });

    test("the Drawer search field is 44px with the icon inside and no attached button (phones)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      await expectSettled(drawer);
      const field = drawer.locator('input[name="q"]');
      const frame = await box(field.locator(".."));
      expect(Math.round(frame.height)).toBe(44);
      expect(Math.round(frame.x)).toBe(20);
      await expect(drawer.locator('button[type="submit"]')).toHaveCount(0);
      const icon = drawer.locator('[role="search"] svg');
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(Math.round((await box(icon)).width)).toBe(20);
      // The border and the icon fade to interactive on focus (DR-225).
      await expect(icon).toHaveCSS("color", "rgb(110, 104, 98)");
      await field.focus();
      await expect(icon).toHaveCSS("color", "rgb(153, 51, 20)");
      await expect(field.locator("..")).toHaveCSS(
        "border-bottom-color",
        "rgb(153, 51, 20)",
      );
      // Enter runs the search.
      await field.fill("Bay of Bengal");
      await page.keyboard.press("Enter");
      await expect(drawer.getByRole("status")).not.toBeEmpty();
    });

    test("the theme starts light and does not follow the system (DR-201)", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(p.path);
      const html = page.locator("html");
      await expect(html).not.toHaveClass(/dark/);
      // Only the .dark class sets the theme (DR-281).
      await expect(html).not.toHaveAttribute("data-theme");
    });

    test("ThemeToggle (from 768) is a switch: aria-checked is dark, the thumb slides, the choice is kept", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const toggle = page.locator("[data-top-bar] [data-theme-toggle]");
      await expect(toggle).toHaveAttribute("role", "switch");
      await expect(toggle).toHaveAttribute("aria-label", p.themeName);
      await expect(toggle).toHaveAttribute("aria-checked", "false");
      const thumb = toggle.locator("span");
      const before = await box(thumb);
      // Thumb 26 x 26, 3px inset in the 56 x 32 track.
      const track = await box(toggle);
      expect([Math.round(before.width), Math.round(before.height)]).toEqual([
        26, 26,
      ]);
      expect(Math.round(before.x - track.x)).toBe(3);

      await expect(async () => {
        await toggle.focus();
        await toggle.press("Space");
        await expect(toggle).toHaveAttribute("aria-checked", "true", {
          timeout: 500,
        });
      }).toPass();
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
      await expect
        .poll(async () => Math.round((await box(thumb)).x - track.x))
        .toBe(27);
      // The track is interactive in dark, fill-neutral in light (DR-295).
      await expect(toggle).toHaveCSS("background-color", "rgb(252, 119, 79)");
      // No hover color: the track does not change under the pointer.
      await toggle.hover();
      await expect(toggle).toHaveCSS("background-color", "rgb(252, 119, 79)");
      expect(await page.evaluate(() => localStorage.getItem("fl-theme"))).toBe(
        "dark",
      );

      await page.reload();
      await expect(html).toHaveClass(/dark/);
      await expect(toggle).toHaveAttribute("aria-checked", "true");

      await toggle.click();
      await expect(html).not.toHaveClass(/dark/);
      await expect(toggle).toHaveCSS("background-color", "rgb(126, 126, 126)");
    });

    test("a theme change in one tab applies in the other tab (storage event, DR-340)", async ({
      context,
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const other = await context.newPage();
      await other.setViewportSize({ width: 1024, height: 800 });
      await other.goto(p.path);
      await expect(other.locator("html")).not.toHaveClass(/dark/);
      const toggle = page.locator("[data-top-bar] [data-theme-toggle]");
      await expect(async () => {
        // Click only while the switch is off, so a retry never turns it back.
        if ((await toggle.getAttribute("aria-checked")) !== "true")
          await toggle.click();
        await expect(page.locator("html")).toHaveClass(/dark/, {
          timeout: 500,
        });
      }).toPass();
      await expect(other.locator("html")).toHaveClass(/dark/);
      await expect(
        other.locator("[data-top-bar] [data-theme-toggle]"),
      ).toHaveAttribute("aria-checked", "true");
    });

    test("with storage blocked the choice lasts for this page only (DR-340)", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new DOMException("blocked", "SecurityError");
          },
        });
      });
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const html = page.locator("html");
      const toggle = page.locator("[data-top-bar] [data-theme-toggle]");
      await expect(html).not.toHaveClass(/dark/);
      await expect(async () => {
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-checked", "true", {
          timeout: 500,
        });
      }).toPass();
      await expect(html).toHaveClass(/dark/);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await expect(html).not.toHaveClass(/dark/);
    });

    test("ThemeButton (phones) is a switch with the icon of the theme it switches to", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const button = page.locator("[data-top-bar] [data-theme-button]");
      await expect(button).toHaveAttribute("role", "switch");
      await expect(button).toHaveAttribute("aria-checked", "false");
      await expect(button.locator("svg")).toHaveClass(/lucide-moon/);
      await expect(async () => {
        await button.click();
        await expect(button).toHaveAttribute("aria-checked", "true", {
          timeout: 500,
        });
      }).toPass();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(button.locator("svg")).toHaveClass(/lucide-sun/);
      // Every top bar icon is 20px (DR-295). The icon shows no hover color.
      expect(Math.round((await box(button.locator("svg"))).width)).toBe(20);
      await expect(button).toHaveCSS("color", "rgb(252, 119, 79)");
      await button.hover();
      await expect(button).toHaveCSS("color", "rgb(252, 119, 79)");
      await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    });

    test("the header has interface text in the page language only (T-27)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      const text = await page.locator("[data-top-bar]").innerText();
      const other = await page
        .locator("[data-top-bar] a[hreflang]")
        .innerText();
      const rest = text.replace(other, "");
      if (p.lang === "bn") expect(rest).not.toMatch(/[A-Za-z]/);
      else expect(rest).not.toMatch(/[ঀ-৿]/);
    });

    test("header controls have no rounded corners and no shadow, except the switch (CPT-05, COL-15)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const styles = await page
        .locator("[data-top-bar] button, [data-top-bar] a")
        .evaluateAll((els) =>
          els.map((el) => {
            const s = getComputedStyle(el);
            return {
              toggle: el.hasAttribute("data-theme-toggle"),
              radius: s.borderRadius,
              shadow: s.boxShadow,
            };
          }),
        );
      for (const s of styles) {
        expect(s.shadow).toBe("none");
        expect(s.radius).toBe(s.toggle ? "4px" : "0px");
      }
    });

    for (const scheme of ["light", "dark"] as const) {
      test(`no serious axe violations in ${scheme}`, async ({ page }) => {
        await setTheme(page, scheme);
        await page.goto(p.path);
        if (scheme === "dark")
          await expect(page.locator("html")).toHaveClass(/dark/);
        else await expect(page.locator("html")).not.toHaveClass(/dark/);
        await expectNoBlockingAxe(page);
      });
    }
  });
}
