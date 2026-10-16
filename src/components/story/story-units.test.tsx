import { render, screen, within } from "@testing-library/react";
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

describe("LeadStory (C-01)", () => {
  it("has an h2 title with one link, an aria-hidden image link, the bar and the panel", () => {
    const { container } = render(<LeadStory story={withImage} strings={bn} />);
    const h2 = screen.getByRole("heading", { level: 2 });
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

  it("shows the placeholder image for a story with no image, with the same overlap and inset (U-33)", () => {
    const { container } = render(
      <LeadStory story={longNoImage} strings={bn} />,
    );
    expect(container.querySelector("[data-placeholder] img")).toHaveAttribute(
      "alt",
      "",
    );
    expect(container.querySelector("[data-lead-panel]")).toHaveClass(
      "-mt-(--space-lead-overlap)",
      "me-(--space-lead-inset-end)",
    );
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

  it("shows the placeholder image for a story with no image, with the same overlap and notch (U-33)", () => {
    const { container } = render(
      <OverlapCard story={longNoImage} strings={bn} />,
    );
    expect(container.querySelector("[data-placeholder] img")).toHaveAttribute(
      "alt",
      "",
    );
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
    const card = container.querySelector("[data-story-card]")!;
    expect(card.children[0]).toHaveAttribute("data-story-media");
    expect(card.children[1]).not.toHaveAttribute("data-story-media");
    expect(container.innerHTML).not.toMatch(/\border-/);
  });

  it.each([
    ["stack", "grid-cols-1", "row-start-1"],
    ["row", "story-split-third", "col-start-2"],
    ["row-from-md", "md:story-split-third", "md:col-start-2"],
    ["row-until-lg", "lg:grid-cols-1", "lg:col-start-1"],
  ] as const)("sets layout %s", (layout, root, media) => {
    const { container } = render(
      <StoryCard story={withImage} strings={bn} layout={layout} />,
    );
    expect(container.querySelector("[data-story-card]")!.className).toContain(
      root,
    );
    expect(container.querySelector("[data-story-media]")!.className).toContain(
      media,
    );
  });

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
    expect(container.querySelector("[data-story-card]")!.className).toContain(
      "md:story-split-feature",
    );
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

  it("shows the placeholder image for a story with no image, in the row layout, whole title (U-33)", () => {
    const { container } = render(
      <StoryCard story={longNoImage} strings={bn} layout="row" />,
    );
    expect(container.querySelector("[data-placeholder] img")).toHaveAttribute(
      "alt",
      "",
    );
    expect(
      container.querySelector("[data-story-card]")!.children[0],
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

  it("makes an h3 with one link and shows Breaking as a filled label", () => {
    const breaking = latest.find((s) => s.breaking)!;
    const { container } = render(
      <StoryListItem story={breaking} strings={bn} />,
    );
    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3).toHaveClass("type-story-title-sm");
    expect(within(h3).getAllByRole("link")).toHaveLength(1);
    expect(container.querySelector(".bg-live")).not.toBeNull();
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
    expect(ul.style.getPropertyValue("--story-list-rows")).toBe(
      "repeat(3, auto)",
    );
    expect(ul).toHaveClass("md:max-lg:grid-flow-col");
    const items = screen.getAllByRole("listitem");
    expect(items[3]).toHaveClass("md:max-lg:before:hidden");
    expect(items[1]).not.toHaveClass("md:max-lg:before:hidden");
  });
});

function h2Text(container: HTMLElement) {
  return container.querySelector("h2")!.textContent;
}
