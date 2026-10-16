import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage } from "@/content";
import { getDictionary } from "@/i18n";

import { MostReadSection } from "./MostReadSection";

function renderSection(lang: "bn" | "en", variant: "full" | "sparse" = "full") {
  const stories = getHomepage(lang, { variant }).mostRead!;
  const view = render(
    <MostReadSection lang={lang} stories={stories} t={getDictionary(lang)} />,
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
    expect(items.map((li) => li.querySelector("h3")!.textContent)).toEqual(
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

  it("uses the column gap token and a rule inside each column, no row gap (C-07, DR-299, DR-300)", () => {
    renderSection("en");
    const list = screen.getByRole("list");
    expect(list).toHaveClass("gap-x-(--grid-column-gap)", "gap-y-0");
    for (const item of screen.getAllByRole("listitem"))
      expect(item).toHaveClass("divider-item-grid");
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

  it("writes the rank from the data in an aria-hidden span, digits in the page language (DR-290)", () => {
    for (const [lang, digits] of [
      ["bn", ["১", "২", "৩", "৪", "৫"]],
      ["en", ["1", "2", "3", "4", "5"]],
    ] as const) {
      const { stories, unmount } = renderSection(lang);
      screen.getAllByRole("listitem").forEach((li, i) => {
        expect([...li.children].map((el) => el.tagName)).toEqual([
          "SPAN",
          "H3",
        ]);
        const numeral = li.firstElementChild!;
        expect(numeral).toHaveAttribute("aria-hidden", "true");
        expect(numeral.textContent).toBe(digits[i]);
        expect(li.querySelector("h3")!.textContent).toBe(stories[i].title);
      });
      unmount();
    }
  });

  it("shows the items that exist when content is sparse (7.3)", () => {
    renderSection("bn", "sparse");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
