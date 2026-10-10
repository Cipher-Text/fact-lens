import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// FL-09: P-3 Grouped categories with the ad-inset, newsletter and daily poll
// (spacing-layout-system.md 7.2 to 7.4, 9, 13; LAY-03, LAY-05, LAY-07, LAY-09,
// LAY-10, LAY-12, LAY-14, LAY-17).

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
      email: "ইমেইল ঠিকানা",
      subscribe: "সাবস্ক্রাইব করুন",
      sending: "পাঠানো হচ্ছে…",
      invalid: "সঠিক ইমেইল ঠিকানা লিখুন।",
      done: "ধন্যবাদ, আপনি সাবস্ক্রাইব করেছেন।",
      vote: "ভোট দিন",
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
      email: "Email address",
      subscribe: "Subscribe",
      sending: "Sending…",
      invalid: "Enter a valid email address.",
      done: "Thank you, you are subscribed.",
      vote: "Vote",
      option: "Maritime security",
      yourVote: "Your vote",
    },
  },
] as const;

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
        // --grid-column-gap: 16 / 20 from 768 / 24 from 1024 (spacing-layout-system.md 3).
        const columnGap = width >= 1024 ? 24 : width >= 768 ? 20 : 16;
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
        expect(Math.round(inset.width)).toBe(Math.round(w.width));
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

        // Rail: newsletter, then poll, space-module between, never ad colors (7.4).
        const newsletter = await box(rail.locator("[data-newsletter]"));
        const poll = await box(rail.locator("[data-poll]"));
        expect(Math.round(poll.y - (newsletter.y + newsletter.height))).toBe(
          space,
        );
        const railBackgrounds = await rail.evaluate((el) =>
          [el, ...el.querySelectorAll("*")].map(
            (n) => getComputedStyle(n).backgroundColor,
          ),
        );
        const adBackground = await insets
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(railBackgrounds).not.toContain(adBackground);

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
      test(`axe in ${theme} theme, before and after the forms are used`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(p.path);
        await expectNoBlockingAxe(page);

        const s = grouped(page);
        await s.getByRole("button", { name: p.s.subscribe }).click();
        await expect(s.getByText(p.s.invalid)).toBeVisible();
        await s.getByRole("radio", { name: p.s.option }).check();
        await s.getByRole("button", { name: p.s.vote }).click();
        await expect(s.locator("[data-poll-results]")).toBeVisible();
        await expectNoBlockingAxe(page);

        await s.getByLabel(p.s.email).fill("reader@example.com");
        await s.getByRole("button", { name: p.s.subscribe }).click();
        await expect(s.getByText(p.s.done)).toBeVisible();
        await expectNoBlockingAxe(page);
      });
    }

    test("newsletter: error, sending and done states", async ({ page }) => {
      await page.goto(p.path);
      const form = page.locator("#newsletter");
      const field = form.getByLabel(p.s.email);

      await field.fill("reader@example");
      await field.press("Enter");
      await expect(form.getByText(p.s.invalid)).toBeVisible();
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toBeFocused();

      await field.fill("reader@example.com");
      await expect(form.getByText(p.s.invalid)).toHaveCount(0);
      await form.getByRole("button", { name: p.s.subscribe }).click();
      await expect(
        form.getByRole("button", { name: p.s.sending }),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(form.getByText(p.s.done)).toBeVisible();
      await expect(form.getByRole("textbox")).toHaveCount(0);
      await expect(form.getByRole("status")).toBeFocused();
    });

    test("poll: one vote per browser, then result bars", async ({
      page,
      browser,
    }) => {
      await page.goto(p.path);
      const poll = grouped(page).locator("[data-poll]");
      await expect(poll.getByRole("radio")).toHaveCount(4);
      await poll.getByRole("radio", { name: p.s.option }).check();
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
      await expect(s.locator("#newsletter")).toHaveCount(1);
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
      // 12 story links, the email field, the button, the privacy link, one stop
      // for the radio group and the vote button.
      const expected = 17;
      const seen: string[] = [];
      await page.locator("body").focus();
      for (let i = 0; i < 200 && seen.length < expected; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          return {
            name: `${el.tagName}:${el.getAttribute("href") ?? el.getAttribute("type") ?? ""}`,
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
          expect(info.ring, info.name).not.toBe("none"); // COL-13
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

test("the Subscribe link and a category nav link reach P-3 (IMP-14)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator('nav a[href="#category-economy"]:visible').first().click();
  await expect(page).toHaveURL(/#category-economy$/);
  await expect(
    page.locator("#category-economy").getByRole("heading", { level: 2 }),
  ).toBeInViewport();
  await page.locator('a[href="#newsletter"]:visible').first().click();
  await expect(page.locator("#newsletter h2")).toBeInViewport();
});
