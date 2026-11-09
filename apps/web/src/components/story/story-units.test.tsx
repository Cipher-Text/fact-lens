import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomepage, getStory } from "@/content";
import { getDictionary } from "@/i18n";

import { LeadStory } from "./LeadStory";
import { OverlapCard } from "./OverlapCard";
import { StoryCard } from "./StoryCard";
import { StoryList } from "./StoryList";
import { StoryListItem } from "./StoryListItem";

const bn = getDictionary("bn");
const withImage = getStory("deep-sea-port-trial-ship", "bn");
const longNoImage = getStory("royal-family-genealogy", "bn");

// DR-338: a flat surface-alt fill at the slot ratio. No image, no mark, no text.
function expectPlaceholder(container: HTMLElement) {
  const slot = container.querySelector("[data-placeholder]")!;
  expect(slot).toHaveAttribute("aria-hidden", "true");
  expect(slot).toHaveAttribute("tabindex", "-1");
  expect(slot.querySelector("img")).toBeNull();
  expect(slot).toHaveTextContent("");
  expect(slot.firstElementChild).toHaveClass("bg-surface-alt");
}

describe("LeadStory (C-01)", () => {
  it("has an h3 title with one link, an aria-hidden image link, the bar and the panel", () => {
    const { container } = render(<LeadStory story={withImage} strings={bn} />);
    const h2 = screen.getByRole("heading", { level: 3 });
    expect(h2).toHaveClass("text-4xl");
    expect(within(h2).getAllByRole("link")).toHaveLength(1);
    const media = container.querySelector("[data-story-media]")!;
    expect(media).toHaveAttribute("tabindex", "-1");
    expect(media).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-lead-bar]")).toHaveClass(
      "h-(--bar-brand)",
      "bg-(--color-bar)",
    );
    expect(container.querySelector("[data-lead-panel]")).toHaveClass(
      "bg-background",
      "-mt-(--space-overlap-large)",
    );
  });

  it("keeps the whole long title and sets no height or clamp (CPT-08, LAY-17)", () => {
    const { container } = render(<LeadStory story={withImage} strings={bn} />);
    expect(h2Text(container)).toBe(withImage.title);
    expect(container.innerHTML).not.toMatch(/line-clamp|truncate|\bh-\d/);
  });

  it("shows the no-image placeholder for a story with no image, with the same overlap and inset (DR-338)", () => {
    const { container } = render(
      <LeadStory story={longNoImage} strings={bn} />,
    );
    expectPlaceholder(container);
    expect(container.querySelector("[data-lead-panel]")).toHaveClass(
      "-mt-(--space-overlap-large)",
      "me-(--space-inset-large-end)",
    );
  });
});

describe("StoryImage (DR-338, DR-325)", () => {
  it("loads lazily by default, eagerly for the hero cards", () => {
    const { container, rerender } = render(
      <StoryCard story={withImage} strings={bn} />,
    );
    expect(container.querySelector("img")).toHaveAttribute("loading", "lazy");
    rerender(<StoryCard story={withImage} strings={bn} eager />);
    expect(container.querySelector("img")).toHaveAttribute("loading", "eager");
  });

  it("preloads the lead image with high fetch priority (C-01, DR-325)", () => {
    const { container } = render(<LeadStory story={withImage} strings={bn} />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("shows the placeholder in the same slot when the image does not load", () => {
    const { container } = render(<StoryCard story={withImage} strings={bn} />);
    fireEvent.error(container.querySelector("img")!);
    expectPlaceholder(container);
    expect(container.querySelector("span.aspect-3\\/2")).not.toBeNull();
  });
});

describe("OverlapCard (C-02)", () => {
  it("covers the image by the card overlap and leaves the notch (DR-105)", () => {
    const { container } = render(
      <OverlapCard story={withImage} strings={bn} />,
    );
    const body = container.querySelector("[data-overlap-body]")!;
    expect(body).toHaveClass(
      "-mt-(--space-overlap)",
      "me-(--space-card-notch)",
      "bg-background",
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("text-2xl");
  });

  it("takes the section color for the text block", () => {
    const { container } = render(
      <OverlapCard story={withImage} strings={bn} surface="elevated" />,
    );
    expect(container.querySelector("[data-overlap-body]")).toHaveClass(
      "bg-surface-elevated",
    );
  });

  it("shows the no-image placeholder for a story with no image, with the same overlap and notch (DR-338)", () => {
    const { container } = render(
      <OverlapCard story={longNoImage} strings={bn} />,
    );
    expectPlaceholder(container);
    expect(container.querySelector("[data-overlap-body]")).toHaveClass(
      "-mt-(--space-overlap)",
      "me-(--space-card-notch)",
    );
  });
});

describe("StoryCard (C-24)", () => {
  it("puts the image before the text in the markup in every variant, with no order class (LAY-14, DR-267)", () => {
    const { container } = render(
      <StoryCard story={withImage} strings={bn} variant="thumbnail" />,
    );
    const grid =
      container.querySelector("[data-story-card]")!.firstElementChild!;
    expect(grid.children[0]).toHaveAttribute("data-story-media");
    expect(grid.children[1]).not.toHaveAttribute("data-story-media");
    expect(container.innerHTML).not.toMatch(/\border-/);
  });

  it.each([
    ["top", "story-top"],
    ["thumbnail", "story-thumbnail"],
    ["side", "lg:story-side"],
    ["dated", "story-dated"],
  ] as const)(
    "sets variant %s on the grid inside the container",
    (variant, grid) => {
      const { container } = render(
        <StoryCard story={withImage} strings={bn} variant={variant} />,
      );
      const card = container.querySelector("[data-story-card]")!;
      expect(card).toHaveClass("@container");
      expect(card.firstElementChild!.className).toContain(grid);
      expect(container.querySelector("[data-story-media]")).toHaveClass(
        "story-media",
      );
    },
  );

  it("side stacks under 1024 and puts the image at the end from 1024; every image is 3:2 (DR-453)", () => {
    const { container } = render(
      <StoryCard story={withImage} strings={bn} variant="side" />,
    );
    const grid =
      container.querySelector("[data-story-card]")!.firstElementChild!;
    expect(grid).toHaveClass("story-top", "lg:story-side");
    expect(container.querySelector("img")).toHaveClass("aspect-3/2");
    expect(container.innerHTML).not.toContain("aspect-video");
  });

  it.each([
    ["top", false, "text-2xl"],
    ["thumbnail", false, "text-lg"],
    ["side", false, "text-2xl"],
    ["dated", false, "text-2xl"],
    ["side", true, "text-4xl"],
  ] as const)(
    "variant %s (large %s) sets the title role %s (tajmin, 5 Nov 2026)",
    (variant, large, role) => {
      render(
        variant === "side" ? (
          <StoryCard
            story={withImage}
            strings={bn}
            variant={variant}
            large={large}
          />
        ) : (
          <StoryCard story={withImage} strings={bn} variant={variant} />
        ),
      );
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveClass(role);
      expect(title.className.match(/\btext-(?:4xl|2xl|lg)\b/g)).toEqual([role]);
    },
  );

  it("side with large wraps pretty: no text-balance on the cover title (DR-468, TYP-13)", () => {
    render(<StoryCard story={withImage} strings={bn} variant="side" large />);
    const title = screen.getByRole("heading", { level: 3 });
    expect(title).toHaveClass("text-4xl");
    expect(title).not.toHaveClass("text-balance");
  });

  it("large is the side option only: on another variant the variant title stays (C-24)", () => {
    const { container } = render(
      // @ts-expect-error The type accepts large with variant="side" only (PR 25 review).
      <StoryCard story={withImage} strings={bn} variant="thumbnail" large />,
    );
    const title = screen.getByRole("heading", { level: 3 });
    expect(title).toHaveClass("text-lg");
    expect(title.className.match(/\btext-(?:4xl|2xl|lg)\b/g)).toEqual([
      "text-lg",
    ]);
    expect(
      container.querySelector("[data-story-card]")!.hasAttribute("data-large"),
    ).toBe(false);
  });

  it("drops the eyebrow and the summary when the section asks", () => {
    const { container } = render(
      <StoryCard
        story={withImage}
        strings={bn}
        eyebrow={false}
        summary={false}
      />,
    );
    expect(container.querySelector("[data-eyebrow]")).toBeNull();
    expect(container.querySelector("[data-summary]")).toBeNull();
  });

  it("dated: the image, the text, then the date in its own area, time only (category page, tajmin)", () => {
    const { container } = render(
      <StoryCard
        story={withImage}
        strings={bn}
        variant="dated"
        eyebrow={false}
      />,
    );
    const grid =
      container.querySelector("[data-story-card]")!.firstElementChild!;
    // Source order is the reading order on phones: media, body, date (LAY-14, DR-267).
    expect(grid.children).toHaveLength(3);
    expect(grid.children[0]).toHaveAttribute("data-story-media");
    expect(grid.children[1]).toHaveClass("story-body");
    expect(grid.children[2]).toHaveClass("story-date");
    // One meta line, the date only: no reading time.
    expect(container.querySelectorAll("[data-reading-time]")).toHaveLength(0);
    expect(grid.children[1].querySelector("time")).toBeNull();
    expect(grid.children[2].querySelector("time")).not.toBeNull();
    expect(container.querySelector("[data-eyebrow]")).toBeNull();
  });

  it("shows the no-image placeholder for a story with no image, in the thumbnail variant, whole title (DR-338)", () => {
    const { container } = render(
      <StoryCard story={longNoImage} strings={bn} variant="thumbnail" />,
    );
    expectPlaceholder(container);
    expect(
      container.querySelector("[data-story-card]")!.firstElementChild!
        .children[0],
    ).toHaveAttribute("data-story-media");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      longNoImage.title,
    );
  });
});

describe("StoryListItem and StoryList (C-25, C-03)", () => {
  const latest = getHomepage("bn").hero!.latest.slice(0, 5);

  it("shows category then time in Latest, time then reading time elsewhere", () => {
    const { container, rerender } = render(
      <StoryListItem story={latest[1]} strings={bn} meta="category-time" />,
    );
    expect(container.querySelector("[data-meta-separator]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector("p")!.firstElementChild).toHaveTextContent(
      bn.categories[latest[1].category],
    );
    expect(container.querySelector("[data-reading-time]")).toBeNull();
    rerender(<StoryListItem story={withImage} strings={bn} />);
    expect(container.querySelector("[data-reading-time]")).not.toBeNull();
  });

  it("eyebrowMode format: the category on news, Analysis on analysis (DR-417, DR-433)", () => {
    const analysis = getStory("chip-supply-map", "bn");
    expect(analysis.format).toBe("analysis");
    const { container, rerender } = render(
      <StoryListItem story={analysis} strings={bn} eyebrowMode="format" />,
    );
    const eyebrow = () => container.querySelector("p[data-eyebrow]")!;
    expect(eyebrow()).toHaveTextContent(bn.analysisOpinion.analysis);
    expect(within(eyebrow() as HTMLElement).getByRole("link")).toHaveAttribute(
      "href",
      "/analysis",
    );
    expect(eyebrow().nextElementSibling!.tagName).toBe("H3");
    rerender(
      <StoryListItem story={latest[0]} strings={bn} eyebrowMode="format" />,
    );
    expect(latest[0].format).toBe("news");
    expect(eyebrow()).toHaveTextContent(bn.categories[latest[0].category]);
    expect(within(eyebrow() as HTMLElement).getByRole("link")).toHaveAttribute(
      "href",
      `/category/${latest[0].category}`,
    );
    // No mode: no Eyebrow (every other list).
    rerender(<StoryListItem story={analysis} strings={bn} />);
    expect(container.querySelector("p[data-eyebrow]")).toBeNull();
  });

  it("makes an h3 with one link and no Breaking label (COL-11, DR-279)", () => {
    const { container } = render(
      <StoryListItem story={latest[0]} strings={bn} />,
    );
    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3).toHaveClass("text-lg");
    expect(within(h3).getAllByRole("link")).toHaveLength(1);
    expect(container.querySelector("[data-chip]")).toBeNull();
  });

  it("draws a rule between rows and none above the first (Divider item)", () => {
    render(<StoryList stories={latest} strings={bn} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    for (const li of items) expect(li).toHaveClass("divider-item");
  });

  it("fills two columns column-first, with no rule at the top of a column", () => {
    const { container } = render(
      <StoryList stories={latest} strings={bn} columns={2} />,
    );
    const ul = container.querySelector("ul")!;
    // CSS columns, so each column keeps its own item heights (DR-350).
    expect(ul).toHaveClass("md:max-lg:columns-2");
    const items = screen.getAllByRole("listitem");
    // Items 1 to 3, then a column break before item 4 (DR-125).
    expect(items[3]).toHaveClass("md:max-lg:break-before-column");
    expect(
      items.filter((li) => li.className.includes("break-before")),
    ).toHaveLength(1);
    expect(items[3]).toHaveClass("md:max-lg:before:hidden");
    expect(items[1]).not.toHaveClass("md:max-lg:before:hidden");
  });
});

function h2Text(container: HTMLElement) {
  return container.querySelector("h3")!.textContent;
}
