import { expect, test } from "@playwright/test";

// 200% browser text size (spacing-layout-system.md Section 13, DR-81): no row scrolls
// sideways. The browser's own font-size setting is set to 32px, so the rem breakpoints
// move with it, as they do for a reader. Setting the root font size in the page would
// leave the media queries at 16px. Chromium only: WebKit has no such switch.

const WIDTHS = [320, 768, 1024];

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "the font-size setting can only be set in Chromium",
);
test.use({
  launchOptions: {
    args: ["--blink-settings=defaultFontSize=32,defaultFixedFontSize=26"],
  },
});

test.describe("200% browser text size", () => {
  for (const p of [
    { name: "bn", path: "/" },
    { name: "en", path: "/en" },
    // The Latest page (layout 7D).
    { name: "latest bn", path: "/latest" },
    { name: "latest en", path: "/en/latest" },
  ]) {
    for (const width of WIDTHS) {
      test(`${p.name} at ${width}: nothing scrolls sideways`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        expect(
          await page.evaluate(
            () => getComputedStyle(document.documentElement).fontSize,
          ),
          "the browser text size is 200%",
        ).toBe("32px");

        const result = await page.evaluate(() => {
          const doc = document.documentElement;
          // Elements that stick out of the viewport and are not inside a scroller
          // made for it (the regions slider).
          const out: string[] = [];
          for (const el of document.body.querySelectorAll("*")) {
            const r = el.getBoundingClientRect();
            // Hidden text for screen readers is 1px wide.
            if (r.width <= 1 || r.height <= 1) continue;
            if (r.right <= doc.clientWidth + 0.5 && r.left >= -0.5) continue;
            let inScroller = false;
            for (
              let a = el.parentElement;
              a && a !== document.body;
              a = a.parentElement
            ) {
              const ox = getComputedStyle(a).overflowX;
              if (ox === "auto" || ox === "scroll" || ox === "hidden") {
                inScroller = true;
                break;
              }
            }
            if (inScroller) continue;
            out.push(
              `${el.tagName.toLowerCase()} ${Math.round(r.left)}-${Math.round(r.right)} "${(el.textContent ?? "").trim().slice(0, 24)}" in ${el.closest("[data-section],section,header,footer")?.getAttribute("class")?.slice(0, 30) ?? "?"}`,
            );
          }
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            out: out.slice(0, 40),
          };
        });

        expect(
          result.scrollWidth,
          JSON.stringify(result.out),
        ).toBeLessThanOrEqual(result.clientWidth);
        expect(result.out).toEqual([]);
      });
    }
  }

  // C-24, DR-308: a StoryCard row stacks (image above the text) when its container is narrower
  // than 17.5rem. The rule is in rem, so at 200% text it is 560px and the rows stack on the
  // phone and tablet widths; at normal text it is 280px and no row stacks.
  for (const p of [
    { name: "bn", path: "/" },
    { name: "en", path: "/en" },
  ]) {
    for (const width of [...WIDTHS, 1280]) {
      test(`${p.name} at ${width}: a story row stacks when its card is under 17.5rem`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(p.path);
        const cards = await page.evaluate(() => {
          const rem = parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          );
          return [...document.querySelectorAll("[data-story-card]")]
            .filter((card) => {
              const layout = card.getAttribute("data-layout") ?? "";
              return layout === "row" || layout === "row-until-lg";
            })
            .map((card) => {
              const media = card
                .querySelector("[data-story-media]")!
                .getBoundingClientRect();
              const body = card
                .querySelector(".story-body")!
                .getBoundingClientRect();
              return {
                width: card.getBoundingClientRect().width,
                limit: 17.5 * rem,
                stacked: media.bottom <= body.top + 0.5,
                rows: getComputedStyle(card.firstElementChild!)
                  .gridTemplateAreas,
              };
            });
        });
        for (const card of cards) {
          // A row-until-lg card stacks from 1024 by its layout, not by its width.
          if (width >= 1024 && card.stacked) continue;
          expect(card.stacked, JSON.stringify(card)).toBe(
            card.width < card.limit,
          );
        }
      });
    }
  }
});
