import Image from "next/image";
import Link from "next/link";

import { headlineLink, storyHref } from "@/components/story/links";
import { Eyebrow } from "@/components/story/Eyebrow";
import { MetaLine, storyMetaItems } from "@/components/story/MetaLine";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type LeadStoryProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
};

/**
 * The P-1 lead (spacing-layout-system.md 7.4). From 768px the text panel overlaps the
 * bottom of the image by 64px, on the surface color, so text never sits on the photo.
 * The panel is inset from the end, which leaves the cut corner of the image showing. It
 * grows down, never up (LAY-17). Below 768px, and for a lead with no image, the text is
 * under the image with no overlap. Panel inset and padding are not in the specs (U-12).
 */
export function LeadStory({ story, strings }: LeadStoryProps) {
  const { image } = story;
  return (
    <article data-lead className="flex flex-col">
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          preload
          className="aspect-video w-full bg-surface-alt object-cover"
        />
      ) : null}
      <div
        data-lead-panel
        className={cn(
          image &&
            "pt-(--space-story-media-text) md:relative md:me-16 md:-mt-16 md:bg-surface md:p-(--space-story-media-text)",
        )}
      >
        <Eyebrow
          story={story}
          strings={strings}
          className="mb-(--space-eyebrow-title)"
        />
        <h3 className="type-story-lead">
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
              ? "mt-(--space-story-summary-meta)"
              : "mt-(--space-story-title-meta)"
          }
        />
      </div>
    </article>
  );
}
