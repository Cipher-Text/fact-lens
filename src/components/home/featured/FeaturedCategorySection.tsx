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
 * Wrapper: the feature story, the StoryCard `side`: one column under 768px (image first),
 * from 768px the image 2 / 3 of the card width (DR-451, DR-464). Rail: a text StoryList of 3 rows, no image (the
 * former rail image story is the first row; IMP-125). From 1024px the rail is 304px beside
 * the wrapper; below, it is under the wrapper (LAY-05). No rail stories: the wrapper spans
 * the shell. One MoreLink at the section end (DR-110, DR-123).
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
  const { source, feature, rail } = section;
  const label =
    source.kind === "category" ? t.categories[source.id] : t.regions[source.id];
  const sectionId =
    source.kind === "category"
      ? `category-${source.id}`
      : `featured-${source.id}`;
  const href =
    source.kind === "category"
      ? `/category/${source.id}`
      : `/regions/${source.id}`;
  const titleId = `${sectionId}-title`;

  const wrapper = (
    <Wrapper data-featured-wrapper>
      <StoryCard story={feature} strings={t} variant="side" eyebrow={false} />
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
      {rail.length > 0 ? (
        <WithRail>
          {wrapper}
          <Rail data-featured-rail>
            <StoryList stories={rail} strings={t} className={dividerItem} />
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
