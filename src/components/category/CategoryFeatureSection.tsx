import { Rail } from "@/components/layout/Rail";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { OverlapCard } from "@/components/story/OverlapCard";
import { StoryList } from "@/components/story/StoryList";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { CategoryCardList } from "./CategoryCards";

type Props = {
  feature: Story;
  latest: Story[];
  cards: Story[];
  t: Dictionary;
  className?: string;
};

/**
 * CategoryFeatureSection: the top of the category page (docs/briefs/category.md, sections 3
 * and 4), laid out as HeroSection: the wrapper holds the feature story as an OverlapCard
 * (C-02, tajmin's tweak at checkpoint 2) with the title in type-story-lead, then the card rows; the rail holds the
 * category's latest stories. From 1024px the rail is beside the wrapper; below, it goes
 * under the whole wrapper (LAY-05). No Eyebrow: the page title names the category
 * (DR-153). With no latest stories the wrapper spans the shell (spacing-layout-system.md 7.3).
 */
export function CategoryFeatureSection({
  feature,
  latest,
  cards,
  t,
  className,
}: Props) {
  const wrapper = (
    <Wrapper
      data-category-wrapper
      className="flex flex-col gap-y-(--grid-row-gap)"
    >
      <OverlapCard story={feature} strings={t} eager eyebrow={false} feature />
      {cards.length > 0 ? <CategoryCardList stories={cards} t={t} /> : null}
    </Wrapper>
  );

  return (
    <Shell
      as="section"
      aria-labelledby="category-feature-title"
      data-section="category-feature"
      className={className}
    >
      <h2 id="category-feature-title" className="sr-only">
        {t.categoryPage.feature}
      </h2>
      {latest.length > 0 ? (
        <WithRail>
          {wrapper}
          <Rail data-category-rail>
            {/* The rail list shows time and reading time, not the category (DR-153, C-25). */}
            <section aria-labelledby="category-latest-title" data-latest>
              <SectionHeading as="h2" id="category-latest-title">
                {t.categoryPage.latest}
              </SectionHeading>
              <StoryList stories={latest} strings={t} columns={2} />
            </section>
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
    </Shell>
  );
}
