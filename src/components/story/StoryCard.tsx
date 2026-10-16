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

// The grid areas media and body place the parts, no `order` (LAY-14). The media is first in
// the markup at every layout (C-24, DR-267); a row layout puts it at the end. The utilities
// are in components.css and stack a row when the card is narrower than 17.5rem (DR-308).
// Class names are whole strings so Tailwind finds them.
const split = {
  third: "story-split-third",
  feature: "story-split-feature",
} as const;
const splitFromMd = {
  third: "md:story-split-third",
  feature: "md:story-split-feature",
} as const;

function gridClass(layout: StoryCardLayout, kind: "third" | "feature") {
  switch (layout) {
    case "stack":
      return "story-stacked";
    case "row":
      return split[kind];
    case "row-from-md":
      return `story-stacked ${splitFromMd[kind]}`;
    case "row-until-lg":
      return `${split[kind]} lg:story-stacked`;
  }
}

/**
 * C-24 StoryCard: one story with an image and text. Every image story that is not a
 * LeadStory or an OverlapCard. One grid with a media and a body part; the media is first in
 * the markup (DR-267) and the grid moves it to the end in a row. No radius, no card border; the list around the
 * card draws the rules. Titles wrap and are never cut (CPT-08). A story with no image shows
 * the no-image placeholder (StoryImage, DR-338).
 */
export function StoryCard({
  story,
  strings,
  layout = "stack",
  ratio = "16:9",
  size = "md",
  split: splitKind = "third",
  eyebrow = true,
  summary = true,
  titleAs: Title = "h3",
  eager = false,
  className,
}: StoryCardProps) {
  const showSummary = summary && Boolean(story.summary);
  return (
    <article
      data-story-card
      data-layout={layout}
      className={cn("@container", className)}
    >
      <div className={cn("grid", gridClass(layout, splitKind))}>
        <StoryImage
          story={story}
          eager={eager}
          className="self-start story-media"
          imageClassName={ratioClass[ratio]}
        />
        <div className="min-w-0 story-body">
          {eyebrow ? (
            <Eyebrow
              story={story}
              strings={strings}
              className="mb-(--space-lead-eyebrow-title)"
            />
          ) : null}
          <Title
            className={
              size === "md" ? "type-story-title" : "type-story-title-sm"
            }
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
      </div>
    </article>
  );
}
