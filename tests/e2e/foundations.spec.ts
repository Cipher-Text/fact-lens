import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// FL-02: languages, cookie, theme, fonts and the temporary foundations page.

async function expectNoBlockingAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test.describe("language URLs (DR-17)", () => {
  test("Bangla is at the root and English under /en", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("/bn redirects to the root URL", async ({ page }) => {
    await page.goto("/bn/foundations");
    expect(new URL(page.url()).pathname).toBe("/foundations");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  });

  test("no redirect by browser language", async ({ browser }) => {
    const context = await browser.newContext({
      locale: "en-US",
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    });
    const page = await context.newPage();
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await context.close();
  });

  test("an unknown ?lang value sets no cookie", async ({ page, context }) => {
    await page.goto("/foundations?lang=fr");
    expect(new URL(page.url()).pathname).toBe("/foundations");
    expect(new URL(page.url()).search).toBe("");
    const cookie = (await context.cookies()).find((c) => c.name === "fl-lang");
    expect(cookie).toBeUndefined();
  });

  test("the language switch keeps the choice in a cookie", async ({
    page,
    context,
  }) => {
    await page.goto("/foundations");
    const toEnglish = page.getByRole("link", { name: "English" });
    await expect(toEnglish).toHaveAttribute("lang", "en");
    await toEnglish.click();
    await expect(page).toHaveURL(/\/en\/foundations$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    const cookie = (await context.cookies()).find((c) => c.name === "fl-lang");
    expect(cookie?.value).toBe("en");

    // The remembered choice opens the English front page.
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/en");

    // Choosing Bangla again stores bn and opens the Bangla page.
    await page.getByRole("link", { name: "বাংলা" }).click();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("interface language (T-27)", () => {
  test("Bangla page shows Bangla interface text", async ({ page }) => {
    await page.goto("/foundations");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "ডিজাইন ভিত্তি",
    );
    await expect(page.getByRole("group", { name: "থিম" })).toBeVisible();
  });

  test("English page shows English interface text", async ({ page }) => {
    await page.goto("/en/foundations");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Design foundations",
    );
    await expect(page.getByRole("group", { name: "Theme" })).toBeVisible();
  });
});

test.describe("theme switch", () => {
  test("starts at system and follows the system theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/en/foundations");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(page.getByRole("button", { name: "System" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.emulateMedia({ colorScheme: "light" });
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("light and dark override the system and survive a reload", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/en/foundations");
    await page.getByRole("button", { name: "Light" }).click();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Dark" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(background).toBe("rgb(24, 25, 30)");
  });

  test("the stored theme is set before the first paint", async ({ page }) => {
    // Record the theme when <body> first appears, before anything paints.
    await page.addInitScript(() => {
      localStorage.setItem("fl-theme", "dark");
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        (window as unknown as { themeAtBody: string }).themeAtBody =
          document.documentElement.className.includes("dark")
            ? "dark"
            : "light";
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/foundations");
    const atBody = await page.evaluate(
      () => (window as unknown as { themeAtBody?: string }).themeAtBody,
    );
    expect(atBody).toBe("dark");
  });

  test("works with the keyboard and shows the focus ring (COL-13)", async ({
    page,
  }) => {
    await page.goto("/en/foundations");
    await page.keyboard.press("Tab"); // language switch
    await expect(page.getByRole("link", { name: "বাংলা" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const dark = page.getByRole("button", { name: "Dark" });
    await expect(dark).toBeFocused();
    // COL-13: a 2px `interactive` ring with a 2px offset in the page background.
    // The ring is a box-shadow: offset layer 0 0 0 2px, ring layer 0 0 0 4px.
    const shadow = await dark.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("rgb(255, 249, 237) 0px 0px 0px 2px"); // background
    expect(shadow).toContain("rgb(153, 51, 20) 0px 0px 0px 4px"); // interactive
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("fonts (typography-system.md Section 8.1)", () => {
  test("Bangla and English roles use their own fonts", async ({ page }) => {
    await page.goto("/en/foundations");
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      const family = (selector: string) =>
        getComputedStyle(document.querySelector(selector)!).fontFamily;
      return {
        enSerif: family('p.type-story-lead[lang="en"]'),
        enSans: family('p.type-ui[lang="en"]'),
        bnSerif: family('p.type-story-lead[lang="bn"]'),
        bnSans: family('p.type-ui[lang="bn"]'),
        loaded: [
          ...new Set(
            [...document.fonts]
              .filter((f) => f.status === "loaded")
              .map((f) => f.family.replace(/"/g, "")),
          ),
        ],
      };
    });
    expect(fonts.enSerif).toMatch(/^"?Source Serif 4/);
    expect(fonts.enSans).toMatch(/^"?Plus Jakarta Sans/);
    expect(fonts.bnSerif).toMatch(/^"?Noto Serif Bengali/);
    expect(fonts.bnSans).toMatch(/^"?Noto Sans Bengali/);
    expect(fonts.loaded).toEqual(
      expect.arrayContaining([
        "Source Serif 4",
        "Plus Jakarta Sans",
        "Noto Serif Bengali",
        "Noto Sans Bengali",
      ]),
    );
  });
});

test.describe("foundations page", () => {
  for (const path of ["/foundations", "/en/foundations"]) {
    for (const scheme of ["light", "dark"] as const) {
      test(`${path} in ${scheme} has no serious axe violations`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          scheme,
        );
        await expectNoBlockingAxe(page);
      });
    }

    for (const width of [320, 360, 768, 1280]) {
      test(`${path} has no horizontal scroll at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scrollWidth).toBeLessThanOrEqual(width);
      });
    }
  }

  test("shows all 22 type roles in both languages", async ({ page }) => {
    await page.goto("/foundations");
    await expect(page.locator('p[lang="bn"][class*="type-"]')).toHaveCount(22);
    await expect(page.locator('p[lang="en"][class*="type-"]')).toHaveCount(22);
  });
});
