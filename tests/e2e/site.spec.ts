import { expect, test } from "@playwright/test";

// FL-02 site checks, moved from the temporary foundations page to the homepage in
// FL-13: language URLs and cookie (DR-17), theme before first paint, fonts
// (typography-system.md Section 8.1).

test.describe("language URLs (DR-17)", () => {
  test("Bangla is at the root and English under /en", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("/bn redirects to the root URL", async ({ page }) => {
    await page.goto("/bn");
    expect(new URL(page.url()).pathname).toBe("/");
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
    await page.goto("/?lang=fr");
    expect(new URL(page.url()).pathname).toBe("/");
    expect(new URL(page.url()).search).toBe("");
    const cookie = (await context.cookies()).find((c) => c.name === "fl-lang");
    expect(cookie).toBeUndefined();
  });

  test("the cookie redirect at / is private and not stored (R2-18)", async ({
    request,
  }) => {
    const redirected = await request.get("/", {
      headers: { Cookie: "fl-lang=en" },
      maxRedirects: 0,
    });
    expect(redirected.status()).toBe(307);
    expect(new URL(redirected.headers()["location"], "http://x").pathname).toBe(
      "/en",
    );
    expect(redirected.headers()["cache-control"]).toBe("private, no-store");

    const plain = await request.get("/", { maxRedirects: 0 });
    expect(plain.status()).toBe(200);
  });

  test("the ?lang redirect is not stored and files keep their URL (DR-328)", async ({
    request,
  }) => {
    const switched = await request.get("/?lang=en", { maxRedirects: 0 });
    expect(switched.headers()["cache-control"]).toBe("no-store");
    expect(switched.headers()["set-cookie"]).toContain("fl-lang=en");

    const file = await request.get("/favicon.ico", {
      headers: { Cookie: "fl-lang=en" },
      maxRedirects: 0,
    });
    expect(file.status()).toBe(200);
  });

  test("the language switch keeps the choice in a cookie", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const toEnglish = page.locator("header").getByRole("link", {
      name: "English",
      exact: true,
    });
    await expect(toEnglish).toHaveAttribute("lang", "en");
    await toEnglish.click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    const cookie = (await context.cookies()).find((c) => c.name === "fl-lang");
    expect(cookie?.value).toBe("en");

    // The remembered choice opens the English front page.
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/en");

    // Choosing Bangla again stores bn and opens the Bangla page.
    await page
      .locator("header")
      .getByRole("link", { name: "বাংলা", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    expect(new URL(page.url()).pathname).toBe("/");
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("heading outline (DR-275)", () => {
  for (const [path, title] of [
    ["/", "ফ্যাক্ট লেন্স: প্রথম পাতা"],
    ["/en", "Fact Lens: front page"],
  ] as const) {
    test(`${path}: one h1, no skipped level, titles are h3`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      const levels = await page
        .locator("h1, h2, h3, h4, h5, h6")
        .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
      }
      // The hero h2 comes before the lead story title (an h3).
      const hero = page.locator('[data-section="hero"]');
      await expect(
        hero.getByRole("heading", { level: 2 }).first(),
      ).toBeAttached();
      await expect(page.locator("[data-lead] h3.text-4xl")).toHaveCount(1);
    });
  }
});

test.describe("theme", () => {
  test("starts light and does not follow the system theme (DR-201)", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/en");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/\bdark\b/);
    // Only the .dark class sets the theme (DR-281).
    await expect(html).not.toHaveAttribute("data-theme");
    await expect(page.locator("header [data-theme-button]")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("a stored choice survives a reload", async ({ page }) => {
    await page.goto("/en");
    const html = page.locator("html");
    const toggle = page.locator("header [data-theme-button]");
    await expect(async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true", {
        timeout: 500,
      });
    }).toPass();
    await expect(html).toHaveClass(/\bdark\b/);

    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(toggle).toHaveAttribute("data-theme-button", "dark");
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(background).toBe("rgb(24, 25, 30)");

    // A second press goes back to light, not to a system state.
    await toggle.click();
    await expect(html).not.toHaveClass(/\bdark\b/);
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
    await page.goto("/");
    const atBody = await page.evaluate(
      () => (window as unknown as { themeAtBody?: string }).themeAtBody,
    );
    expect(atBody).toBe("dark");
  });
});

test.describe("fonts (typography-system.md Section 8.1)", () => {
  for (const p of [
    { path: "/", serif: /^"?Noto Serif Bengali/, sans: /^"?Noto Sans Bengali/ },
    { path: "/en", serif: /^"?Source Serif 4/, sans: /^"?Plus Jakarta Sans/ },
  ]) {
    test(`${p.path} uses its own serif and sans`, async ({ page }) => {
      await page.goto(p.path);
      const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        const family = (selector: string) =>
          getComputedStyle(document.querySelector(selector)!).fontFamily;
        return {
          serif: family("main article h3"),
          sans: family("main [data-meta-line]"),
          loaded: [
            ...new Set(
              [...document.fonts]
                .filter((f) => f.status === "loaded")
                .map((f) => f.family.replace(/"/g, "")),
            ),
          ],
        };
      });
      expect(fonts.serif).toMatch(p.serif);
      expect(fonts.sans).toMatch(p.sans);
      expect(fonts.loaded.length).toBeGreaterThanOrEqual(2);
    });
  }
});
