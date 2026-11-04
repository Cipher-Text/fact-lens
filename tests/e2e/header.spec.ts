import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// R2-05, R3-02, R4-01: top bar, nav row, Drawer (shadcn Sheet) and search dialog (shadcn
// Drawer) (spacing-layout-system.md Sections 6 and 9; component-system.md C-12, C-17 to
// C-20; DR-21, DR-41, DR-173, DR-188, DR-201, DR-249, DR-269, DR-280, DR-281, DR-295,
// DR-340, DR-345, DR-346, DR-349, LAY-15).

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
    regions: "অঞ্চলসমূহ",
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
    regions: "Regions",
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

/** The drawn logo size: its font size times the scale of its transform (C-17, DR-349). */
async function logoSize(logo: Locator) {
  return logo.evaluate((el) => {
    const style = getComputedStyle(el);
    const scale =
      style.transform === "none" ? 1 : new DOMMatrix(style.transform).a;
    return Math.round(parseFloat(style.fontSize) * scale * 10) / 10;
  });
}

/** The bottom rule of the top bar is drawn when its color is not transparent. */
async function barRuleShown(page: Page) {
  const color = await page
    .locator("[data-top-bar]")
    .evaluate((el) => getComputedStyle(el).borderBottomColor);
  return color !== "rgba(0, 0, 0, 0)";
}

/** Ink, interactive-hover and interactive-pressed per theme (color-system.md Section 2). */
const COLORS = {
  light: {
    ink: "rgb(31, 26, 23)",
    hover: "rgb(127, 42, 17)",
    pressed: "rgb(106, 35, 14)",
  },
  dark: {
    ink: "rgb(245, 245, 245)",
    hover: "rgb(253, 162, 135)",
    pressed: "rgb(254, 196, 178)",
  },
} as const;

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** The ghost IconButton size: 32 under 768, 36 from 768 (--icon-button-size-ghost). */
const ghostSize = (width: number) => (width >= 768 ? 36 : 32);

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

        // The server HTML of the nav row wraps until the items that do not fit are hidden
        // after hydration (IMP-16). Wait for the one-line row: 44px + the 1px rule.
        if (width >= 1280)
          await expect
            .poll(async () => Math.round((await box(navRow)).height))
            .toBe(45);

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
        const buttonSize = ghostSize(width);
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

        // The theme icon ends on the gutter too (--top-bar-inset, DR-349).
        const endIcon = await box(bar.locator("[data-theme-button] svg"));
        expect(
          Math.abs(width - (endIcon.x + endIcon.width) - gutter),
        ).toBeLessThanOrEqual(0.5);
        expect(Math.abs(icon.x - gutter)).toBeLessThanOrEqual(0.5);

        // The logo is in the center at every width (1fr auto 1fr).
        const logoBox = await box(logo);
        expect(logoBox.x).toBeGreaterThan(menuBox.x + menuBox.width);
        const center = logoBox.x + logoBox.width / 2;
        expect(Math.abs(center - width / 2)).toBeLessThanOrEqual(2);

        // The theme control is one ThemeButton at every width; no switch track or thumb
        // in the page (DR-349).
        const button = bar.locator("[data-theme-button]");
        await expect(button).toHaveCount(1);
        await expect(button).toBeVisible();
        await expect(page.locator("[data-theme-toggle]")).toHaveCount(0);
        await expect(button.locator("span")).toHaveCount(0);
        const t = await box(button);
        expect([Math.round(t.width), Math.round(t.height)]).toEqual([
          buttonSize,
          buttonSize,
        ]);

        // The language link: "En" on Bangla phones, "English" from 768 (C-17). As tall as
        // the icon buttons, and on one center line with the theme button (DR-349).
        const languageLink = bar.locator("a[hreflang]");
        const language = (await languageLink.innerText()).trim();
        if (p.lang === "bn")
          expect(language).toBe(width >= 768 ? "English" : "En");
        else expect(language).toBe("বাংলা");
        const languageBox = await box(languageLink);
        expect(Math.round(languageBox.height)).toBe(buttonSize);
        expect(
          Math.abs(
            languageBox.y + languageBox.height / 2 - (t.y + t.height / 2),
          ),
        ).toBeLessThanOrEqual(0.5);

        // No subscribe button in the header (DR-188).
        expect(await page.locator('a[href="#newsletter"]').count()).toBe(0);

        // The nav row shows from 1280 only, at shell width, with a 1px rule (DR-41). The
        // nav is a full-width band in the page color; its shell holds the items and the
        // rule, so the page does not show beside it while it is pinned (DR-349).
        if (width >= 1280) {
          await expect(navRow).toBeVisible();
          const navBox = await box(navRow);
          expect(Math.round(navBox.width)).toBe(width);
          const shellBox = await box(navRow.locator("[data-nav-shell]"));
          expect(Math.round(shellBox.width)).toBe(Math.min(width - 48, 1280));
          expect(Math.round(shellBox.height)).toBe(45);
          expect(Math.round(navBox.y)).toBe(
            Math.round(barBox.y + barBox.height),
          );
          // The row is 44px (--nav-row-height) and the 1px rule is below it (DR-349).
          expect(Math.round(navBox.height)).toBe(45);
          const list = await box(navRow.locator("ul"));
          expect(Math.round(list.height)).toBe(44);
          const navRule = await navRow
            .locator("[data-nav-shell]")
            .evaluate((el) => getComputedStyle(el).borderBottomWidth);
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

    for (const width of [1280, 1440]) {
      test(`site header sticks; past the nav row the row hides under the bar until the page top at ${width} (LAY-15, DR-173, DR-349)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        const html = page.locator("html");
        const bar = page.locator("[data-top-bar]");
        const nav = page.locator("[data-nav-row]");
        const logo = bar.locator("[data-logo]");
        await expect
          .poll(async () => Math.round((await box(nav)).height))
          .toBe(45);

        // Page top: the row shows below the bar; the bar has no rule; logo 32px.
        await expect(html).not.toHaveAttribute("data-bar-stuck");
        expect(await nav.evaluate((el) => (el as HTMLElement).inert)).toBe(
          false,
        );
        expect(Math.round((await box(nav)).y)).toBe(64);
        expect(await barRuleShown(page)).toBe(false);
        await expect.poll(() => logoSize(logo)).toBe(32);

        // Past the row (45px): stuck. The row slides up under the bar, is hidden and inert,
        // the bar shows its rule and the logo is 24px. The bar keeps its height.
        await page.evaluate(() => window.scrollTo(0, 46));
        await expect(html).toHaveAttribute("data-bar-stuck", "");
        await expect
          .poll(async () => {
            const n = await box(nav);
            return Math.round(n.y + n.height);
          })
          .toBeLessThanOrEqual(64);
        await expect(nav).toHaveCSS("visibility", "hidden");
        await expect(nav).toBeHidden();
        expect(await nav.evaluate((el) => (el as HTMLElement).inert)).toBe(
          true,
        );
        await expect.poll(() => barRuleShown(page)).toBe(true);
        await expect.poll(() => logoSize(logo)).toBe(24);
        expect(Math.round((await box(bar)).height)).toBe(64);
        expect(Math.round((await box(bar)).y)).toBe(0);
        // The row is out of the tab order: Tab from the theme button leaves the header.
        // A focus in the stuck bar does not scroll the page (scroll-margin-top, DR-357).
        await bar.getByRole("switch").focus();
        expect(await page.evaluate(() => window.scrollY)).toBe(46);
        await page.keyboard.press("Tab");
        expect(
          await page.evaluate(
            () => !!document.activeElement?.closest("[data-nav-row]"),
          ),
        ).toBe(false);

        // A small scroll up does not bring the row back.
        await page.evaluate(() => window.scrollTo(0, 10));
        await page.waitForTimeout(100);
        await expect(html).toHaveAttribute("data-bar-stuck", "");
        await expect(nav).toBeHidden();

        // At the page top it shows again.
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(html).not.toHaveAttribute("data-bar-stuck");
        await expect.poll(async () => Math.round((await box(nav)).y)).toBe(64);
        await expect(nav).toBeVisible();
        expect(await nav.evaluate((el) => (el as HTMLElement).inert)).toBe(
          false,
        );
        await expect.poll(() => barRuleShown(page)).toBe(false);
        await expect.poll(() => logoSize(logo)).toBe(32);

        // Far down the page the bar is still at the top.
        await page.evaluate(() => window.scrollTo(0, 2000));
        await expect.poll(async () => Math.round((await box(bar)).y)).toBe(0);
        const top = await box(page.locator('[data-ad-slot="ad-top"]'));
        expect(top.y + top.height).toBeLessThanOrEqual(0);
      });
    }

    for (const width of [360, 600, 768, 1024]) {
      test(`under 1280 the bar sticks alone: rule and logo scale once the page scrolls at ${width} (DR-295, DR-348)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        const html = page.locator("html");
        const bar = page.locator("[data-top-bar]");
        const logo = bar.locator("[data-logo]");
        expect(await barRuleShown(page)).toBe(false);
        await expect(html).not.toHaveAttribute("data-bar-stuck");
        await page.evaluate(() => window.scrollTo(0, 1));
        await expect(html).toHaveAttribute("data-bar-stuck", "");
        await expect.poll(() => barRuleShown(page)).toBe(true);
        // Stuck: 24px from 768; phones keep the 20px logo.
        await expect.poll(() => logoSize(logo)).toBe(width >= 768 ? 24 : 20);
        await page.evaluate(() => window.scrollTo(0, 600));
        await expect.poll(async () => Math.round((await box(bar)).y)).toBe(0);
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect.poll(() => barRuleShown(page)).toBe(false);
        await expect(html).not.toHaveAttribute("data-bar-stuck");
      });
    }

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

    test("nav row items are text-nav: 16px 600 on Bangla pages, 14px 600 on English pages; no # link is left (DR-346)", async ({
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
      // Every item goes to a page: the Analysis item replaced the parent Analysis and
      // Opinion # link (DR-331; tajmin, 4 Nov 2026).
      await expect(page.locator('[data-nav-row] a[href^="#"]')).toHaveCount(0);
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
        // The close button is an IconButton ghost; its 20px icon ends on the 20px panel
        // inset, like the logo starts on it (DR-209, DR-349).
        const close = drawer.getByRole("button", { name: p.closeMenu });
        const closeBox = await box(close);
        expect([
          Math.round(closeBox.width),
          Math.round(closeBox.height),
        ]).toEqual([ghostSize(width), ghostSize(width)]);
        const closeIcon = await box(close.locator("svg"));
        expect(
          Math.abs(drawerBox.x + drawerBox.width - 20 - (closeIcon.x + 20)),
        ).toBeLessThanOrEqual(0.5);
        expect(Math.abs(head.x - drawerBox.x - 20)).toBeLessThanOrEqual(0.5);

        // The Regions item reads অঞ্চলসমূহ / Regions (DR-345) and goes to /regions (DR-411).
        await expect(
          drawer.locator(
            `nav > ul > li a[href="${p.path === "/" ? "" : "/en"}/regions"]`,
          ),
        ).toHaveText(p.regions);

        // Every nav item is in the drawer: 9 rows, Regions with 8 regions (China among
        // them, DR-19, DR-411); Analysis has no sub-items and there is no Opinion item
        // (tajmin, 4 Nov 2026), no Op-ed (DR-302, DR-414). The accordion is closed (DR-181).
        await expect(drawer.locator("nav > ul > li")).toHaveCount(9);
        const carets = drawer.locator("nav button[aria-expanded]");
        await expect(carets).toHaveCount(1);
        for (const caret of await carets.all())
          await expect(caret).toHaveAttribute("aria-expanded", "false");
        await expect(drawer.locator("nav ul ul")).toHaveCount(0);
        for (const caret of await carets.all()) await caret.click();
        await expect(drawer.locator("nav ul ul a")).toHaveCount(8);
        await expect(drawer.locator('a[href*="op-ed"]')).toHaveCount(0);
        await expect(drawer.locator('a[href*="opinion"]')).toHaveCount(0);
        // Every item goes to a page: no # link is left (tajmin, 4 Nov 2026).
        await expect(drawer.locator('nav a[href^="#"]')).toHaveCount(0);

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
      // The caret button stays 44 x 44 (C-19, DR-349).
      const caretBox = await box(caret);
      expect([Math.round(caretBox.width), Math.round(caretBox.height)]).toEqual(
        [44, 44],
      );
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

    test("drawer opens with a 450ms ease-slide slide, and with reduced motion it does not slide (DR-280, DR-346)", async ({
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
        ease: getComputedStyle(el).transitionTimingFunction,
      }));
      // One slide from the start edge: transform, 450ms ease-slide (DR-346).
      expect(slide).toEqual({
        time: "0.45s",
        property: "transform",
        ease: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
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

    test("a drawer link closes the drawer and opens its page", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(menu, drawer);
      // Every nav item goes to a page; no # link is left (tajmin, 4 Nov 2026).
      const hub = p.path === "/" ? "/analysis" : "/en/analysis";
      await drawer.locator(`nav a[href="${hub}"]`).click();
      await expect(page).toHaveURL(hub);
      await expectClosed(drawer);
      // The scroll lock is gone with the drawer.
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    });

    // The category items go to the category pages; the open category is the current item,
    // and the Drawer marks it too (spacing-layout-system.md 7B, DR-181).
    test("category links go to the category pages, with aria-current on the open one", async ({
      page,
    }) => {
      const prefix = p.path === "/" ? "" : "/en";
      // Bangladesh is not a category (DR-412).
      const ids = [
        "geopolitics",
        "economy",
        "security",
        "technology",
        "history",
      ];
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      await waitForNavRow(page);
      const row = page.locator("[data-nav-row]");
      for (const id of ids) {
        await expect(
          row.locator(`a[href="${prefix}/category/${id}"]`),
        ).toHaveCount(1);
      }
      await expect(row.locator('a[href*="#category-"]')).toHaveCount(0);

      await page.goto(`${prefix}/category/economy`);
      await waitForNavRow(page);
      const current = row.locator('a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute(
        "href",
        `${prefix}/category/economy`,
      );

      await page.setViewportSize({ width: 360, height: 800 });
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(menu, drawer);
      const drawerCurrent = drawer.locator('a[aria-current="page"]');
      await expect(drawerCurrent).toHaveCount(1);
      await expect(drawerCurrent).toHaveAttribute(
        "href",
        `${prefix}/category/economy`,
      );
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
      // The close button comes after the field group in the source; position puts it in
      // the corner (C-20, DR-348).
      expect(
        await dialog.evaluate((panel, label) => {
          const input = panel.querySelector('input[name="q"]')!;
          const form = input.closest('[role="search"]')!;
          const buttons = [...panel.querySelectorAll("button")];
          const close = buttons.find(
            (b) => b.getAttribute("aria-label") === label,
          );
          return Boolean(
            close &&
            form.compareDocumentPosition(close) &
              Node.DOCUMENT_POSITION_FOLLOWING &&
            !form.contains(close),
          );
        }, p.closeSearch),
      ).toBe(true);

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
      // IconButton ghost, 36 x 36 (DR-349).
      expect(Math.round((await box(close)).width)).toBe(36);
      expect(Math.round((await box(close)).height)).toBe(36);
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

    for (const width of [360, 600]) {
      test(`the Drawer search field is 44px with the icon at the end and no attached button at ${width} (DR-349)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
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
        const iconBox = await box(icon);
        expect(Math.round(iconBox.width)).toBe(20);
        // The icon is at the field end: after the input in the source, 12px from the
        // inner end edge. The placeholder and the typed text start at the start edge: the
        // input starts at the inner start edge with its 12px padding (DR-349).
        const fieldBox = await box(field);
        expect(iconBox.x).toBeGreaterThan(fieldBox.x + fieldBox.width - 0.5);
        expect(
          Math.abs(
            frame.x + frame.width - 1 - 12 - (iconBox.x + iconBox.width),
          ),
        ).toBeLessThanOrEqual(0.5);
        expect(Math.abs(fieldBox.x - (frame.x + 1))).toBeLessThanOrEqual(0.5);
        await expect(field).toHaveCSS("padding-inline-start", "12px");
        const order = await drawer
          .locator('[role="search"]')
          .evaluate((form) => {
            const input = form.querySelector("input")!;
            const svg = form.querySelector("svg")!;
            return input.compareDocumentPosition(svg) &
              Node.DOCUMENT_POSITION_FOLLOWING
              ? "input first"
              : "icon first";
          });
        expect(order).toBe("input first");
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
    }

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

    test("ThemeButton (from 768) is a switch: aria-checked is dark, the choice is kept (DR-340, DR-349)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(p.path);
      const button = page.locator("[data-top-bar] [data-theme-button]");
      await expect(button).toHaveAttribute("role", "switch");
      await expect(button).toHaveAttribute("aria-label", p.themeName);
      await expect(button).toHaveAttribute("aria-checked", "false");
      await expect(button.locator("svg")).toHaveClass(/lucide-moon-star/);

      await expect(async () => {
        await button.focus();
        await button.press("Space");
        await expect(button).toHaveAttribute("aria-checked", "true", {
          timeout: 500,
        });
      }).toPass();
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
      await expect(button.locator("svg")).toHaveClass(/lucide-sun/);
      expect(await page.evaluate(() => localStorage.getItem("fl-theme"))).toBe(
        "dark",
      );

      await page.reload();
      await expect(html).toHaveClass(/dark/);
      await expect(button).toHaveAttribute("aria-checked", "true");
      await expect(button.locator("svg")).toHaveClass(/lucide-sun/);

      await button.click();
      await expect(html).not.toHaveClass(/dark/);
      await expect(button).toHaveAttribute("aria-checked", "false");
      expect(await page.evaluate(() => localStorage.getItem("fl-theme"))).toBe(
        "light",
      );
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
      // Wait until the second tab's ThemeButton responds: then it has hydrated and
      // subscribed, so its storage listener is in place (IMP-86). Turn it on and off again.
      const otherToggle = other.locator("[data-top-bar] [data-theme-button]");
      for (const state of ["true", "false"]) {
        await expect(async () => {
          if ((await otherToggle.getAttribute("aria-checked")) !== state)
            await otherToggle.click();
          await expect(otherToggle).toHaveAttribute("aria-checked", state, {
            timeout: 500,
          });
        }).toPass();
      }
      await expect(other.locator("html")).not.toHaveClass(/dark/);
      const toggle = page.locator("[data-top-bar] [data-theme-button]");
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
        other.locator("[data-top-bar] [data-theme-button]"),
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
      const toggle = page.locator("[data-top-bar] [data-theme-button]");
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

    test("ThemeButton (phones) is a switch with the icon of the theme it switches to (DR-349)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const button = page.locator("[data-top-bar] [data-theme-button]");
      await expect(button).toHaveAttribute("role", "switch");
      await expect(button).toHaveAttribute("aria-label", p.themeName);
      await expect(button).toHaveAttribute("aria-checked", "false");
      await expect(button.locator("svg")).toHaveClass(/lucide-moon-star/);
      await expect(async () => {
        await button.click();
        await expect(button).toHaveAttribute("aria-checked", "true", {
          timeout: 500,
        });
      }).toPass();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(button.locator("svg")).toHaveClass(/lucide-sun/);
      expect(Math.round((await box(button.locator("svg"))).width)).toBe(20);
    });

    for (const scheme of ["light", "dark"] as const) {
      test(`ghost buttons and the language link: size, ink, hover, pressed, no wash, focus ring in ${scheme} (C-12, C-17, DR-349)`, async ({
        page,
      }) => {
        await setTheme(page, scheme);
        const colors = COLORS[scheme];
        for (const width of [360, 600, 768, 1024, 1280, 1440]) {
          await page.setViewportSize({ width, height: 800 });
          await page.goto(p.path);
          const bar = page.locator("[data-top-bar]");
          const controls = [
            page.getByRole("button", { name: p.menu, exact: true }),
            ...(width >= 768
              ? [page.getByRole("button", { name: p.search, exact: true })]
              : []),
            bar.locator("[data-theme-button]"),
          ];
          for (const control of controls) {
            const b = await box(control);
            expect(
              [Math.round(b.width), Math.round(b.height)],
              `${width}`,
            ).toEqual([ghostSize(width), ghostSize(width)]);
            const icon = await box(control.locator("svg"));
            expect([Math.round(icon.width), Math.round(icon.height)]).toEqual([
              20, 20,
            ]);
          }
          const states = [...controls, bar.locator("a[hreflang]")];
          for (const control of states) {
            // At rest: ink, no fill.
            await page.mouse.move(0, 799);
            await expect(control).toHaveCSS("color", colors.ink);
            await expect(control).toHaveCSS("background-color", TRANSPARENT);
            // Hover: interactive-hover, no wash.
            await control.hover();
            await expect(control).toHaveCSS("color", colors.hover);
            await expect(control).toHaveCSS("background-color", TRANSPARENT);
            // Pressed: interactive-pressed, no wash. The pointer leaves before the
            // release, so the press does not click.
            await page.mouse.down();
            await expect(control).toHaveCSS("color", colors.pressed);
            await expect(control).toHaveCSS("background-color", TRANSPARENT);
            await page.mouse.move(0, 799);
            await page.mouse.up();
          }
        }
        // Tab shows the focus ring on every bar control (COL-13).
        await page.setViewportSize({ width: 1024, height: 800 });
        await page.goto(p.path);
        const seen = new Set<string>();
        for (let i = 0; i < 12 && seen.size < 4; i++) {
          await page.keyboard.press("Tab");
          const focused = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null;
            if (!el?.closest("[data-top-bar]") || el.matches("[data-logo]"))
              return null;
            const s = getComputedStyle(el);
            return {
              name: el.getAttribute("aria-label") ?? el.textContent ?? "",
              outline: s.outlineStyle,
              width: s.outlineWidth,
            };
          });
          if (!focused) continue;
          seen.add(focused.name);
          expect(focused.outline, focused.name).not.toBe("none");
          expect(focused.width, focused.name).toBe("2px");
        }
        expect(seen.size).toBe(4);
      });
    }

    test("one header landmark: the TopBar; the NavBar is a nav outside it (C-17, C-18, DR-349)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      await expect(page.locator("header")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveAttribute("data-top-bar");
      const nav = page.locator("[data-nav-row]");
      await expect(nav).toHaveJSProperty("tagName", "NAV");
      expect(await nav.evaluate((el) => el.closest("header") === null)).toBe(
        true,
      );
      // The nav is the next sibling of the header.
      expect(
        await page
          .locator("header")
          .evaluate((el) =>
            el.nextElementSibling?.hasAttribute("data-nav-row"),
          ),
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withRules([
          "landmark-banner-is-top-level",
          "landmark-no-duplicate-banner",
          "landmark-unique",
          "landmark-one-main",
          "landmark-no-duplicate-contentinfo",
          "landmark-main-is-top-level",
        ])
        .analyze();
      expect(
        results.violations,
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });

    test("the NavBar Regions item reads অঞ্চলসমূহ / Regions (DR-345)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(p.path);
      await expect(
        page.locator(
          `[data-nav-row] a[href="${p.path === "/" ? "" : "/en"}/regions"]`,
        ),
      ).toHaveText(p.regions);
    });

    // South Asia takes the place of Bangladesh; Regions and its regions go to their own URLs
    // (layout 7C, DR-411, DR-412); those pages are not built yet (IMP-18). Analysis is one
    // item to the analysis hub; Opinion is on hold, no item (tajmin, 4 Nov 2026).
    test("nav targets: South Asia, regions and the analysis hub (DR-414)", async ({
      page,
    }) => {
      const prefix = p.path === "/" ? "" : "/en";
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      // The second row, in the place of Bangladesh. The accordions are closed, so the
      // South Asia entry under Regions is not in the DOM yet.
      await expect(
        drawer.locator(`nav a[href="${prefix}/regions/south-asia"]`),
      ).toHaveCount(1);
      await expect(
        drawer
          .locator("nav > ul > li")
          .nth(1)
          .locator(`a[href="${prefix}/regions/south-asia"]`),
      ).toHaveCount(1);
      for (const caret of await drawer
        .locator("nav button[aria-expanded]")
        .all())
        await caret.click();
      const sub = await drawer
        .locator("nav ul ul a")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")!));
      expect(sub).toEqual([
        ...[
          "americas",
          "europe",
          "russia",
          "middle-east",
          "south-asia",
          "china",
          "asia",
          "oceania",
        ].map((id) => `${prefix}/regions/${id}`),
      ]);
      await expect(drawer.locator('a[href*="bangladesh"]')).toHaveCount(0);
      await expect(
        drawer.locator("nav > ul > li").last().locator("a"),
      ).toHaveAttribute("href", `${prefix}/analysis`);
      await expect(drawer.locator('a[href*="opinion"]')).toHaveCount(0);
      await expect(drawer.locator('nav a[href^="#"]')).toHaveCount(0);
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

    test("header controls have no rounded corners and no shadow, no exception (CPT-05, COL-15, DR-349)", async ({
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
              radius: s.borderRadius,
              shadow: s.boxShadow,
            };
          }),
        );
      for (const s of styles) {
        expect(s.shadow).toBe("none");
        expect(s.radius).toBe("0px");
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

// R5-01 checkpoint 3: focus in the stuck header (DR-357 C1, IMP-84), the NavBar band and
// its one-row item list (C-18 Surface, DR-357 C4, DR-359 IMP-90), the stuck logo (C-17,
// DR-355 B4) and the language link font (C-17, typography §7, DOC-44).
const SHELL_SELECTOR = "main .shell";

/** The focusables of the page in DOM order that a Tab can reach. */
async function firstFocusableAfterHeader(page: Page) {
  return page.evaluate(() => {
    const all = [
      ...document.querySelectorAll<HTMLElement>(
        "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ].filter((el) => !el.closest("[inert]") && el.getClientRects().length > 0);
    const header = all.filter((el) =>
      el.closest("[data-top-bar], [data-nav-row]"),
    );
    const last = header[header.length - 1];
    const next = all.find(
      (el) =>
        !el.closest("[data-top-bar], [data-nav-row]") &&
        last.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    )!;
    next.setAttribute("data-test-after-header", "");
    return true;
  });
}

for (const p of PAGES) {
  test.describe(`site header ${p.path} (R5-01)`, () => {
    for (const width of [360, 1280, 1440]) {
      test(`Shift+Tab into the stuck header does not scroll the page at ${width} (DR-357, IMP-84)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForNavRow(page);
        await page.evaluate(() => window.scrollTo(0, 600));
        await expect(page.locator("html")).toHaveAttribute(
          "data-bar-stuck",
          "",
        );
        // Setup only: put focus on the first control after the header without a scroll.
        await firstFocusableAfterHeader(page);
        await page
          .locator("[data-test-after-header]")
          .evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
        const before = await page.evaluate(() => window.scrollY);
        expect(before).toBe(600);
        // The real key press moves focus into the header.
        await page.keyboard.press("Shift+Tab");
        await page.waitForTimeout(100);
        const after = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const r = el.getBoundingClientRect();
          return {
            inHeader: !!el.closest("[data-top-bar], [data-nav-row]"),
            y: window.scrollY,
            top: r.top,
            bottom: r.bottom,
            visible: getComputedStyle(el).visibility === "visible",
          };
        });
        expect(after.inHeader).toBe(true);
        expect(after.y).toBe(before);
        expect(after.visible).toBe(true);
        expect(after.top).toBeGreaterThanOrEqual(0);
        expect(after.bottom).toBeLessThanOrEqual(900);
      });
    }

    for (const width of [1280, 1440]) {
      test(`NavBar band spans the viewport; list and rule on the shell edges at ${width} (C-18, DR-357)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForNavRow(page);
        const m = await page.evaluate((shellSelector) => {
          const nav = document.querySelector("[data-nav-row]")!;
          const shell = nav.querySelector("[data-nav-shell]")!;
          const list = nav.querySelector("ul")!;
          const items = [...list.children].filter(
            (li) => !(li as HTMLElement).hidden,
          );
          const edges = (el: Element) => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right };
          };
          return {
            viewport: document.documentElement.clientWidth,
            band: edges(nav),
            background: getComputedStyle(nav).backgroundColor,
            page: getComputedStyle(document.body).backgroundColor,
            rule: {
              ...edges(shell),
              width: getComputedStyle(shell).borderBottomWidth,
            },
            list: edges(list),
            first: edges(items[0]),
            last: edges(items[items.length - 1]),
            shell: edges(document.querySelector(shellSelector)!),
          };
        }, SHELL_SELECTOR);
        // The band is full width in the page color.
        expect(Math.abs(m.band.left)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(m.band.right - m.viewport)).toBeLessThanOrEqual(0.5);
        expect(m.background).toBe(m.page);
        // The 1px rule and the item list sit on the shell edges.
        expect(m.rule.width).toBe("1px");
        for (const part of [m.rule, m.list]) {
          expect(Math.abs(part.left - m.shell.left)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(part.right - m.shell.right)).toBeLessThanOrEqual(0.5);
        }
        // The items are centered in the shell (DR-170), so they stay inside its edges.
        expect(m.first.left).toBeGreaterThanOrEqual(m.shell.left - 0.5);
        expect(m.last.right).toBeLessThanOrEqual(m.shell.right + 0.5);
      });

      test(`NavBar is one row from the server HTML: no shift at hydration at ${width} (DR-359, IMP-90)`, async ({
        browser,
      }) => {
        const measure = async (javaScriptEnabled: boolean) => {
          const context = await browser.newContext({
            javaScriptEnabled,
            viewport: { width, height: 900 },
          });
          const page = await context.newPage();
          // The web fonts are blocked, so this measures the NavBar row only: the Bangla font
          // swap moves the centered items 3.7px sideways (CLS 0.00003), a separate finding
          // (IMP-91, tajmin's choice on 18 Oct 2026).
          await page.route(/\.woff2$/, (route) => route.abort());
          await page.addInitScript(() => {
            (window as unknown as { __cls: number }).__cls = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as unknown as {
                value: number;
                hadRecentInput: boolean;
              }[])
                if (!entry.hadRecentInput)
                  (window as unknown as { __cls: number }).__cls += entry.value;
            }).observe({ type: "layout-shift", buffered: true });
          });
          await page.goto(p.path);
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(500);
          const result = await page.evaluate(() => {
            const nav = document.querySelector("[data-nav-row]")!;
            const list = nav.querySelector("ul")!.getBoundingClientRect();
            const items = [...nav.querySelectorAll("li")].map((li) => {
              const r = li.getBoundingClientRect();
              return {
                hidden: (li as HTMLElement).hidden,
                inRow:
                  r.height > 0 && r.top >= list.top && r.bottom <= list.bottom,
                below: r.top >= list.bottom,
              };
            });
            return {
              nav: nav.getBoundingClientRect().height,
              main: document.querySelector("main")!.getBoundingClientRect().top,
              items,
              cls: (window as unknown as { __cls?: number }).__cls ?? 0,
            };
          });
          return { page, context, result };
        };
        const off = await measure(false);
        await off.context.close();
        const on = await measure(true);
        expect(off.result.nav).toBe(45);
        expect(on.result.nav).toBe(off.result.nav);
        expect(on.result.main).toBe(off.result.main);
        expect(on.result.cls).toBe(0);
        // Without JavaScript the items that wrap are cut off whole, below the row.
        for (const item of off.result.items)
          expect(item.inRow !== item.below).toBe(true);
        // After hydration an item is in the row or hidden: never seen cut, never tabbed to.
        for (const item of on.result.items)
          expect(item.inRow !== item.hidden).toBe(true);
        const page = on.page;
        const hiddenLinks = page.locator("[data-nav-row] li[hidden] a");
        for (const link of await hiddenLinks.all())
          await expect(link).toBeHidden();
        const reached = new Set<string>();
        await page.locator("[data-nav-row] li:not([hidden]) a").first().focus();
        for (let i = 0; i < 12; i++) {
          const href = await page.evaluate(
            () =>
              document.activeElement?.closest("[data-nav-row]") &&
              document.activeElement.getAttribute("href"),
          );
          if (!href) break;
          reached.add(href);
          await page.keyboard.press("Tab");
        }
        const shown = await page
          .locator("[data-nav-row] li:not([hidden]) a")
          .evaluateAll((els) => els.map((el) => el.getAttribute("href")!));
        expect([...reached].sort()).toEqual([...shown].sort());
        await on.context.close();
      });
    }

    for (const width of [360, 1280]) {
      test(`stuck logo keeps its font size and scales by transform; language link is text-xs 600 at ${width} (C-17, DR-355, DOC-44)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForNavRow(page);
        const logo = page.locator("[data-top-bar] [data-logo]");
        const fontSize = () =>
          logo.evaluate((el) => getComputedStyle(el).fontSize);
        const top = await fontSize();
        await page.evaluate(() => window.scrollTo(0, 600));
        await expect(page.locator("html")).toHaveAttribute(
          "data-bar-stuck",
          "",
        );
        await expect.poll(() => logoSize(logo)).toBe(width >= 768 ? 24 : 20);
        expect(await fontSize()).toBe(top);

        const link = page.locator("[data-top-bar] a[hreflang]");
        const font = await link.evaluate((el) => {
          const probe = document.createElement("span");
          probe.className = "font-ui text-xs";
          probe.lang = el.getAttribute("lang")!;
          el.parentElement!.append(probe);
          const read = (node: Element) => {
            const s = getComputedStyle(node);
            return {
              size: s.fontSize,
              family: s.fontFamily,
              line: s.lineHeight,
            };
          };
          const value = {
            link: read(el),
            role: read(probe),
            weight: getComputedStyle(el).fontWeight,
          };
          probe.remove();
          return value;
        });
        expect(font.link).toEqual(font.role);
        expect(font.weight).toBe("600");
      });
    }
  });
}
