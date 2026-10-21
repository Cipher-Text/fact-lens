import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { columnRule, tokenBackground } from "./rules";
import { waitForNavRow } from "./settle";
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
        await waitForNavRow(page);

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
        await expectNoBlockingAxe(page);
        await s.getByRole("radio", { name: p.s.option }).click();
        await expectNoBlockingAxe(page);
        await s.getByRole("button", { name: p.s.vote }).click();
        await expect(s.locator("[data-poll-results]")).toBeVisible();
        await expectNoBlockingAxe(page);
      });
    }

    // C-26 sheet checks: no panel (DR-273), the layout per container width (DR-298), the
    // spacing, the square markers (DR-138) and the vote button (C-12).
    for (const width of [360, 600, 768, 1023, 1024, 1280]) {
      test(`poll sheet at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const poll = grouped(page).locator("[data-poll]");
        // The container is the shell: width minus two gutters (24px from 600). A container
        // of 600px or more means a viewport of 648px or more (DOC-31).
        const inRow = width < 1024 && width - 48 >= 600;

        // No panel: no background, padding, border, radius or shadow on the section.
        const style = await poll.evaluate((el) => {
          const c = getComputedStyle(el);
          return {
            bg: c.backgroundColor,
            padding: c.padding,
            border: c.borderTopWidth,
          };
        });
        expect(style.bg).toBe("rgba(0, 0, 0, 0)");
        expect(style.padding).toBe("0px");
        expect(style.border).toBe("0px");
        expect(await poll.locator(".panel-inset").count()).toBe(0);
        if (width >= 1024) {
          expect(Math.round((await box(poll)).width)).toBe(304);
        }

        // The question is the legend of the fieldset and names the group (DR-273).
        const heading = await box(poll.getByRole("heading", { level: 2 }));
        const legend = poll.locator("fieldset > legend");
        await expect(legend).toHaveCount(1);
        const question = await box(legend);
        const group = poll.getByRole("group");
        await expect(group).toHaveCount(1);
        await expect(poll.getByRole("radiogroup")).toHaveCount(1);
        const options = await box(poll.getByRole("radiogroup"));
        // Heading 16px to the question.
        expect(Math.round(question.y - (heading.y + heading.height))).toBe(16);
        if (inRow) {
          // Heading and question at the start, options at the end, tops level.
          expect(options.x).toBeGreaterThan(question.x + question.width - 1);
          expect(Math.round(options.y)).toBe(Math.round(heading.y));
        } else {
          // Stacked: 24px from the question to the first option.
          expect(Math.round(options.y - (question.y + question.height))).toBe(
            24,
          );
        }

        // 2 to 4 rows, 48px or more, 4px apart; markers, rows and button have no radius.
        const rows = poll.getByRole("radio");
        await expect(rows).toHaveCount(4);
        const first = await box(rows.nth(0));
        const second = await box(rows.nth(1));
        expect(Math.round(second.y - (first.y + first.height))).toBe(4);
        expect(first.height).toBeGreaterThanOrEqual(48);
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

        // Marker: 20px square, 2px interactive border; selected holds a 12px square.
        const marker = rows.first().locator("[data-slot=radio-group-marker]");
        const markerBox = await box(marker);
        expect([markerBox.width, markerBox.height]).toEqual([20, 20]);
        expect(
          await marker.evaluate((el) => getComputedStyle(el).borderTopWidth),
        ).toBe("2px");
        await expect(marker.locator("span")).toHaveCount(0);
        await rows.first().click();
        const dot = await box(marker.locator("span"));
        expect([dot.width, dot.height]).toEqual([12, 12]);

        // The vote button: 48px, the full width of the options column, 24px below them.
        const button = await box(poll.getByRole("button", { name: p.s.vote }));
        expect(Math.round(button.height)).toBe(48);
        expect(Math.round(button.width)).toBe(Math.round(options.width));
        const last = await box(rows.last());
        expect(Math.round(button.y - (last.y + last.height))).toBe(24);
      });
    }

    test("poll: pressing vote with no choice does nothing", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(p.path);
      const poll = grouped(page).locator("[data-poll]");
      // With the keyboard: focus the button, press it with Enter and with Space.
      const vote = poll.getByRole("button", { name: p.s.vote });
      await vote.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      // No state change, and focus stays on the button (C-26, DR-348).
      await expect(vote).toBeFocused();
      await expect(poll).not.toHaveAttribute("data-voted");
      await expect(
        poll.locator('[role="radio"][aria-checked="true"]'),
      ).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((k) => k.startsWith("fl-poll:")),
        ),
      ).toEqual([]);
      await vote.click();
      await expect(vote).toBeFocused();
      expect(errors).toEqual([]);
      await expect(poll.getByRole("radio")).toHaveCount(4);
      await expect(poll.locator("[data-poll-results]")).toHaveCount(0);
      await expect(poll.locator("[role=alert]")).toHaveCount(0);
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
      // Wait until fonts and images have settled, or the first reading is of a page that
      // is still growing.
      await page.waitForLoadState("load");
      await page.evaluate(() => document.fonts.ready);
      await waitForNavRow(page);
      const adBefore = await pageY();
      await poll.getByRole("radio", { name: p.s.option }).click();
      await poll.getByRole("button", { name: p.s.vote }).click();
      // The vote does not move the rail ad (LAY-10).
      expect(await pageY()).toBe(adBefore);
      const mine = poll.locator('[data-poll-result="maritime"]');
      await expect(mine).toContainText(p.s.yourVote);
      // Own vote: interactive bar; the others: fill-neutral (DR-295). Bars are aria-hidden.
      const barFill = (id: string) =>
        poll
          .locator(`[data-poll-result="${id}"] [data-poll-bar]`)
          .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(await barFill("maritime")).not.toBe(await barFill("trade"));
      expect(await barFill("trade")).toBe("rgb(126, 126, 126)");
      // Results are the one live region; the markers are gone.
      await expect(poll.locator("[role=status]")).toHaveCount(1);
      await expect(poll.locator("[data-poll-results]")).toHaveAttribute(
        "role",
        "status",
      );
      await expect(poll.getByRole("radio")).toHaveCount(0);
      const markers = poll.locator("[data-slot=radio-group-marker]");
      for (const state of await markers.evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).visibility),
      )) {
        expect(state).toBe("hidden");
      }
      // Bars are 32px high with no radius.
      const bar = await box(
        poll
          .locator('[data-poll-result="trade"] [data-poll-bar]')
          .locator(".."),
      );
      expect(Math.round(bar.height)).toBe(32);
    });

    test("poll: one vote per browser, then result bars", async ({
      page,
      browser,
    }) => {
      await page.goto(p.path);
      const poll = grouped(page).locator("[data-poll]");
      await expect(poll.getByRole("radio")).toHaveCount(4);
      await poll.getByRole("radio", { name: p.s.option }).click();
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
      // The percent is ink, and the whole number turns background once the fill reaches the
      // start of the number (C-26, DR-273). Measured, not hard-coded.
      const flips = await poll.locator("[data-poll-bar]").evaluateAll((bars) =>
        bars.map((bar) => {
          const number = bar.nextElementSibling as HTMLElement;
          const fillEnd = bar.getBoundingClientRect().right;
          const reaches = fillEnd >= number.getBoundingClientRect().left;
          return {
            reaches,
            color: getComputedStyle(number).color,
            ink: getComputedStyle(document.body).color,
            background: getComputedStyle(document.body).backgroundColor,
          };
        }),
      );
      for (const flip of flips) {
        expect(flip.color).toBe(flip.reaches ? flip.background : flip.ink);
      }
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
            // The base outline (COL-13) on the focused element.
            ring: (() => {
              const s = getComputedStyle(el);
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
      // The vote button is gone: focus moves to the poll h2 (tabindex -1), and the results
      // are in role status (C-26, DR-346).
      const heading = poll.getByRole("heading", { level: 2 });
      await expect(heading).toBeFocused();
      await expect(heading).toHaveAttribute("tabindex", "-1");
      expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
        "H2",
      );
      await expect(poll.getByRole("status")).toHaveCount(1);
      await expect(poll.getByRole("status")).toHaveAttribute(
        "data-poll-results",
        "",
      );
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

// R4-03: Divider.column-inset between the wrapper and the rail from 1024, none between the
// category blocks (C-22, P-3, DR-351).
test.describe("column rule (C-22, DR-351)", () => {
  for (const p of PAGES) {
    for (const theme of ["light", "dark"] as const) {
      test(`${p.path} ${theme}: in the middle of the wrapper and rail gap from 1024`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        for (const width of [360, 600, 768, 1023, 1024, 1280, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          const grid = '[data-section="grouped"] .with-rail';
          const rule = await columnRule(
            page,
            grid,
            "[data-grouped-wrapper]",
            "[data-grouped-rail]",
          );
          // The gap is the column gap of before the change (DR-300, DR-351).
          const gap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;
          expect(rule.gap, `gap at ${width}`).toBe(`${gap}px`);
          // No rule between category blocks, at any width.
          const blockRules = await page.evaluate(() =>
            [
              ...document.querySelectorAll(
                "[data-grouped-row], [data-category-block]",
              ),
            ].flatMap((el) => [
              getComputedStyle(el, "::before").content,
              getComputedStyle(el, "::after").content,
              getComputedStyle(el).borderInlineStartWidth,
              getComputedStyle(el).borderInlineEndWidth,
            ]),
          );
          for (const v of blockRules) expect(["none", "0px"]).toContain(v);
          if (width < 1024) {
            // The rail is under the wrapper: no rule.
            expect(rule.shown, `rule at ${width}`).toBe(false);
            continue;
          }
          expect(rule.shown, `rule at ${width}`).toBe(true);
          expect(rule.width).toBe(1);
          expect(rule.color).toBe(
            await tokenBackground(page, "--color-border"),
          );
          expect(
            Math.abs(rule.offCenter),
            `center at ${width}`,
          ).toBeLessThanOrEqual(0.5);
          expect(
            Math.abs(rule.top - 16),
            `top at ${width}`,
          ).toBeLessThanOrEqual(0.5);
          expect(
            Math.abs(rule.bottom - 16),
            `bottom at ${width}`,
          ).toBeLessThanOrEqual(0.5);
        }
      });
    }
  }

  test("no column rule in the other wrapper and rail sections (DR-351)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const others = await page.evaluate(() =>
      [...document.querySelectorAll(".with-rail")]
        .filter((el) => !el.closest('[data-section="grouped"]'))
        .map((el) => getComputedStyle(el, "::after").content),
    );
    expect(others.length).toBeGreaterThan(0);
    for (const content of others) expect(content).toBe("none");
  });
});
