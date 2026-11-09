import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { Eyebrow, type EyebrowMode } from "./Eyebrow";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";
import { StoryImage } from "./StoryImage";

type OverlapCardProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
  /** The color of the section under the card: the text block repeats it (C-02). Page color in the hero, surface-elevated in P-4. */
  surface?: "background" | "elevated";
  /** Load the image without lazy loading: cards near the top of the page (hero). */
  eager?: boolean;
  /** The page drops the eyebrow when its title names the category (DR-114, DR-153). */
  eyebrow?: boolean;
  /** The Eyebrow mode (C-08): format in mixed lists (DR-417). */
  eyebrowMode?: EyebrowMode;
  /**
   * The cover story of its section (CategoryCoverSection; option large, DR-451, DR-453): the title takes text-4xl and the text block
   * ends with --space-panel-large, as the C-01 panel does.
   */
  large?: boolean;
  className?: string;
};

/**
 * C-02 OverlapCard: the image-led story card. The text block covers the image bottom by
 * --space-overlap (10% of the card width, 40 to 64px) from the start edge and stops
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
  eyebrow = true,
  eyebrowMode,
  large = false,
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
          "me-(--space-card-notch) -mt-(--space-overlap) pt-4",
          large && "overlap-large pb-(--space-panel-large)",
        )}
      >
        {eyebrow ? (
          <Eyebrow
            story={story}
            strings={strings}
            mode={eyebrowMode}
            className="mb-(--space-story-eyebrow-title)"
          />
        ) : null}
        <h3
          className={
            large
              ? "font-editorial text-4xl font-semibold text-balance"
              : "font-editorial text-2xl font-semibold"
          }
        >
          <Link href={storyHref(story)} className={headlineLink}>
            {story.title}
          </Link>
        </h3>
        {story.summary ? (
          <p
            data-summary
            className="mt-(--space-story-title-summary) max-w-(--measure-deck) font-editorial text-sm leading-relaxed font-medium text-ink-secondary"
          >
            {story.summary}
          </p>
        ) : null}
        <MetaLine
          items={storyMetaItems(story, strings.story)}
          className={
            story.summary
              ? "mt-(--space-story-summary-meta)"
              : "mt-(--space-story-title-meta)"
          }
        />
      </div>
    </article>
  );
}
