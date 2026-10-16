import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage } from "@/content";

import { RankedList } from "./RankedList";

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
