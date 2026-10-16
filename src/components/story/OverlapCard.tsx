import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { Eyebrow } from "./Eyebrow";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";
import { StoryImage } from "./StoryImage";

type OverlapCardProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
  /** The color of the section under the card: the text block repeats it (C-02). Page color in the hero, surface-elevated in P-4. */
  surface?: "background" | "elevated";
  /** Load the image without lazy loading: cards near the top of the page (hero). */
  eager?: boolean;
  className?: string;
};

/**
 * C-02 OverlapCard: the image-led story card. The text block covers the image bottom by
 * --space-card-overlap (10% of the card width, 40 to 64px) from the start edge and stops
 * --space-card-notch short of the end edge, so the corner of the image shows. The card is
 * the container, so cqi means the card width (CPT-04, CPT-09). Each card flows on its own, with
 * no shared rows (DR-99). The body grows down (LAY-17); the title is never cut (CPT-08). A story with
 * no image shows the no-image placeholder (StoryImage, DR-338).
 */
export function OverlapCard({
  story,
  strings,
  surface = "background",
  eager = false,
  className,
}: OverlapCardProps) {
  return (
    <article data-overlap-card className={cn("@container", className)}>
      <StoryImage story={story} eager={eager} imageClassName="aspect-video" />
      <div
        data-overlap-body
        className={cn(
          "relative ps-0 pe-4",
          surface === "elevated" ? "bg-surface-elevated" : "bg-background",
          "me-(--space-card-notch) -mt-(--space-card-overlap) pt-4",
        )}
      >
        <Eyebrow
          story={story}
          strings={strings}
          className="mb-(--space-lead-eyebrow-title)"
        />
        <h3 className="type-story-title">
          <Link href={storyHref(story)} className={headlineLink}>
            {story.title}
          </Link>
        </h3>
        {story.summary ? (
          <p className="mt-(--space-story-title-summary) type-summary text-ink-secondary">
            {story.summary}
          </p>
        ) : null}
        <MetaLine
          items={storyMetaItems(story, strings.story)}
          className={
            story.summary
              ? "mt-(--space-lead-summary-meta)"
              : "mt-(--space-story-title-meta)"
          }
        />
      </div>
    </article>
  );
}
