import { expect, test, type Page } from "@playwright/test";

// R2-04: the small parts on the real homepage, measured in the browser
// (component-system.md C-08 to C-13, C-22; CPT-05, CPT-06, CPT-10, CPT-13, CPT-15,
// COL-06, COL-13). The states are measured through the computed style.

const PAGES = [
  { path: "/", more: /^আরও দেখুন/ },
  { path: "/en", more: /^See more/ },
] as const;

// The colour of a token, resolved by the browser the way a part would use it.
async function token(page: Page, name: string, property = "color") {
  return page.evaluate(
    ([n, p]) => {
      const probe = document.createElement("span");
      probe.style.setProperty(p, `var(${n})`);
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return value;
    },
    [name, property],
  );
}

for (const { path, more } of PAGES) {
  test.describe(`small parts ${path}`, () => {
    test("SectionHeading: bar and rule share the bottom edge; bar size by width (C-13, C-22)", async ({
      page,
    }) => {
      for (const [width, barW, barH] of [
        [360, 48, 6],
        [1023, 48, 6],
        [1280, 64, 8],
      ] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const divider = page.locator("[data-divider]").first();
        const bar = divider.locator("[data-divider-bar]");
        const barBox = (await bar.boundingBox())!;
        const dividerBox = (await divider.boundingBox())!;
        expect(Math.round(barBox.width), `bar width at ${width}`).toBe(barW);
        expect(Math.round(barBox.height), `bar height at ${width}`).toBe(barH);
        // The rule is the last pixel row of the divider: the bar ends on it.
        expect(Math.round(barBox.y + barBox.height)).toBe(
          Math.round(dividerBox.y + dividerBox.height),
        );
        expect(
          await bar.evaluate((el) => getComputedStyle(el).borderRadius),
        ).toBe("0px");
      }
    });

    test("SectionHeading: the heading is not a link and the bar changes color in dark (CPT-13, C-22)", async ({
      page,
    }) => {
      await page.goto(path);
      const headings = page.locator(
        "[data-divider] + div h2, [data-divider] + div h3",
      );
      expect(await headings.count()).toBeGreaterThan(0);
      expect(await headings.locator("a").count()).toBe(0);
      const bar = page.locator("[data-divider-bar]").first();
      const light = await bar.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      const dark = await bar.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      expect(dark).not.toBe(light);
    });

    test("MoreLink: end edge, 44px tall, 600 weight, no underline, hover and pressed colors (C-10)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const link = page.getByRole("link", { name: more }).first();
      await link.scrollIntoViewIfNeeded();
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      const style = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          weight: s.fontWeight,
          decoration: s.textDecorationLine,
          color: s.color,
          align: getComputedStyle(el.parentElement!).textAlign,
        };
      });
      expect(style.align).toBe("end");
      expect(style.weight).toBe("600");
      expect(style.decoration).toBe("none");
      expect(style.color).toBe(await token(page, "--interactive"));
      // The chevron is 16px and decorative.
      const icon = link.locator("svg");
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(Math.round((await icon.boundingBox())!.width)).toBe(16);
      // The link sits at the end edge of its block.
      const parent = (await link.locator("..").boundingBox())!;
      expect(
        Math.round(parent.x + parent.width - (box.x + box.width)),
      ).toBeLessThanOrEqual(1);

      await link.hover();
      await expect
        .poll(() => link.evaluate((el) => getComputedStyle(el).color))
        .toBe(await token(page, "--interactive-hover"));
      expect(
        await link.evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toBe("none");
      await page.mouse.down();
      await expect
        .poll(() => link.evaluate((el) => getComputedStyle(el).color))
        .toBe(await token(page, "--interactive-pressed"));
      await page.mouse.up();
    });

    test("MoreLink and Eyebrow show the base focus outline (COL-13)", async ({
      page,
    }) => {
      await page.goto(path);
      for (const link of [
        page.getByRole("link", { name: more }).first(),
        page.locator("p.type-eyebrow a").first(),
      ]) {
        await link.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        const outline = await link.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            width: s.outlineWidth,
            offset: s.outlineOffset,
            style: s.outlineStyle,
          };
        });
        expect(outline).toEqual({
          width: "2px",
          offset: "2px",
          style: "solid",
        });
      }
    });

    test("Eyebrow: interactive link, no underline, hover color (C-08)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const link = page.locator("p.type-eyebrow a").first();
      await expect(link).toBeVisible();
      expect(await link.evaluate((el) => getComputedStyle(el).color)).toBe(
        await token(page, "--interactive"),
      );
      expect(
        await link.evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toBe("none");
      await link.hover();
      await expect
        .poll(() => link.evaluate((el) => getComputedStyle(el).color))
        .toBe(await token(page, "--interactive-hover"));
    });

    test("MetaLine: a 4px square separator, 10px each side, no radius, aria-hidden (C-09, CPT-10)", async ({
      page,
    }) => {
      await page.goto(path);
      const separators = page.locator("[data-meta-separator]");
      expect(await separators.count()).toBeGreaterThan(0);
      const first = separators.first();
      await expect(first).toHaveAttribute("aria-hidden", "true");
      const style = await first.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          w: s.width,
          h: s.height,
          radius: s.borderRadius,
          ml: s.marginLeft,
          mr: s.marginRight,
          bg: s.backgroundColor,
          text: getComputedStyle(el.parentElement!).color,
        };
      });
      expect(style).toMatchObject({
        w: "4px",
        h: "4px",
        radius: "0px",
        ml: "10px",
        mr: "10px",
      });
      expect(style.bg).toBe(style.text);
      expect(style.bg).toBe(await token(page, "--color-meta"));
    });

    test("Chip label: square, bar color fill (C-11)", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const chip = page.locator('[data-chip="label"]').first();
      await expect(chip).toBeVisible();
      const style = await chip.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          radius: s.borderRadius,
          bg: s.backgroundColor,
          color: s.color,
          py: s.paddingTop,
          px: s.paddingLeft,
        };
      });
      expect(style).toMatchObject({ radius: "0px", py: "2px", px: "8px" });
      expect(style.bg).toBe(
        await token(page, "--color-bar", "background-color"),
      );
      expect(style.color).toBe(await token(page, "--on-interactive"));
    });

    test("Chip filter: 44px, outlined, selected fill, no hover color (C-11, DR-222)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(path);
      const tabs = page.locator('[data-chip="filter"]');
      expect(await tabs.count()).toBeGreaterThan(1);
      const selected = tabs.first();
      const other = tabs.nth(1);
      for (const tab of [selected, other]) {
        const box = (await tab.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      const read = (tab: typeof selected) =>
        tab.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            radius: s.borderRadius,
            bg: s.backgroundColor,
            color: s.color,
            border: s.borderTopWidth,
            px: s.paddingLeft,
          };
        });
      const sel = await read(selected);
      expect(sel).toMatchObject({ radius: "0px", border: "1px", px: "16px" });
      expect(sel.bg).toBe(
        await token(page, "--interactive", "background-color"),
      );
      expect(sel.color).toBe(await token(page, "--on-interactive"));
      const before = await read(other);
      expect(before.color).toBe(await token(page, "--ink"));
      await other.hover();
      expect(await read(other)).toEqual(before);
    });

    test("IconButton filled: 44px square, disabled at the start, keeps focus (C-12)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const previous = page.locator("[data-region-previous]");
      const next = page.locator("[data-region-next]");
      await expect(next).toBeVisible();
      for (const button of [previous, next]) {
        const box = (await button.boundingBox())!;
        expect([Math.round(box.width), Math.round(box.height)]).toEqual([
          44, 44,
        ]);
        expect(
          await button.evaluate((el) => getComputedStyle(el).borderRadius),
        ).toBe("0px");
        expect(
          await button.evaluate((el) => getComputedStyle(el).boxShadow),
        ).toBe("none");
        expect(
          Math.round((await button.locator("svg").boundingBox())!.width),
        ).toBe(20);
      }
      await expect(previous).toHaveAttribute("aria-disabled", "true");
      expect(
        await previous.evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(await token(page, "--surface-alt", "background-color"));
      expect(await previous.evaluate((el) => getComputedStyle(el).color)).toBe(
        await token(page, "--ink-disabled"),
      );
      await previous.focus();
      await expect(previous).toBeFocused();

      expect(
        await next.evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(await token(page, "--interactive", "background-color"));
      await next.hover();
      await expect
        .poll(() => next.evaluate((el) => getComputedStyle(el).backgroundColor))
        .toBe(await token(page, "--interactive-hover", "background-color"));
      await page.mouse.down();
      await expect
        .poll(() => next.evaluate((el) => getComputedStyle(el).backgroundColor))
        .toBe(await token(page, "--interactive-pressed", "background-color"));
      await page.mouse.up();
    });
  });
}
