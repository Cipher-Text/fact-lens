import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, type FeaturedSection } from "@/content";
import { getDictionary } from "@/i18n";

import { FeaturedCategory } from "./FeaturedCategory";

function renderSection(lang: "bn" | "en", section: FeaturedSection) {
  return render(
    <FeaturedCategory lang={lang} section={section} t={getDictionary(lang)} />,
  );
}

const full = getHomepage("bn").featured;
const sparse = getHomepage("bn", { variant: "sparse" }).featured;

describe("FeaturedCategory (P-2)", () => {
  it("is a shell section named by its category, with the nav anchor id (IMP-14)", () => {
    const { container } = renderSection("bn", full.bangladesh!);
    const section = container.firstElementChild as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("shell");
    expect(section).toHaveAttribute("id", "category-bangladesh");
    expect(
      screen.getByRole("region", { name: "বাংলাদেশ" }),
    ).toBeInTheDocument();
    // The heading is plain text, not a link (DR-122, CPT-13).
    const heading = screen.getByRole("heading", { level: 2, name: "বাংলাদেশ" });
    expect(heading.querySelector("a")).toBeNull();
  });

  it("puts the feature story in the wrapper and the rail after it (LAY-05, LAY-14)", () => {
    const { container } = renderSection("bn", full.geopolitics!);
    const grid = container.querySelector(".with-rail")!;
    expect(
      [...grid.children].map((el) =>
        el.hasAttribute("data-featured-wrapper") ? "wrapper" : "rail",
      ),
    ).toEqual(["wrapper", "rail"]);
  });

  it("draws the feature story as a StoryCard: stack under 768, row from 768, no eyebrow (C-24, P-2)", () => {
    const { container } = renderSection("bn", full.bangladesh!);
    const card = container.querySelector(
      "[data-featured-wrapper] [data-story-card]",
    ) as HTMLElement;
    expect(card).toHaveAttribute("data-layout", "row-from-md");
    expect(card.className).toContain("md:story-split-feature");
    expect(card.className).not.toMatch(/\border-/);
    // Text before the image in the markup (LAY-14).
    expect(card.children[0]).not.toHaveAttribute("data-story-media");
    expect(card.children[1]).toHaveAttribute("data-story-media");
    expect(card.querySelector("[data-story-media] img")).toHaveClass(
      "aspect-3/2",
    );
    expect(within(card).getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title",
    );
    expect(card.querySelector(".type-eyebrow")).toBeNull();
  });

  it("has one image story and two text rows in the rail (C-24, C-03)", () => {
    const { container } = renderSection("bn", full.bangladesh!);
    const rail = container.querySelector("[data-featured-rail]") as HTMLElement;
    const card = rail.querySelector("[data-story-card]") as HTMLElement;
    expect(card).toHaveAttribute("data-layout", "row-until-lg");
    expect(card.querySelector("[data-story-media] img")).toHaveClass(
      "aspect-video",
    );
    expect(within(card).getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title-sm",
    );
    const items = within(rail).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    for (const li of items) {
      expect(li.querySelector("img")).toBeNull();
      expect(within(li).getByRole("heading", { level: 3 })).toHaveClass(
        "type-story-title-sm",
      );
    }
  });

  it("has one আরও দেখুন link at the section end, to the category page (DR-110, DR-123)", () => {
    const { container } = renderSection("bn", full.bangladesh!);
    const links = screen.getAllByRole("link", { name: /আরও দেখুন/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("আরও দেখুন: বাংলাদেশ");
    expect(links[0]).toHaveAttribute("href", "/category/bangladesh");
    const section = container.firstElementChild!;
    expect(section.lastElementChild).toContainElement(links[0]);
    // English pages link inside /en.
    const en = renderSection("en", getHomepage("en").featured.bangladesh!);
    expect(
      within(en.container).getByRole("link", { name: /See more/ }),
    ).toHaveAttribute("href", "/en/category/bangladesh");
  });

  it("spans the shell when there are no rail stories (7.3)", () => {
    const { container } = renderSection("bn", sparse.bangladesh!);
    expect(container.querySelector(".with-rail")).toBeNull();
    expect(container.querySelector("[data-featured-rail]")).toBeNull();
    expect(container.querySelector("[data-featured-wrapper]")).not.toBeNull();
  });

  it("uses the page language for every interface string (T-27)", () => {
    const en = getHomepage("en").featured.geopolitics!;
    const { container } = renderSection("en", en);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Geopolitics and Diplomacy",
      }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[ঀ-৿]/);
  });
});
