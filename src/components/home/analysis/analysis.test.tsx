import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, type AnalysisOpinionSection } from "@/content";
import { getDictionary } from "@/i18n";

import { AnalysisSection } from "./AnalysisSection";

function renderSection(lang: "bn" | "en", section: AnalysisOpinionSection) {
  return render(
    <AnalysisSection lang={lang} section={section} t={getDictionary(lang)} />,
  );
}

const full = getHomepage("bn").analysisOpinion!;
const sparse = getHomepage("bn", { variant: "sparse" }).analysisOpinion!;

describe("AnalysisSection (P-4)", () => {
  it("is a panel band: surface-elevated across the full width, content in the shell (DR-264)", () => {
    const { container } = renderSection("bn", full);
    const section = container.firstElementChild as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("bg-surface-elevated");
    expect(section).not.toHaveClass("shell");
    expect(section.firstElementChild).toHaveClass("shell");
    expect(
      screen.getByRole("heading", { level: 2, name: "বিশ্লেষণ ও মতামত" }),
    ).toBeInTheDocument();
  });

  it("has analysis first, then opinion, in two columns from md (LAY-14, DR-52)", () => {
    const { container } = renderSection("bn", full);
    const columns = container.querySelector("[data-columns]")!;
    expect(
      [...columns.children].map((el) => el.getAttribute("data-column")),
    ).toEqual(["analysis", "opinion"]);
    expect(columns.className).toContain("md:grid-cols-2");
    expect(columns.className).not.toMatch(/\border-/);
  });

  it("shows the plain মতামত chip on the opinion column only (DR-77)", () => {
    const { container } = renderSection("bn", full);
    const chips = container.querySelectorAll("[data-chip]");
    expect(chips).toHaveLength(1);
    const chip = chips[0] as HTMLElement;
    expect(chip).toHaveTextContent("মতামত");
    expect(chip).toHaveClass("bg-(--color-bar)", "text-on-interactive");
    expect(chip.closest("[data-column]")).toHaveAttribute(
      "data-column",
      "opinion",
    );
    expect(chip.closest("a")).toBeNull();
    // The chip is a label in a paragraph, not a heading: the story titles are the h3s (C-06).
    expect(chip.parentElement?.tagName).toBe("P");
  });

  it("puts a আরও দেখুন link below the last item of each column (LAY-18)", () => {
    const { container } = renderSection("bn", full);
    for (const [id, name] of [
      ["analysis", "আরও দেখুন: বিশ্লেষণ"],
      ["opinion", "আরও দেখুন: মতামত"],
    ] as const) {
      const column = container.querySelector(
        `[data-column="${id}"]`,
      ) as HTMLElement;
      const link = within(column).getByRole("link", { name });
      expect(link).toHaveTextContent("আরও দেখুন");
      // The link paragraph is the last child, after the list.
      expect(column.lastElementChild).toContainElement(link);
      expect(column.lastElementChild?.previousElementSibling?.tagName).toBe(
        "UL",
      );
    }
  });

  it("gives the band the block inset only, no inline inset (LAY-20, DR-224, DR-264)", () => {
    const { container } = renderSection("bn", full);
    const section = container.firstElementChild as HTMLElement;
    expect(section).toHaveClass("py-10", "sm:py-12");
    expect(section.className).not.toMatch(/\bpx-/);
    expect(section.querySelector(".panel-inset")).toBeNull();
  });

  it("builds the analysis column from one OverlapCard and compact StoryCard rows (P-4)", () => {
    const { container } = renderSection(
      "en",
      getHomepage("en").analysisOpinion!,
    );
    const analysis = container.querySelector('[data-column="analysis"]')!;
    expect(analysis.querySelectorAll("li")).toHaveLength(3);
    const feature = analysis.querySelectorAll("[data-overlap-card]");
    expect(feature).toHaveLength(1);
    expect(feature[0].querySelector("[data-overlap-body]")).toHaveClass(
      "bg-surface-elevated",
    );
    const rows = analysis.querySelectorAll("[data-story-card]");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveAttribute("data-variant", "thumbnail");
      expect(row.querySelector("[data-summary]")).toBeNull();
    }
    // Every story has an image slot: the mock story with none shows the placeholder (DR-338).
    expect(analysis.querySelectorAll("[data-story-media]")).toHaveLength(3);
    expect(analysis.querySelectorAll("img")).toHaveLength(2);
    expect(analysis.querySelectorAll("[data-placeholder]")).toHaveLength(1);
    // Every title is an h3 with one link; the column has no heading of its own.
    expect(analysis.querySelectorAll("h3")).toHaveLength(3);
    expect(analysis.querySelectorAll("h3 a")).toHaveLength(3);
    expect(analysis.querySelector("h4")).toBeNull();
  });

  it("builds the opinion column from quote rows with the author and time on own lines (C-06)", () => {
    const { container } = renderSection(
      "en",
      getHomepage("en").analysisOpinion!,
    );
    const opinion = container.querySelector('[data-column="opinion"]')!;
    const items = opinion.querySelectorAll("li");
    expect(items).toHaveLength(5);
    // Divider.item between items; no row gap on the list (DR-299).
    expect(opinion.querySelector("ul")?.className ?? "").not.toMatch(/gap-y/);
    for (const item of items) {
      const mark = item.querySelector("[data-quote-mark]")!;
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(mark).toHaveClass("w-(--quote-mark-width)");
      expect(item).toHaveClass("divider-item");
      expect(item.querySelector("article")).toHaveClass(
        "gap-x-(--grid-column-gap)",
      );
      expect(item.querySelectorAll("h3 a")).toHaveLength(1);
      expect(item.querySelector("img")).toBeNull();
      expect(item.querySelector("[data-author]")).toHaveClass(
        "font-semibold",
        "text-ink-secondary",
      );
      expect(item.querySelector("[data-author] a")).toBeNull();
      expect(item.querySelector("[data-time]")).toHaveClass("text-ink-muted");
    }
  });

  it("gives the আরও দেখুন links the base focus outline, not ring classes (COL-13)", () => {
    const { container } = renderSection("bn", full);
    const links = container.querySelectorAll("a[aria-label]");
    expect(links).toHaveLength(2);
    for (const link of links) expect(link.className).not.toMatch(/\bring/);
  });

  it("lets the remaining column span the shell when one is empty (7.3)", () => {
    const { container } = renderSection("bn", sparse);
    const columns = container.querySelector("[data-columns]")!;
    expect(columns.children).toHaveLength(1);
    expect(columns.className).not.toContain("md:grid-cols-2");
    expect(container.querySelector("[data-chip]")).toBeNull();

    const onlyOpinion = renderSection("bn", {
      analysis: [],
      opinion: full.opinion,
    });
    const other = onlyOpinion.container.querySelector("[data-columns]")!;
    expect(
      [...other.children].map((el) => el.getAttribute("data-column")),
    ).toEqual(["opinion"]);
    expect(other.className).not.toContain("md:grid-cols-2");
  });

  it("shows interface text in the page language only (T-27)", () => {
    const { container } = renderSection(
      "en",
      getHomepage("en").analysisOpinion!,
    );
    expect(container.textContent).not.toMatch(/[ঀ-৿]/);
    expect(
      screen.getByRole("heading", { level: 2, name: "Analysis and Opinion" }),
    ).toBeInTheDocument();
  });
});
