import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { Eyebrow } from "./Eyebrow";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";
import { StoryImage } from "./StoryImage";

/**
 * Where the image sits. The section sets it at the page breakpoints (C-24):
 * stack: image above the text. row: text at the start, image at the end.
 * row-from-md: stack under 768px, row from 768px (P-2 feature story).
 * row-until-lg: row under 1024px, stack from 1024px (P-2 rail image story).
 */
export type StoryCardLayout = "stack" | "row" | "row-from-md" | "row-until-lg";

type StoryCardProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
  layout?: StoryCardLayout;
  ratio?: "3:2" | "16:9";
  /** md: type-story-title. sm: type-story-title-sm. */
  size?: "md" | "sm";
  /** Row only. third: text 2fr, image 1fr. feature: the clamped image column of P-2. */
  split?: "third" | "feature";
  /** The section drops the eyebrow when its heading names the category (DR-114). */
  eyebrow?: boolean;
  /** Shows the summary when the story has one. */
  summary?: boolean;
  titleAs?: "h3" | "h4";
  eager?: boolean;
  className?: string;
};

const ratioClass = { "3:2": "aspect-3/2", "16:9": "aspect-video" } as const;

// Placement on one grid, no `order` (LAY-14). The body is first in the markup at every layout.
// `grid-cols-1` is the stack; a split utility sets the two row columns. Class names are whole
// strings so Tailwind finds them.
const splitRow = {
  third: "story-split-third",
  feature: "story-split-feature",
} as const;
const splitFromMd = {
  third: "md:story-split-third",
  feature: "md:story-split-feature",
} as const;

const stack = {
  root: "grid-cols-1 gap-y-(--space-story-media-text)",
  media: "row-start-1",
  body: "row-start-2",
};

function layoutClasses(layout: StoryCardLayout, split: "third" | "feature") {
  switch (layout) {
    case "stack":
      return stack;
    case "row":
      return {
        root: splitRow[split],
        media: "col-start-2 row-start-1",
        body: "col-start-1 row-start-1",
      };
    case "row-from-md":
      return {
        root: `${stack.root} ${splitFromMd[split]} md:gap-y-0`,
        media: `${stack.media} md:col-start-2`,
        body: `${stack.body} md:col-start-1 md:row-start-1`,
      };
    case "row-until-lg":
      return {
        root: `${splitRow[split]} lg:grid-cols-1 lg:gap-x-0 lg:gap-y-(--space-story-media-text)`,
        media: "col-start-2 row-start-1 lg:col-start-1",
        body: "col-start-1 row-start-1 lg:row-start-2",
      };
  }
}

/**
 * C-24 StoryCard: one story with an image and text. Every image story that is not a
 * LeadStory or an OverlapCard. One grid with a body and a media part; the body is first in
 * the markup and the grid moves the image. No radius, no card border; the list around the
 * card draws the rules. Titles wrap and are never cut (CPT-08). A story with no image gets the
 * body in one column (UNRESOLVED_DESIGN_SYSTEM U-33: the sheet requires an image).
 */
export function StoryCard({
  story,
  strings,
  layout = "stack",
  ratio = "16:9",
  size = "md",
  split = "third",
  eyebrow = true,
  summary = true,
  titleAs: Title = "h3",
  eager = false,
  className,
}: StoryCardProps) {
  const classes = layoutClasses(layout, split);
  const hasImage = Boolean(story.image);
  const showSummary = summary && Boolean(story.summary);
  return (
    <article
      data-story-card
      data-layout={layout}
      className={cn("grid", hasImage ? classes.root : "grid-cols-1", className)}
    >
      <div className={cn("min-w-0", hasImage && classes.body)}>
        {eyebrow ? (
          <Eyebrow
            story={story}
            strings={strings}
            className="mb-(--space-lead-eyebrow-title)"
          />
        ) : null}
        <Title
          className={size === "md" ? "type-story-title" : "type-story-title-sm"}
        >
          <Link href={storyHref(story)} className={headlineLink}>
            {story.title}
          </Link>
        </Title>
        {showSummary ? (
          <p className="mt-(--space-story-title-summary) type-summary text-ink-secondary">
            {story.summary}
          </p>
        ) : null}
        <MetaLine
          items={storyMetaItems(story, strings.story)}
          className={
            showSummary
              ? "mt-(--space-lead-summary-meta)"
              : "mt-(--space-story-title-meta)"
          }
        />
      </div>
      <StoryImage
        story={story}
        eager={eager}
        className={classes.media}
        imageClassName={ratioClass[ratio]}
      />
    </article>
  );
}
