import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The URL format (spacing-layout-system.md 7C; DR-401, DR-410, DR-411, DR-413, DR-414).
// One article URL, /story/<slug>-<id>, found by <id>: a wrong or old slug gets a 301, an
// unknown id and a bare root give a 404. Topics link to /topic/<slug>. An article in one
// language only has no hreflang to the other, and its language switch goes to the
// category page in the other language, which shows a note.

const RIVER = "river-data-framework-t3txcff";
const LEDGERS = "old-dhaka-trade-ledgers-wa78nf3";

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

for (const prefix of ["", "/en"]) {
  test.describe(`article URLs ${prefix || "/"}`, () => {
    test("the current URL opens the article", async ({ page }) => {
      const response = await page.goto(`${prefix}/story/${RIVER}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    });

    for (const old of ["wrong-slug-t3txcff", "river-data-framework"]) {
      test(`${old} gets a 301 to the current URL, query kept (DR-413)`, async ({
        request,
      }) => {
        const response = await request.get(`${prefix}/story/${old}?x=1`, {
          maxRedirects: 0,
        });
        expect(response.status()).toBe(301);
        expect(new URL(response.headers().location!, "http://x").pathname).toBe(
          `${prefix}/story/${RIVER}`,
        );
        expect(response.headers().location).toContain("x=1");
      });
    }

    for (const path of ["/story", "/story/no-such-story-zzzzzzz", "/story/x"]) {
      test(`${path} is a 404`, async ({ request }) => {
        const response = await request.get(`${prefix}${path}`, {
          maxRedirects: 0,
        });
        expect(response.status()).toBe(404);
      });
    }

    test("story links on the homepage are /story/<slug>-<id>", async ({
      page,
    }) => {
      await page.goto(prefix || "/");
      const hrefs = await page
        .locator('main a[href*="/story/"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")!));
      expect(hrefs.length).toBeGreaterThan(10);
      for (const href of hrefs)
        expect(href).toMatch(
          new RegExp(`^${prefix}/story/[a-z0-9]+(-[a-z0-9]+)*-[0-9a-z]{6,8}$`),
        );
    });

    test("topics link to /topic/<slug>, and no tag link is left (DR-410)", async ({
      page,
    }) => {
      await page.goto(`${prefix}/story/${RIVER}`);
      const topics = page.locator(".rd-topics a");
      await expect(topics).toHaveCount(4);
      expect(
        await topics.evaluateAll((els) =>
          els.map((el) => el.getAttribute("href")),
        ),
      ).toEqual(
        ["rivers", "monsoon", "flood-forecasting", "regional-cooperation"].map(
          (slug) => `${prefix}/topic/${slug}`,
        ),
      );
      await expect(page.locator('a[href*="/tag/"]')).toHaveCount(0);
    });

    test("an article in both languages has hreflang to both", async ({
      page,
    }) => {
      await page.goto(`${prefix}/story/${RIVER}`);
      const alternates = page.locator('link[rel="alternate"][hreflang]');
      expect(
        await alternates.evaluateAll((els) =>
          els.map((el) => el.getAttribute("hreflang")),
        ),
      ).toEqual(["bn", "en"]);
    });
  });
}

test.describe("missing translation (DR-401)", () => {
  test("a Bangla-only article has no English page and no hreflang to English", async ({
    page,
    request,
  }) => {
    expect((await request.get(`/en/story/${LEDGERS}`)).status()).toBe(404);
    await page.goto(`/story/${LEDGERS}`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveCount(0);
  });

  test("its language switch goes to the English category page, which shows the note", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/story/${LEDGERS}`);
    const toggle = page.locator("[data-top-bar] a[hreflang='en']");
    await expect(toggle).toHaveAttribute(
      "href",
      "/en/category/history?lang=en&only=bn",
    );
    await toggle.click();
    await expect(page).toHaveURL(/\/en\/category\/history\?only=bn$/);
    const note = page.getByRole("status").filter({
      hasText: "This story is in Bangla only.",
    });
    await expect(note).toBeVisible();
    // The note is in the page language only (T-27).
    expect(await note.innerText()).not.toMatch(/[ঀ-৿]/);
    await expectNoBlockingAxe(page);
  });

  test("the category page shows no note without the query", async ({
    page,
  }) => {
    await page.goto("/en/category/history");
    await expect(page.getByText("This story is in Bangla only.")).toHaveCount(
      0,
    );
    // The status region is always there, empty, so text added after hydration is
    // announced (PR #15 review).
    await expect(page.locator("[data-note][role=status]")).toHaveText("");
  });

  test("an article in both languages keeps the switch to the same article", async ({
    page,
  }) => {
    await page.goto(`/story/${RIVER}`);
    await expect(
      page.locator("[data-top-bar] a[hreflang='en']"),
    ).toHaveAttribute("href", `/en/story/${RIVER}?lang=en`);
  });
});

// C-08 Eyebrow modes (DR-417). The sparse homepage leads with an analysis story: the hero is
// a mixed list, so its Eyebrow is the format. The analysis section keeps the category.
for (const prefix of ["", "/en"]) {
  test(`Eyebrow format mode in the hero, category in analysis ${prefix || "/"}`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/?content=sparse`);
    const leadEyebrow = page.locator("[data-lead] .case-eyebrow a");
    await expect(leadEyebrow).toHaveAttribute("href", `${prefix}/analysis`);
    await expect(leadEyebrow).toHaveText(prefix ? /analysis/i : "বিশ্লেষণ");
    // The top story is news: its category.
    await expect(
      page.locator("[data-top-stories] .case-eyebrow a").first(),
    ).toHaveAttribute("href", new RegExp(`^${prefix}/category/`));
    // Analysis section cards: the category, never the format.
    const analysisEyebrows = page.locator(
      "[data-section=analysis-opinion] .case-eyebrow a",
    );
    await expect(analysisEyebrows.first()).toBeVisible();
    for (const href of await analysisEyebrows.evaluateAll((links) =>
      links.map((a) => a.getAttribute("href")),
    )) {
      expect(href).toMatch(new RegExp(`^${prefix}/category/`));
    }
  });
}

// ArticleHeader.category (C-27, C-08 two-part; DR-416): text links, no filled button. News
// shows the category; analysis shows format · category.
const RESERVES = "reserve-indicators-";
for (const prefix of ["", "/en"]) {
  test.describe(`article Eyebrow ${prefix || "/"}`, () => {
    test("a news article shows the category as a text link", async ({
      page,
    }) => {
      await page.goto(`${prefix}/story/${RIVER}`);
      const row = page.locator("article .rd-category");
      const links = row.getByRole("link");
      await expect(links).toHaveCount(1);
      await expect(links).toHaveAttribute(
        "href",
        new RegExp(`^${prefix}/category/`),
      );
      await expect(row.locator("[data-eyebrow-separator]")).toHaveCount(0);
      // No fill: the link has no background color.
      expect(
        await links.evaluate((a) => getComputedStyle(a).backgroundColor),
      ).toBe("rgba(0, 0, 0, 0)");
    });

    test("an analysis article shows format · category", async ({ page }) => {
      await page.goto(prefix || "/");
      const href = await page
        .locator(`a[href*="/story/${RESERVES}"]`)
        .first()
        .getAttribute("href");
      await page.goto(href!);
      const row = page.locator("article .rd-category");
      const links = row.getByRole("link");
      await expect(links).toHaveCount(2);
      await expect(links.nth(0)).toHaveAttribute("href", `${prefix}/analysis`);
      await expect(links.nth(1)).toHaveAttribute(
        "href",
        `${prefix}/category/economy`,
      );
      // The separator is the CPT-10 square in the Eyebrow color (DR-435): 4px, 10px each
      // side, centered on the row, and it keeps its color while a link is hovered.
      const separator = row.locator("[data-eyebrow-separator]");
      await expect(separator).toHaveText("");
      const drawn = () =>
        separator.evaluate((el) => {
          const s = getComputedStyle(el);
          const link = el.previousElementSibling!;
          const a = el.getBoundingClientRect();
          const b = link.getBoundingClientRect();
          return {
            width: a.width,
            height: a.height,
            marginStart: parseFloat(s.marginInlineStart),
            marginEnd: parseFloat(s.marginInlineEnd),
            radius: s.borderRadius,
            bg: s.backgroundColor,
            linkColor: getComputedStyle(link).color,
            centerOffset: Math.abs(
              a.top + a.height / 2 - (b.top + b.height / 2),
            ),
          };
        });
      const before = await drawn();
      expect(before).toMatchObject({
        width: 4,
        height: 4,
        marginStart: 10,
        marginEnd: 10,
        radius: "0px",
      });
      expect(before.bg).toBe(before.linkColor);
      expect(before.centerOffset).toBeLessThanOrEqual(1);
      await links.nth(0).hover();
      expect((await drawn()).bg).toBe(before.bg);
      for (const i of [0, 1]) {
        expect(
          await links
            .nth(i)
            .evaluate((a) => getComputedStyle(a).backgroundColor),
        ).toBe("rgba(0, 0, 0, 0)");
      }
      // The row stays in the reading column at 320px, with no sideways scroll.
      await page.setViewportSize({ width: 320, height: 800 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      // The heading rises in (rd-rise): axe reads a lighter color while it fades, so wait
      // for the animations to end.
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((a) => a.finished)),
      );
      await expectNoBlockingAxe(page);
    });
  });
}
