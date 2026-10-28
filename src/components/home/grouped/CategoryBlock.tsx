import type { ReactNode } from "react";

import { dividerItem } from "@/components/layout/Divider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryList } from "@/components/story/StoryList";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

type CategoryBlockProps = {
  /** Names the block: the `data-category-block` value and the `category-<name>` id. */
  name: string;
  heading: string;
  /** The MoreLink target, already localized. */
  href: string;
  stories: Story[];
  t: Dictionary;
  /** Replaces the feature story and the StoryList: the category page opinion block uses the
   * OpinionList quote rows (tajmin, 28 Oct 2026). */
  children?: ReactNode;
};

/**
 * C-23 CategoryBlock: one block in P-3 (component-system.md C-23). The heading is plain
 * text, not a link (DR-122). Then the feature story (a StoryCard: image 3:2 on top, title,
 * summary, meta, no eyebrow because the heading names the block) with a rule below it,
 * then a StoryList of the other stories (3 per category on the homepage, DR-126). The
 * MoreLink is pinned to the block bottom, so both blocks in a row end on one line (DR-110,
 * DR-123). The page gives the heading, the name and the link: a category on the homepage,
 * where the id is the anchor of the category links in the nav and drawer (IMP-14); a format
 * on the category page (DR-415).
 */
export function CategoryBlock({
  name,
  heading,
  href,
  stories,
  t,
  children,
}: CategoryBlockProps) {
  const [feature, ...rest] = stories;
  const titleId = `category-${name}-title`;
  return (
    <section
      id={`category-${name}`}
      aria-labelledby={titleId}
      data-category-block={name}
      className="flex min-w-0 flex-col"
    >
      <SectionHeading id={titleId}>{heading}</SectionHeading>
      {children ?? (
        <>
          {feature ? (
            <StoryCard
              story={feature}
              strings={t}
              layout="stack"
              ratio="3:2"
              size="md"
              eyebrow={false}
            />
          ) : null}
          {rest.length > 0 ? (
            <StoryList stories={rest} strings={t} className={dividerItem} />
          ) : null}
        </>
      )}
      <div className="mt-auto">
        <MoreLink href={href} section={heading} strings={t.common} />
      </div>
    </section>
  );
}
