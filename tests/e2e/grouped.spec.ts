import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// R2-11: P-3 Grouped categories with the ad-inset, the daily poll and the rail ad
// (component-system.md C-23, C-26, C-16; spacing-layout-system.md 7.2 to 7.4, 9, 13;
// LAY-03, LAY-05, LAY-07, LAY-09, LAY-10, LAY-12, LAY-14, LAY-17, LAY-20, DR-239 to DR-245).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    categories: [
      "নিরাপত্তা ও সংঘাত",
      "ইতিহাস ও প্রেক্ষাপট",
      "অর্থনীতি ও বাণিজ্য",
      "প্রযুক্তি ও কৌশলগত শক্তি",
    ],
    s: {
      vote: "ভোট দিন",
      chooseOption: "একটি উত্তর বেছে নিন।",
      more: "আরও দেখুন",
      option: "সমুদ্র নিরাপত্তা",
      yourVote: "আপনার ভোট",
    },
  },
  {
    path: "/en",
    lang: "en",
    categories: [
      "Security and Conflict",
      "History and Context",
      "Economy and Trade",
      "Technology and Strategic Power",
    ],
    s: {
      vote: "Vote",
      chooseOption: "Choose an answer.",
      more: "See more",
      option: "Maritime security",
      yourVote: "Your vote",
    },
  },
] as const;

const WIDTHS = [
  320, 360, 600, 767, 768, 834, 1023, 1024, 1180, 1279, 1280, 1366, 1440, 1920,
];

// spacing-layout-system.md 3.2: the wrapper is shell − 304 − column gap (24px at 1024, 32px from 1280).
const WRAPPER: Record<number, number> = {
  1024: 648,
  1180: 804,
  1279: 903,
  1280: 896,
  1366: 944,
  1440: 944,
  1920: 944,
};

const grouped = (page: Page) => page.locator('[data-section="grouped"]');

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
  test.describe(`grouped categories ${p.path}`, () => {
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
        // --grid-column-gap: 16 / 24 from 768 / 32 from 1280 (spacing-layout-system.md 3.1, DR-300).
        const columnGap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;

        const s = grouped(page);
        const wrapper = s.locator("[data-grouped-wrapper]");
        const rail = s.locator("[data-grouped-rail]");

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
        } else {
          expect(Math.round(w.width)).toBe(shell);
          expect(Math.round(r.width)).toBe(shell);
          expect(r.y).toBeGreaterThan(w.y + w.height);
        }

        // Two categories per row from 600, one on phones (LAY-07).
        const rows = s.locator("[data-grouped-row]");
        await expect(rows).toHaveCount(2);
        for (let i = 0; i < 2; i++) {
          const blocks = rows.nth(i).locator("[data-category-block]");
          await expect(blocks).toHaveCount(2);
          const a = await box(blocks.nth(0));
          const b = await box(blocks.nth(1));
          if (width >= 600) {
            expect(Math.round(a.y)).toBe(Math.round(b.y));
            expect(Math.round(b.x - (a.x + a.width))).toBe(columnGap);
            expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1);
          } else {
            expect(Math.round(a.width)).toBe(shell);
            expect(b.y).toBeGreaterThan(a.y + a.height);
          }
        }

        // One ad-inset between the rows, at wrapper width, with its reserved
        // height: 250, or 90 from 1280, plus the 24px label line (Section 9, LAY-10).
        const insets = s.locator('[data-ad-slot="ad-inset"]');
        await expect(insets).toHaveCount(1);
        const inset = await box(insets.first());
        // Wrapper width; full screen width under 332px (DR-207).
        expect(Math.round(inset.width)).toBe(
          width < 332 ? width : Math.round(w.width),
        );
        expect(Math.round(inset.height)).toBe(width >= 1280 ? 114 : 274);
        const row1 = await box(rows.nth(0));
        const row2 = await box(rows.nth(1));
        expect(Math.round(inset.y - (row1.y + row1.height))).toBe(space);
        expect(Math.round(row2.y - (inset.y + inset.height))).toBe(space);
        const padding = await insets
          .first()
          .evaluate((el) => getComputedStyle(el).padding);
        expect(padding).toBe("0px"); // LAY-09

        // On phones, 600px of editorial content or more between two ads (Section 9).
        const before = await box(s.locator("xpath=preceding-sibling::*[1]"));
        if (width < 600) {
          expect(inset.y - (before.y + before.height)).toBeGreaterThanOrEqual(
            600,
          );
        }

        // An ad-band comes before the section; space-module is the section's (LAY-12).
        await expect(
          s.locator("xpath=preceding-sibling::*[1]"),
        ).toHaveAttribute("data-ad-slot", "ad-band");
        expect(Math.round(sectionBox.y)).toBe(
          Math.round(before.y + before.height),
        );
        expect(await s.evaluate((el) => getComputedStyle(el).paddingTop)).toBe(
          `${space}px`,
        );

        // Rail: the poll, then from 1280 the rail ad space-module below it, never ad
        // colors in the poll (7.4, DR-239, DR-242).
        const poll = await box(rail.locator("[data-poll]"));
        expect(Math.round(poll.y)).toBe(Math.round(r.y));
        const railAd = rail.locator('[data-ad-slot="ad-rail"]');
        if (width >= 1280) {
          const ad = await box(railAd);
          expect(Math.round(ad.height)).toBe(624); // 600 + 24px label line
          expect(Math.round(ad.width)).toBe(304);
          expect(Math.round(ad.y - (poll.y + poll.height))).toBe(space);
        } else {
          await expect(railAd).toBeHidden();
          expect(
            await railAd.evaluate((el) => getComputedStyle(el).display),
          ).toBe("none");
        }
        const pollBackgrounds = await rail
          .locator("[data-poll]")
          .evaluate((el) =>
            [el, ...el.querySelectorAll("*")].map(
              (n) => getComputedStyle(n).backgroundColor,
            ),
          );
        const adBackground = await insets
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(
          pollBackgrounds.filter((c) => c === adBackground),
          "the poll never uses the ad color",
        ).toEqual([]);

        // Both blocks in a row end on one line: the MoreLinks are pinned to the bottom
        // (DR-110, DR-123); the link is at the end edge (CPT-15).
        for (let i = 0; i < 2; i++) {
          const links = rows
            .nth(i)
            .locator("[data-category-block] > div:last-child a");
          await expect(links).toHaveCount(2);
          if (width >= 600) {
            const a = await box(links.nth(0));
            const b = await box(links.nth(1));
            expect(Math.round(a.y + a.height)).toBe(Math.round(b.y + b.height));
          }
        }

        // No text is clipped and no word runs out of its box (LAY-17, TYP-09).
        const overflowing = await s.evaluate((el) =>
          [
            ...el.querySelectorAll(
              ":is(h2, h3, p, a, time, label, button, legend):not(.sr-only)",
            ),
          ]
            .filter(
              (n) =>
                n.scrollWidth > n.clientWidth + 1 ||
                getComputedStyle(n).textOverflow === "ellipsis" ||
                getComputedStyle(n).webkitLineClamp !== "none",
            )
            .map((n) => n.textContent),
        );
        expect(overflowing).toEqual([]);
      });
    }

    for (const width of [360, 600, 1024]) {
      test(`sparse content at ${width}: the odd last category keeps its size (7.3)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${p.path}?content=sparse`);
        const rows = grouped(page).locator("[data-grouped-row]");
        await expect(rows).toHaveCount(2);
        const first = await box(
          rows.nth(0).locator("[data-category-block]").first(),
        );
        const blocks = rows.nth(1).locator("[data-category-block]");
        await expect(blocks).toHaveCount(1);
        const last = await box(blocks.first());
        expect(Math.abs(last.width - first.width)).toBeLessThanOrEqual(1);
        expect(Math.round(last.x)).toBe(Math.round(first.x));
      });
    }

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme, before and after the vote`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        await page.goto(p.path);
        await expectNoBlockingAxe(page);

        const s = grouped(page);
        await s.getByRole("button", { name: p.s.vote }).click();
        await expect(s.getByText(p.s.chooseOption)).toBeVisible();
        await expectNoBlockingAxe(page);
        await s.getByRole("radio", { name: p.s.option }).check({ force: true });
        await s.getByRole("button", { name: p.s.vote }).click();
        await expect(s.locator("[data-poll-results]")).toBeVisible();
        await expectNoBlockingAxe(page);
      });
    }

    // C-26 sheet checks: the panel, its inset (LAY-20, DR-224), the layout per container
    // width, the square markers (DR-138) and the vote button (C-12).
    for (const width of [360, 600, 768, 1023, 1024, 1280]) {
      test(`poll sheet at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const poll = grouped(page).locator("[data-poll]");
        const panel = poll.locator(".panel-inset");
        const panelBox = await box(panel);
        // In the 304px rail from 1024: container under 600, so 40 / 32 and stacked.
        // The container is the shell: width minus two gutters (24px from 600). A container
        // of 600px or more means a viewport of 648px or more (DOC-31).
        const inRow = width < 1024 && width - 48 >= 600;
        const style = await panel.evaluate((el) => {
          const c = getComputedStyle(el);
          return {
            bg: c.backgroundColor,
            top: c.paddingTop,
            start: c.paddingLeft,
          };
        });
        expect(style.top).toBe(inRow ? "48px" : "40px");
        expect(style.start).toBe(inRow ? "40px" : "32px");
        // The panel is surface-elevated, not the page color.
        const page_bg = await page.evaluate(
          () => getComputedStyle(document.body).backgroundColor,
        );
        expect(style.bg).not.toBe(page_bg);
        if (width >= 1024) expect(Math.round(panelBox.width)).toBe(304);

        // Row layout: heading and question at the start, options and button at the end.
        const heading = await box(poll.getByRole("heading", { level: 2 }));
        const options = await box(poll.locator("fieldset"));
        if (inRow) {
          expect(options.x).toBeGreaterThan(heading.x + heading.width - 1);
          expect(Math.round(options.y)).toBe(Math.round(heading.y));
        } else {
          expect(options.y).toBeGreaterThan(heading.y + heading.height);
        }

        // Heading 22px role, plain text; question to options 24px when stacked.
        const question = await box(poll.locator("p").first());
        if (!inRow) {
          expect(Math.round(options.y - (question.y + question.height))).toBe(
            24,
          );
        }

        // 2 to 4 rows, 4px apart, no radius on markers, rows or the button.
        const rows = poll.locator("fieldset label");
        await expect(rows).toHaveCount(4);
        const first = await box(rows.nth(0));
        const second = await box(rows.nth(1));
        expect(Math.round(second.y - (first.y + first.height))).toBe(4);
        expect(first.height).toBeGreaterThanOrEqual(44);
        const radii = await poll.evaluate((el) =>
          [el, ...el.querySelectorAll("*")]
            .map((n) => getComputedStyle(n).borderRadius)
            .filter((r) => r !== "0px"),
        );
        expect(radii).toEqual([]); // CPT-05
        const shadows = await poll.evaluate((el) =>
          [el, ...el.querySelectorAll("*")]
            .map((n) => getComputedStyle(n).boxShadow)
            .filter((v) => v !== "none"),
        );
        expect(shadows).toEqual([]); // COL-15

        // The vote button: one 48px size, the full width of the options column.
        const button = await box(poll.getByRole("button", { name: p.s.vote }));
        expect(Math.round(button.height)).toBe(48);
        expect(Math.round(button.width)).toBe(Math.round(options.width));
        const last = await box(rows.last());
        expect(Math.round(button.y - (last.y + last.height))).toBe(24);
      });
    }

    test("poll: no answer shows the error and keeps the focus on the first option", async ({
      page,
    }) => {
      await page.goto(p.path);
      const poll = grouped(page).locator("[data-poll]");
      await poll.getByRole("button", { name: p.s.vote }).click();
      await expect(poll.getByText(p.s.chooseOption)).toBeVisible();
      await expect(poll.getByRole("radio").first()).toBeFocused();
      await expect(poll.locator("fieldset")).toHaveAccessibleDescription(
        p.s.chooseOption,
      );
      await expect(poll.getByRole("group", { name: /./ })).toHaveCount(1);
    });

    test("poll results: own vote filled and named, fills follow the percents", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const poll = grouped(page).locator("[data-poll]");
      const railAd = grouped(page).locator('[data-ad-slot="ad-rail"]');
      const pageY = async () =>
        (await box(railAd)).y + (await page.evaluate(() => scrollY));
      const adBefore = await pageY();
      await poll
        .getByRole("radio", { name: p.s.option })
        .check({ force: true });
      await poll.getByRole("button", { name: p.s.vote }).click();
      // The vote does not move the rail ad (LAY-10).
      expect(await pageY()).toBe(adBefore);
      const mine = poll.locator('[data-poll-result="maritime"]');
      await expect(mine).toContainText(p.s.yourVote);
      const markerFill = (id: string) =>
        poll
          .locator(`[data-poll-result="${id}"] span[aria-hidden="true"]`)
          .nth(1)
          .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(await markerFill("maritime")).not.toBe(await markerFill("trade"));
      await expect(poll.locator("[role=status]")).toHaveCount(1);
    });

    test("poll: one vote per browser, then result bars", async ({
      page,
      browser,
    }) => {
      await page.goto(p.path);
      const poll = grouped(page).locator("[data-poll]");
      await expect(poll.getByRole("radio")).toHaveCount(4);
      await poll
        .getByRole("radio", { name: p.s.option })
        .check({ force: true });
      await poll.getByRole("button", { name: p.s.vote }).click();

      const results = poll.locator("[data-poll-result]");
      await expect(results).toHaveCount(4);
      await expect(poll.getByRole("radio")).toHaveCount(0);
      await expect(poll.locator('[data-poll-result="maritime"]')).toContainText(
        p.s.yourVote,
      );
      // The bars follow the percents and fill no more than their track.
      const fractions = await poll
        .locator("[data-poll-bar]")
        .evaluateAll((bars) =>
          bars.map(
            (bar) =>
              bar.getBoundingClientRect().width /
              bar.parentElement!.getBoundingClientRect().width,
          ),
        );
      expect(fractions.reduce((sum, f) => sum + f, 0)).toBeCloseTo(1, 1);
      for (const f of fractions) expect(f).toBeLessThanOrEqual(1);
      const text = await poll.innerText();
      if (p.lang === "bn") expect(text).not.toMatch(/[0-9]/); // TYP-17

      // The same browser sees the results after a reload.
      await page.reload();
      await expect(
        grouped(page).locator("[data-poll] [data-poll-result]"),
      ).toHaveCount(4);

      // Another browser can still vote.
      const other = await browser.newContext();
      const fresh = await other.newPage();
      await fresh.goto(p.path);
      await expect(
        grouped(fresh).locator("[data-poll]").getByRole("radio"),
      ).toHaveCount(4);
      await other.close();
    });

    test("headings, anchors and language", async ({ page }) => {
      await page.goto(p.path);
      const s = grouped(page);
      for (const name of p.categories) {
        await expect(s.getByRole("heading", { level: 2, name })).toBeVisible();
      }
      for (const id of ["security", "history", "economy", "technology"]) {
        await expect(page.locator(`#category-${id}`)).toHaveCount(1);
      }
      await expect(page.locator("#newsletter")).toHaveCount(0); // DR-239
      const text = (await s.innerText()).replace(/\s+/g, " ");
      if (p.lang === "bn") {
        // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
        expect(text).not.toMatch(/[A-Za-z0-9]/);
      } else {
        expect(text).not.toMatch(/[ঀ-৿]/);
      }
    });

    test("keyboard: every control is reachable, shows the focus ring and works", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const selector = '[data-section="grouped"]';
      // 12 story links and 4 MoreLinks, the inset ad, one stop for the radio group, the
      // vote button and the rail ad (shown at 1280).
      const expected = 20;
      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 200 && seen.length < expected; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          return {
            name: `${el.tagName}:${el.getAttribute("href") ?? el.getAttribute("type") ?? ""}`,
            // The base outline (COL-13). The radio input is hidden, so the outline is on its
            // square marker, the next element.
            ring: (() => {
              const target =
                el instanceof HTMLInputElement && el.type === "radio"
                  ? (el.nextElementSibling as HTMLElement)
                  : el;
              const s = getComputedStyle(target);
              return s.outlineStyle === "solid" && s.outlineWidth === "2px"
                ? "outline"
                : "none";
            })(),
          };
        }, selector);
        if (info) {
          expect(info.ring, info.name).toBe("outline"); // COL-13
          seen.push(info.name);
        }
      }
      expect(seen).toHaveLength(expected);

      // Vote with the keyboard: arrow keys pick an option, Enter on the button votes.
      const poll = grouped(page).locator("[data-poll]");
      await poll.getByRole("radio").first().focus();
      await page.keyboard.press("ArrowDown");
      await expect(poll.getByRole("radio").nth(1)).toBeChecked();
      await page.keyboard.press("Tab");
      await expect(poll.getByRole("button", { name: p.s.vote })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(poll.locator("[data-poll-results]")).toBeFocused();
    });
  });
}

test("page order: ভূরাজনীতি, ad, P-3 (7.1)", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(7)).toHaveAttribute("data-category", "geopolitics");
  await expect(main.nth(8)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(9)).toHaveAttribute("data-section", "grouped");
});

// The header has no Subscribe link any more (DR-188), so only the category link is left.
test("a category nav link reaches P-3 (IMP-14)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator('nav a[href="#category-economy"]:visible').first().click();
  await expect(page).toHaveURL(/#category-economy$/);
  await expect(
    page.locator("#category-economy").getByRole("heading", { level: 2 }),
  ).toBeInViewport();
  await expect(page.locator('a[href="#newsletter"]')).toHaveCount(0);
});
