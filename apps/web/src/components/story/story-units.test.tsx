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
const longNoImage = getStory("primary-teacher-training", "bn");

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
    expect(h2).toHaveClass("type-story-lead");
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
      "-mt-(--space-lead-overlap)",
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
      "-mt-(--space-lead-overlap)",
      "me-(--space-lead-inset-end)",
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
    expect(container.querySelector("span.aspect-video")).not.toBeNull();
  });
});

describe("OverlapCard (C-02)", () => {
  it("covers the image by the card overlap and leaves the notch (DR-105)", () => {
    const { container } = render(
      <OverlapCard story={withImage} strings={bn} />,
    );
    const body = container.querySelector("[data-overlap-body]")!;
    expect(body).toHaveClass(
      "-mt-(--space-card-overlap)",
      "me-(--space-card-notch)",
      "bg-background",
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title",
    );
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
      "-mt-(--space-card-overlap)",
      "me-(--space-card-notch)",
    );
  });
});

describe("StoryCard (C-24)", () => {
  it("puts the image before the text in the markup at every layout, with no order class (LAY-14, DR-267)", () => {
    const { container } = render(
      <StoryCard story={withImage} strings={bn} layout="row" />,
    );
    const grid =
      container.querySelector("[data-story-card]")!.firstElementChild!;
    expect(grid.children[0]).toHaveAttribute("data-story-media");
    expect(grid.children[1]).not.toHaveAttribute("data-story-media");
    expect(container.innerHTML).not.toMatch(/\border-/);
  });

  it.each([
    ["stack", "story-stacked"],
    ["row", "story-split-third"],
    ["row-from-md", "md:story-split-third"],
    ["row-until-lg", "lg:story-stacked"],
  ] as const)(
    "sets layout %s on the grid inside the container",
    (layout, grid) => {
      const { container } = render(
        <StoryCard story={withImage} strings={bn} layout={layout} />,
      );
      const card = container.querySelector("[data-story-card]")!;
      expect(card).toHaveClass("@container");
      expect(card.firstElementChild!.className).toContain(grid);
      expect(container.querySelector("[data-story-media]")).toHaveClass(
        "story-media",
      );
    },
  );

  it("uses the feature split, the ratio and the size", () => {
    const { container } = render(
      <StoryCard
        story={withImage}
        strings={bn}
        layout="row-from-md"
        split="feature"
        ratio="3:2"
        size="sm"
      />,
    );
    expect(
      container.querySelector("[data-story-card]")!.firstElementChild!
        .className,
    ).toContain("md:story-split-feature");
    expect(container.querySelector("img")).toHaveClass("aspect-3/2");
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title-sm",
    );
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
    expect(container.querySelector(".type-eyebrow")).toBeNull();
    expect(container.querySelector(".type-summary")).toBeNull();
  });

  it("shows the no-image placeholder for a story with no image, in the row layout, whole title (DR-338)", () => {
    const { container } = render(
      <StoryCard story={longNoImage} strings={bn} layout="row" />,
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

  it("makes an h3 with one link and no Breaking label (COL-11, DR-279)", () => {
    const { container } = render(
      <StoryListItem story={latest[0]} strings={bn} />,
    );
    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3).toHaveClass("type-story-title-sm");
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
