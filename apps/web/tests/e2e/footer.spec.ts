import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// R2-14: the Footer (component-system.md C-21; spacing-layout-system.md 7.1 row 15, 13;
// DR-59, DR-224; LAY-02, LAY-14, LAY-17, LAY-20, COL-04, COL-05, COL-06, COL-13, T-27).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    prefix: "",
    pages: [
      "আমাদের সম্পর্কে",
      "যোগাযোগ",
      "সংশোধনী",
      "গোপনীয়তা নীতি",
      "শর্তাবলি",
    ],
    networks: ["ফেসবুক", "ইউটিউব", "এক্স", "ইনস্টাগ্রাম"],
    other: /[A-Za-z]/,
  },
  {
    path: "/en",
    lang: "en",
    prefix: "/en",
    pages: ["About", "Contact", "Corrections", "Privacy", "Terms"],
    networks: ["Facebook", "YouTube", "X", "Instagram"],
    other: /[ঀ-৿]/,
  },
] as const;

const PATHS = ["about", "contact", "corrections", "privacy", "terms"];

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440, 1920,
];

const footer = (page: Page) => page.locator("[data-footer]");

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
  test.describe(`footer ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        // A full-width row (7.1 row 15) after main, the last element of the page.
        const f = footer(page);
        const rowBox = await box(f);
        expect(Math.round(rowBox.x)).toBe(0);
        expect(Math.round(rowBox.width)).toBe(width);
        await expect(
          page.locator("main").locator("xpath=following-sibling::*[1]"),
        ).toHaveAttribute("data-footer");

        // Panel band (DR-264): block inset only, 40px under 600px and 48px from 600px,
        // and no inline inset; the content sits in the shell.
        const block = width < 600 ? 40 : 48;
        const gutter = width < 600 ? 16 : 24;
        const padding = await f.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.paddingTop, s.paddingBottom, s.paddingLeft, s.paddingRight];
        });
        expect(padding).toEqual([`${block}px`, `${block}px`, "0px", "0px"]);

        // The band is surface-elevated, not surface-alt (C-21 checks).
        const colors = await f.evaluate((el) => {
          const probe = (v: string) => {
            const n = document.createElement("span");
            n.style.backgroundColor = `var(${v})`;
            el.append(n);
            const c = getComputedStyle(n).backgroundColor;
            n.remove();
            return c;
          };
          return {
            band: getComputedStyle(el).backgroundColor,
            elevated: probe("--surface-elevated"),
          };
        });
        expect(colors.band).toBe(colors.elevated);

        // The content is centered and inside the shell width (LAY-02, LAY-03).
        const contentWidth = Math.min(width - 2 * gutter, 1280);
        const left = (width - contentWidth) / 2;
        const innerBox = { x: left, width: contentWidth };
        const stack = await box(f.locator("> .shell > div"));
        expect(Math.round(stack.width)).toBe(contentWidth);
        expect(Math.round(stack.x)).toBe(Math.round(left));
        for (const centered of await f.locator("[data-logo], ul, p").all()) {
          const b = await box(centered);
          expect(Math.abs(b.x + b.width / 2 - width / 2)).toBeLessThanOrEqual(
            1,
          );
        }

        // Every part stays inside the content (LAY-02), and every target is 44px
        // or more (U-05).
        const parts = f.locator("a");
        await expect(parts).toHaveCount(11);
        for (const b of await Promise.all(
          (await parts.all()).map((a) => box(a)),
        )) {
          expect(b.x).toBeGreaterThanOrEqual(innerBox.x - 0.5);
          expect(b.x + b.width).toBeLessThanOrEqual(
            innerBox.x + innerBox.width + 0.5,
          );
        }
        for (const a of await f.locator("[data-social], nav a").all()) {
          expect((await box(a)).height).toBeGreaterThanOrEqual(44);
        }

        // No text is clipped (LAY-17, TYP-09).
        const overflowing = await f.evaluate((el) =>
          [...el.querySelectorAll("a")]
            .filter(
              (n) =>
                n.scrollWidth > n.clientWidth + 1 ||
                getComputedStyle(n).textOverflow === "ellipsis",
            )
            .map((n) => n.textContent),
        );
        expect(overflowing).toEqual([]);
      });
    }

    test("links and names in the page language (7.4, T-27)", async ({
      page,
    }) => {
      await page.goto(p.path);
      const f = page.getByRole("contentinfo");
      await expect(f).toHaveAttribute("data-footer");

      const logo = f.locator("[data-logo]");
      await expect(logo).toHaveAttribute("href", p.prefix || "/");
      // Footer.logo: type-logo-sm, 24px in both languages (C-21, DR-306).
      await expect(logo).toHaveClass(/\btype-logo-sm\b/);
      await expect(logo).toHaveCSS("font-size", "24px");

      const nav = f.getByRole("navigation");
      await expect(nav.getByRole("link")).toHaveText([...p.pages]);
      expect(
        await nav
          .getByRole("link")
          .evaluateAll((as) => as.map((a) => a.getAttribute("href"))),
      ).toEqual(PATHS.map((path) => `${p.prefix}/${path}`));

      // Each social link has a text name for screen readers; the icon is hidden.
      const social = f.locator("[data-social]");
      await expect(social).toHaveCount(5);
      for (const [i, name] of p.networks.entries()) {
        await expect(social.nth(i)).toHaveAccessibleName(name);
        await expect(social.nth(i).locator("svg")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      }

      // No interface text from the other language.
      const text = await f.evaluate((el) =>
        [
          el.textContent ?? "",
          ...[...el.querySelectorAll("[aria-label]")].map(
            (n) => n.getAttribute("aria-label") ?? "",
          ),
        ].join(" "),
      );
      expect(text).not.toMatch(p.other);
    });

    test("colors: brand logo, ink icons, ink-secondary links (COL-04, COL-05)", async ({
      page,
    }) => {
      await page.goto(p.path);
      const colors = await footer(page).evaluate((el) => {
        const probe = (v: string) => {
          const s = document.createElement("span");
          s.style.color = `var(${v})`;
          el.append(s);
          const c = getComputedStyle(s).color;
          s.remove();
          return c;
        };
        const color = (sel: string) =>
          [...el.querySelectorAll(sel)].map((n) => getComputedStyle(n).color);
        return {
          brand: probe("--brand"),
          ink: probe("--ink"),
          secondary: probe("--ink-secondary"),
          muted: probe("--ink-muted"),
          logo: color("[data-logo]"),
          icons: color("[data-social]"),
          links: color("nav a"),
          copyright: color("p"),
        };
      });
      expect(colors.logo).toEqual([colors.brand]);
      expect(new Set(colors.icons)).toEqual(new Set([colors.ink]));
      expect(new Set(colors.links)).toEqual(new Set([colors.secondary]));
      expect(colors.copyright).toEqual([colors.muted]);
    });

    test("hover and press states of links and icons, no underline (C-21, DR-220)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const f = footer(page);
      const read = (loc: Locator) =>
        loc.evaluate((el) => {
          const s = getComputedStyle(el);
          return { color: s.color, line: s.textDecorationLine };
        });
      const probe = (name: string) =>
        f.evaluate((el, v) => {
          const s = document.createElement("span");
          s.style.color = `var(${v})`;
          el.append(s);
          const c = getComputedStyle(s).color;
          s.remove();
          return c;
        }, name);
      // mouse.down and mouse.up make a click; stop the link from leaving the page, or the
      // next target is read from the page that opens (R4-05, W4-11).
      await page.evaluate(() =>
        document.addEventListener("click", (e) => e.preventDefault(), true),
      );
      const hover = await probe("--interactive-hover");
      const pressed = await probe("--interactive-pressed");
      for (const target of [
        f.locator("nav a").first(),
        f.locator("[data-social]").first(),
      ]) {
        await target.hover();
        expect((await read(target)).color).toBe(hover);
        expect((await read(target)).line).toBe("none");
        await page.mouse.down();
        expect((await read(target)).color).toBe(pressed);
        await page.mouse.up();
      }
    });

    test("copyright line in the page language and digits", async ({ page }) => {
      await page.goto(p.path);
      const line = footer(page).locator("p");
      await expect(line).toHaveText(
        p.lang === "bn"
          ? /^© [০-৯]{4} ফ্যাক্ট লেন্স।/
          : /^© 20\d\d Fact Lens\./,
      );
      // The year is the current year in Dhaka time (C-21), in the page digits.
      const year = new Intl.DateTimeFormat(
        p.lang === "bn" ? "bn-BD-u-nu-beng" : "en-GB",
        { year: "numeric", timeZone: "Asia/Dhaka" },
      ).format(new Date());
      await expect(line).toContainText(`© ${year} `);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        await page.goto(p.path);
        await expect(footer(page)).toBeVisible();
        await expectNoBlockingAxe(page);
      });
    }

    test("keyboard: every link is reachable in source order with the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const seen: string[] = [];
      await page.locator("body").focus();
      // The footer is last, so Shift+Tab from the start of the page reaches it first.
      for (let i = 0; i < 13 && seen.length < 11; i++) {
        await page.keyboard.press("Shift+Tab");
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest("[data-footer]")) return null;
          return {
            name: el.getAttribute("href") ?? el.tagName,
            // The base outline (COL-13).
            ring: (() => {
              const s = getComputedStyle(el);
              return s.outlineStyle === "solid" && s.outlineWidth === "2px"
                ? "outline"
                : "none";
            })(),
          };
        });
        if (info) {
          expect(info.ring, info.name).toBe("outline"); // COL-13
          seen.push(info.name);
        }
      }
      expect(seen.reverse()).toEqual([
        p.prefix || "/",
        "https://www.facebook.com/",
        "https://www.youtube.com/",
        "https://x.com/",
        "https://www.instagram.com/",
        "https://www.linkedin.com/",
        ...PATHS.map((path) => `${p.prefix}/${path}`),
      ]);
    });

    test("200% text size: the footer wraps and nothing leaves it", async ({
      page,
    }) => {
      // Page zoom at 200% of a 640px window is the 320 layout above (Section 13).
      // This checks text-only zoom: the root font size doubles at 320.
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(p.path);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const f = footer(page);
      const fBox = await box(f);
      expect(await f.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      );
      for (const a of await f.locator("a").all()) {
        const b = await box(a);
        expect(b.x).toBeGreaterThanOrEqual(-0.5);
        expect(b.x + b.width).toBeLessThanOrEqual(fBox.width + 0.5);
      }
    });
  });
}

test("sparse content: the footer stays (7.3)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/?content=sparse");
  await expect(footer(page)).toBeVisible();
  await expect(footer(page).locator("a")).toHaveCount(11);
});
