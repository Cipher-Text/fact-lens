import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { setTheme } from "./theme";

// R2-05: top bar, nav row, Drawer and search dialog
// (spacing-layout-system.md Sections 6 and 9; component-system.md C-12, C-17 to C-20;
// DR-21, DR-41, DR-173, DR-188, DR-201, DR-249, LAY-15).

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
        const bar = page.locator("[data-top-bar]");
        const navRow = page.locator("[data-nav-row]");
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        const search = page.getByRole("button", {
          name: p.search,
          exact: true,
        });
        const logo = bar.locator("[data-logo]:not(dialog *)");

        // The top ad is the first row, above the bar.
        const topBox = await box(top);
        const barBox = await box(bar);
        expect(Math.round(topBox.y)).toBe(0);
        expect(Math.round(barBox.y)).toBe(Math.round(topBox.height));

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
          const rules = await page.evaluate(() => ({
            bar: getComputedStyle(document.querySelector("[data-top-bar]")!)
              .borderBottomWidth,
            nav: getComputedStyle(document.querySelector("[data-nav-row]")!)
              .borderBottomWidth,
          }));
          // No rule between the bar and the nav row; the nav row keeps its own.
          expect(rules).toEqual({ bar: "0px", nav: "1px" });
        } else {
          await expect(navRow).toBeHidden();
          const barRule = await bar.evaluate(
            (el) => getComputedStyle(el).borderBottomWidth,
          );
          expect(barRule).toBe("1px");
        }

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
      const top = await box(page.locator('[data-ad-slot="ad-band-top"]'));
      expect(top.y + top.height).toBeLessThanOrEqual(0);
      const nav = await box(page.locator("[data-nav-row]"));
      expect(nav.y + nav.height).toBeLessThan(64);
      const navPosition = await page
        .locator("[data-nav-row]")
        .evaluate((el) => getComputedStyle(el).position);
      expect(navPosition).toBe("static");
      // The nav row is gone, so the bar shows its own 1px rule again.
      await expect(bar).toHaveCSS("border-bottom-width", "1px");
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(bar).toHaveCSS("border-bottom-width", "0px");
    });

    for (const width of [360, 1280]) {
      test(`drawer works with the keyboard at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        const menu = page.getByRole("button", { name: p.menu, exact: true });
        const drawer = page.locator("dialog[data-drawer]");

        await openWithKeyboard(menu, drawer);
        // Focus moves to the panel itself, not to an item (DR-249).
        await expect(drawer.locator("[data-drawer-panel]")).toBeFocused();

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
        // them, DR-19) and Analysis and Opinion with 3 sub-items. All closed (DR-181).
        await expect(drawer.locator("nav > ul > li")).toHaveCount(9);
        await expect(drawer.locator("nav ul ul")).toHaveCount(2);
        await expect(drawer.locator("nav ul ul[hidden]")).toHaveCount(2);
        await expect(drawer.locator("nav ul ul a")).toHaveCount(10);

        // The social band is pinned at the bottom, with the 5 links of the footer.
        const social = drawer.locator("[data-social]");
        await expect(social).toHaveCount(5);
        const last = await box(social.last());
        expect(Math.round(last.y + last.height)).toBeGreaterThan(800 - 70);
        for (let i = 0; i < 5; i++) {
          const b = await box(social.nth(i));
          expect([Math.round(b.width), Math.round(b.height)]).toEqual([44, 44]);
        }

        // Tab stays inside the open drawer: the page behind it is inert.
        for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
        const inside = await page.evaluate(
          () => document.activeElement?.closest("dialog[data-drawer]") !== null,
        );
        expect(inside).toBe(true);

        await expectNoBlockingAxe(page);

        await page.keyboard.press("Escape");
        await expect(drawer).toHaveJSProperty("open", false);
        expect(await activeLabel(page)).toBe(p.menu);
      });
    }

    test("drawer rows are 52px with a 1px rule; sub-items open with the caret and close again", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("dialog[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      const row = drawer.locator("nav > ul > li").first().locator("> div");
      expect(Math.round((await box(row)).height)).toBe(53); // 52px + 1px rule
      await expect(row).toHaveCSS("border-bottom-width", "1px");

      const caret = drawer.locator("nav button[aria-expanded]").first();
      await expect(caret).toHaveAttribute("aria-expanded", "false");
      const children = drawer.locator("nav ul ul").first();
      await expect(children).toBeHidden();
      await caret.click();
      await expect(caret).toHaveAttribute("aria-expanded", "true");
      await expect(children).toBeVisible();
      // Children are 44px rows on the page surface, indented 16px past the panel inset.
      const child = children.locator("a").first();
      expect(Math.round((await box(child)).height)).toBe(44);
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
      await expect(children).toBeHidden();
    });

    test("drawer slides in over 450ms, and with reduced motion it does not slide", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("dialog[data-drawer]");
      const duration = await drawer.evaluate((el) => ({
        time: getComputedStyle(el).transitionDuration,
        property: getComputedStyle(el).transitionProperty,
      }));
      expect(duration.time).toBe("0.45s");
      expect(duration.property).toContain("transform");

      await page.emulateMedia({ reducedMotion: "reduce" });
      const reduced = await drawer.evaluate(
        (el) => getComputedStyle(el).transitionDuration,
      );
      expect(reduced).toBe("0s");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      // In place at once, with no wait for a slide.
      expect(Math.round((await box(drawer)).x)).toBe(0);
    });

    test("drawer closes with the close button and the backdrop", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const menu = page.getByRole("button", { name: p.menu, exact: true });
      const drawer = page.locator("dialog[data-drawer]");

      await openWithKeyboard(menu, drawer);
      await drawer.getByRole("button", { name: p.closeMenu }).click();
      await expect(drawer).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.menu);

      await openWithKeyboard(menu, drawer);
      // The backdrop is to the right of the drawer.
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
      // The target is the P-2 বাংলাদেশ section (FL-08).
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

      // Panel: full width at the top, 96px above the field, a 56px field (C-20).
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

      // The dialog has no animation (DR-227).
      await expect(dialog).toHaveCSS("transition-duration", "0s");

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
      await expect(dialog).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.search);

      // The close button also closes it, and so does a press on the backdrop.
      await openWithKeyboard(search, dialog);
      await dialog.getByRole("button", { name: p.closeSearch }).click();
      await expect(dialog).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.search);

      await openWithKeyboard(search, dialog);
      await page.mouse.click(500, 790);
      await expect(dialog).toHaveJSProperty("open", false);
      expect(await activeLabel(page)).toBe(p.search);
    });

    test("the Drawer search field is 48px with a 46px attached button (phones)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const drawer = page.locator("dialog[data-drawer]");
      await openWithKeyboard(
        page.getByRole("button", { name: p.menu, exact: true }),
        drawer,
      );
      const field = drawer.locator('input[name="q"]');
      const frame = await box(field.locator(".."));
      expect(Math.round(frame.height)).toBe(48);
      const submit = await box(drawer.locator('button[type="submit"]'));
      expect(Math.round(submit.height)).toBe(46);
      expect(Math.round(submit.width)).toBe(46);
    });

    test("the theme starts light and does not follow the system (DR-201)", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(p.path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
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
      await expect(html).toHaveAttribute("data-theme", "dark");
      await expect
        .poll(async () => Math.round((await box(thumb)).x - track.x))
        .toBe(27);
      // The track is ink in dark, interactive in light.
      await expect(toggle).toHaveCSS("background-color", "rgb(245, 245, 245)");
      // No hover color: the track does not change under the pointer.
      await toggle.hover();
      await expect(toggle).toHaveCSS("background-color", "rgb(245, 245, 245)");

      await page.reload();
      await expect(html).toHaveAttribute("data-theme", "dark");
      await expect(toggle).toHaveAttribute("aria-checked", "true");

      await toggle.click();
      await expect(html).toHaveAttribute("data-theme", "light");
      await expect(toggle).toHaveCSS("background-color", "rgb(153, 51, 20)");
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
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(button.locator("svg")).toHaveClass(/lucide-sun/);
      // The icon is ink in dark and shows no hover color.
      await expect(button).toHaveCSS("color", "rgb(245, 245, 245)");
      await button.hover();
      await expect(button).toHaveCSS("color", "rgb(245, 245, 245)");
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
        expect(s.radius).toBe(s.toggle ? "6px" : "0px");
      }
    });

    for (const scheme of ["light", "dark"] as const) {
      test(`no serious axe violations in ${scheme}`, async ({ page }) => {
        await setTheme(page, scheme);
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
