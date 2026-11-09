import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { Eyebrow, type EyebrowMode } from "./Eyebrow";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";
import { StoryImage } from "./StoryImage";

type LeadStoryProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
  /** The Eyebrow mode (C-08). The hero is a mixed list and sets format (DR-417). */
  eyebrowMode?: EyebrowMode;
  className?: string;
};

/**
 * C-01 LeadStory: the one lead story of the site, in HeroSection only. Image 16:9, then a
 * panel in the page color that covers the image bottom by --space-overlap-large, inset by
 * --space-inset-large-* each side, with the brand bar on top. The wrapper is the container
 * (CPT-04): the tokens in components.css change at 600 and 880px of the card width. Text sits
 * on the panel, never on the photo. The panel grows down (LAY-17); the title is never cut
 * (CPT-08). A story with no image shows the no-image placeholder (StoryImage, DR-338).
 */
export function LeadStory({
  story,
  strings,
  eyebrowMode,
  className,
}: LeadStoryProps) {
  return (
    <div className={cn("@container", className)}>
      <article data-lead className="lead-story flex flex-col">
        <StoryImage story={story} preload imageClassName="aspect-video" />
        <div
          data-lead-panel
          className={cn(
            "relative ms-(--space-inset-large-start) me-(--space-inset-large-end) -mt-(--space-overlap-large) bg-background",
          )}
        >
          <div
            aria-hidden="true"
            data-lead-bar
            className="h-(--bar-brand) bg-(--color-bar)"
          />
          <div className="py-(--space-panel-large) ps-(--space-panel-large-start) pe-(--space-panel-large)">
            <Eyebrow
              story={story}
              strings={strings}
              mode={eyebrowMode}
              className="mb-(--space-story-eyebrow-title)"
            />
            <h3 className="font-editorial text-4xl font-semibold text-balance">
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
        </div>
      </article>
    </div>
  );
}
