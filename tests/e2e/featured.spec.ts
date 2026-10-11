import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// FL-08: P-2 Featured category for বাংলাদেশ and ভূরাজনীতি (spacing-layout-system.md
// 7.1 to 7.3, 13; DR-49, DR-55, DR-68, LAY-03, LAY-05, LAY-12, LAY-13).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    titles: { bangladesh: "বাংলাদেশ", geopolitics: "ভূরাজনীতি ও কূটনীতি" },
  },
  {
    path: "/en",
    lang: "en",
    titles: {
      bangladesh: "Bangladesh",
      geopolitics: "Geopolitics and Diplomacy",
    },
  },
] as const;

const CATEGORIES = ["bangladesh", "geopolitics"] as const;

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440, 1920,
];

// spacing-layout-system.md 3.2: the wrapper is shell − 304 − 24 from 1024.
const WRAPPER: Record<number, number> = {
  1024: 648,
  1180: 804,
  1279: 903,
  1280: 904,
  1366: 952,
  1440: 952,
  1920: 952,
};

const section = (page: Page, category: string) =>
  page.locator(`[data-section="featured"][data-category="${category}"]`);

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
  test.describe(`featured categories ${p.path}`, () => {
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

        for (const category of CATEGORIES) {
          const s = section(page, category);
          const wrapper = s.locator("[data-featured-wrapper]");
          const rail = s.locator("[data-featured-rail]");
          const lead = s.locator("[data-featured-lead]");
          const image = lead.locator("img");
          const text = lead.locator("[data-featured-text]");
          const items = rail.locator("li");

          // Shell width (LAY-03).
          const sectionBox = await box(s);
          expect(Math.round(sectionBox.width)).toBe(shell);

          // Wrapper + 304px rail from 1024; rail under the wrapper below (LAY-05).
          const w = await box(wrapper);
          const r = await box(rail);
          if (width >= 1024) {
            expect(Math.round(r.width)).toBe(304);
            expect(Math.round(w.width)).toBe(WRAPPER[width]);
            expect(Math.round(r.y)).toBe(Math.round(w.y));
            expect(r.x).toBeGreaterThan(w.x + w.width);
          } else {
            expect(Math.round(w.width)).toBe(shell);
            expect(Math.round(r.width)).toBe(shell);
            expect(r.y).toBeGreaterThan(w.y + w.height);
          }

          // Text under the image to 1279, beside it from 1280 (DR-55).
          const i = await box(image);
          const t = await box(text);
          if (width >= 1280) {
            expect(t.x).toBeGreaterThan(i.x + i.width);
            expect(Math.round(t.y)).toBe(Math.round(i.y));
          } else {
            expect(t.y).toBeGreaterThanOrEqual(i.y + i.height);
            expect(Math.round(t.x)).toBe(Math.round(i.x));
          }

          // Rail: one image story, then two stories. Two columns at 600–1023.
          await expect(items).toHaveCount(3);
          await expect(items.nth(0).locator("img")).toHaveCount(1);
          const first = await box(items.nth(0));
          const second = await box(items.nth(1));
          const third = await box(items.nth(2));
          if (width >= 600 && width < 1024) {
            expect(second.x).toBeGreaterThan(first.x + first.width);
            expect(Math.round(second.y)).toBe(Math.round(first.y));
            expect(third.y).toBeGreaterThan(second.y + second.height);
          } else {
            expect(second.y).toBeGreaterThan(first.y + first.height);
            expect(third.y).toBeGreaterThan(second.y + second.height);
          }

          // No text is clipped and no word runs out of its box (LAY-17, TYP-09).
          const overflowing = await s.evaluate((el) =>
            [...el.querySelectorAll(":is(h2, h3, p, a, time):not(.sr-only)")]
              .filter(
                (n) =>
                  n.scrollWidth > n.clientWidth + 1 ||
                  getComputedStyle(n).textOverflow === "ellipsis" ||
                  getComputedStyle(n).webkitLineClamp !== "none",
              )
              .map((n) => n.textContent),
          );
          expect(overflowing).toEqual([]);

          // An ad row comes before and after the section. The space-module between
          // them is the section's padding, not the ad row's (LAY-12).
          await expect(
            s.locator("xpath=preceding-sibling::*[1]"),
          ).toHaveAttribute("data-ad-slot", "ad-band");
          const next = s.locator("xpath=following-sibling::*[1]");
          await expect(next).toHaveAttribute("data-ad-slot", "ad-band");
          expect(Math.round((await box(next)).y)).toBe(
            Math.round(sectionBox.y + sectionBox.height),
          );
          const padding = await s.evaluate((el) => {
            const style = getComputedStyle(el);
            return [style.paddingTop, style.paddingBottom];
          });
          expect(padding).toEqual([`${space}px`, `${space}px`]);
        }
      });
    }

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        await page.goto(p.path);
        await expectNoBlockingAxe(page);
      });
    }

    for (const width of [1024, 1280]) {
      test(`sparse content at ${width}: no rail, the wrapper spans the shell (7.3)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${p.path}?content=sparse`);
        const s = section(page, "bangladesh");
        await expect(s.locator("[data-featured-rail]")).toHaveCount(0);
        expect(
          Math.round((await box(s.locator("[data-featured-wrapper]"))).width),
        ).toBe(Math.round((await box(s)).width));
        // A section with no content is not shown, nor is its ad row (LAY-13).
        await expect(section(page, "geopolitics")).toHaveCount(0);
        const adjacentAds = await page.evaluate(
          () =>
            [...document.querySelectorAll("main > [data-ad-slot]")].filter(
              (el) => el.nextElementSibling?.hasAttribute("data-ad-slot"),
            ).length,
        );
        expect(adjacentAds).toBe(0);
      });
    }

    test("headings, anchors and language", async ({ page }) => {
      await page.goto(p.path);
      for (const category of CATEGORIES) {
        const s = section(page, category);
        await expect(s).toHaveAttribute("id", `category-${category}`);
        await expect(
          s.getByRole("heading", { level: 2, name: p.titles[category] }),
        ).toBeVisible();
        const text = (await s.innerText()).replace(/\s+/g, " ");
        if (p.lang === "bn") {
          // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
          expect(text).not.toMatch(/[A-Za-z0-9]/);
        } else {
          expect(text).not.toMatch(/[ঀ-৿]/);
        }
      }
    });

    test("keyboard: every link is reachable and shows the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const selector = '[data-section="featured"]';
      const links = page.locator(`${selector} a`);
      const count = await links.count();
      // Per section: the lead and three rail stories.
      expect(count).toBe(8);

      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 120 && seen.length < count; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          return {
            href: el.getAttribute("href") ?? "",
            // The base outline (COL-13), or the old ring on controls that are not rebuilt yet.
            ring: (() => {
              const s = getComputedStyle(el);
              return s.outlineStyle === "solid" && s.outlineWidth === "2px"
                ? "outline"
                : s.boxShadow;
            })(),
          };
        }, selector);
        if (info) {
          expect(info.ring).not.toBe("none"); // COL-13
          seen.push(info.href);
        }
      }
      expect(seen).toHaveLength(count);
    });
  });
}

test("page order: P-4, ad, বাংলাদেশ, ad, ভূরাজনীতি, ad (7.1)", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(3)).toHaveAttribute("data-section", "analysis-opinion");
  await expect(main.nth(4)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(5)).toHaveAttribute("data-category", "bangladesh");
  await expect(main.nth(6)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(7)).toHaveAttribute("data-category", "geopolitics");
  await expect(main.nth(8)).toHaveAttribute("data-ad-slot", "ad-band");
});

test("the nav link scrolls to its category section (IMP-14)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .locator('nav a[href="#category-geopolitics"]:visible')
    .first()
    .click();
  await expect(page).toHaveURL(/#category-geopolitics$/);
  await expect(
    section(page, "geopolitics").getByRole("heading", { level: 2 }),
  ).toBeInViewport();
});
