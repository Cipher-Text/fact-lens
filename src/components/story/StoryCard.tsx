import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { Eyebrow, type EyebrowMode } from "./Eyebrow";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";
import { StoryImage } from "./StoryImage";

/**
 * The card variant (C-24, DR-451, DR-453). The variant sets where the image sits and the
 * title size (tajmin, 5 Nov 2026: "map against variant"), not the card width:
 * top: the image above the text; card title.
 * thumbnail: text at the start, a small image at the end (text : image = 2 : 1); list title.
 * side: stacked as top under 768px; from 768px text at the start, the image at the end
 * (text : image = 1 : 2, no cap); card title, or the cover title with `large`.
 * dated: the image, the text, then the date under 600px; from 600px three columns, the date,
 * the text, the image (More stories; tajmin, 27 Oct 2026). The date is the time only, no
 * reading time. Card title.
 * Every StoryCard image is 3:2 (DR-453).
 */
export type StoryCardVariant = "top" | "thumbnail" | "side" | "dated";

type StoryCardProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
  variant?: StoryCardVariant;
  /** side only: the cover story of its section, the cover title (the analysis hub cover). */
  large?: boolean;
  /** The section drops the eyebrow when its heading names the category (DR-114). */
  eyebrow?: boolean;
  /** The Eyebrow mode (C-08): format in mixed lists (DR-417). */
  eyebrowMode?: EyebrowMode;
  /**
   * dated only, on an analysis story: the format Eyebrow above the title at every width
   * (More stories; tajmin, 28 Oct 2026). News stories show none. With `eyebrow` on, the
   * Eyebrow itself shows the format (the topic page), so this adds no second label.
   */
  formatLabel?: boolean;
  /** Shows the summary when the story has one. */
  summary?: boolean;
  titleAs?: "h2" | "h3" | "h4";
  eager?: boolean;
  /** Fade the image in when it has loaded (StoryImage fadeIn): rows added by load more. */
  imageFadeIn?: boolean;
  className?: string;
};

// The title role of each variant (typography-system.md 3.2).
const cardTitle = "font-editorial text-2xl font-semibold";
const titleClass: Record<StoryCardVariant, string> = {
  top: cardTitle,
  thumbnail: "font-editorial text-lg font-semibold",
  side: cardTitle,
  dated: cardTitle,
};
const coverTitle = "font-editorial text-4xl text-balance font-semibold";

// The grid areas media and body place the parts, no `order` (LAY-14). The media is first in
// the markup in every variant (C-24, DR-267); a row puts it at the end. The utilities are in
// components.css and stack a row when the card is narrower than 17.5rem (DR-308). Class
// names are whole strings so Tailwind finds them.
const gridClass: Record<StoryCardVariant, string> = {
  top: "story-top",
  thumbnail: "story-thumbnail",
  side: "story-top md:story-side",
  dated: "story-dated",
};

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
  variant = "top",
  large = false,
  eyebrow = true,
  eyebrowMode,
  formatLabel = false,
  summary = true,
  titleAs: Title = "h3",
  eager = false,
  imageFadeIn = false,
  className,
}: StoryCardProps) {
  const showSummary = summary && Boolean(story.summary);
  const dated = variant === "dated";
  const analysisLabel =
    dated && formatLabel && !eyebrow && story.format === "analysis";
  return (
    <article
      data-story-card
      data-variant={variant}
      data-large={large && variant === "side" ? "" : undefined}
      className={cn("@container", className)}
    >
      <div className={cn("grid", gridClass[variant])}>
        <StoryImage
          story={story}
          eager={eager}
          fadeIn={imageFadeIn}
          className="self-start story-media"
          imageClassName="aspect-3/2"
        />
        <div className="min-w-0 story-body">
          {eyebrow ? (
            <Eyebrow
              story={story}
              strings={strings}
              mode={eyebrowMode}
              className="mb-(--space-story-eyebrow-title)"
            />
          ) : null}
          {analysisLabel ? (
            <Eyebrow
              story={story}
              strings={strings}
              mode="format"
              className="mb-(--space-story-eyebrow-title)"
            />
          ) : null}
          <Title
            className={
              large && variant === "side" ? coverTitle : titleClass[variant]
            }
          >
            <Link href={storyHref(story)} className={headlineLink}>
              {story.title}
            </Link>
          </Title>
          {showSummary ? (
            <p
              data-summary
              className="mt-(--space-story-title-summary) max-w-(--measure-deck) font-editorial text-sm leading-relaxed font-medium text-ink-secondary"
            >
              {story.summary}
            </p>
          ) : null}
          {dated ? null : (
            <MetaLine
              items={storyMetaItems(story, strings.story)}
              className={
                showSummary
                  ? "mt-(--space-story-summary-meta)"
                  : "mt-(--space-story-title-meta)"
              }
            />
          )}
        </div>
        {/* dated: the date is its own grid area, at the start from 600px. */}
        {dated ? (
          <MetaLine
            items={storyMetaItems(story, strings.story, { readingTime: false })}
            className="self-start story-date"
          />
        ) : null}
      </div>
    </article>
  );
}
