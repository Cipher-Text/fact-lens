import { SectionHeading } from "@/components/layout/SectionHeading";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryList } from "@/components/story/StoryList";
import type { CategoryBlock as CategoryBlockData, Lang } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

type CategoryBlockProps = {
  lang: Lang;
  block: CategoryBlockData;
  t: Dictionary;
};

/**
 * C-23 CategoryBlock: one category in P-3 (component-system.md C-23). The heading is plain
 * text, not a link (DR-122). Then the feature story (a StoryCard: image 3:2 on top, title,
 * summary, meta, no eyebrow because the heading names the category) with a rule below it,
 * then a StoryList of the other stories (3 per category, DR-126). The MoreLink is pinned to
 * the block bottom, so both blocks in a row end on one line (DR-110, DR-123). The section id
 * is the anchor of the category links in the nav and drawer (IMP-14).
 */
export function CategoryBlock({ lang, block, t }: CategoryBlockProps) {
  const { category, stories } = block;
  const [feature, ...rest] = stories;
  const titleId = `category-${category}-title`;
  return (
    <section
      id={`category-${category}`}
      aria-labelledby={titleId}
      data-category-block={category}
      className="flex min-w-0 flex-col"
    >
      <SectionHeading id={titleId}>{t.categories[category]}</SectionHeading>
      {feature ? (
        <div
          className={
            rest.length > 0
              ? "border-b border-border pb-(--space-list-item)"
              : undefined
          }
        >
          <StoryCard
            story={feature}
            strings={t}
            layout="stack"
            ratio="3:2"
            size="md"
            eyebrow={false}
          />
        </div>
      ) : null}
      {rest.length > 0 ? (
        <StoryList
          stories={rest}
          strings={t}
          className="pt-(--space-list-item)"
        />
      ) : null}
      <div className="mt-auto">
        <MoreLink
          href={localizedPath(lang, `/category/${category}`)}
          section={t.categories[category]}
          strings={t.common}
        />
      </div>
    </section>
  );
}
