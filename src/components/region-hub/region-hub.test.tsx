import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getNavItems } from "@/components/header/navItems";
import { getRegionsPage, type RegionsPage } from "@/content";
import { getDictionary } from "@/i18n";

import { regionGroups } from "./RegionsGroupedSection";
import { RegionsPageView } from "./RegionsPageView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/regions",
  useSearchParams: () => new URLSearchParams(),
}));

// The region hub (layout 7C.2 Paths, Region hub row; page/regions brief): the order of main,
// the region groups of 4 with an ad band before each (tajmin, 5 Nov 2026) and the sparse
// cases (7.3, LAY-12, LAY-13).

const full = getRegionsPage("en");

function view(cover: boolean, latest: number, regions: number): RegionsPage {
  return {
    ...full,
    cover: cover ? full.cover : null,
    latest: full.latest.slice(0, latest),
    regions: full.regions.slice(0, regions),
  };
}

function rows(page: RegionsPage) {
  const { container } = render(<RegionsPageView page={page} />);
  const main = container.querySelector("main")!;
  return {
    main,
    order: [...main.children].map(
      (el) =>
        el.getAttribute("data-section") ??
        el.getAttribute("data-ad-slot") ??
        el.tagName.toLowerCase(),
    ),
    classes: (selector: string) =>
      [...main.querySelectorAll(selector)].map(
        (el) => el.getAttribute("class") ?? "",
      ),
  };
}

describe("RegionsPageView", () => {
  it("full page: title band, cover, then an ad band before each group of 4", () => {
    const { main, order, classes } = rows(full);
    expect(order).toEqual([
      "header",
      "regions-cover",
      "ad-band",
      "regions-grouped",
      "ad-band",
      "regions-grouped",
    ]);
    expect(main.querySelectorAll("h1")).toHaveLength(1);
    expect(
      main.querySelector("[data-page-title-description]"),
    ).toHaveTextContent(getDictionary("en").regionsPage.description);
    // 7 regions with stories (Oceania has none): 4, then 3.
    const groups = [
      ...main.querySelectorAll('[data-section="regions-grouped"]'),
    ].map((g) => g.querySelectorAll("[data-category-block]").length);
    expect(groups).toEqual([4, 3]);
    // No ad-inset: the band between the groups replaces it.
    expect(main.querySelectorAll('[data-ad-slot="ad-inset"]')).toHaveLength(0);
    // LAY-12: space-module before each ad row on the section above, after it on the
    // section below; the last group adds none.
    expect(classes('[data-section="regions-cover"]')[0]).toContain(
      "pb-(--space-module)",
    );
    const grouped = classes('[data-section="regions-grouped"]');
    expect(grouped[0]).toContain("pt-(--space-module)");
    expect(grouped[0]).toContain("pb-(--space-module)");
    expect(grouped[1]).toContain("pt-(--space-module)");
    expect(grouped[1]).not.toContain("pb-");
  });

  it("the cover is OverlapCard large with the Latest rail of 5 and no MoreLink", () => {
    const { main } = rows(full);
    const cover = main.querySelector('[data-section="regions-cover"]')!;
    expect(cover.querySelector("h2")).toHaveClass("sr-only");
    const card = cover.querySelector("[data-overlap-card] [data-overlap-body]");
    expect(card).toHaveClass("overlap-large");
    expect(cover.querySelector("[data-overlap-card] [data-eyebrow]")).not.toBe(
      null,
    );
    const rail = cover.querySelector("[data-regions-rail]")!;
    expect(rail.querySelectorAll("li")).toHaveLength(5);
    expect(rail.querySelectorAll("a[href$='/latest']")).toHaveLength(0);
  });

  it("each region block: heading, 4 stories with the Eyebrow, a link to its region page", () => {
    const { main } = rows(full);
    const blocks = main.querySelectorAll(
      '[data-section="regions-grouped"] [data-category-block]',
    );
    expect(blocks).toHaveLength(7);
    for (const block of blocks) {
      expect(block.querySelectorAll("h3")).toHaveLength(4);
      expect(block.querySelectorAll("[data-eyebrow]")).toHaveLength(4);
      const more = [...block.querySelectorAll("a")].at(-1)!;
      expect(more.getAttribute("href")).toMatch(/^\/en\/regions\/[a-z-]+$/);
    }
    // The format Eyebrow (C-08): an analysis story shows বিশ্লেষণ / Analysis only, no
    // two-part label (tajmin, 5 Nov 2026: "use only format when its an analysis").
    const grouped = main.querySelectorAll('[data-section="regions-grouped"]');
    const analysis = [...grouped].flatMap((g) => [
      ...g.querySelectorAll('[data-eyebrow] a[href="/en/analysis"]'),
    ]);
    expect(analysis.length).toBeGreaterThan(0);
    for (const g of grouped) {
      expect(g.querySelectorAll("[data-eyebrow-separator]")).toHaveLength(0);
      for (const eyebrow of g.querySelectorAll("[data-eyebrow]")) {
        expect(eyebrow.querySelectorAll("a")).toHaveLength(1);
      }
    }
  });

  it("each group has its rail ad from 1024 and the inset column rule", () => {
    const { main } = rows(full);
    for (const group of main.querySelectorAll(
      '[data-section="regions-grouped"]',
    )) {
      const grid = group.querySelector(".with-rail")!;
      expect(grid).toHaveClass("divider-column-rail");
      expect(grid).not.toHaveClass("divider-column-full");
      expect(group.querySelector("[data-regions-grouped-rail]")).toHaveClass(
        "max-lg:hidden",
      );
      expect(group.querySelectorAll('[data-ad-slot="ad-rail"]')).toHaveLength(
        1,
      );
    }
  });

  it("no Latest stories: the cover spans the shell, no rail", () => {
    const { main } = rows(view(true, 0, 7));
    expect(main.querySelector("[data-regions-rail]")).toBeNull();
    expect(
      main.querySelector('[data-section="regions-cover"] .with-rail'),
    ).toBeNull();
  });

  it("no cover: the first group follows the title band with no ad band, no Latest rail", () => {
    const { main, order, classes } = rows(view(false, 5, 7));
    // Intended (RG-02; tajmin, 5 Nov 2026): with no cover the Latest rail is not shown,
    // even with Latest stories, as on the category page.
    expect(main.querySelector("[data-latest]")).toBeNull();
    expect(order).toEqual([
      "header",
      "regions-grouped",
      "ad-band",
      "regions-grouped",
    ]);
    expect(classes('[data-section="regions-grouped"]')[0]).not.toContain("pt-");
  });

  it("4 regions or fewer: one group, one ad band", () => {
    const { order, classes } = rows(view(true, 5, 3));
    expect(order).toEqual([
      "header",
      "regions-cover",
      "ad-band",
      "regions-grouped",
    ]);
    expect(classes('[data-section="regions-grouped"]')[0]).not.toContain("pb-");
  });

  it("no regions: the cover is the last row and adds no space", () => {
    const { order, classes } = rows(view(true, 5, 0));
    expect(order).toEqual(["header", "regions-cover"]);
    expect(classes('[data-section="regions-cover"]')[0]).not.toContain("pb-");
  });

  it("no stories at all: the title band only (the empty message is U-63)", () => {
    const { order } = rows(view(false, 0, 0));
    expect(order).toEqual(["header"]);
  });
});

describe("regionGroups", () => {
  it("groups of 4 in order, the last group holds the rest", () => {
    expect(regionGroups([1, 2, 3, 4, 5, 6, 7])).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7],
    ]);
    expect(regionGroups([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9],
    ]);
    expect(regionGroups([])).toEqual([]);
  });
});

describe("navigation: the Regions item (C-18, C-19)", () => {
  for (const lang of ["bn", "en"] as const) {
    it(`${lang}: current on /regions only`, () => {
      const t = getDictionary(lang);
      const regions = (path: string) =>
        getNavItems(t, lang, path).find((item) => item.id === "regions")!;
      expect(regions("/regions").current).toBe(true);
      expect(regions("/").current).toBe(false);
      expect(regions("/regions/china").current).toBe(false);
      expect(regions("/").href).toBe(
        lang === "bn" ? "/regions" : "/en/regions",
      );
    });
    it(`${lang}: the region sub-item and South Asia are current on their region page`, () => {
      const t = getDictionary(lang);
      const items = (path: string) => getNavItems(t, lang, path);
      const child = (path: string, id: string) =>
        items(path)
          .find((item) => item.id === "regions")!
          .children!.find((c) => c.id === id)!;
      expect(child("/regions/china", "china").current).toBe(true);
      expect(child("/regions/china", "europe").current).toBe(false);
      expect(child("/regions", "china").current).toBe(false);
      const southAsia = (path: string) =>
        items(path).find((item) => item.id === "south-asia")!;
      expect(southAsia("/regions/south-asia").current).toBe(true);
      expect(child("/regions/south-asia", "south-asia").current).toBe(true);
      expect(southAsia("/regions/china").current).toBe(false);
    });
  }
});
