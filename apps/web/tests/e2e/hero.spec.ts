import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { columnRule, tokenBackground } from "./rules";
import { waitForNavRow } from "./settle";
import { setTheme } from "./theme";

// FL-06: P-1 Hero with the Latest rail (spacing-layout-system.md 7.2 to 7.4, 13;
// DR-39, DR-44, LAY-05, LAY-12, LAY-13).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    title: "শীর্ষ খবর",
    latest: "সর্বশেষ",
    more: "আরও দেখুন: সর্বশেষ",
  },
  {
    path: "/en",
    lang: "en",
    title: "Top stories",
    latest: "Latest",
    more: "See more: Latest",
  },
] as const;

const WIDTHS = [
  320, 360, 600, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

// spacing-layout-system.md 3.2: the wrapper is shell − 304 − column gap (24px at 1024, 32px from 1280).
const WRAPPER: Record<number, number> = {
  1024: 648,
  1180: 804,
  1280: 896,
  1366: 944,
  1440: 944,
  1920: 944,
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
    test("hidden h2 names the section and is in the heading outline (C-01, DR-345)", async ({
      page,
    }) => {
      await page.goto(p.path);
      const hero = page.locator('[data-section="hero"]');
      const heading = page.getByRole("heading", {
        level: 2,
        name: p.title,
        exact: true,
      });
      await expect(heading).toHaveCount(1);
      await expect(heading).toHaveText(p.title);
      // Visually hidden: the sr-only clip, not display none, so it stays in the outline.
      await expect(heading).toHaveClass(/\bsr-only\b/);
      expect(
        await heading.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.display, s.visibility, s.position, s.width, s.height];
        }),
      ).toEqual(["block", "visible", "absolute", "1px", "1px"]);
      await expect(
        page.getByRole("region", { name: p.title, exact: true }),
      ).toHaveAttribute("data-section", "hero");
      // The first h2 of the page outline is the hero heading.
      const outline = await page
        .locator("main h2")
        .evaluateAll((els) => els.map((el) => el.id));
      expect(outline[0]).toBe("hero-title");
      expect(await hero.locator("h2").first().getAttribute("id")).toBe(
        "hero-title",
      );
    });

    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForNavRow(page);

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

        // Latest: 2 columns at 768–1023, 1 column otherwise (C-03).
        const first = await box(items.nth(0));
        const second = await box(items.nth(1));
        const fourth = await box(items.nth(3));
        if (width >= 768 && width < 1024) {
          // Column-first: items 1 to 3, then 4 to 6 (DR-125).
          expect(Math.round(fourth.y)).toBe(Math.round(first.y));
          expect(fourth.x).toBeGreaterThan(first.x);
          expect(Math.round(second.x)).toBe(Math.round(first.x));
        } else {
          expect(second.y).toBeGreaterThan(first.y);
          expect(Math.round(second.x)).toBe(Math.round(first.x));
        }
        await expect(items).toHaveCount(5);

        // Lead panel (C-01): covers the image by 32px under 600px of card width, by 10% of
        // it (64 to 96px) from 600px, and is inset at the end so the corner of the image shows.
        const imageBox = await box(image);
        const panelBox = await box(panel);
        expect(Math.round(imageBox.width)).toBe(Math.round(wrapperBox.width));
        const overlap = imageBox.y + imageBox.height - panelBox.y;
        const expected =
          imageBox.width < 600
            ? 32
            : Math.min(96, Math.max(64, imageBox.width * 0.1));
        expect(overlap).toBeCloseTo(expected, 0);
        expect(panelBox.width).toBeLessThan(imageBox.width);

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

    // C-01 and C-02 checks: bar thickness, panel inset and padding, top-card overlap and notch.
    for (const [width, bar, inset, padding] of [
      [360, 6, 0, 16],
      [768, 8, 32, 24],
      [1366, 10, 40, 32],
    ] as const) {
      test(`sheet checks at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const hero = page.locator('[data-section="hero"]');
        const lead = hero.locator("[data-lead]");
        const imageBox = await box(lead.locator("img"));
        const panelBox = await box(lead.locator("[data-lead-panel]"));

        // C-01: no radius or border; the bar and the padding are fixed per size.
        const barStyle = await lead
          .locator("[data-lead-bar]")
          .evaluate((el) => ({
            height: getComputedStyle(el).height,
            radius: getComputedStyle(el).borderRadius,
          }));
        expect(barStyle).toEqual({ height: `${bar}px`, radius: "0px" });
        const panelStyle = await lead
          .locator("[data-lead-panel]")
          .evaluate((el) => {
            const body = el.lastElementChild!;
            const s = getComputedStyle(body);
            return {
              top: s.paddingTop,
              start: s.paddingLeft,
              end: s.paddingRight,
              border: getComputedStyle(el).borderTopWidth,
              radius: getComputedStyle(el).borderRadius,
              bg: getComputedStyle(el).backgroundColor,
              page: getComputedStyle(document.body).backgroundColor,
            };
          });
        expect(panelStyle.border).toBe("0px");
        expect(panelStyle.radius).toBe("0px");
        expect(panelStyle.bg).toBe(panelStyle.page);
        expect(panelStyle.top).toBe(`${padding}px`);
        expect(panelStyle.end).toBe(`${padding}px`);
        expect(panelStyle.start).toBe(width < 600 ? "0px" : `${padding}px`);

        // The panel space to the image edge: 32px of image at the end on phones, equal
        // on both sides from 600 (32px at 768, 40px at 1366).
        const startGap = panelBox.x - imageBox.x;
        const endGap =
          imageBox.x + imageBox.width - (panelBox.x + panelBox.width);
        if (width < 600) {
          expect(Math.round(startGap)).toBe(0);
          expect(Math.round(endGap)).toBe(32);
        } else {
          expect(Math.round(startGap)).toBe(inset);
          expect(Math.round(endGap)).toBe(inset);
        }

        // C-02: the body covers the image by 10% of the card (40 to 64px) and leaves the
        // same notch at the end side; the title is an h3 in the story title role.
        const cards = hero.locator("[data-top-stories] article");
        // Every hero story has an image (DR-91), so both cards get the geometry check.
        for (let i = 0; i < 2; i++) {
          const card = cards.nth(i);
          const title = card.getByRole("heading", { level: 3 });
          await expect(title).toHaveClass(/text-2xl/);
          await expect(card.locator("img")).toHaveCount(1);
          const cardImage = await box(card.locator("img"));
          const body = await box(card.locator("[data-overlap-body]"));
          const unit = Math.min(64, Math.max(40, cardImage.width * 0.1));
          expect(cardImage.y + cardImage.height - body.y).toBeCloseTo(unit, 0);
          expect(
            cardImage.x + cardImage.width - (body.x + body.width),
          ).toBeCloseTo(unit, 0);
          expect(Math.round(body.x)).toBe(Math.round(cardImage.x));
        }
        await expect(lead.getByRole("heading", { level: 3 })).toHaveClass(
          /text-4xl/,
        );
        // One tab stop for the story and one for the eyebrow (C-01).
        await expect(lead.locator("a:not([tabindex='-1'])")).toHaveCount(2);
      });
    }

    test("lead bar and panel colors in the dark theme (C-01)", async ({
      page,
    }) => {
      await setTheme(page, "dark");
      await page.goto(p.path);
      const lead = page.locator('[data-section="hero"] [data-lead]');
      const colors = await lead.evaluate((el) => {
        const probe = document.createElement("span");
        probe.style.color = "var(--interactive)";
        document.body.append(probe);
        const interactive = getComputedStyle(probe).color;
        probe.remove();
        return {
          bar: getComputedStyle(el.querySelector("[data-lead-bar]")!)
            .backgroundColor,
          panel: getComputedStyle(el.querySelector("[data-lead-panel]")!)
            .backgroundColor,
          page: getComputedStyle(document.body).backgroundColor,
          interactive,
        };
      });
      expect(colors.bar).toBe(colors.interactive);
      expect(colors.panel).toBe(colors.page);
    });

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
      // A lead with no image shows the placeholder, with the same overlap (DR-338).
      await expect(hero.locator("[data-lead] [data-placeholder]")).toHaveCount(
        1,
      );
      await expect(hero.locator("[data-lead] img")).toHaveCount(0);
      const leadImage = await box(
        hero.locator("[data-lead] [data-placeholder]"),
      );
      const leadPanel = await box(hero.locator("[data-lead-panel]"));
      expect(leadImage.y + leadImage.height - leadPanel.y).toBeGreaterThan(0);
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
        hero.getByRole("heading", { level: 2, name: p.latest }),
      ).toBeVisible();
      // Latest has one more link, to the Latest page (C-03, C-10, DR-350).
      await expect(hero.getByRole("link", { name: p.more })).toHaveCount(1);
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
      // The image links have tabindex -1: one tab stop per story (C-01, C-02).
      const links = page.locator(
        '[data-section="hero"] a:not([tabindex="-1"])',
      );
      const count = await links.count();
      // Lead, two top stories and their three category links (Eyebrow, C-08), five Latest
      // items and the Latest MoreLink (DR-350).
      expect(count).toBe(12);

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
            outline: `${getComputedStyle(el).outlineStyle} ${getComputedStyle(el).outlineWidth}`,
          };
        });
        if (info) {
          expect(info.outline).toBe("solid 2px"); // COL-13, base rule
          seen.push(info.href);
        }
      }
      expect(seen).toHaveLength(count);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`axe in ${theme} theme`, async ({ page }) => {
        await setTheme(page, theme);
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

// R4-03: the Latest MoreLink to the Latest page (C-03, C-10, DR-350). The page is M2, so
// the link goes to 404 until then.
test.describe("Latest MoreLink (C-03, C-10, DR-350)", () => {
  for (const p of PAGES) {
    test(`${p.path}: text, href and the end edge below the list`, async ({
      page,
    }) => {
      for (const width of [360, 600, 768, 900, 1023, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const latest = page.locator("[data-latest]");
        const link = latest.getByRole("link", { name: p.more });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveText(
          p.lang === "bn" ? "আরও দেখুন" : "See more",
        );
        await expect(link).toHaveAttribute(
          "href",
          p.lang === "bn" ? "/latest" : "/en/latest",
        );
        const linkBox = await box(link);
        const listBox = await box(latest.locator("[data-story-list]"));
        const latestBox = await box(latest);
        // Below the list (also below both columns at 768 to 1023), at the end edge (CPT-15).
        expect(linkBox.y, `below the list at ${width}`).toBeGreaterThanOrEqual(
          listBox.y + listBox.height,
        );
        expect(
          Math.abs(linkBox.x + linkBox.width - (latestBox.x + latestBox.width)),
          `end edge at ${width}`,
        ).toBeLessThanOrEqual(0.5);
        expect(Math.round(linkBox.height)).toBeGreaterThanOrEqual(44);
        if (width >= 768 && width < 1024) {
          // Two columns: the link is below the taller column.
          const items = latest.locator("[data-story-list] > li");
          const last = await box(items.nth(2));
          const fifth = await box(items.nth(4));
          expect(fifth.x).toBeGreaterThan(last.x);
          expect(linkBox.y).toBeGreaterThanOrEqual(
            Math.max(last.y + last.height, fifth.y + fifth.height),
          );
        }
      }
    });
  }
});

// R5-01 checkpoint 4: Divider.column-inset between the two Latest columns at 768 to 1023
// (C-03, C-22, DR-355). Column-first: 1 to 3, then 4 and 5 (DR-125, LAY-14).
test.describe("Latest column rule (C-03, C-22, DR-355)", () => {
  for (const p of PAGES) {
    for (const theme of ["light", "dark"] as const) {
      test(`${p.path} ${theme}: rule between the columns at 768 to 1023 only`, async ({
        page,
      }) => {
        await setTheme(page, theme);
        const list = "[data-latest] [data-story-list]";
        for (const width of [767, 768, 1000, 1023, 1024]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          const rule = await columnRule(
            page,
            list,
            `${list} > li:nth-child(1)`,
            `${list} > li:nth-child(4)`,
          );
          if (width < 768 || width >= 1024) {
            expect(rule.shown, `rule at ${width}`).toBe(false);
            continue;
          }
          expect(rule.shown, `rule at ${width}`).toBe(true);
          expect(rule.width).toBe(1);
          expect(rule.color).toBe(
            await tokenBackground(page, "--color-border"),
          );
          // The gap stays --grid-column-gap (24px at 768 to 1023, DR-300).
          expect(rule.gap).toBe("24px");
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
          // Column order: items 1 to 3 in the first column, 4 and 5 in the second.
          const xs = await page
            .locator(`${list} > li`)
            .evaluateAll((items) =>
              items.map((li) => Math.round(li.getBoundingClientRect().left)),
            );
          expect(xs.length).toBe(5);
          expect(new Set(xs.slice(0, 3)).size).toBe(1);
          expect(new Set(xs.slice(3)).size).toBe(1);
          expect(xs[3]).toBeGreaterThan(xs[0]);
        }
      });
    }
  }
});
