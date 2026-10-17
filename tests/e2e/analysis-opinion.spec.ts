import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { columnRule, tokenBackground } from "./rules";
import { waitForNavRow } from "./settle";
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
        await waitForNavRow(page);

        const section = page.locator(SECTION);
        const analysis = section.locator('[data-column="analysis"]');
        const opinion = section.locator('[data-column="opinion"]');

        // No horizontal scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        // Panel band: the background is full width, the content is in the shell (DR-264).
        const gutter = width < 600 ? 16 : 24;
        const sectionBox = await box(section);
        expect(Math.round(sectionBox.x)).toBe(0);
        expect(Math.round(sectionBox.width)).toBe(width);
        const shellBox = await box(section.locator("> .shell"));
        expect(Math.round(shellBox.width)).toBe(
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
        const before = section.locator("xpath=preceding-sibling::*[1]");
        await expect(before).toHaveAttribute("data-ad-slot", "ad-band");
        // Read both gaps in one pass, so a late layout shift cannot change one box between
        // two reads (IMP-54: WebKit read -8 from boxes taken at different times).
        const gaps = await section.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return {
            after:
              el.nextElementSibling!.getBoundingClientRect().top - r.bottom,
            before:
              r.top - el.previousElementSibling!.getBoundingClientRect().bottom,
          };
        });
        expect(Math.round(gaps.after)).toBe(space);
        expect(Math.round(gaps.before)).toBe(space);
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
      // The image links have tabindex -1 (one tab stop per story, C-02, C-24).
      const links = page.locator(`${SECTION} a:not([tabindex="-1"])`);
      const count = await links.count();
      // Three analysis titles with their category links (Eyebrow, C-08), five opinion
      // titles, and two more links.
      expect(count).toBe(13);

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

test.describe("sheet checks (P-4, C-02, C-06, C-24)", () => {
  for (const p of PAGES) {
    for (const width of [360, 768, 1366]) {
      test(`${p.path} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const section = page.locator(SECTION);

        // Panel band: block inset only, 40px under 600px and 48px from 600px, no inline inset (LAY-20, DR-264).
        const [block, inline] = width < 600 ? [40, 0] : [48, 0];
        const padding = await section.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.paddingTop, s.paddingBottom, s.paddingLeft, s.paddingRight];
        });
        expect(padding).toEqual(
          [block, block, inline, inline].map((v) => `${v}px`),
        );

        // No radius and no card border anywhere in the section (CPT-05, CPT-06).
        const decorated = await section.evaluate((el) =>
          [el, ...el.querySelectorAll("*")]
            .filter((n) => {
              const s = getComputedStyle(n);
              return (
                !n.closest("svg") &&
                (s.borderTopLeftRadius !== "0px" ||
                  (n.tagName !== "LI" && s.borderTopWidth !== "0px"))
              );
            })
            .map((n) => n.tagName),
        );
        expect(decorated).toEqual([]);

        // Analysis: one OverlapCard, then two compact rows.
        const analysis = section.locator('[data-column="analysis"]');
        await expect(analysis.locator("[data-overlap-card]")).toHaveCount(1);
        await expect(analysis.locator("[data-story-card]")).toHaveCount(2);
        const card = analysis.locator("[data-overlap-card]");
        const media = await box(card.locator("[data-story-media] img"));
        const body = await box(card.locator("[data-overlap-body]"));
        const cardBox = await box(card);
        // The text block covers the image bottom by 10% of the card width (40 to 64px)
        // from the start edge and stops the same short of the end edge.
        const inset = Math.min(Math.max(cardBox.width * 0.1, 40), 64);
        expect(Math.round(media.y + media.height - body.y)).toBe(
          Math.round(inset),
        );
        expect(Math.round(body.x - cardBox.x)).toBe(0);
        expect(Math.round(media.x + media.width - (body.x + body.width))).toBe(
          Math.round(inset),
        );
        expect(
          await card
            .locator("[data-overlap-body]")
            .evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe(await tokenColor(page, "--surface-elevated"));

        // Compact rows: text at the start, 16:9 image at the end, text : image = 2 : 1, --grid-column-gap between them (DR-300).
        // --grid-column-gap: 16px, 24px from 768, 32px from 1280 (spacing-layout-system.md §3).
        const columnGap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;
        for (const row of await analysis.locator("[data-story-card]").all()) {
          const rowBox = await box(row);
          // The image or, for a story with no image, the placeholder in the same slot (DR-338).
          const img = await box(row.locator("[data-story-media] > *"));
          const text = await box(row.locator("h3"));
          expect(Math.round((img.width / img.height) * 100)).toBe(178);
          expect(img.x).toBeGreaterThan(text.x);
          expect(Math.round(img.x + img.width)).toBe(
            Math.round(rowBox.x + rowBox.width),
          );
          expect(Math.round(((rowBox.width - columnGap) * 1) / 3)).toBe(
            Math.round(img.width),
          );
          await expect(row.locator(".type-summary")).toHaveCount(0);
        }

        // Every story title is an h3 with one link (P-4, C-06).
        await expect(section.locator("h3")).toHaveCount(8);
        await expect(section.locator("h3 a")).toHaveCount(8);

        // Opinion: the quote mark width and the column gap by width, Divider.item between rows.
        const opinion = section.locator('[data-column="opinion"]');
        const [markWidth, gap] =
          width < 600
            ? [28, 16]
            : width < 1024
              ? [36, 24]
              : [44, width >= 1280 ? 32 : 24];
        const items = await opinion.locator("li").all();
        expect(items).toHaveLength(5);
        for (const item of items) {
          const mark = await box(item.locator("[data-quote-mark]"));
          expect(Math.round(mark.width)).toBe(markWidth);
          expect(Math.round(mark.height)).toBe(
            Math.round((markWidth * 36) / 44),
          );
          const title = await box(item.locator("h3"));
          expect(Math.round(title.x - (mark.x + mark.width))).toBe(gap);
          expect(
            Math.round(title.y - (await box(item.locator("article"))).y),
          ).toBe(0);
          // Author and time on own lines, below the title, 600 and 400 (C-06).
          const author = item.locator("[data-author]");
          const time = item.locator("[data-time]");
          expect(
            await author.evaluate((el) => getComputedStyle(el).fontWeight),
          ).toBe("600");
          expect(
            await time.evaluate((el) => getComputedStyle(el).fontWeight),
          ).toBe("400");
          expect((await box(author)).y).toBeGreaterThanOrEqual(
            title.y + title.height,
          );
          expect((await box(time)).y).toBeGreaterThanOrEqual(
            (await box(author)).y + (await box(author)).height - 1,
          );
          expect(
            await item.evaluate((el) => getComputedStyle(el).borderTopWidth),
          ).toBe("0px");
        }
        for (let i = 1; i < items.length; i++) {
          const prev = await box(items[i - 1]);
          const cur = await box(items[i]);
          // Divider.item: space-list-item (16px) above the rule (the time line above ends
          // at its ink, DR-350); below it the 1px rule and 16px to the title ink: the padding
          // is 17px less the blank space above the title ink (--list-ink-start).
          expect(Math.round(cur.y - (prev.y + prev.height))).toBe(16);
          const pad = await items[i].evaluate((el) => {
            const probe = document.createElement("span");
            probe.style.display = "block";
            probe.style.height = "var(--list-ink-start)";
            el.append(probe);
            const start = parseFloat(getComputedStyle(probe).height);
            probe.remove();
            return { pad: parseFloat(getComputedStyle(el).paddingTop), start };
          });
          expect(pad.start).toBeGreaterThanOrEqual(0);
          expect(Math.abs(pad.pad - (17 - pad.start))).toBeLessThanOrEqual(0.5);
        }

        // The chip: brand fill in light, on-interactive text, 2px 8px, a label and not a link.
        const chip = opinion.locator("[data-chip]");
        const chipPadding = await chip.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft];
        });
        expect(chipPadding).toEqual(["2px", "8px", "2px", "8px"]);
        expect(
          await chip.evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe(await tokenColor(page, "--brand"));
      });
    }
  }
});

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

// R4-03: the column rule between analysis and opinion, the OpinionList item rule and the
// chip space (C-06, C-22, P-4; DR-351).
test.describe("rules (C-06, C-22, DR-351)", () => {
  for (const p of PAGES) {
    for (const theme of ["light", "dark"] as const) {
      test(`${p.path} ${theme}: Divider.column-inset from 768 in the middle of the gap`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        for (const width of [360, 600, 767, 768, 1023, 1024, 1280, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          const rule = await columnRule(
            page,
            `${SECTION} [data-columns]`,
            `${SECTION} [data-column="analysis"]`,
            `${SECTION} [data-column="opinion"]`,
          );
          // The gap is the column gap of before the change (DR-300, DR-351).
          const gap = width >= 1280 ? 32 : width >= 768 ? 24 : 16;
          expect(rule.gap, `gap at ${width}`).toBe(`${gap}px`);
          if (width < 768) {
            // The columns stack: no rule.
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

    test(`${p.path}: the OpinionList rule starts at the text column; chip to the first item`, async ({
      page,
    }) => {
      for (const width of [360, 600, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const opinion = page.locator(`${SECTION} [data-column="opinion"]`);
        const items = opinion.locator("li");
        for (let i = 1; i < 5; i++) {
          const at = await items.nth(i).evaluate((li) => {
            const s = getComputedStyle(li, "::before");
            const box = li.getBoundingClientRect();
            const text = li
              .querySelector("[data-quote-mark]")!
              .nextElementSibling!.getBoundingClientRect();
            const mark = li
              .querySelector("[data-quote-mark]")!
              .getBoundingClientRect();
            return {
              start: box.left + parseFloat(s.left),
              end: box.left + parseFloat(s.left) + parseFloat(s.width),
              text: text.left,
              textEnd: text.right,
              mark: mark.right,
            };
          });
          // The rule spans the text column only, not the quote mark (DR-351).
          expect(
            Math.abs(at.start - at.text),
            `start at ${width}`,
          ).toBeLessThanOrEqual(0.5);
          expect(
            Math.abs(at.end - at.textEnd),
            `end at ${width}`,
          ).toBeLessThanOrEqual(0.5);
          expect(at.start).toBeGreaterThan(at.mark);
        }
        // Chip to the first item: space-section-title-after, 20px under 768 and 24px from
        // 768 (layout 5.1; DR-351).
        const chip = await opinion
          .locator("[data-chip]")
          .locator("..")
          .boundingBox();
        const first = await items.first().boundingBox();
        expect(
          Math.abs(
            first!.y - (chip!.y + chip!.height) - (width >= 768 ? 24 : 20),
          ),
          `chip space at ${width}`,
        ).toBeLessThanOrEqual(0.5);
      }
    });
  }
});
