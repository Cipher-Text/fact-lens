import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-12: the minimum footer (spacing-layout-system.md 7.1 row 15, 7.4, 13; DR-59;
// LAY-02, LAY-03, LAY-14, LAY-16, LAY-17, COL-04, COL-05, COL-13, T-27).

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
      "ব্যবহারের শর্তাবলি",
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

        const gutter = width < 600 ? 16 : 24;
        const shell = Math.min(width - 2 * gutter, 1280);
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;

        // A full-width row (7.1 row 15) after main, the last element of the page.
        const f = footer(page);
        const rowBox = await box(f);
        expect(Math.round(rowBox.x)).toBe(0);
        expect(Math.round(rowBox.width)).toBe(width);
        await expect(
          page.locator("main").locator("xpath=following-sibling::*[1]"),
        ).toHaveAttribute("data-footer");

        // The content is in the shell, centered, with space-module above and below.
        const inner = f.locator(".shell");
        const innerBox = await box(inner);
        expect(Math.round(innerBox.width)).toBe(shell);
        expect(Math.round(innerBox.x)).toBe(Math.round((width - shell) / 2));
        const padding = await inner.evaluate((el) => [
          getComputedStyle(el).paddingTop,
          getComputedStyle(el).paddingBottom,
        ]);
        expect(padding).toEqual([`${space}px`, `${space}px`]);

        // Every part stays inside the shell (LAY-02), and every target is 44px or
        // more (U-05).
        const parts = f.locator("a");
        await expect(parts).toHaveCount(10);
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

      const nav = f.getByRole("navigation");
      await expect(nav.getByRole("link")).toHaveText([...p.pages]);
      expect(
        await nav
          .getByRole("link")
          .evaluateAll((as) => as.map((a) => a.getAttribute("href"))),
      ).toEqual(PATHS.map((path) => `${p.prefix}/${path}`));

      // Each social link has a text name for screen readers; the icon is hidden.
      const social = f.locator("[data-social]");
      await expect(social).toHaveCount(4);
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

    test("colors: brand logo, interactive links and icons (COL-04, COL-05)", async ({
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
          interactive: probe("--interactive"),
          logo: color("[data-logo]"),
          links: [...color("nav a"), ...color("[data-social]")],
        };
      });
      expect(colors.logo).toEqual([colors.brand]);
      expect(new Set(colors.links)).toEqual(new Set([colors.interactive]));
    });

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
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
      for (let i = 0; i < 12 && seen.length < 10; i++) {
        await page.keyboard.press("Shift+Tab");
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest("[data-footer]")) return null;
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
        });
        if (info) {
          expect(info.ring, info.name).not.toBe("none"); // COL-13
          seen.push(info.name);
        }
      }
      expect(seen.reverse()).toEqual([
        p.prefix || "/",
        "https://www.facebook.com/",
        "https://www.youtube.com/",
        "https://x.com/",
        "https://www.instagram.com/",
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
      expect(
        await f.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
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
  await expect(footer(page).locator("a")).toHaveCount(10);
});
