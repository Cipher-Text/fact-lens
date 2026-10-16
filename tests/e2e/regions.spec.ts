import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { setTheme } from "./theme";

// FL-11: P-3b Regions (spacing-layout-system.md 7.1 to 7.4, 13; DR-19, DR-54;
// typography-system.md 7.1 region chip; LAY-02, LAY-03, LAY-12, LAY-14, LAY-17,
// TYP-09, COL-13).

const PAGES = [
  {
    path: "/",
    lang: "bn",
    // The P-3b heading reads অঞ্চলসমূহ (component-system.md 3.3, DR-345).
    title: "অঞ্চলসমূহ",
    previous: "আগের অঞ্চল",
    next: "পরের অঞ্চল",
  },
  {
    path: "/en",
    lang: "en",
    title: "Regions",
    previous: "Previous region",
    next: "Next region",
  },
] as const;

const WIDTHS = [
  320, 360, 599, 600, 767, 768, 834, 1023, 1024, 1180, 1280, 1366, 1440, 1920,
];

// Full content: 6 regions with stories (আফ্রিকা has none and is not shown).
const REGION_COUNT = 6;

// Regions in view (C-15, DR-140, DR-141).
const inViewAt = (width: number) => (width >= 1280 ? 4 : width >= 1024 ? 3 : 2);

const regions = (page: Page) => page.locator('[data-section="regions"]');
const row = (page: Page) => page.locator("[data-region-row]");

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

// From 600, the client code drops the tab roles once it runs: the slider is hydrated.
async function waitForSlider(page: Page) {
  await expect(regions(page).locator('[role="tabpanel"]')).toHaveCount(0);
}

const scrollLeft = (page: Page) =>
  row(page).evaluate((el) => Math.round(el.scrollLeft));

// A column is a fraction of a pixel wide at 1024 (3 in view): allow one pixel.
const expectScroll = (page: Page, target: number) =>
  expect
    .poll(async () => Math.abs((await scrollLeft(page)) - target))
    .toBeLessThanOrEqual(1);

for (const p of PAGES) {
  test.describe(`regions ${p.path}`, () => {
    for (const width of WIDTHS) {
      test(`layout at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);

        // No horizontal page scroll (LAY-02, Section 13).
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);

        const gutter = width < 600 ? 16 : 24;
        const shell = Math.min(width - 2 * gutter, 1280);
        const columnGap = width >= 1280 ? 32 : width >= 768 ? 24 : 16; // DR-300

        const s = regions(page);
        const sectionBox = await box(s);
        expect(Math.round(sectionBox.width)).toBe(shell); // LAY-03

        const panels = s.locator("[data-region]");
        await expect(panels).toHaveCount(REGION_COUNT);
        const tablist = s.getByRole("tablist");
        const previous = s.getByRole("button", { name: p.previous });
        const next = s.getByRole("button", { name: p.next });

        if (width < 600) {
          // Tabs: one panel shows, at shell width (7.4).
          await expect(tablist).toBeVisible();
          await expect(previous).toBeHidden();
          await expect(next).toBeHidden();
          await expect(s.locator("[data-region]:visible")).toHaveCount(1);
          const panel = s.getByRole("tabpanel");
          await expect(panel).toHaveCount(1);
          expect(Math.round((await box(panel)).width)).toBe(shell);
          // The tab strip scrolls without a scrollbar.
          expect(
            await tablist.evaluate((el) => getComputedStyle(el).scrollbarWidth),
          ).toBe("none");
          // A chip is as wide as its label and 44px tall or more (TYP-09).
          const chips = await s.getByRole("tab").evaluateAll((tabs) =>
            tabs.map((t) => ({
              height: t.getBoundingClientRect().height,
              clipped: t.scrollWidth > t.clientWidth + 1,
              font: getComputedStyle(t).fontSize,
            })),
          );
          for (const chip of chips) {
            expect(chip.height).toBeGreaterThanOrEqual(44);
            expect(chip.clipped).toBe(false);
          }
        } else {
          // Slider: 2 regions in view, 3 from 1024, 4 from 1280 (C-15), at the column gap.
          await expect(tablist).toBeHidden();
          await expect(s.getByRole("tabpanel")).toHaveCount(0);
          // Each column is a named group, not one more landmark.
          await expect(s.getByRole("group")).toHaveCount(REGION_COUNT);
          await expect(s.getByRole("region")).toHaveCount(0);
          const inView = inViewAt(width);
          const b = await Promise.all([0, 1, 2].map((i) => box(panels.nth(i))));
          const column = (shell - (inView - 1) * columnGap) / inView;
          expect(Math.abs(b[0].width - column)).toBeLessThanOrEqual(1);
          expect(Math.round(b[1].x - (b[0].x + b[0].width))).toBe(columnGap);
          // The first column starts at the shell edge.
          expect(Math.round(b[0].x)).toBe(Math.round(sectionBox.x));
          // All columns are in one row.
          expect(Math.round(b[2].y)).toBe(Math.round(b[0].y));
          // 6 regions: buttons show, previous disabled at the start.
          await expect(previous).toBeVisible();
          await expect(previous).toHaveAttribute("aria-disabled", "true");
          await expect(next).not.toHaveAttribute("aria-disabled");
          // The filled slider buttons stay 44 x 44 (C-12, DR-349).
          for (const button of [previous, next]) {
            const size = await button.boundingBox();
            expect([
              Math.round(size?.width ?? 0),
              Math.round(size?.height ?? 0),
            ]).toEqual([44, 44]);
          }
          const style = await row(page).evaluate((el) => ({
            snap: getComputedStyle(el).scrollSnapType,
            scrollbar: getComputedStyle(el).scrollbarWidth,
          }));
          expect(style.snap).toContain("x");
          // The scrollbar is hidden (C-15).
          expect(style.scrollbar).toBe("none");
        }

        // After the Most read ad row: space-module above (LAY-12). Last section.
        const space = width >= 1024 ? 40 : width >= 768 ? 32 : 24;
        const prev = s.locator("xpath=preceding-sibling::*[1]");
        await expect(prev).toHaveAttribute("data-ad-slot", "ad-band");
        expect(await s.evaluate((el) => getComputedStyle(el).paddingTop)).toBe(
          `${space}px`,
        );

        // No text is clipped (LAY-17, TYP-09).
        const overflowing = await s.evaluate((el) =>
          [...el.querySelectorAll(":is(h2, h3, h4, a):not(.sr-only)")]
            // Skip hidden panels and the phone heading, which is visually hidden
            // (sr-only, 1px) because the chip names the panel.
            .filter((n) => (n as HTMLElement).offsetParent !== null)
            .filter((n) => n.getBoundingClientRect().width > 1)
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

    for (const width of [600, 1024, 1366]) {
      test(`buttons move one region and stop at each end at ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        await waitForSlider(page);
        const s = regions(page);
        const previous = s.getByRole("button", { name: p.previous });
        const next = s.getByRole("button", { name: p.next });
        const panels = s.locator("[data-region]");
        const [a, b] = await Promise.all([
          box(panels.nth(0)),
          box(panels.nth(1)),
        ]);
        const step = Math.round(b.x - a.x);
        const inView = inViewAt(width);
        const moves = REGION_COUNT - inView;

        for (let i = 1; i <= moves; i++) {
          await next.click();
          await expectScroll(page, i * step);
        }
        // At the end: next is disabled, a press does nothing. No loop.
        await expect(next).toHaveAttribute("aria-disabled", "true");
        await expect(previous).not.toHaveAttribute("aria-disabled");
        // Playwright does not click an aria-disabled button, so send the event.
        await next.dispatchEvent("click");
        // Wait for animation frames, not for a time: the test must not depend on the machine.
        await page.evaluate(async () => {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => requestAnimationFrame(r));
          }
        });
        expect(
          Math.abs((await scrollLeft(page)) - moves * step),
        ).toBeLessThanOrEqual(1);

        // Keyboard on the buttons; focus stays on the disabled button (COL-13).
        await previous.focus();
        for (let i = moves - 1; i >= 0; i--) {
          await page.keyboard.press("Enter");
          await expectScroll(page, i * step);
        }
        await expect(previous).toHaveAttribute("aria-disabled", "true");
        await expect(previous).toBeFocused();
      });
    }

    test("swipe (native scroll) updates the buttons, and snaps to a column", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 900 });
      await page.goto(p.path);
      await waitForSlider(page);
      const s = regions(page);
      const r = row(page);
      await r.evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
      });
      await expect(s.getByRole("button", { name: p.next })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await expect(
        s.getByRole("button", { name: p.previous }),
      ).not.toHaveAttribute("aria-disabled");
      await page.mouse.move(400, 400);
      await r.hover();
      await page.mouse.wheel(-100, 0);
      // Mandatory snap ends on a column start, not part way.
      const panels = s.locator("[data-region]");
      const [a, b] = await Promise.all([
        box(panels.nth(0)),
        box(panels.nth(1)),
      ]);
      const step = b.x - a.x;
      await expect
        .poll(async () => (await scrollLeft(page)) % Math.round(step))
        .toBe(0);
    });

    test("touch: a swipe moves the row and snaps to a column; a tap selects a tab", async ({
      browser,
      browserName,
    }) => {
      test.skip(
        browserName !== "chromium",
        "The swipe uses a Chromium CDP gesture",
      );
      const context = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 768, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(p.path);
      await waitForSlider(page);
      const s = regions(page);
      await s.scrollIntoViewIfNeeded();
      const panels = s.locator("[data-region]");
      const [a, b] = await Promise.all([
        box(panels.nth(0)),
        box(panels.nth(1)),
      ]);
      const step = b.x - a.x;
      const rowBox = await box(row(page));
      // A touch swipe to the start side (a real finger drag, through the browser).
      const client = await context.newCDPSession(page);
      await client.send("Input.synthesizeScrollGesture", {
        x: rowBox.x + rowBox.width / 2,
        y: rowBox.y + 100,
        xDistance: -step,
        yDistance: 0,
        gestureSourceType: "touch",
      });
      await expect.poll(() => scrollLeft(page)).toBeGreaterThan(step / 2);
      await expect
        .poll(async () => {
          const left = await scrollLeft(page);
          return Math.abs(left / step - Math.round(left / step)) < 0.02;
        })
        .toBe(true);
      await expect(
        s.getByRole("button", { name: p.previous }),
      ).not.toHaveAttribute("aria-disabled");
      // No sideways page scroll.
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(768);

      // Phone: a tap on a chip selects its region.
      await page.setViewportSize({ width: 320, height: 800 });
      await expect(s.getByRole("tab").first()).toBeVisible();
      await s.getByRole("tab").nth(2).tap();
      await expect(s.getByRole("tab").nth(2)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(s.getByRole("tabpanel")).toHaveAttribute(
        "id",
        (await s.getByRole("tab").nth(2).getAttribute("aria-controls"))!,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(320);
      await context.close();
    });

    test("reduced motion: a button press moves at once", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(p.path);
      await waitForSlider(page);
      const s = regions(page);
      const before = await scrollLeft(page);
      // Read the position in the same task as the click: no animation frames.
      const after = await s
        .getByRole("button", { name: p.next })
        .evaluate((button, start) => {
          (button as HTMLButtonElement).click();
          const el = document.querySelector<HTMLElement>("[data-region-row]")!;
          return Math.round(el.scrollLeft) - start;
        }, before);
      expect(after).toBeGreaterThan(0);
    });

    test("with motion: a button press animates and does not jump", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(p.path);
      await waitForSlider(page);
      // The test checks what the reader sees, not how long it takes: the speed depends on
      // the frame rate of the machine (the 450ms and the curve are set in the component).
      const result = await page.evaluate(async () => {
        const el = document.querySelector<HTMLElement>("[data-region-row]")!;
        const button =
          document.querySelector<HTMLElement>("[data-region-next]")!;
        button.click();
        const sameTask = el.scrollLeft;
        const positions = [sameTask];
        let still = 0;
        while (still < 30 && positions.length < 600) {
          await new Promise((r) => requestAnimationFrame(r));
          const now = el.scrollLeft;
          still = now === positions[positions.length - 1] ? still + 1 : 0;
          positions.push(now);
        }
        return { sameTask, positions };
      });
      const end = result.positions[result.positions.length - 1];
      expect(result.sameTask).toBe(0);
      expect(end).toBeGreaterThan(0);
      // At least one frame between the start and the end: it animates, it does not jump.
      expect(result.positions.some((x) => x > 0 && x < end - 1)).toBe(true);
    });

    test("phone tabs: a chip press fades the panel out, then the new one in, 450ms ease-slide each, opacity only (DR-284, DR-346)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const s = regions(page);
      const tabs = s.getByRole("tab");
      const row = s.locator("[data-region-row]");
      const duration = await row.evaluate((el) => {
        const style = getComputedStyle(el);
        return [
          style.transitionProperty,
          style.transitionDuration,
          style.transitionTimingFunction,
        ];
      });
      expect(duration).toEqual([
        "opacity",
        "0.45s",
        "cubic-bezier(0.22, 1, 0.36, 1)",
      ]);
      const samples = await row.evaluate(
        (el) =>
          new Promise<number[]>((resolve) => {
            const seen: number[] = [];
            const start = performance.now();
            const frame = () => {
              seen.push(parseFloat(getComputedStyle(el).opacity));
              if (performance.now() - start < 1200)
                requestAnimationFrame(frame);
              else resolve(seen);
            };
            document
              .querySelector<HTMLElement>('[role="tab"]:nth-child(2)')!
              .click();
            frame();
          }),
      );
      // Out to (almost) 0, then back to 1: both fades happen, one after the other.
      expect(Math.min(...samples)).toBeLessThan(0.1);
      expect(samples.some((x) => x > 0.2 && x < 0.9)).toBe(true);
      expect(samples.at(-1)).toBe(1);
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      await expect(s.getByRole("tabpanel")).toHaveCount(1);
    });

    test("phone tabs: with reduced motion a press changes the panel at once (DR-151)", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const s = regions(page);
      await s.getByRole("tab").nth(1).click();
      await expect(s.getByRole("tab").nth(1)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(s.locator("[data-region-row]")).toHaveCSS("opacity", "1");
    });

    test("phone tabs: arrow keys, Home and End select a region", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.path);
      const s = regions(page);
      const tabs = s.getByRole("tab");
      await expect(tabs).toHaveCount(REGION_COUNT);
      await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

      // One tab stop for the tablist (roving tabindex).
      await tabs.first().focus();
      await page.keyboard.press("ArrowRight");
      await expect(tabs.nth(1)).toBeFocused();
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
      const panel = s.getByRole("tabpanel");
      await expect(panel).toHaveCount(1);
      await expect(panel).toHaveAttribute(
        "id",
        (await tabs.nth(1).getAttribute("aria-controls"))!,
      );

      // End: the last chip is selected and scrolls into view.
      await page.keyboard.press("End");
      const last = tabs.nth(REGION_COUNT - 1);
      await expect(last).toBeFocused();
      await expect(last).toHaveAttribute("aria-selected", "true");
      await expect(last).toBeInViewport({ ratio: 1 });
      await page.keyboard.press("ArrowRight");
      await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("ArrowLeft");
      await expect(last).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Home");
      await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

      // Tab leaves the tablist and goes into the panel.
      await page.keyboard.press("Tab");
      const inPanel = await page.evaluate(
        () => !!document.activeElement?.closest('[role="tabpanel"]'),
      );
      expect(inPanel).toBe(true);

      // A click selects too.
      await tabs.nth(2).click();
      await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    });

    test("a #region-<id> link selects the region on phones", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`${p.path}#region-europe`);
      const panel = regions(page).getByRole("tabpanel");
      await expect(panel).toHaveAttribute("id", "region-europe");
      await expect(panel).toBeInViewport();
    });

    // Sparse: 3 regions after the empty one is removed (7.3). 2 are in view at 600 to 1023,
    // so the buttons show there; 3 are in view from 1024, so they do not (DR-140).
    for (const width of [360, 600, 1024, 1280]) {
      test(`sparse content at ${width}: buttons only while regions are out of view (7.3)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${p.path}?content=sparse`);
        const s = regions(page);
        const ids = await s
          .locator("[data-region]")
          .evaluateAll((els) => els.map((e) => e.getAttribute("data-region")));
        expect(ids.length).toBeLessThanOrEqual(4);
        expect(ids).not.toContain("africa");
        const buttons = [
          s.getByRole("button", { name: p.previous }),
          s.getByRole("button", { name: p.next }),
        ];
        for (const button of buttons) {
          if (width >= 600 && width < 1024) await expect(button).toBeVisible();
          else await expect(button).toBeHidden();
        }
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scroll).toBeLessThanOrEqual(width);
      });
    }

    test("each panel: region name, a 3:2 image story and two text stories; one section link", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(p.path);
      const s = regions(page);
      const panels = s.locator("[data-region]");
      for (let i = 0; i < REGION_COUNT; i++) {
        const panel = panels.nth(i);
        await expect(panel.locator("h3")).toHaveCount(1);
        await expect(panel.locator("[data-story-card]")).toHaveCount(1);
        // The image or, for a story with no image, the placeholder in the same slot (DR-338).
        const image = await box(panel.locator("[data-story-media] > *"));
        expect(Math.abs(image.width / image.height - 1.5)).toBeLessThan(0.02);
        expect(
          await panel.locator("[data-story-list-item]").count(),
        ).toBeLessThanOrEqual(2);
        // Rules between the stories, none above the first or around the card (CPT-06).
        const rules = await panel
          .locator(":scope > ul > li")
          .evaluateAll((items) =>
            items.map((li) => getComputedStyle(li, "::before").display),
          );
        expect(rules[0]).toBe("none");
        for (const rule of rules.slice(1)) expect(rule).toBe("block");
      }
      // One "more" link at the section end, at the end edge, to the regions page.
      const more = s.getByRole("link", { name: /^(আরও দেখুন|See more)/ });
      await expect(more).toHaveCount(1);
      await expect(more).toHaveAttribute(
        "href",
        p.lang === "bn" ? "/regions" : "/en/regions",
      );
      const [m, sb] = await Promise.all([box(more), box(s)]);
      expect(Math.round(m.x + m.width)).toBe(Math.round(sb.x + sb.width));
      expect(m.y).toBeGreaterThan(
        (await box(panels.nth(0))).y + (await box(panels.nth(0))).height - 1,
      );
    });

    for (const theme of ["light", "dark"] as const) {
      for (const width of [360, 1280]) {
        test(`axe in ${theme} theme at ${width}`, async ({ page }) => {
          await setTheme(page, theme);
          await page.setViewportSize({ width, height: 900 });
          await page.goto(p.path);
          await expect(regions(page)).toBeVisible();
          await expectNoBlockingAxe(page);
        });
      }
    }

    test("heading, region names and language", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const s = regions(page);
      await expect(
        page.getByRole("region", { name: p.title, exact: true }),
      ).toHaveAttribute("id", "regions");
      await expect(
        s.getByRole("heading", { level: 2, name: p.title, exact: true }),
      ).toBeVisible();
      await expect(s.getByRole("heading", { level: 3 })).toHaveCount(
        REGION_COUNT,
      );

      const text = (await s.innerText()).replace(/\s+/g, " ");
      if (p.lang === "bn") {
        // No English words and no Latin digits on a Bangla page (T-27, TYP-17).
        expect(text).not.toMatch(/[A-Za-z0-9]/);
        await expect(
          s.getByRole("heading", { level: 3, name: "চীন", exact: true }),
        ).toBeVisible(); // DR-19
      } else {
        expect(text).not.toMatch(/[ঀ-৿]/);
      }
    });

    test("keyboard: every link in every region is reachable with the focus ring", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(p.path);
      const selector = "[data-region-row]";
      // The image links are not tab stops (tabindex -1): the title link is the one stop.
      const total = await row(page).locator('a:not([tabindex="-1"])').count();
      const seen = new Set<string>();
      await page.getByRole("button", { name: p.next }).focus();
      for (let i = 0; i < 80 && seen.size < total; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest(sel)) return null;
          const r = el.getBoundingClientRect();
          const rowBox = el.closest(sel)!.getBoundingClientRect();
          return {
            name: el.getAttribute("href") ?? el.tagName,
            // The base outline (COL-13).
            ring: (() => {
              const s = getComputedStyle(el);
              return s.outlineStyle === "solid" && s.outlineWidth === "2px"
                ? "outline"
                : "missing";
            })(),
            // The focused link scrolls into the row's view.
            inView: r.left >= rowBox.left - 1 && r.right <= rowBox.right + 1,
          };
        }, selector);
        if (info) {
          expect(info.ring, info.name).toBe("outline"); // COL-13
          expect(info.inView, info.name).toBe(true);
          seen.add(info.name);
        }
      }
      expect(seen.size).toBe(total);
    });
  });
}

test("page order: P-5, ad, P-3b (7.1)", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main > *");
  await expect(main.nth(10)).toHaveAttribute("data-section", "most-read");
  await expect(main.nth(11)).toHaveAttribute("data-ad-slot", "ad-band");
  await expect(main.nth(12)).toHaveAttribute("data-section", "regions");
  await expect(main).toHaveCount(13);
});
