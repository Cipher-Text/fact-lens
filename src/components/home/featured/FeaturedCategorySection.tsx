import { Rail } from "@/components/layout/Rail";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryList } from "@/components/story/StoryList";
import type { FeaturedSection, Lang } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

type FeaturedCategorySectionProps = {
  lang: Lang;
  section: FeaturedSection;
  t: Dictionary;
  className?: string;
};

/**
 * P-2 FeaturedCategorySection (component-system.md P-2; spacing-layout-system.md 7.2, 7.3).
 * Wrapper: the feature story, a StoryCard that is one column under 768px (image first) and
 * text beside the image from 768px. Rail: one image story and two text rows. From 1024px the
 * rail is 304px beside the wrapper; below, it is under the wrapper (LAY-05). The rail image
 * story is a row (text 2 : 1 image) until 1024px and a stack in the 304px rail. No rail
 * stories: the wrapper spans the shell. One MoreLink at the section end (DR-110, DR-123).
 * The heading is plain text (DR-122). The section id is the anchor of the nav links (IMP-14).
 */
export function FeaturedCategorySection({
  lang,
  section,
  t,
  className,
}: FeaturedCategorySectionProps) {
  const { category, lead, rail } = section;
  const titleId = `category-${category}-title`;
  const [imageStory, ...textStories] = rail;

  const wrapper = (
    <Wrapper data-featured-wrapper>
      <StoryCard
        story={lead}
        strings={t}
        layout="row-from-md"
        ratio="3:2"
        size="md"
        split="feature"
        eyebrow={false}
      />
    </Wrapper>
  );

  return (
    <Shell
      as="section"
      id={`category-${category}`}
      aria-labelledby={titleId}
      data-section="featured"
      data-category={category}
      className={className}
    >
      <SectionHeading id={titleId}>{t.categories[category]}</SectionHeading>
      {imageStory ? (
        <WithRail>
          {wrapper}
          <Rail data-featured-rail>
            {/* The rule below the image story is the card's border; the list then
                starts with space-list-item (C-24, C-03). */}
            <div
              className={
                textStories.length > 0
                  ? "border-b border-border pb-(--space-list-item)"
                  : undefined
              }
            >
              <StoryCard
                story={imageStory}
                strings={t}
                layout="row-until-lg"
                ratio="16:9"
                size="sm"
                split="third"
                eyebrow={false}
                summary={false}
              />
            </div>
            {textStories.length > 0 ? (
              <StoryList
                stories={textStories}
                strings={t}
                className="pt-(--space-list-item)"
              />
            ) : null}
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
      <MoreLink
        href={localizedPath(lang, `/category/${category}`)}
        section={t.categories[category]}
        strings={t.common}
      />
    </Shell>
  );
}
