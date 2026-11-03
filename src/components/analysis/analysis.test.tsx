import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getNavItems } from "@/components/header/navItems";
import { getAnalysisPage, type AnalysisPage } from "@/content";
import { getDictionary } from "@/i18n";

import { AnalysisPageView } from "./AnalysisPageView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/analysis",
  useSearchParams: () => new URLSearchParams(),
}));

// The analysis hub (layout 7C.2 Paths, Analysis hub row): the order of main and the sparse
// cases (tajmin, 2 Nov 2026): 1 story shows the hero only; 2 to 4 fill the mosaic as far as
// they go; no list stories remove the ad band and More stories (7.3, LAY-13).

const full = getAnalysisPage("en");

function view(lead: number, top: number, more: number): AnalysisPage {
  return {
    ...full,
    lead: lead ? full.lead : null,
    top: full.top.slice(0, top),
    more: full.more.slice(0, more),
  };
}

function rows(page: AnalysisPage) {
  const { container } = render(<AnalysisPageView page={page} />);
  const main = container.querySelector("main")!;
  return {
    main,
    order: [...main.children].map(
      (el) =>
        el.getAttribute("data-section") ??
        el.getAttribute("data-ad-slot") ??
        (el.hasAttribute("data-analysis-lead-rule")
          ? "rule"
          : el.tagName.toLowerCase()),
    ),
    cls: (selector: string) =>
      main.querySelector(selector)?.getAttribute("class") ?? "",
  };
}

describe("AnalysisPageView", () => {
  it("full page: title band, hero, rule, mosaic, ad band, More stories", () => {
    const { main, order, cls } = rows(full);
    expect(order).toEqual([
      "header",
      "analysis-lead",
      "rule",
      "analysis-top",
      "ad-band",
      "category-more",
    ]);
    expect(main.querySelectorAll("h1")).toHaveLength(1);
    expect(
      main.querySelector("[data-page-title-description]"),
    ).toHaveTextContent(getDictionary("en").analysisPage.description);
    // The mosaic: 4 OverlapCards (C-02).
    expect(
      main.querySelectorAll(
        '[data-section="analysis-top"] [data-overlap-card]',
      ),
    ).toHaveLength(4);
    // space-module on each side of the rule and before the ad band (LAY-12).
    expect(cls('[data-section="analysis-lead"]')).toContain(
      "pb-(--space-module)",
    );
    expect(cls('[data-section="analysis-top"]')).toContain(
      "pt-(--space-module)",
    );
    expect(cls('[data-section="analysis-top"]')).toContain(
      "pb-(--space-module)",
    );
    expect(cls('[data-section="category-more"]')).toContain(
      "pt-(--space-module)",
    );
  });

  it("1 story: the hero only, the last row adds no space", () => {
    const { order, cls } = rows(view(1, 0, 0));
    expect(order).toEqual(["header", "analysis-lead"]);
    expect(cls('[data-section="analysis-lead"]')).not.toContain("pb-");
  });

  it.each([1, 2, 3])(
    "%i mosaic stories and no list: no ad band, no More stories",
    (top) => {
      const { main, order, cls } = rows(view(1, top, 0));
      expect(order).toEqual([
        "header",
        "analysis-lead",
        "rule",
        "analysis-top",
      ]);
      expect(main.querySelector("[data-analysis-top]")!.children).toHaveLength(
        top,
      );
      expect(cls('[data-section="analysis-top"]')).not.toContain("pb-");
    },
  );

  it("no mosaic but list stories: the ad band follows the hero, no rule", () => {
    const { order, cls } = rows(view(1, 0, 3));
    expect(order).toEqual([
      "header",
      "analysis-lead",
      "ad-band",
      "category-more",
    ]);
    expect(cls('[data-section="analysis-lead"]')).toContain(
      "pb-(--space-module)",
    );
  });

  it("the hero is the feature StoryCard: size lead, 3:2, category Eyebrow, eager image", () => {
    const { main } = rows(full);
    const hero = main.querySelector('[data-section="analysis-lead"]')!;
    expect(hero.querySelector("h2")).toHaveClass("sr-only");
    const card = hero.querySelector("[data-story-card]")!;
    expect(card).toHaveClass("story-split-lead");
    expect(card.firstElementChild!.className).toContain(
      "md:story-split-feature",
    );
    expect(hero.querySelector("h3")).toHaveClass("type-story-lead");
    const eyebrow = hero.querySelector(".type-eyebrow a");
    expect(eyebrow?.getAttribute("href")).toMatch(/^\/en\/category\//);
  });

  it("the mosaic rail holds the rail ad from 1024 and the full-height column rule", () => {
    const { main } = rows(full);
    const top = main.querySelector('[data-section="analysis-top"]')!;
    expect(top.querySelector(".with-rail")).toHaveClass(
      "divider-column-rail",
      "divider-column-full",
    );
    expect(top.querySelector("[data-analysis-top-rail]")).toHaveClass(
      "max-lg:hidden",
    );
    expect(top.querySelector('[data-ad-slot="ad-rail"]')).toHaveClass(
      "lg:grid",
    );
  });
});

describe("navigation: the Analysis item (C-18, C-19)", () => {
  for (const lang of ["bn", "en"] as const) {
    it(`${lang}: one Analysis item, no sub-items, to the hub, current on /analysis only; no Opinion item`, () => {
      const t = getDictionary(lang);
      const items = (path: string) => getNavItems(t, lang, path);
      const analysis = (path: string) =>
        items(path).find((item) => item.id === "analysis")!;
      expect(items("/").at(-1)!.id).toBe("analysis");
      expect(analysis("/").label).toBe(t.analysisOpinion.analysis);
      expect(analysis("/").href).toBe(
        lang === "bn" ? "/analysis" : "/en/analysis",
      );
      expect(analysis("/").children).toBeUndefined();
      expect(analysis("/analysis").current).toBe(true);
      expect(analysis("/").current).toBe(false);
      expect(analysis("/latest").current).toBe(false);
      const ids = items("/").flatMap((item) => [
        item.id,
        ...(item.children ?? []).map((child) => child.id),
      ]);
      expect(ids).not.toContain("opinion");
      expect(ids).not.toContain("analysis-opinion");
    });
  }
});
