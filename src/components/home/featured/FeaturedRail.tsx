import Image from "next/image";
import Link from "next/link";

import { Chip } from "@/components/story/Chip";
import { headlineLink, storyHref } from "@/components/story/links";
import { MetaLine, storyMetaItems } from "@/components/story/MetaLine";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type FeaturedRailProps = {
  stories: Story[];
  strings: Pick<Dictionary, "story">;
};

// The rule between items has space-list-item on each side; the first item has none.
// At 600–1023px the rail is under the wrapper in two columns: the image story on the
// left over both rows, the other stories on the right, so the second item has no rule.
const item =
  "mt-(--space-list-item) border-t border-border pt-(--space-list-item) first:mt-0 first:border-t-0 first:pt-0";
const itemTwoColumns =
  "sm:max-lg:first:row-span-2 sm:max-lg:nth-2:mt-0 sm:max-lg:nth-2:border-t-0 sm:max-lg:nth-2:pt-0";

/**
 * The P-2 rail: one image story, then two stories (spacing-layout-system.md 7.2).
 * Compact items in type-story-title-sm (typography-system.md 7.1). One column in the
 * 304px rail from 1024px and on phones; two columns at 600–1023px, so the image is not
 * as wide as the shell. The two-column split is not in the specs (U-19).
 */
export function FeaturedRail({ stories, strings }: FeaturedRailProps) {
  const twoColumns = stories.length > 1;
  return (
    <ul
      data-featured-rail-list
      className={cn(
        "grid grid-cols-1 items-start gap-x-(--grid-column-gap)",
        twoColumns && "sm:max-lg:grid-cols-2",
      )}
    >
      {stories.map((story, index) => {
        // The first story is the image story (7.2).
        const image = index === 0 ? story.image : undefined;
        return (
          <li key={story.id} className={cn(item, twoColumns && itemTwoColumns)}>
            <article>
              {image ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="mb-(--space-story-media-text) aspect-video w-full bg-surface-alt object-cover"
                />
              ) : null}
              {story.breaking ? (
                <p className="mb-(--space-eyebrow-title) type-eyebrow">
                  <Chip variant="live">{strings.story.breaking}</Chip>
                </p>
              ) : null}
              <h3 className="type-story-title-sm">
                <Link href={storyHref(story)} className={headlineLink}>
                  {story.title}
                </Link>
              </h3>
              <MetaLine
                items={storyMetaItems(story, strings.story)}
                className="mt-(--space-story-title-meta)"
              />
            </article>
          </li>
        );
      })}
    </ul>
  );
}
