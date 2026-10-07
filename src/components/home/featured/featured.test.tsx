import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, type FeaturedSection } from "@/content";
import { getDictionary } from "@/i18n";

import { FeaturedCategory } from "./FeaturedCategory";

function renderSection(lang: "bn" | "en", section: FeaturedSection) {
  return render(<FeaturedCategory section={section} t={getDictionary(lang)} />);
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
    expect(
      screen.getByRole("heading", { level: 2, name: "বাংলাদেশ" }),
    ).toBeInTheDocument();
  });

  it("puts the lead in the wrapper and the rail after it (LAY-05, LAY-14)", () => {
    const { container } = renderSection("bn", full.geopolitics!);
    const grid = container.querySelector(".with-rail")!;
    expect(
      [...grid.children].map((el) =>
        el.hasAttribute("data-featured-wrapper") ? "wrapper" : "rail",
      ),
    ).toEqual(["wrapper", "rail"]);
    const lead = container.querySelector("[data-featured-lead]")!;
    expect(lead.querySelector("img")).not.toBeNull();
    // Text under the image, beside it from 1280px (DR-55).
    expect(lead.className).toContain("xl:grid-cols-2");
    expect(lead.className).not.toMatch(/\b(md|lg):grid-cols/);
  });

  it("has one image story and two stories in the rail (7.2)", () => {
    const { container } = renderSection("bn", full.bangladesh!);
    const rail = container.querySelector("[data-featured-rail]") as HTMLElement;
    const items = within(rail).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((li) => li.querySelectorAll("img").length)).toEqual([
      1, 0, 0,
    ]);
    for (const li of items) {
      expect(within(li).getByRole("heading", { level: 3 })).toHaveClass(
        "type-story-title-sm",
      );
    }
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
