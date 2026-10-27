import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage } from "@/content";
import { getDictionary } from "@/i18n";

import { MostReadSection } from "./MostReadSection";
import { RankedList } from "./RankedList";

function renderSection(lang: "bn" | "en", variant: "full" | "sparse" = "full") {
  const stories = getHomepage(lang, { variant }).mostRead!;
  const view = render(
    <MostReadSection lang={lang} stories={stories} t={getDictionary(lang)} />,
  );
  return { ...view, stories };
}

describe("RankedList (C-07)", () => {
  it("is an ordered list of title links, in rank order, one h3 per item", () => {
    const stories = getHomepage("en").mostRead!;
    const { container } = render(<RankedList lang="en" stories={stories} />);
    const list = container.querySelector("ol")!;
    expect(list).toHaveClass("rank-list");
    expect(
      [...list.children].map((li) => li.querySelector("h3")!.textContent),
    ).toEqual(stories.map((story) => story.title));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(
      stories.length,
    );
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^\/en\/story\//);
    }
  });
});

describe("MostReadSection (P-5)", () => {
  it("is a section named by its heading, with the top 5 as an ordered list (DR-44)", () => {
    const { stories } = renderSection("bn");
    const section = screen.getByRole("region", { name: "সর্বাধিক পঠিত" });
    const list = within(section).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(list).toHaveClass("rank-list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    // Source order is the rank order (LAY-14).
    expect(items.map((li) => li.querySelector("h3")!.textContent)).toEqual(
      stories.map((s) => s.title),
    );
  });

  it("puts the list in the middle and end of three columns from 1024, the start column empty (C-07)", () => {
    renderSection("en");
    const list = screen.getByRole("list");
    expect(list).toHaveClass("lg:col-span-2", "lg:col-start-2");
    expect(list.parentElement).toHaveClass(
      "lg:grid",
      "lg:grid-cols-3",
      "lg:gap-x-(--grid-column-gap)",
    );
    // No other column count and no 2xl tier (LAY-06).
    expect(list.className).not.toMatch(/grid-cols|2xl:/);
  });

  it("uses two CSS columns from 600, items 1 to 3 then 4 and 5, the column tops level (C-07)", () => {
    renderSection("en");
    const list = screen.getByRole("list");
    expect(list).toHaveClass("sm:columns-2", "sm:gap-x-(--grid-column-gap)");
    screen.getAllByRole("listitem").forEach((li, i) => {
      expect(li).toHaveClass("sm:break-inside-avoid");
      if (i === 3) expect(li).toHaveClass("sm:break-before-column", "sm:mt-0");
      else expect(li).not.toHaveClass("sm:break-before-column");
    });
  });

  it("has no rule between the items: they are --rank-list-gap apart (C-07, tajmin)", () => {
    renderSection("bn");
    screen.getAllByRole("listitem").forEach((li, i) => {
      expect(li.className).not.toMatch(/divider-item/);
      if (i > 0) expect(li).toHaveClass("mt-(--rank-list-gap)");
      else expect(li).not.toHaveClass("mt-(--rank-list-gap)");
    });
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

  it("writes the rank from the data in an aria-hidden chip, digits in the page language (DR-290)", () => {
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
        const chip = li.firstElementChild!;
        expect(chip).toHaveAttribute("aria-hidden", "true");
        // One inner span, which the chip trims to the ink of the digits.
        expect([...chip.children].map((el) => el.tagName)).toEqual(["SPAN"]);
        expect(chip.textContent).toBe(digits[i]);
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
