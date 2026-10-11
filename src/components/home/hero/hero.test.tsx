import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, type HeroSection } from "@/content";
import { getDictionary } from "@/i18n";

import { Hero } from "./Hero";

function renderHero(lang: "bn" | "en", hero: HeroSection) {
  return render(<Hero hero={hero} t={getDictionary(lang)} />);
}

const full = getHomepage("bn").hero!;
const sparse = getHomepage("bn", { variant: "sparse" }).hero!;

describe("Hero (P-1)", () => {
  it("has the wrapper before the rail, with the lead, two top stories and Latest", () => {
    const { container } = renderHero("bn", full);
    const grid = container.querySelector(".with-rail")!;
    const parts = [...grid.children].map((el) =>
      el.hasAttribute("data-hero-wrapper") ? "wrapper" : "rail",
    );
    expect(parts).toEqual(["wrapper", "rail"]); // LAY-14
    expect(
      container.querySelectorAll("[data-top-stories] article"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("heading", { level: 2, name: "সর্বশেষ" }),
    ).toBeInTheDocument();
  });

  it("shows two top-story cards at most (DR-44)", () => {
    const extra = getHomepage("bn").featured.bangladesh!.lead;
    const { container } = renderHero("bn", {
      ...full,
      top: [...full.top, extra],
    });
    expect(
      container.querySelectorAll("[data-top-stories] article"),
    ).toHaveLength(2);
  });

  it("uses the role mapping of typography-system.md 7.1", () => {
    const { container } = renderHero("en", getHomepage("en").hero!);
    expect(container.querySelector("[data-lead] h2")).toHaveClass(
      "type-story-lead",
    );
    for (const h of container.querySelectorAll("[data-top-stories] h3"))
      expect(h).toHaveClass("type-story-title");
  });

  it("lets one top story span the wrapper (7.3)", () => {
    const { container } = renderHero("bn", sparse);
    const row = container.querySelector("[data-top-stories]")!;
    expect(row.querySelectorAll("article")).toHaveLength(1);
    expect(row).toHaveClass("sm:grid-cols-1");
    expect(row).not.toHaveClass("sm:grid-cols-2");
  });

  it("shows the placeholder image for a lead with no image, and the overlap stays (7.4, U-33)", () => {
    const { container } = renderHero("bn", sparse);
    expect(sparse.lead.image).toBeUndefined();
    expect(container.querySelector("[data-lead] img")).toHaveAttribute(
      "alt",
      "",
    );
    expect(
      container.querySelector("[data-lead] [data-placeholder]"),
    ).not.toBeNull();
    expect(container.querySelector("[data-lead-panel]")!.className).toContain(
      "-mt-(--space-lead-overlap)",
    );
  });

  it("overlaps the lead image by the C-01 tokens, on the page color, and grows down (LAY-17)", () => {
    const { container } = renderHero("bn", full);
    const panel = container.querySelector("[data-lead-panel]")!;
    expect(panel.className).toContain("-mt-(--space-lead-overlap)");
    expect(panel.className).toContain("bg-background");
    expect(panel.className).not.toMatch(/\b(h|max-h)-/);
  });

  it("shows the Latest items that exist", () => {
    renderHero("bn", sparse);
    const latest = screen.getByRole("region", { name: "সর্বশেষ" });
    expect(within(latest).getAllByRole("listitem")).toHaveLength(2);
  });

  it("lets the wrapper span the shell when Latest is empty", () => {
    const { container } = renderHero("bn", { ...full, latest: [] });
    expect(container.querySelector(".with-rail")).toBeNull();
    expect(container.querySelector("[data-hero-rail]")).toBeNull();
  });

  it("shows five Latest items and no more link (C-03, DR-102)", () => {
    renderHero("bn", full);
    const latest = screen.getByRole("region", { name: "সর্বশেষ" });
    expect(within(latest).getAllByRole("listitem")).toHaveLength(5);
    expect(
      within(latest).queryByRole("link", { name: /আরও দেখুন/ }),
    ).toBeNull();
  });

  it("shows Breaking as a filled label in the page language (COL-11, T-27)", () => {
    renderHero("bn", full);
    expect(screen.getByText("সদ্যপ্রাপ্ত")).toHaveClass(
      "bg-live",
      "text-on-live",
    );
    expect(screen.queryByText("Breaking")).toBeNull();
  });

  it("formats time and reading time with Bangla digits (TYP-17)", () => {
    const { container } = renderHero("bn", full);
    const lead = container.querySelector("[data-lead]")!;
    expect(lead.querySelector("time")).toHaveAttribute(
      "datetime",
      full.lead.publishedAt,
    );
    expect(lead.querySelector("time")).toHaveTextContent("০৯:১৫");
    expect(lead.querySelector("[data-reading-time]")).toHaveTextContent(
      "পড়তে ৬ মিনিট",
    );
    expect(container.textContent).not.toMatch(/[0-9]/);
  });

  it("has no English interface words on a Bangla page (T-27)", () => {
    const { container } = renderHero("bn", full);
    expect(container.textContent).not.toMatch(/[A-Za-z]/);
  });
});
