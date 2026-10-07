import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-06: P-1 Hero with the Latest rail (spacing-layout-system.md 7.2 to 7.4, 13;
// DR-39, DR-44, LAY-05, LAY-12, LAY-13).

const PAGES = [
  { path: "/", lang: "bn", latest: "সর্বশেষ", more: "আরও দেখুন: সর্বশেষ" },
  { path: "/en", lang: "en", latest: "Latest", more: "See more: Latest" },
] as const;

const WIDTHS = [
  320, 360, 600, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

// spacing-layout-system.md 3.2: the wrapper is shell − 304 − 24 from 1024.
const WRAPPER: Record<number, number> = {
  1024: 648,
  1180: 804,
  1280: 904,
  1366: 952,
  1440: 952,
  1920: 952,
};

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
  test.describe(`hero ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);

        const hero = page.locator('[data-section="hero"]');
        const wrapper = hero.locator("[data-hero-wrapper]");
        const rail = hero.locator("[data-hero-rail]");
        const lead = hero.locator("[data-lead]");
        const image = lead.locator("img");
        const panel = lead.locator("[data-lead-panel]");
        const cards = hero.locator("[data-top-stories] article");
        const items = rail.locator("li");

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        // Shell: min(100% − 2 × gutter, 1280).
        const gutter = width < 600 ? 16 : 24;
        const heroBox = await box(hero);
        expect(Math.round(heroBox.width)).toBe(
          Math.min(width - 2 * gutter, 1280),
        );

        const wrapperBox = await box(wrapper);
        const railBox = await box(rail);
        if (width >= 1024) {
          // Rail beside the wrapper, 304 wide (LAY-05).
          expect(Math.round(railBox.width)).toBe(304);
          expect(Math.round(wrapperBox.width)).toBe(WRAPPER[width]);
          expect(railBox.x).toBeGreaterThan(wrapperBox.x + wrapperBox.width);
          expect(Math.round(railBox.y)).toBe(Math.round(wrapperBox.y));
        } else {
          // Rail under the wrapper at full width.
          expect(Math.round(railBox.width)).toBe(Math.round(heroBox.width));
          expect(railBox.y).toBeGreaterThan(wrapperBox.y + wrapperBox.height);
        }

        // Latest: 2 columns at 600–1023, 1 column otherwise.
        const first = await box(items.nth(0));
        const second = await box(items.nth(1));
        if (width >= 600 && width < 1024) {
          expect(Math.round(second.y)).toBe(Math.round(first.y));
          expect(second.x).toBeGreaterThan(first.x);
        } else {
          expect(second.y).toBeGreaterThan(first.y);
          expect(Math.round(second.x)).toBe(Math.round(first.x));
        }
        await expect(items).toHaveCount(6);

        // Lead panel: overlaps the image by 64 from 768, under it below (7.4).
        const imageBox = await box(image);
        const panelBox = await box(panel);
        expect(Math.round(imageBox.width)).toBe(Math.round(wrapperBox.width));
        const overlap = imageBox.y + imageBox.height - panelBox.y;
        if (width >= 768) {
          expect(Math.round(overlap)).toBe(64);
          // Inset from the end: the cut corner of the image shows.
          expect(panelBox.width).toBeLessThan(imageBox.width);
        } else {
          // Under the image: no overlap; the panel padding gives the image-to-text space.
          expect(Math.round(overlap)).toBe(0);
        }

        // Two top-story cards: side by side from 600, stacked on phones (DR-44, LAY-07).
        await expect(cards).toHaveCount(2);
        const a = await box(cards.nth(0));
        const b = await box(cards.nth(1));
        if (width >= 600) {
          expect(Math.round(b.y)).toBe(Math.round(a.y));
          expect(Math.round(a.width)).toBe(Math.round(b.width));
        } else {
          expect(b.y).toBeGreaterThanOrEqual(a.y + a.height);
        }
        // The metadata row lines up across the pair (subgrid, LAY-08).
        if (width >= 600) {
          const metaA = await box(cards.nth(0).locator("time"));
          const metaB = await box(cards.nth(1).locator("time"));
          expect(Math.round(metaA.y)).toBe(Math.round(metaB.y));
        }

        // No text is clipped: no element in the hero hides overflowing content
        // (glyphs may overflow a line box; that is not clipping). LAY-17, TYP-09.
        const clipped = await hero.evaluate((el) =>
          [...el.querySelectorAll(":not(.sr-only)")]
            .filter((n) => {
              const style = getComputedStyle(n);
              const hides =
                style.overflowX !== "visible" ||
                style.overflowY !== "visible" ||
                style.textOverflow === "ellipsis" ||
                style.webkitLineClamp !== "none";
              return (
                hides &&
                n.textContent?.trim() &&
                (n.scrollWidth > n.clientWidth + 1 ||
                  n.scrollHeight > n.clientHeight + 1)
              );
            })
            .map((n) => n.textContent),
        );
        expect(clipped).toEqual([]);

        // An ad row follows the hero; the space before it belongs to the section (LAY-12).
        const ad = page.locator('main > [data-ad-slot="ad-band"]').first();
        const adBox = await box(ad);
        expect(Math.round(adBox.y)).toBe(
          Math.round(heroBox.y + heroBox.height),
        );
        const heroPadding = await hero.evaluate(
          (el) => getComputedStyle(el).paddingBottom,
        );
        expect(heroPadding).toBe(
          width >= 1024 ? "40px" : width >= 768 ? "32px" : "24px",
        );
      });
    }

    test("sparse content (7.3)", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${p.path}?content=sparse`);
      const hero = page.locator('[data-section="hero"]');
      const wrapper = hero.locator("[data-hero-wrapper]");
      const cards = hero.locator("[data-top-stories] article");

      // One top story spans the wrapper.
      await expect(cards).toHaveCount(1);
      expect(Math.round((await box(cards)).width)).toBe(
        Math.round((await box(wrapper)).width),
      );
      // Latest shows the items that exist.
      await expect(hero.locator("[data-hero-rail] li")).toHaveCount(2);
      // A lead with no image has no overlap.
      await expect(hero.locator("[data-lead] img")).toHaveCount(0);
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(scroll).toBeLessThanOrEqual(1280);
    });

    test("language, headings and links", async ({ page }) => {
      await page.goto(p.path);
      const hero = page.locator('[data-section="hero"]');
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(
        hero.getByRole("heading", { level: 3, name: p.latest }),
      ).toBeVisible();
      await expect(hero.getByRole("link", { name: p.more })).toBeVisible();
      const text = (await hero.innerText()).replace(/\s+/g, " ");
      if (p.lang === "bn") {
        // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
        expect(text).not.toMatch(/[A-Za-z0-9]/);
      } else {
        expect(text).not.toMatch(/[ঀ-৿]/);
      }
    });

    test("keyboard: every hero link is reachable and shows the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const links = page.locator('[data-section="hero"] a');
      const count = await links.count();
      // Lead, two top stories, six Latest items, the more link.
      expect(count).toBe(10);

      // Tab from the last control before the hero.
      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 60 && seen.length < count; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest('[data-section="hero"]')) return null;
          return {
            href: el.getAttribute("href") ?? "",
            ring: getComputedStyle(el).boxShadow,
          };
        });
        if (info) {
          expect(info.ring).not.toBe("none"); // COL-13
          seen.push(info.href);
        }
      }
      expect(seen).toHaveLength(count);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(p.path);
        await expectNoBlockingAxe(page);
      });
    }
  });
}

test("the ad-band follows the hero directly (7.1)", async ({ page }) => {
  // Every content variant has a hero; hiding the hero with its ad row (LAY-13) is
  // covered by the page code and is tested when a variant without a hero exists.
  await page.goto("/");
  const firstInMain = page.locator("main > *").nth(1);
  await expect(firstInMain).toHaveAttribute("data-section", "hero");
  await expect(page.locator("main > *").nth(2)).toHaveAttribute(
    "data-ad-slot",
    "ad-band",
  );
});
