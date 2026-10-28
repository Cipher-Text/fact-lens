import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, type FeaturedSection } from "@/content";
import { getDictionary } from "@/i18n";

import { FeaturedCategorySection } from "./FeaturedCategorySection";

function renderSection(lang: "bn" | "en", section: FeaturedSection) {
  return render(
    <FeaturedCategorySection
      lang={lang}
      section={section}
      t={getDictionary(lang)}
    />,
  );
}

const full = getHomepage("bn").featured;
const sparse = getHomepage("bn", { variant: "sparse" }).featured;

describe("FeaturedCategorySection (P-2)", () => {
  it("is a shell section named by its region, দক্ষিণ এশিয়া (DR-412)", () => {
    const { container } = renderSection("bn", full.southAsia!);
    const section = container.firstElementChild as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("shell");
    // Not region-south-asia: that is the RegionSlider panel id on the same page.
    expect(section).toHaveAttribute("id", "featured-south-asia");
    expect(
      screen.getByRole("region", { name: "দক্ষিণ এশিয়া" }),
    ).toBeInTheDocument();
    // The heading is plain text, not a link (DR-122, CPT-13).
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "দক্ষিণ এশিয়া",
    });
    expect(heading.querySelector("a")).toBeNull();
  });

  it("is a shell section named by its category, with the nav anchor id (IMP-14)", () => {
    const { container } = renderSection("bn", full.geopolitics!);
    const section = container.firstElementChild as HTMLElement;
    expect(section).toHaveAttribute("id", "category-geopolitics");
    expect(
      screen.getByRole("region", { name: "ভূরাজনীতি ও কূটনীতি" }),
    ).toBeInTheDocument();
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
    const { container } = renderSection("bn", full.southAsia!);
    const card = container.querySelector(
      "[data-featured-wrapper] [data-story-card]",
    ) as HTMLElement;
    expect(card).toHaveAttribute("data-layout", "row-from-md");
    const grid = card.firstElementChild as HTMLElement;
    expect(card).toHaveClass("@container");
    expect(grid.className).toContain("md:story-split-feature");
    expect(card.innerHTML).not.toMatch(/\border-/);
    // Image before the text in the markup; the grid puts the image at the end (LAY-14, DR-267).
    expect(grid.children[0]).toHaveAttribute("data-story-media");
    expect(grid.children[1]).not.toHaveAttribute("data-story-media");
    expect(card.querySelector("[data-story-media] img")).toHaveClass(
      "aspect-3/2",
    );
    expect(within(card).getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title",
    );
    expect(card.querySelector(".type-eyebrow")).toBeNull();
  });

  it("has one image story and two text rows in the rail (C-24, C-03)", () => {
    const { container } = renderSection("bn", full.southAsia!);
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

  it("has one আরও দেখুন link at the section end, to the region page (DR-110, DR-123, DR-412)", () => {
    const { container } = renderSection("bn", full.southAsia!);
    const links = screen.getAllByRole("link", { name: /আরও দেখুন/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("আরও দেখুন: দক্ষিণ এশিয়া");
    expect(links[0]).toHaveAttribute("href", "/regions/south-asia");
    const section = container.firstElementChild!;
    expect(section.lastElementChild).toContainElement(links[0]);
    // English pages link inside /en.
    const en = renderSection("en", getHomepage("en").featured.southAsia!);
    expect(
      within(en.container).getByRole("link", { name: /See more/ }),
    ).toHaveAttribute("href", "/en/regions/south-asia");
  });

  it("links a category section to its category page", () => {
    const { container } = renderSection("bn", full.geopolitics!);
    expect(
      within(container).getByRole("link", { name: /আরও দেখুন/ }),
    ).toHaveAttribute("href", "/category/geopolitics");
  });

  it("spans the shell when there are no rail stories (7.3)", () => {
    const { container } = renderSection("bn", sparse.southAsia!);
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
