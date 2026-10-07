import Image from "next/image";
import Link from "next/link";

import { listItem } from "@/components/home/analysis-opinion/classes";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { BreakingLabel } from "@/components/story/StoryEyebrow";
import { headlineLink, storyHref } from "@/components/story/links";
import { StoryMeta } from "@/components/story/StoryMeta";
import type { CategoryBlock as CategoryBlockData } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type CategoryBlockProps = {
  block: CategoryBlockData;
  strings: Pick<Dictionary, "story" | "categories">;
};

/**
 * One category in P-3 (spacing-layout-system.md 7.2): the section heading, then a list
 * with the first story as an image story (type-story-title) and the others as compact
 * items (type-story-title-sm). The inside of a block is not in the specs
 * (UNRESOLVED_DESIGN_SYSTEM U-21). The heading names the category, so the items show no
 * category label; a breaking story keeps its filled label (COL-11, U-20).
 * The section id is the anchor of the category links in the nav and drawer (IMP-14).
 */
export function CategoryBlock({ block, strings }: CategoryBlockProps) {
  const { category, stories } = block;
  const titleId = `category-${category}-title`;
  return (
    <section
      id={`category-${category}`}
      aria-labelledby={titleId}
      data-category-block={category}
      className="min-w-0"
    >
      <SectionHeading id={titleId}>
        {strings.categories[category]}
      </SectionHeading>
      <ul>
        {stories.map((story, index) => {
          const image = index === 0 ? story.image : undefined;
          return (
            <li key={story.id} className={listItem}>
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
                    <BreakingLabel text={strings.story.breaking} />
                  </p>
                ) : null}
                <h3
                  className={cn(
                    index === 0 ? "type-story-title" : "type-story-title-sm",
                  )}
                >
                  <Link href={storyHref(story)} className={headlineLink}>
                    {story.title}
                  </Link>
                </h3>
                <StoryMeta
                  story={story}
                  strings={strings.story}
                  className="mt-(--space-story-title-meta)"
                />
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
