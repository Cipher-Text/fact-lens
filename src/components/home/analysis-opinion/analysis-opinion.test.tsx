import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, type AnalysisOpinionSection } from "@/content";
import { getDictionary } from "@/i18n";

import { AnalysisOpinion } from "./AnalysisOpinion";

function renderSection(lang: "bn" | "en", section: AnalysisOpinionSection) {
  return render(
    <AnalysisOpinion lang={lang} section={section} t={getDictionary(lang)} />,
  );
}

const full = getHomepage("bn").analysisOpinion!;
const sparse = getHomepage("bn", { variant: "sparse" }).analysisOpinion!;

describe("AnalysisOpinion (P-4)", () => {
  it("is a shell section with surface-elevated inside the shell (DR-76)", () => {
    const { container } = renderSection("bn", full);
    const section = container.firstElementChild as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("shell", "bg-surface-elevated");
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
    expect(chip).toHaveClass("bg-accent-subtle");
    expect(chip.closest("[data-column]")).toHaveAttribute(
      "data-column",
      "opinion",
    );
    expect(chip.closest("a")).toBeNull();
    expect(chip.parentElement).toHaveClass("type-eyebrow", "text-ink");
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

  it("lists every story, analysis with images and opinion with a hidden quote icon", () => {
    const { container } = renderSection(
      "en",
      getHomepage("en").analysisOpinion!,
    );
    const analysis = container.querySelector('[data-column="analysis"]')!;
    const opinion = container.querySelector('[data-column="opinion"]')!;
    expect(analysis.querySelectorAll("li")).toHaveLength(4);
    expect(opinion.querySelectorAll("li")).toHaveLength(4);
    // One mock analysis story has no image (FL-04 hard cases).
    expect(analysis.querySelectorAll("img")).toHaveLength(3);
    const icons = opinion.querySelectorAll("[data-quote-icon]");
    expect(icons).toHaveLength(4);
    for (const icon of icons)
      expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the surface-elevated focus ring offset on its links (COL-13)", () => {
    const { container } = renderSection("bn", full);
    for (const link of container.querySelectorAll("a")) {
      expect(link.className).toContain(
        "focus-visible:ring-offset-surface-elevated",
      );
      expect(link.className).not.toContain("ring-offset-background");
    }
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
