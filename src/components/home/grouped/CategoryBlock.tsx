import { SectionHeading } from "@/components/layout/SectionHeading";
import { StoryStack } from "@/components/story/StoryStack";
import type { CategoryBlock as CategoryBlockData } from "@/content";
import type { Dictionary } from "@/i18n";

type CategoryBlockProps = {
  block: CategoryBlockData;
  strings: Pick<Dictionary, "story" | "categories">;
};

/**
 * One category in P-3 (spacing-layout-system.md 7.2): the section heading, then the
 * story stack (UNRESOLVED_DESIGN_SYSTEM U-21).
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
      <StoryStack stories={stories} strings={strings.story} />
    </section>
  );
}
