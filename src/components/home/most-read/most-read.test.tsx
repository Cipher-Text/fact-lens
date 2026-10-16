import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage } from "@/content";
import { getDictionary } from "@/i18n";

import { MostReadSection } from "./MostReadSection";

function renderSection(lang: "bn" | "en", variant: "full" | "sparse" = "full") {
  const stories = getHomepage(lang, { variant }).mostRead!;
  const view = render(
    <MostReadSection stories={stories} t={getDictionary(lang)} />,
  );
  return { ...view, stories };
}

describe("MostReadSection (P-5)", () => {
  it("is a section named by its heading, with the top 5 as an ordered list (DR-51)", () => {
    const { stories } = renderSection("bn");
    const section = screen.getByRole("region", { name: "সর্বাধিক পঠিত" });
    const list = within(section).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(list.className).toContain("rank-list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    // Source order is the rank order (LAY-14).
    expect(items.map((li) => li.textContent)).toEqual(
      stories.map((s) => s.title),
    );
  });

  it("uses 1, 2, 3 and 4 columns, and no other count (DR-51, DR-145, LAY-06)", () => {
    renderSection("en");
    const list = screen.getByRole("list");
    expect(list.className).toMatch(/(^| )grid-cols-1( |$)/);
    expect(list.className).toContain("sm:grid-cols-2");
    expect(list.className).toContain("lg:grid-cols-3");
    expect(list.className).toContain("xl:grid-cols-4");
    expect(list.className).not.toMatch(/(md|2xl):grid-cols/);
  });

  it("uses the sheet gaps: 24px columns, 20px rows on phones, 24px from 600 (C-07, LAY-21)", () => {
    renderSection("en");
    const list = screen.getByRole("list");
    for (const name of ["gap-x-6", "gap-y-5", "sm:gap-y-6"]) {
      expect(list).toHaveClass(name);
    }
  });

  it("links each title to its story in the page language", () => {
    const { stories } = renderSection("en");
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      stories.map((s) => `/en/story/${s.slug}`),
    );
    for (const heading of screen.getAllByRole("heading", { level: 3 })) {
      expect(heading.className).toContain("type-story-title-sm");
    }
  });

  it("has no rank element in the markup: the CSS counter draws the numeral (typography 7.1)", () => {
    const { stories } = renderSection("bn");
    const items = screen.getAllByRole("listitem");
    items.forEach((li, i) => {
      expect([...li.children].map((el) => el.tagName)).toEqual(["H3"]);
      expect(li.textContent).toBe(stories[i].title);
    });
  });

  it("shows the items that exist when content is sparse (7.3)", () => {
    renderSection("bn", "sparse");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
