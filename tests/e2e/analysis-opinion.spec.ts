import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// FL-07: P-4 বিশ্লেষণ ও মতামত (spacing-layout-system.md 7.2 to 7.4, 13;
// DR-52, DR-76, DR-77, LAY-03, LAY-12, LAY-13, LAY-18).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    title: "বিশ্লেষণ ও মতামত",
    chip: "মতামত",
    moreAnalysis: "আরও দেখুন: বিশ্লেষণ",
    moreOpinion: "আরও দেখুন: মতামত",
  },
  {
    path: "/en",
    lang: "en",
    title: "Analysis and Opinion",
    chip: "Opinion",
    moreAnalysis: "See more: Analysis",
    moreOpinion: "See more: Opinion",
  },
] as const;

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

const SECTION = '[data-section="analysis-opinion"]';

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no box");
  return b;
}

/** The computed value of a color token, resolved the way the browser paints it. */
async function tokenColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
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
  test.describe(`analysis and opinion ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);

        const section = page.locator(SECTION);
        const analysis = section.locator('[data-column="analysis"]');
        const opinion = section.locator('[data-column="opinion"]');

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        // Shell width, not a full-width row (LAY-03, DR-76).
        const gutter = width < 600 ? 16 : 24;
        const sectionBox = await box(section);
        expect(Math.round(sectionBox.width)).toBe(
          Math.min(width - 2 * gutter, 1280),
        );

        // Two equal columns from 768, analysis left; stacked below (7.2).
        const a = await box(analysis);
        const o = await box(opinion);
        if (width >= 768) {
          expect(Math.round(o.y)).toBe(Math.round(a.y)); // aligned to the top
          expect(o.x).toBeGreaterThan(a.x + a.width);
          expect(Math.abs(a.width - o.width)).toBeLessThanOrEqual(1);
        } else {
          expect(o.y).toBeGreaterThan(a.y + a.height);
          expect(Math.round(o.x)).toBe(Math.round(a.x));
          expect(Math.round(o.width)).toBe(Math.round(a.width));
        }

        // Each "more" link sits below the last item of its column, at the end edge (CPT-14, CPT-15).
        for (const column of [analysis, opinion]) {
          const last = await box(column.locator("li").last());
          const more = await box(column.locator("ul + p a"));
          expect(more.y).toBeGreaterThan(last.y + last.height);
          const columnBox = await box(column);
          expect(
            Math.abs(more.x + more.width - (columnBox.x + columnBox.width)),
          ).toBeLessThanOrEqual(1);
        }

        // No text is clipped (LAY-17, TYP-09).
        const clipped = await section.evaluate((el) =>
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

        // No word runs out of its text box, even in the narrow column beside the
        // analysis image at 320 (LAY-02, TYP-09).
        const overflowing = await section.evaluate((el) =>
          [...el.querySelectorAll(":is(h2, h3, h4, p):not(.sr-only)")]
            .filter((n) => n.scrollWidth > n.clientWidth + 1)
            .map((n) => n.textContent),
        );
        expect(overflowing).toEqual([]);

        // An ad row follows the section; the space before it is the section's margin,
        // outside the background (LAY-12).
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;
        const next = section.locator("xpath=following-sibling::*[1]");
        await expect(next).toHaveAttribute("data-ad-slot", "ad-band");
        const adBox = await box(next);
        expect(Math.round(adBox.y - (sectionBox.y + sectionBox.height))).toBe(
          space,
        );
        const before = section.locator("xpath=preceding-sibling::*[1]");
        await expect(before).toHaveAttribute("data-ad-slot", "ad-band");
        const beforeBox = await box(before);
        expect(
          Math.round(sectionBox.y - (beforeBox.y + beforeBox.height)),
        ).toBe(space);
      });
    }

    for (const theme of ["light", "dark"] as const) {
      test(`surface-elevated background in ${theme} theme (DR-76)`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        await page.goto(p.path);
        const section = page.locator(SECTION);
        const background = await section.evaluate(
          (el) => getComputedStyle(el).backgroundColor,
        );
        expect(background).toBe(await tokenColor(page, "--surface-elevated"));
        // Different from the page and from the ad rows (surface-alt).
        expect(background).not.toBe(await tokenColor(page, "--background"));
        expect(background).not.toBe(await tokenColor(page, "--surface-alt"));
      });

      test(`axe in ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
        await page.goto(p.path);
        await expectNoBlockingAxe(page);
      });
    }

    test("sparse content: one column spans the shell (7.3)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${p.path}?content=sparse`);
      const section = page.locator(SECTION);
      const columns = section.locator("[data-columns]");
      await expect(section.locator('[data-column="opinion"]')).toHaveCount(0);
      const analysis = section.locator('[data-column="analysis"]');
      expect(Math.round((await box(analysis)).width)).toBe(
        Math.round((await box(columns)).width),
      );
      await expect(section.locator("[data-chip]")).toHaveCount(0);
    });

    test("language, headings, chip and links", async ({ page }) => {
      await page.goto(p.path);
      const section = page.locator(SECTION);
      await expect(
        section.getByRole("heading", { level: 2, name: p.title }),
      ).toBeVisible();
      // Only the opinion column has the chip, and it is not a link (DR-77).
      const chip = section.locator("[data-chip]");
      await expect(chip).toHaveCount(1);
      await expect(chip).toHaveText(p.chip);
      await expect(
        section.locator('[data-column="opinion"] [data-chip]'),
      ).toHaveCount(1);
      await expect(section.locator("a [data-chip]")).toHaveCount(0);
      await expect(
        section.getByRole("link", { name: p.moreAnalysis }),
      ).toBeVisible();
      await expect(
        section.getByRole("link", { name: p.moreOpinion }),
      ).toBeVisible();

      const text = (await section.innerText()).replace(/\s+/g, " ");
      if (p.lang === "bn") {
        // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
        expect(text).not.toMatch(/[A-Za-z0-9]/);
      } else {
        expect(text).not.toMatch(/[ঀ-৿]/);
      }
    });

    test("keyboard: every link is reachable and shows the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const links = page.locator(`${SECTION} a`);
      const count = await links.count();
      // Four analysis and four opinion stories, the four analysis category links (Eyebrow,
      // C-08), and two more links.
      expect(count).toBe(14);

      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 80 && seen.length < count; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((selector) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(selector)) return null;
          return {
            href: el.getAttribute("href") ?? "",
            outline: `${getComputedStyle(el).outlineStyle} ${getComputedStyle(el).outlineWidth}`,
          };
        }, SECTION);
        if (info) {
          expect(info.outline).toBe("solid 2px"); // COL-13, base rule
          seen.push(info.href);
        }
      }
      expect(seen).toHaveLength(count);
    });
  });
}

test("page order: hero, ad, analysis and opinion, ad (7.1)", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(1)).toHaveAttribute("data-section", "hero");
  await expect(main.nth(2)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(3)).toHaveAttribute("data-section", "analysis-opinion");
  await expect(main.nth(4)).toHaveAttribute("data-ad-slot", "ad-band");
});
