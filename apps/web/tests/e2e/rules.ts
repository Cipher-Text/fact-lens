import type { Page } from "@playwright/test";

// R4-03 (DR-350): the space on each side of a Divider.item rule is measured to the ink, so
// the tests read it from a screenshot, not from the boxes. A pixel counts as ink when it
// differs from the background by more than INK_THRESHOLD (sum of the RGB differences): text,
// images and the no-image placeholder count; the page background does not.
const INK_THRESHOLD = 24;
// Rows scanned above and below the rule.
const REACH = 48;

export type RuleInk = {
  /** Where the rule is, for the failure message. */
  label: string;
  /** Blank pixel rows from the last ink row above the rule to the rule. */
  above: number;
  /** Blank pixel rows from the rule to the first ink row below it. */
  below: number;
};

/**
 * Hides the site header (it is sticky and would cover a rule) and turns off smooth
 * scrolling, so a scroll ends before the screenshot. Waits for the web fonts: a font swap
 * after a rule is measured moves the lines.
 */
export async function prepareInkScan(page: Page) {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.addStyleTag({
    content:
      "html { scroll-behavior: auto !important; } [data-top-bar], [data-nav-row] { visibility: hidden !important; }",
  });
}

/**
 * Every Divider.item rule in view on the page (in `scope` when given): the items that draw
 * the rule (divider-item ::before, divider-item-grid ::after) and are visible, inside the
 * viewport width and not in a hidden or inert panel. Returns their index in document order.
 */
async function visibleRules(page: Page, scope: string) {
  return page.evaluate((scopeSelector) => {
    const root = document.querySelector(scopeSelector);
    if (!root) return [];
    const items = [
      ...root.querySelectorAll(".divider-item, .divider-item-grid"),
    ];
    return items.flatMap((el, index) => {
      const pseudo = el.classList.contains("divider-item")
        ? "::before"
        : "::after";
      const s = getComputedStyle(el, pseudo);
      if (s.display === "none" || s.content === "none") return [];
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return [];
      if (r.left < 0 || r.right > window.innerWidth + 0.5) return [];
      if (el.closest("[hidden], [inert], [aria-hidden='true']")) return [];
      const section =
        el.closest("[data-section]")?.getAttribute("data-section") ??
        el.closest("section")?.getAttribute("aria-labelledby") ??
        "page";
      return [{ index, label: `${section} item ${index}` }];
    });
  }, scope);
}

/** The rule above one item, measured on a screenshot. */
async function scanRule(
  page: Page,
  scope: string,
  index: number,
): Promise<{ above: number; below: number }> {
  const rect = await page.evaluate(
    ([scopeSelector, i]) => {
      const el = document
        .querySelector(scopeSelector)!
        .querySelectorAll(".divider-item, .divider-item-grid")[i as number];
      const pseudo = el.classList.contains("divider-item")
        ? "::before"
        : "::after";
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 300, behavior: "instant" });
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el, pseudo);
      const start = r.left + parseFloat(s.left);
      // A row-first grid (RankedList, C-07): the item below a rule sits under the tallest
      // item of the row above, so the ink above is read across the whole list width.
      const list = el.parentElement!.getBoundingClientRect();
      const grid = pseudo === "::after";
      return {
        top: r.top,
        left: start,
        width: parseFloat(s.width),
        aboveLeft: grid ? list.left : start,
        aboveWidth: grid ? list.width : parseFloat(s.width),
      };
    },
    [scope, index] as const,
  );
  // Images in view are lazy: wait until they have loaded.
  await page.waitForFunction(() =>
    [...document.images].every(
      (img) =>
        !img.getBoundingClientRect().height ||
        img.getBoundingClientRect().bottom < 0 ||
        img.getBoundingClientRect().top > window.innerHeight ||
        img.complete,
    ),
  );
  const shot = async (left: number, w: number) => {
    const x = Math.ceil(left);
    const y = Math.floor(rect.top) - REACH;
    const width = Math.floor(left + w) - x;
    const buffer = await page.screenshot({
      clip: { x, y, width, height: 2 * REACH + 2 },
      scale: "css",
      animations: "disabled",
    });
    return measure(page, buffer.toString("base64"), rect.top - y);
  };
  const own = await shot(rect.left, rect.width);
  if (rect.aboveLeft === rect.left) return own;
  const row = await shot(rect.aboveLeft, rect.aboveWidth);
  return { above: row.above, below: own.below };
}

/** Blank rows above and below the rule row in a screenshot strip. */
async function measure(page: Page, png: string, ruleTop: number) {
  return page.evaluate(
    async ({ png, ruleTop, threshold }) => {
      const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const { data, width, height } = ctx.getImageData(
        0,
        0,
        bitmap.width,
        bitmap.height,
      );
      // The background is the most common colour of the rule row (2 of 3 pixels are gaps).
      const ruleRow = Math.round(ruleTop);
      const counts = new Map<string, number>();
      for (let px = 0; px < width; px++) {
        const i = (ruleRow * width + px) * 4;
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const bg = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])[0][0]
        .split(",")
        .map(Number);
      const ink = (row: number) => {
        for (let px = 0; px < width; px++) {
          const i = (row * width + px) * 4;
          const diff =
            Math.abs(data[i] - bg[0]) +
            Math.abs(data[i + 1] - bg[1]) +
            Math.abs(data[i + 2] - bg[2]);
          if (diff > threshold) return true;
        }
        return false;
      };
      // The rule is the ink within 1 row of its top edge: at a fractional top a browser
      // snaps it up or down, or anti-aliases it over two rows.
      const near = [-1, 0, 1, 2]
        .map((d) => Math.floor(ruleTop) + d)
        .filter((row) => row >= 0 && row < height && ink(row));
      const first = near.length ? Math.min(...near) : ruleRow;
      const last = near.length ? Math.max(...near) : ruleRow;
      let up = first - 1;
      while (up >= 0 && !ink(up)) up--;
      let down = last + 1;
      while (down < height && !ink(down)) down++;
      return {
        above: up < 0 ? Infinity : first - up - 1,
        below: down >= height ? Infinity : down - last - 1,
      };
    },
    { png, ruleTop, threshold: INK_THRESHOLD },
  );
}

/** The ink space on each side of every visible Divider.item rule in `scope`. */
export async function ruleInkSpaces(
  page: Page,
  scope = "main",
): Promise<RuleInk[]> {
  const rules = await visibleRules(page, scope);
  const out: RuleInk[] = [];
  for (const { index, label } of rules) {
    out.push({ label, ...(await scanRule(page, scope, index)) });
  }
  return out;
}

export type ColumnRule = {
  /** The rule is drawn (::after with content). */
  shown: boolean;
  width: number;
  color: string;
  /** Rule center less the center of the gap between the two columns. */
  offCenter: number;
  /** Space from the grid top to the rule top, and from the rule bottom to the grid bottom. */
  top: number;
  bottom: number;
  /** The computed column gap of the grid. */
  gap: string;
};

/**
 * Divider.column-inset (C-22, DR-351) on a grid: the ::after rule, measured against the
 * end edge of the column before it and the start edge of the column after it.
 */
export async function columnRule(
  page: Page,
  grid: string,
  before: string,
  after: string,
): Promise<ColumnRule> {
  return page.evaluate(
    ([g, b, a]) => {
      const el = document.querySelector(g)!;
      const s = getComputedStyle(el, "::after");
      const box = el.getBoundingClientRect();
      const left = document.querySelector(b)!.getBoundingClientRect();
      const right = document.querySelector(a)!.getBoundingClientRect();
      const ruleLeft = box.left + parseFloat(s.left);
      const ruleTop = box.top + parseFloat(s.top);
      const height = parseFloat(s.height);
      const width = parseFloat(s.width);
      return {
        shown: s.content !== "none" && s.display !== "none",
        width,
        color: s.backgroundColor,
        offCenter: ruleLeft + width / 2 - (left.right + right.left) / 2,
        top: ruleTop - box.top,
        bottom: box.bottom - (ruleTop + height),
        gap: getComputedStyle(el).columnGap,
      };
    },
    [grid, before, after] as const,
  );
}

/** The color of a token, resolved by the browser the way a part paints it. */
export async function tokenBackground(page: Page, token: string) {
  return page.evaluate((t) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(${t})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
}
