import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCategoryPage } from "@/content";
import { getDictionary } from "@/i18n";

import { CategoryFormatsSection } from "./CategoryFormatsSection";

// The analysis and opinion row of the category page (DR-415, brief category-formats.md).
function renderRow(
  category: "economy" | "security",
  lang: "bn" | "en",
  drop: "none" | "analysis" | "opinion" | "both" = "none",
) {
  const page = getCategoryPage(category, lang);
  const analysis = drop === "analysis" || drop === "both" ? [] : page.analysis;
  const opinion = drop === "opinion" || drop === "both" ? [] : page.opinion;
  return render(
    <CategoryFormatsSection
      lang={lang}
      analysis={analysis}
      opinion={opinion}
      t={getDictionary(lang)}
    />,
  );
}

const blocks = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-category-block]")].map((el) =>
    el.getAttribute("data-category-block"),
  );

describe("CategoryFormatsSection", () => {
  for (const lang of ["bn", "en"] as const) {
    const t = getDictionary(lang);

    it(`${lang}: Analysis at the start, Opinion at the end, each with its heading and hub link`, () => {
      const { container } = renderRow("economy", lang);
      expect(blocks(container)).toEqual(["analysis", "opinion"]);
      const prefix = lang === "en" ? "/en" : "";
      for (const format of ["analysis", "opinion"] as const) {
        const block = container.querySelector<HTMLElement>(
          `[data-category-block="${format}"]`,
        )!;
        expect(
          within(block).getByRole("heading", { level: 2 }).textContent,
        ).toBe(t.analysisOpinion[format]);
        const links = within(block)
          .getAllByRole("link")
          .map((a) => a.getAttribute("href"));
        expect(links.at(-1)).toBe(`${prefix}/${format}`);
      }
    });

    it(`${lang}: Opinion uses the quote rows, no image; Analysis keeps the feature card`, () => {
      const { container } = renderRow("economy", lang);
      const opinion = container.querySelector<HTMLElement>(
        '[data-category-block="opinion"]',
      )!;
      expect(opinion.querySelectorAll("li")).toHaveLength(
        getCategoryPage("economy", lang).opinion.length,
      );
      expect(opinion.querySelectorAll(".story-media")).toHaveLength(0);
      expect(opinion.querySelectorAll("[data-author]").length).toBeGreaterThan(
        0,
      );
      const analysis = container.querySelector<HTMLElement>(
        '[data-category-block="analysis"]',
      )!;
      expect(analysis.querySelectorAll(".story-media")).toHaveLength(1);
    });
  }

  it("sparse (7.3): an empty block is not shown; both empty removes the row", () => {
    // Security has no opinion in the mock data: Analysis only.
    expect(blocks(renderRow("security", "en").container)).toEqual(["analysis"]);
    expect(blocks(renderRow("economy", "en", "analysis").container)).toEqual([
      "opinion",
    ]);
    expect(renderRow("economy", "en", "both").container.innerHTML).toBe("");
  });
});
