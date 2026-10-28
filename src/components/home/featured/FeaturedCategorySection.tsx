import { dividerItem } from "@/components/layout/Divider";
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
 * The section features a category or a region (DR-412): the heading, the id and the
 * MoreLink target come from its source. A region section is `featured-<region>`, because
 * `region-<region>` is the RegionSlider panel id on the same page.
 */
export function FeaturedCategorySection({
  lang,
  section,
  t,
  className,
}: FeaturedCategorySectionProps) {
  const { source, lead, rail } = section;
  const label =
    source.kind === "category"
      ? t.categories[source.id]
      : t.regions[source.id];
  const sectionId =
    source.kind === "category"
      ? `category-${source.id}`
      : `featured-${source.id}`;
  const href =
    source.kind === "category"
      ? `/category/${source.id}`
      : `/regions/${source.id}`;
  const titleId = `${sectionId}-title`;
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
      id={sectionId}
      aria-labelledby={titleId}
      data-section="featured"
      data-category={source.kind === "category" ? source.id : undefined}
      data-region={source.kind === "region" ? source.id : undefined}
      className={className}
    >
      <SectionHeading id={titleId}>{label}</SectionHeading>
      {imageStory ? (
        <WithRail>
          {wrapper}
          <Rail data-featured-rail>
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
            {textStories.length > 0 ? (
              <StoryList
                stories={textStories}
                strings={t}
                className={dividerItem}
              />
            ) : null}
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
      <MoreLink
        href={localizedPath(lang, href)}
        section={label}
        strings={t.common}
      />
    </Shell>
  );
}
