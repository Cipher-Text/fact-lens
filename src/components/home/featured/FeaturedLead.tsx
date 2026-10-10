import Image from "next/image";
import Link from "next/link";

import { Chip } from "@/components/story/Chip";
import { headlineLink, storyHref } from "@/components/story/links";
import { MetaLine, storyMetaItems } from "@/components/story/MetaLine";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type FeaturedLeadProps = {
  story: Story;
  strings: Pick<Dictionary, "story">;
};

/**
 * The P-2 lead in the wrapper: image, then text. The text is under the image up to
 * 1279px and beside it from 1280px (spacing-layout-system.md 7.2, DR-55). The split
 * beside the image is not in the specs (UNRESOLVED_DESIGN_SYSTEM U-18): two equal
 * columns with the column gap. The section heading names the category, so the lead
 * shows no category label; a breaking story keeps its filled label (COL-11).
 */
export function FeaturedLead({ story, strings }: FeaturedLeadProps) {
  const { image } = story;
  return (
    <article
      data-featured-lead
      className={cn(
        "grid grid-cols-1 items-start gap-y-(--space-story-media-text)",
        image && "xl:grid-cols-2 xl:gap-x-(--grid-column-gap)",
      )}
    >
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="aspect-video w-full bg-surface-alt object-cover"
        />
      ) : null}
      <div data-featured-text>
        {story.breaking ? (
          <p className="mb-(--space-eyebrow-title) type-eyebrow">
            <Chip variant="live">{strings.story.breaking}</Chip>
          </p>
        ) : null}
        <h3 className="type-story-title-lg">
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
