import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test, type Page } from "@playwright/test";

// FL-13: measures the cases in spacing-layout-system.md Section 13 and the
// prototype checks in typography-system.md Section 9. It records results and
// screenshots; it asserts nothing. The results go to FL13_OUT as JSON.

const OUT =
  process.env.FL13_OUT ?? path.join(process.cwd(), "test-results/fl-13");
const SHOTS = path.join(process.cwd(), "docs/fl-13");
mkdirSync(OUT, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [320, 360, 600, 768, 834, 1024, 1180, 1280, 1366, 1440, 1920];
const LANGS = [
  { lang: "bn", path: "/" },
  { lang: "en", path: "/en" },
] as const;
const THEMES = ["light", "dark"] as const;

function save(name: string, data: unknown) {
  writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
}

async function open(page: Page, url: string, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
}

/** Horizontal scroll, and text boxes that are clipped or leave the viewport. */
async function faults(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const scroll = document.documentElement.scrollWidth;
    const clipped: string[] = [];
    const outside: string[] = [];
    const label = (el: Element) =>
      `[${el.closest("[data-section]")?.getAttribute("data-section") ?? el.closest("header, footer")?.tagName.toLowerCase() ?? "?"}] `+
      `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${[...el.classList].slice(0, 3).join(".")} "${(el.textContent ?? "").trim().slice(0, 40)}"`;
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      if (el.closest("dialog:not([open])")) continue;
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      // Visually hidden helpers (sr-only) are 1px boxes on purpose.
      if (el.offsetWidth <= 1 && el.offsetHeight <= 1) continue;
      const hasText = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent!.trim() !== "",
      );
      if (!hasText) continue;
      // The region slider scrolls on purpose; its columns may sit past the edge.
      const inScroller = (() => {
        for (let a = el.parentElement; a; a = a.parentElement) {
          const o = getComputedStyle(a).overflowX;
          if (o === "auto" || o === "scroll") return true;
        }
        return false;
      })();
      const clips =
        s.overflowX !== "visible" ||
        s.overflowY !== "visible" ||
        s.textOverflow === "ellipsis" ||
        s.webkitLineClamp !== "none";
      if (
        clips &&
        (el.scrollWidth > el.clientWidth + 1 ||
          el.scrollHeight > el.clientHeight + 1)
      )
        clipped.push(label(el));
      const r = el.getBoundingClientRect();
      if (!inScroller && (r.right > vw + 1 || r.left < -1))
        outside.push(label(el));
    }
    return {
      scroll,
      vw,
      hScroll: scroll > vw,
      clipped: clipped.slice(0, 10),
      outside: outside.slice(0, 10),
    };
  });
}

// 1. Every width × language × theme, at reader size 1 and A++ (Section 13).
for (const { lang, path: url } of LANGS) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      test(`widths ${lang} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await open(page, url, theme);
        const base = await faults(page);
        const sizeBefore = await page.evaluate(
          () =>
            getComputedStyle(document.querySelector("h1, h2, h3")!).fontSize,
        );
        await page.evaluate(() =>
          document.documentElement.setAttribute("data-reader-size", "xl"),
        );
        const xl = await faults(page);
        const sizeAfter = await page.evaluate(
          () =>
            getComputedStyle(document.querySelector("h1, h2, h3")!).fontSize,
        );
        const height = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        save(`w-${lang}-${theme}-${width}`, {
          lang,
          theme,
          width,
          base,
          xl,
          headingSize: [sizeBefore, sizeAfter],
          height,
        });
        if (theme === "light" && [320, 768, 1024, 1366, 1920].includes(width))
          await page
            .evaluate(() =>
              document.documentElement.removeAttribute("data-reader-size"),
            )
            .then(() =>
              page.screenshot({
                path: path.join(SHOTS, `full-${lang}-light-${width}.jpg`),
                fullPage: true,
                type: "jpeg",
                quality: 60,
              }),
            );
        if (theme === "dark" && [360, 1280].includes(width))
          await page
            .evaluate(() =>
              document.documentElement.removeAttribute("data-reader-size"),
            )
            .then(() =>
              page.screenshot({
                path: path.join(SHOTS, `full-${lang}-dark-${width}.jpg`),
                fullPage: true,
                type: "jpeg",
                quality: 60,
              }),
            );
      });
    }
  }
}

// 2. First screen at 1366×768: about 650px of viewport (Section 13).
for (const { lang, path: url } of LANGS) {
  test(`first screen ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 650 });
    await open(page, url, "light");
    const m = await page.evaluate(() => {
      const top = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), height: Math.round(r.height) };
      };
      const hero = document.querySelector('[data-section="hero"]')!;
      const lead = hero.querySelector("[data-lead]")!;
      const leadTitle = lead.querySelector("h2, h3, a")!;
      const leadImg = lead.querySelector("img")!;
      return {
        topAd: top('[data-ad-slot="ad-band-top"]'),
        header: top("header"),
        nav: (() => {
          const n = [...document.querySelectorAll("nav")].find(
            (x) => !x.closest("dialog") && x.getBoundingClientRect().height > 0,
          );
          if (!n) return null;
          const r = n.getBoundingClientRect();
          return { top: Math.round(r.top), height: Math.round(r.height) };
        })(),
        hero: top('[data-section="hero"]'),
        leadImage: {
          top: Math.round(leadImg.getBoundingClientRect().top),
          height: Math.round(leadImg.getBoundingClientRect().height),
        },
        leadTitleTop: Math.round(leadTitle.getBoundingClientRect().top),
        heroVisible: Math.max(
          0,
          650 - Math.round(hero.getBoundingClientRect().top),
        ),
      };
    });
    save(`first-${lang}`, m);
    await page.screenshot({
      path: path.join(SHOTS, `first-screen-${lang}-1366x650.jpg`),
      type: "jpeg",
      quality: 70,
    });
  });
}

// 3. Bangla nav row at 1280 (Section 13).
for (const width of [1280, 1366, 1920]) {
  test(`nav row bn ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/", "light");
    const m = await page.evaluate(() => {
      // The nav row is the visible nav outside the drawer dialog.
      const nav = [...document.querySelectorAll("nav")].find(
        (n) => !n.closest("dialog") && n.getBoundingClientRect().height > 0 &&
          n.getBoundingClientRect().top < 500,
      );
      if (!nav) return null;
      nav.setAttribute("data-fl13-nav", "");
      const items = [...nav.querySelectorAll("li")];
      const shown = items.filter((li) => {
        const s = getComputedStyle(li);
        return (
          s.display !== "none" &&
          s.visibility !== "hidden" &&
          !li.hasAttribute("hidden") &&
          li.getBoundingClientRect().width > 0
        );
      });
      const r = nav.getBoundingClientRect();
      const rows = new Set(
        shown.map((li) => Math.round(li.getBoundingClientRect().top)),
      );
      return {
        total: items.length,
        shown: shown.length,
        labels: shown.map((li) => li.textContent?.trim()),
        hiddenLabels: items
          .filter((li) => !shown.includes(li))
          .map((li) => li.textContent?.trim()),
        height: Math.round(r.height),
        rows: rows.size,
      };
    });
    save(`nav-bn-${width}`, m);
    if (width === 1280) {
      const nav = page.locator("[data-fl13-nav]");
      await nav.screenshot({
        path: path.join(SHOTS, `nav-row-bn-1280.png`),
      });
    }
  });
}

// 4. Two top-story cards at 1024 and 1280 (Section 13).
for (const { lang, path: url } of LANGS) {
  for (const width of [1024, 1280]) {
    test(`top cards ${lang} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, url, "light");
      const cards = page.locator('[data-section="hero"] [data-top-stories]');
      const m = await cards.evaluate((row) => {
        const arts = [...row.querySelectorAll("article")];
        return arts.map((a) => {
          const r = a.getBoundingClientRect();
          const title = a.querySelector("h2, h3");
          const tr = title?.getBoundingClientRect();
          const lh = title ? parseFloat(getComputedStyle(title).lineHeight) : 0;
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
            img: !!a.querySelector("img"),
            titleTop: tr ? Math.round(tr.top) : null,
            titleLines: tr && lh ? Math.round(tr.height / lh) : null,
            titleSize: title ? getComputedStyle(title).fontSize : null,
          };
        });
      });
      save(`cards-${lang}-${width}`, m);
      await cards.screenshot({
        path: path.join(SHOTS, `top-cards-${lang}-${width}.png`),
      });
    });
  }
}

// 5. Sparse sections (Section 7.3).
for (const { lang, path: url } of LANGS) {
  for (const width of [360, 768, 1280]) {
    test(`sparse ${lang} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, `${url}?content=sparse`, "light");
      const f = await faults(page);
      const m = await page.evaluate(() => {
        const main = document.querySelector("main")!;
        const rows = [...main.children].map(
          (el) =>
            el.getAttribute("data-section") ??
            el.getAttribute("data-ad-slot") ??
            el.tagName.toLowerCase(),
        );
        let adjacentAds = 0;
        for (let i = 1; i < rows.length; i++)
          if (rows[i].startsWith("ad-") && rows[i - 1].startsWith("ad-"))
            adjacentAds++;
        return { rows, adjacentAds };
      });
      save(`sparse-${lang}-${width}`, { faults: f, ...m });
      await page.screenshot({
        path: path.join(SHOTS, `sparse-${lang}-${width}.jpg`),
        fullPage: true,
        type: "jpeg",
        quality: 60,
      });
    });
  }
}

// 6. Long Bangla headlines and stories with no image.
for (const width of [320, 600, 1024, 1280]) {
  test(`long headlines bn ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/", "light");
    const mock = await page.evaluate(() => {
      const titles = [...document.querySelectorAll("main article :is(h2,h3)")];
      const lens = titles.map((t) => (t.textContent ?? "").trim().length);
      const noImage = [...document.querySelectorAll("main article")].filter(
        (a) => !a.querySelector("img"),
      ).length;
      const longest = titles.reduce((a, b) =>
        (b.textContent ?? "").length > (a.textContent ?? "").length ? b : a,
      );
      const lh = parseFloat(getComputedStyle(longest).lineHeight);
      return {
        titles: titles.length,
        maxChars: Math.max(...lens),
        longest: (longest.textContent ?? "").trim(),
        longestLines: Math.round(longest.getBoundingClientRect().height / lh),
        articles: document.querySelectorAll("main article").length,
        noImage,
      };
    });
    // Stress A: every headline three times as long, normal Bangla words only.
    // Stress B: as A, plus one 40-letter compound word.
    const stretch = (extra: string) =>
      page.evaluate((add) => {
        for (const t of document.querySelectorAll("main :is(h2,h3,h4) a, main li a"))
          if ((t.textContent ?? "").length > 20) t.textContent += add;
      }, extra);
    await stretch(
      " আঞ্চলিক নিরাপত্তা, বাণিজ্য ও জ্বালানি নিয়ে দীর্ঘ আলোচনার পর নতুন সমঝোতার খসড়া প্রকাশ করা হয়েছে বলে কর্মকর্তারা জানিয়েছেন",
    );
    const stressWords = await faults(page);
    await page.screenshot({
      path: path.join(SHOTS, `long-headlines-bn-${width}.jpg`),
      fullPage: true,
      type: "jpeg",
      quality: 60,
    });
    await stretch(" আন্তর্জাতিকসম্পর্কবিষয়কবিশ্লেষণপ্রতিবেদন");
    const stress = await faults(page);
    save(`long-bn-${width}`, { mock, stressWords, stress });
    
  });
}

// 7. 200% text size and WCAG text spacing (TYP-23, AGENTS.md Section 11.5).
for (const { lang, path: url } of LANGS) {
  for (const width of [320, 360, 600, 768, 1024, 1280]) {
    test(`text zoom ${lang} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, url, "light");
      await page.addStyleTag({
        content: "html { font-size: 200% !important; }",
      });
      const zoom = await faults(page);
      const rootSize = await page.evaluate(
        () =>
          getComputedStyle(document.querySelector("main h2, main h3")!)
            .fontSize,
      );
      await page.addStyleTag({
        content:
          "html { font-size: 100% !important; } * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }",
      });
      const spacing = await faults(page);
      save(`zoom-${lang}-${width}`, { zoom, rootSize, spacing });
    });
  }
}

// 8. typography-system.md Section 9: sizes in use on the homepage.
for (const { lang, path: url } of LANGS) {
  for (const width of [360, 1024, 1280]) {
    test(`type ${lang} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, url, "light");
      const m = await page.evaluate(() => {
        const sizes: Record<
          string,
          { size: string; lh: string; family: string; count: number }
        > = {};
        for (const el of document.querySelectorAll<HTMLElement>(
          "[class*='type-']",
        )) {
          const role = [...el.classList].find((c) => c.startsWith("type-"));
          if (!role || sizes[role]) {
            if (role) sizes[role].count++;
            continue;
          }
          const s = getComputedStyle(el);
          sizes[role] = {
            size: s.fontSize,
            lh: s.lineHeight,
            family: s.fontFamily.split(",")[0],
            count: 1,
          };
        }
        const hero = document.querySelector('[data-section="hero"]')!;
        const lead = hero.querySelector("[data-lead] :is(h2,h3)");
        const card = hero.querySelector("[data-top-stories] :is(h2,h3)");
        const rail = hero.querySelector("[data-hero-rail]");
        const railTitles = rail ? [...rail.querySelectorAll("li a")] : [];
        const railOverflow = railTitles.filter(
          (a) =>
            a.getBoundingClientRect().right >
            rail!.getBoundingClientRect().right + 1,
        ).length;
        return {
          sizes,
          lead: lead ? getComputedStyle(lead).fontSize : null,
          card: card ? getComputedStyle(card).fontSize : null,
          railWidth: rail
            ? Math.round(rail.getBoundingClientRect().width)
            : null,
          railOverflow,
          leadImage: Math.round(
            hero.querySelector("[data-lead] img")!.getBoundingClientRect()
              .width,
          ),
        };
      });
      save(`type-${lang}-${width}`, m);
      if (width === 1024)
        await page.locator('[data-section="hero"]').screenshot({
          path: path.join(SHOTS, `hero-${lang}-1024.png`),
        });
    });
  }
}
